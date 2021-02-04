import * as Joi from '@hapi/joi';
import { Module } from '@nestjs/common';
import configuration from './config';
import { AWSConfigService } from './config.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema: Joi.object({
        AWS_ACCESS_KEY_ID: Joi.string(),
        AWS_SECRET_ACCESS_KEY: Joi.string(),
        AWS_S3_BUCKET: Joi.string(),
        AWS_S3_BUCKET_REGION: Joi.string(),
        AWS_MEDIA_CONVERT_ENDPOINT: Joi.string(),
        AWS_ELASTIC_TRANSCODER_PIPELINE_ID: Joi.string(),
        AWS_ELASTIC_TRANSCODER_PRESET_ID: Joi.string(),
        AWS_CLOUDFRONT: Joi.string(),
      }),
    }),
  ],
  providers: [ConfigService, AWSConfigService],
  exports: [ConfigService, AWSConfigService],
})
export class AWSConfigModule {}
