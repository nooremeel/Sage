import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { LOCALES, type Locale } from '@sage/shared';

export class SignupDto {
  @ApiProperty({ example: 'student@sage.local' })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 100, example: 'password123' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  password!: string;

  @ApiPropertyOptional({ enum: ['student', 'instructor'], default: 'student' })
  @IsOptional()
  @IsIn(['student', 'instructor'], { message: 'Role must be student or instructor' })
  role?: 'student' | 'instructor' = 'student';

  @ApiPropertyOptional({ enum: LOCALES, default: 'en' })
  @IsOptional()
  @IsIn(LOCALES as unknown as string[], { message: 'Locale must be ar or en' })
  locale?: Locale = 'en';
}

export class LoginDto {
  @ApiProperty({ example: 'student@sage.local' })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'student@sage.local' })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'token-string' })
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token!: string;

  @ApiProperty({ minLength: 8, maxLength: 100, example: 'newPassword123' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  newPassword!: string;
}

export class VerifyEmailDto {
  @ApiProperty({ example: 'token-string' })
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token!: string;
}
