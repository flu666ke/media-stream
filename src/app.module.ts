import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AWSConfigModule } from './config/config.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [TypeOrmModule.forRoot(), MediaModule, AWSConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
