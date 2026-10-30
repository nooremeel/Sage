import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';
import { TranscodeService } from './transcode.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>(
          'JWT_PLAYBACK_SECRET',
          'dev_jwt_playback_secret_change_in_production_32chars_long',
        ),
        signOptions: { expiresIn: '4h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, TranscodeService],
  exports: [MediaService, TranscodeService],
})
export class MediaModule {}
