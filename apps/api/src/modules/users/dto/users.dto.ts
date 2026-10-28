import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { LOCALES, USER_ROLES, type Locale, type UserRole } from '@sage/shared';

export class UpdateProfileDto {
  @ApiPropertyOptional({ enum: LOCALES, example: 'ar' })
  @IsOptional()
  @IsIn(LOCALES as unknown as string[], { message: 'Locale must be ar or en' })
  locale?: Locale;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: USER_ROLES, example: 'instructor' })
  @IsIn(USER_ROLES as unknown as string[], { message: 'Role must be student, instructor, or admin' })
  role!: UserRole;
}
