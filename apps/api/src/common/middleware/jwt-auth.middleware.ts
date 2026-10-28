import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import type { CurrentUser } from '../casl/casl-ability.factory.js';

declare global {
  namespace Express {
    interface Request {
      user?: CurrentUser;
    }
  }
}

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly jwtSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>(
      'JWT_SECRET',
      'sage-dev-jwt-secret-do-not-use-in-prod',
    );
  }

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    let token: string | undefined;

    // 1. Try reading from httpOnly cookie
    if (req.cookies && req.cookies['access_token']) {
      token = req.cookies['access_token'];
    }

    // 2. Fallback to Authorization: Bearer header
    if (!token && req.headers.authorization) {
      const [bearer, headerToken] = req.headers.authorization.split(' ');
      if (bearer?.toLowerCase() === 'bearer' && headerToken) {
        token = headerToken;
      }
    }

    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.jwtSecret,
        });

        if (payload && payload.sub) {
          req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            locale: payload.locale,
          };
        }
      } catch {
        // Token invalid or expired - leave req.user undefined; PoliciesGuard will handle
        req.user = undefined;
      }
    }

    next();
  }
}
