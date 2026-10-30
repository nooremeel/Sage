import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import { EtagInterceptor } from '../../common/interceptors/etag.interceptor.js';
import type { Locale } from '@sage/shared';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @UseInterceptors(EtagInterceptor)
  @Get()
  @ApiOperation({ summary: 'List all categories with localized names' })
  async list(@Query('locale') locale?: Locale) {
    const items = await this.categoriesService.findAll(locale || 'en');
    return { categories: items };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  @ApiOperation({ summary: 'Admin create new category' })
  async create(
    @Body()
    dto: {
      slug: string;
      icon?: string;
      translations: { locale: Locale; name: string; description?: string }[];
    },
  ) {
    return this.categoriesService.create(dto);
  }
}

