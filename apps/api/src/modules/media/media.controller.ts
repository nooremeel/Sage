import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MediaService } from './media.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CheckPolicies } from '../../common/casl/check-policies.decorator.js';
import { CourseSubject, type CurrentUser } from '../../common/casl/casl-ability.factory.js';
import { User } from '../../common/decorators/current-user.decorator.js';
import type { InitiateUploadInput, CompleteUploadInput } from '@sage/shared';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('uploads')
  @HttpCode(HttpStatus.CREATED)
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Initiate resumable S3 multipart upload for video or media asset' })
  async initiateUpload(
    @User() user: CurrentUser,
    @Body() body: InitiateUploadInput,
  ) {
    return this.mediaService.initiateUpload(user.id, body);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Complete S3 multipart upload and trigger background transcode' })
  async completeUpload(
    @Param('id') id: string,
    @User() user: CurrentUser,
    @Body() body: CompleteUploadInput,
  ) {
    const asset = await this.mediaService.completeUpload(id, user.id, body, user.role === 'admin');
    return { asset };
  }

  @Get(':id')
  @CheckPolicies((ability) => ability.can('create', CourseSubject))
  @ApiOperation({ summary: 'Get media asset metadata and transcode status' })
  async getAsset(
    @Param('id') id: string,
    @User() user: CurrentUser,
  ) {
    const asset = await this.mediaService.getAssetById(id, user.id, user.role === 'admin');
    return { asset };
  }

  @Public()
  @Get(':assetId/master.m3u8')
  @ApiOperation({ summary: 'Serve token-gated HLS master playlist' })
  async getMasterPlaylist(
    @Param('assetId') assetId: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const playlist = await this.mediaService.getMasterPlaylist(assetId, token);
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'private, no-cache, no-store');
    res.status(HttpStatus.OK).send(playlist);
  }

  @Public()
  @Get(':assetId/playlists/:rendition.m3u8')
  @ApiOperation({ summary: 'Serve token-gated HLS rendition playlist' })
  async getVariantPlaylist(
    @Param('assetId') assetId: string,
    @Param('rendition') rendition: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const playlist = await this.mediaService.getVariantPlaylist(assetId, rendition, token);
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Cache-Control', 'private, no-cache, no-store');
    res.status(HttpStatus.OK).send(playlist);
  }

  @Public()
  @Get(':assetId/segments/:rendition/:file')
  @ApiOperation({ summary: 'Verify playback token and redirect to short-lived presigned segment URL' })
  async getSegment(
    @Param('assetId') assetId: string,
    @Param('rendition') rendition: string,
    @Param('file') file: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const redirectUrl = await this.mediaService.getSegmentRedirectUrl(assetId, rendition, file, token);
    res.redirect(HttpStatus.FOUND, redirectUrl);
  }
}
