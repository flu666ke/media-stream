import { Injectable } from '@nestjs/common';
import { config, S3, MediaConvert, ElasticTranscoder } from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import { AWSConfigService } from 'src/config/config.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { Repository } from 'typeorm';
import { MediaTypeEnum } from './enums/mediaType.enum';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    private readonly awsConfigService: AWSConfigService,
  ) {}

  async uploadMediaFile(
    dataBuffer: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<Media> {
    config.update({
      accessKeyId: this.awsConfigService.accessKeyId,
      secretAccessKey: this.awsConfigService.secretAccessKey,
      region: this.awsConfigService.s3BucketRegion,
    });

    const s3 = new S3();
    const mediaType = mimetype.split('/')[0];
    const uuidFile = uuid();
    const transcodedVideoExtension = 'm3u8';
    const transcodedAudioExtension = 'transcoded.mp3';

    const uploadResult = await s3
      .upload({
        ACL: 'public-read',
        Bucket: this.awsConfigService.s3Bucket,
        Body: dataBuffer,
        Key: `${mediaType}/${uuidFile}-${filename}`,
      })
      .promise();

    try {
      if (MediaTypeEnum.video === mediaType) {
        await this.transcodingMedia(`${uuidFile}-${filename}`);
      }

      if (MediaTypeEnum.audio === mediaType) {
        await this.transcodingAudio(
          `${uuidFile}-${filename}`,
          uploadResult.Key,
        );
      }

      const newFile = this.mediaRepository.create({
        mediaType: MediaTypeEnum[mediaType],
        key: uploadResult.Key,
        url:
          MediaTypeEnum.video === mediaType
            ? `${this.awsConfigService.cloudFront}/${uploadResult.Key}.${transcodedVideoExtension}`
            : `${this.awsConfigService.cloudFront}/${uploadResult.Key}.${transcodedAudioExtension}`,
        filename,
      });

      await this.mediaRepository.save(newFile);

      return newFile;
    } catch (error) {
      console.log(error);
    }
  }

  async transcodingMedia(uuidFilename: string): Promise<void> {
    config.update({
      region: this.awsConfigService.s3BucketRegion,
    });

    config.mediaconvert = {
      endpoint: this.awsConfigService.mediaConvertEndpoint,
    };

    const params = this.getTranscodingParams(uuidFilename);

    // Create a promise on a MediaConvert object
    const endpointPromise = new MediaConvert({ apiVersion: '2017-08-29' })
      .createJob(params)
      .promise();

    // Handle promise's fulfilled/rejected status
    endpointPromise.then(
      function (data) {
        console.log('Job created! ', data);
      },
      function (err) {
        console.log('Error', err);
      },
    );
  }

  async transcodingAudio(uuidFilename: string, uploadResultKey: string) {
    const params = {
      PipelineId: this.awsConfigService.transcoderPipelineId,
      Input: {
        Key: uploadResultKey,
      },
      Output: {
        Key: `audio/${uuidFilename}.transcoded.mp3`,
        PresetId: this.awsConfigService.transcoderPresetId,
        AlbumArt: {
          MergePolicy: 'Fallback',
          Artwork: [],
        },
      },
    };

    const endpointPromise = new ElasticTranscoder({
      apiVersion: '2012-09-25',
      region: this.awsConfigService.s3BucketRegion,
    })
      .createJob(params)
      .promise();

    // Handle promise's fulfilled/rejected status
    endpointPromise.then(
      function (data) {
        console.log('Job created! ', data);
      },
      function (err) {
        console.log('Error', err);
      },
    );
  }

  async getMediaList() {
    // To use the MediaConvert service, we need to get an endpoint
    // await this.getEndpoint();

    const videoFiles = await this.mediaRepository.find({
      mediaType: MediaTypeEnum.video,
    });

    const audioFiles = await this.mediaRepository.find({
      mediaType: MediaTypeEnum.audio,
    });

    return {
      videoFiles,
      audioFiles,
    };
  }

  async getMediaById(id: string): Promise<Media> {
    return await this.mediaRepository.findOne(id);
  }

  getTranscodingParams(uuidFilename: string) {
    return {
      Queue: 'arn:aws:mediaconvert:eu-west-1:007564888953:queues/Default',
      UserMetadata: {
        Customer: 'Amazon',
      },
      Role: 'arn:aws:iam::007564888953:role/MediaConvertFullAccessRole',
      Settings: {
        OutputGroups: [
          {
            Name: 'Apple HLS',
            OutputGroupSettings: {
              Type: 'HLS_GROUP_SETTINGS',
              HlsGroupSettings: {
                ManifestDurationFormat: 'INTEGER',
                SegmentLength: 10,
                TimedMetadataId3Period: 10,
                CaptionLanguageSetting: 'OMIT',
                Destination: `s3://on-demand-media-streaming/video/${uuidFilename}`,
                TimedMetadataId3Frame: 'PRIV',
                CodecSpecification: 'RFC_4281',
                OutputSelection: 'MANIFESTS_AND_SEGMENTS',
                ProgramDateTimePeriod: 600,
                MinSegmentLength: 0,
                DirectoryStructure: 'SINGLE_DIRECTORY',
                ProgramDateTime: 'EXCLUDE',
                SegmentControl: 'SEGMENTED_FILES',
                ManifestCompression: 'NONE',
                ClientCache: 'ENABLED',
                StreamInfResolution: 'INCLUDE',
              },
            },
            Outputs: [
              {
                VideoDescription: {
                  ScalingBehavior: 'DEFAULT',
                  TimecodeInsertion: 'DISABLED',
                  AntiAlias: 'ENABLED',
                  Sharpness: 100,
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      InterlaceMode: 'PROGRESSIVE',
                      NumberReferenceFrames: 3,
                      Syntax: 'DEFAULT',
                      Softness: 0,
                      GopClosedCadence: 1,
                      GopSize: 90,
                      Slices: 1,
                      GopBReference: 'DISABLED',
                      SlowPal: 'DISABLED',
                      SpatialAdaptiveQuantization: 'ENABLED',
                      TemporalAdaptiveQuantization: 'ENABLED',
                      FlickerAdaptiveQuantization: 'DISABLED',
                      EntropyEncoding: 'CABAC',
                      Bitrate: 3500000,
                      FramerateControl: 'INITIALIZE_FROM_SOURCE',
                      RateControlMode: 'CBR',
                      CodecProfile: 'MAIN',
                      Telecine: 'NONE',
                      MinIInterval: 0,
                      AdaptiveQuantization: 'HIGH',
                      CodecLevel: 'LEVEL_3_1',
                      FieldEncoding: 'PAFF',
                      SceneChangeDetect: 'ENABLED',
                      QualityTuningLevel: 'SINGLE_PASS_HQ',
                      FramerateConversionAlgorithm: 'DUPLICATE_DROP',
                      UnregisteredSeiTimecode: 'DISABLED',
                      GopSizeUnits: 'FRAMES',
                      ParControl: 'INITIALIZE_FROM_SOURCE',
                      NumberBFramesBetweenReferenceFrames: 2,
                      RepeatPps: 'DISABLED',
                    },
                  },
                  AfdSignaling: 'NONE',
                  DropFrameTimecode: 'ENABLED',
                  RespondToAfd: 'NONE',
                  ColorMetadata: 'INSERT',
                  Width: 960,
                  Height: 540,
                },
                AudioDescriptions: [
                  {
                    AudioTypeControl: 'FOLLOW_INPUT',
                    CodecSettings: {
                      Codec: 'AAC',
                      AacSettings: {
                        AudioDescriptionBroadcasterMix: 'NORMAL',
                        Bitrate: 96000,
                        RateControlMode: 'CBR',
                        CodecProfile: 'LC',
                        CodingMode: 'CODING_MODE_2_0',
                        RawFormat: 'NONE',
                        SampleRate: 48000,
                        Specification: 'MPEG4',
                      },
                    },
                    LanguageCodeControl: 'FOLLOW_INPUT',
                  },
                ],
                ContainerSettings: {
                  Container: 'M3U8',
                  M3u8Settings: {
                    AudioFramesPerPes: 4,
                    PcrControl: 'PCR_EVERY_PES_PACKET',
                    PmtPid: 480,
                    PrivateMetadataPid: 503,
                    ProgramNumber: 1,
                    PatInterval: 0,
                    PmtInterval: 0,
                    Scte35Source: 'NONE',
                    Scte35Pid: 500,
                    TimedMetadata: 'NONE',
                    TimedMetadataPid: 502,
                    VideoPid: 481,
                    AudioPids: [
                      482,
                      483,
                      484,
                      485,
                      486,
                      487,
                      488,
                      489,
                      490,
                      491,
                      492,
                    ],
                  },
                },
                NameModifier: '_low',
              },
            ],
          },
        ],
        AdAvailOffset: 0,
        Inputs: [
          {
            AudioSelectors: {
              'Audio Selector 1': {
                Offset: 0,
                DefaultSelection: 'NOT_DEFAULT',
                ProgramSelection: 1,
                SelectorType: 'TRACK',
                Tracks: [1],
              },
            },
            VideoSelector: {
              ColorSpace: 'FOLLOW',
            },
            FilterEnable: 'AUTO',
            PsiControl: 'USE_PSI',
            FilterStrength: 0,
            DeblockFilter: 'DISABLED',
            DenoiseFilter: 'DISABLED',
            TimecodeSource: 'EMBEDDED',
            FileInput: `s3://on-demand-media-streaming/video/${uuidFilename}`,
          },
        ],
      },
    };
  }

  async getEndpoint(): Promise<void> {
    // Set the Region
    config.update({ region: this.awsConfigService.s3BucketRegion });

    // Create empty request parameters
    const params = {
      MaxResults: 0,
    };

    // Create a promise on a MediaConvert object
    const endpointPromise = new MediaConvert({ apiVersion: '2017-08-29' })
      .describeEndpoints(params)
      .promise();

    endpointPromise.then(
      function (data) {
        console.log('Your MediaConvert endpoint is ', data.Endpoints);
      },
      function (err) {
        console.log('Error', err);
      },
    );
  }
}
