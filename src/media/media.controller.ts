import {
  Controller,
  Get,
  Param,
  Post,
  Render,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileDto } from './dto/media-file.dto';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: UploadFileDto) {
    const { buffer, originalname, mimetype } = file;

    try {
      const result = await this.mediaService.uploadMediaFile(
        buffer,
        originalname,
        mimetype,
      );
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  @Get()
  @Render('media')
  async renderMediaPage() {
    try {
      return await this.mediaService.getMediaList();
    } catch (error) {
      console.log(error);
    }
  }

  @Get('/:id')
  @Render('play-video')
  async showVideo(@Param('id') id: string) {
    try {
      const { url } = await this.mediaService.getMediaById(id);
      return { url };
    } catch (error) {
      console.log(error);
    }
  }
}
