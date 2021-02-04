import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { MediaTypeEnum } from '../enums/mediaType.enum';

@Entity()
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: MediaTypeEnum,
  })
  mediaType: MediaTypeEnum;

  @Column()
  key: string;

  @Column()
  filename: string;

  @Column()
  url: string;
}
