import {
  Injectable,
  Inject,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import { users, refreshTokens, authTokens } from '../../db/schema/index.js';
import {
  AppErrorCode,
  type SignupInput,
  type LoginInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
  type AuthUserDto,
  type UserRole,
  type Locale,
} from '@sage/shared';

export interface TokensResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly isProduction: boolean;

  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDb,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET', 'sage-dev-jwt-secret-do-not-use-in-prod');
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateOpaqueToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  mapUserToDto(user: typeof users.$inferSelect): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      locale: user.locale as Locale,
      emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async signup(input: SignupInput): Promise<TokensResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Check email uniqueness
    const existing = await this.db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existing) {
      throw new ConflictException({
        message: 'A user with this email already exists',
        code: AppErrorCode.CONFLICT,
      });
    }

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
      memoryCost: 19456, // 19 MiB per OWASP recommendations
      timeCost: 2,
    });

    const [newUser] = await this.db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        role: input.role,
        locale: input.locale,
      })
      .returning();

    if (!newUser) {
      throw new BadRequestException('Failed to create user');
    }

    // Issue initial refresh family & access token
    const familyId = crypto.randomUUID();
    const rawRefreshToken = this.generateOpaqueToken();
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.db.insert(refreshTokens).values({
      userId: newUser.id,
      familyId,
      tokenHash,
      expiresAt,
    });

    const accessToken = await this.generateAccessToken(newUser);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: this.mapUserToDto(newUser),
    };
  }

  async login(input: LoginInput): Promise<TokensResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await this.db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
        code: AppErrorCode.INVALID_CREDENTIALS,
      });
    }

    const validPassword = await argon2.verify(user.passwordHash, input.password);
    if (!validPassword) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
        code: AppErrorCode.INVALID_CREDENTIALS,
      });
    }

    // Issue new refresh family & access token
    const familyId = crypto.randomUUID();
    const rawRefreshToken = this.generateOpaqueToken();
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.db.insert(refreshTokens).values({
      userId: user.id,
      familyId,
      tokenHash,
      expiresAt,
    });

    const accessToken = await this.generateAccessToken(user);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: this.mapUserToDto(user),
    };
  }

  async rotateRefreshToken(rawToken: string): Promise<TokensResult> {
    if (!rawToken) {
      throw new UnauthorizedException({
        message: 'Refresh token is required',
        code: AppErrorCode.UNAUTHORIZED,
      });
    }

    const tokenHash = this.hashToken(rawToken);

    const tokenRecord = await this.db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.tokenHash, tokenHash),
    });

    if (!tokenRecord) {
      throw new UnauthorizedException({
        message: 'Invalid refresh token',
        code: AppErrorCode.TOKEN_INVALID,
      });
    }

    // Reuse detection: If token was already revoked, someone is replaying a stolen/old token
    if (tokenRecord.revokedAt !== null) {
      // Invalidate the ENTIRE family immediately
      await this.db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.familyId, tokenRecord.familyId));

      throw new UnauthorizedException({
        message: 'Refresh token reuse detected. All sessions in this family revoked.',
        code: AppErrorCode.REFRESH_TOKEN_REUSE,
      });
    }

    // Check expiration
    if (tokenRecord.expiresAt < new Date()) {
      await this.db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.id, tokenRecord.id));

      throw new UnauthorizedException({
        message: 'Refresh token has expired',
        code: AppErrorCode.TOKEN_EXPIRED,
      });
    }

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, tokenRecord.userId),
    });

    if (!user) {
      throw new UnauthorizedException({
        message: 'User no longer exists',
        code: AppErrorCode.UNAUTHORIZED,
      });
    }

    // Generate successor token in the same family
    const nextRawRefreshToken = this.generateOpaqueToken();
    const nextTokenHash = this.hashToken(nextRawRefreshToken);
    const nextExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [newRecord] = await this.db
      .insert(refreshTokens)
      .values({
        userId: user.id,
        familyId: tokenRecord.familyId,
        tokenHash: nextTokenHash,
        expiresAt: nextExpiresAt,
      })
      .returning();

    if (!newRecord) {
      throw new BadRequestException('Failed to rotate refresh token');
    }

    // Invalidate current token and link successor
    await this.db
      .update(refreshTokens)
      .set({
        revokedAt: new Date(),
        replacedBy: newRecord.id,
      })
      .where(eq(refreshTokens.id, tokenRecord.id));

    const accessToken = await this.generateAccessToken(user);

    return {
      accessToken,
      refreshToken: nextRawRefreshToken,
      user: this.mapUserToDto(user),
    };
  }

  async logout(rawToken?: string): Promise<void> {
    if (!rawToken) return;

    const tokenHash = this.hashToken(rawToken);
    const tokenRecord = await this.db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.tokenHash, tokenHash),
    });

    if (tokenRecord) {
      // Revoke the family
      await this.db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.familyId, tokenRecord.familyId));
    }
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string; devToken?: string }> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      // Avoid enumeration by returning generic response
      return { message: 'If this email exists, password reset instructions have been sent.' };
    }

    const rawToken = this.generateOpaqueToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.db.insert(authTokens).values({
      userId: user.id,
      type: 'password_reset',
      tokenHash,
      expiresAt,
    });

    // In non-production, return token for tests/dev inspection
    return {
      message: 'If this email exists, password reset instructions have been sent.',
      devToken: !this.isProduction ? rawToken : undefined,
    };
  }

  async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const tokenHash = this.hashToken(input.token);

    const record = await this.db.query.authTokens.findFirst({
      where: and(
        eq(authTokens.tokenHash, tokenHash),
        eq(authTokens.type, 'password_reset'),
        isNull(authTokens.consumedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    });

    if (!record) {
      throw new BadRequestException({
        message: 'Invalid or expired password reset token',
        code: AppErrorCode.TOKEN_INVALID,
      });
    }

    const newPasswordHash = await argon2.hash(input.newPassword, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
    });

    // Update user password
    await this.db
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, record.userId));

    // Mark reset token consumed
    await this.db
      .update(authTokens)
      .set({ consumedAt: new Date() })
      .where(eq(authTokens.id, record.id));

    // Revoke all existing refresh token families to force re-login on all devices
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.userId, record.userId));

    return { message: 'Password has been reset successfully.' };
  }

  async createEmailVerificationToken(userId: string): Promise<string> {
    const rawToken = this.generateOpaqueToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.db.insert(authTokens).values({
      userId,
      type: 'email_verification',
      tokenHash,
      expiresAt,
    });

    return rawToken;
  }

  async verifyEmail(input: VerifyEmailInput): Promise<{ message: string }> {
    const tokenHash = this.hashToken(input.token);

    const record = await this.db.query.authTokens.findFirst({
      where: and(
        eq(authTokens.tokenHash, tokenHash),
        eq(authTokens.type, 'email_verification'),
        isNull(authTokens.consumedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    });

    if (!record) {
      throw new BadRequestException({
        message: 'Invalid or expired verification token',
        code: AppErrorCode.TOKEN_INVALID,
      });
    }

    await this.db
      .update(users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, record.userId));

    await this.db
      .update(authTokens)
      .set({ consumedAt: new Date() })
      .where(eq(authTokens.id, record.id));

    return { message: 'Email verified successfully.' };
  }

  async generateAccessToken(user: typeof users.$inferSelect): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      locale: user.locale,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: '15m',
    });
  }

  getCookieOptions(type: 'access' | 'refresh') {
    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge:
        type === 'access'
          ? 15 * 60 * 1000 // 15 mins
          : 7 * 24 * 60 * 60 * 1000, // 7 days
    };
  }
}
