import { registerAs } from '@nestjs/config';

export default registerAs('aws', () => ({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3Bucket: process.env.AWS_S3_BUCKET,
  s3BucketRegion: process.env.AWS_S3_BUCKET_REGION,
  mediaConvertEndpoint: process.env.AWS_MEDIA_CONVERT_ENDPOINT,
  transcoderPipelineId: process.env.AWS_ELASTIC_TRANSCODER_PIPELINE_ID,
  transcoderPresetId: process.env.AWS_ELASTIC_TRANSCODER_PRESET_ID,
  cloudFront: process.env.AWS_CLOUDFRONT,
}));
