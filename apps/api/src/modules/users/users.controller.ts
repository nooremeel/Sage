import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateProfileDto, UpdateUserRoleDto } from './dto/users.dto.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import { UserSubject, type CurrentUser } from '../../common/casl/casl-ability.factory.js';
import { User } from '../../common/decorators/current-user.decorator.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @CheckPolicies((ability) => ability.can('read', UserSubject))
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@User() user: CurrentUser) {
    const profile = await this.usersService.findById(user.id);
    return { user: profile };
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @CheckPolicies((ability) => ability.can('update', UserSubject))
  @ApiOperation({ summary: 'Update current user profile (e.g. locale)' })
  async updateProfile(
    @User() user: CurrentUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return { user: updated };
  }

  @Get()
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  @ApiOperation({ summary: 'Admin list all users' })
  async listUsers(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    return this.usersService.findAll(parsedLimit, parsedOffset);
  }

  @Patch(':id/role')
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  @ApiOperation({ summary: 'Admin update user role' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    const updated = await this.usersService.updateRole(id, dto.role);
    return { user: updated };
  }
}
