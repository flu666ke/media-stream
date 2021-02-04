import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AWSConfigService {
  constructor(private readonly configService: ConfigService) {}

  get accessKeyId(): string {
    return this.configService.get<string>('aws.accessKeyId');
  }
  get secretAccessKey(): string {
    return this.configService.get<string>('aws.secretAccessKey');
  }
  get s3Bucket(): string {
    return this.configService.get<string>('aws.s3Bucket');
  }
  get s3BucketRegion(): string {
    return this.configService.get<string>('aws.s3BucketRegion');
  }
  get mediaConvertEndpoint(): string {
    return this.configService.get<string>('aws.mediaConvertEndpoint');
  }
  get transcoderPipelineId(): string {
    return this.configService.get<string>('aws.transcoderPipelineId');
  }
  get transcoderPresetId(): string {
    return this.configService.get<string>('aws.transcoderPresetId');
  }
  get cloudFront(): string {
    return this.configService.get<string>('aws.cloudFront');
  }
}
