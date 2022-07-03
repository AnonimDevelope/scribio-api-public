import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UploadedAudioData } from 'src/files/schemas/uploaded-audio-data.schema';
import { UploadedImageData } from 'src/files/schemas/uploaded-Image-data.schema';

export type PostDocument = Post & Document;

@Schema()
export class Content {
  @Prop()
  time: number;

  @Prop({ type: [], required: true })
  blocks: any[];

  @Prop()
  version: string;
}

@Schema()
export class Author {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  avatar: UploadedImageData;
}

@Schema()
export class Post {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  createdAt: number;

  @Prop({ required: true })
  timeToRead: string;

  @Prop({ required: true })
  likes: number;

  @Prop({ required: true })
  dislikes: number;

  @Prop({ required: true })
  saves: number;

  @Prop({ required: true })
  views: number;

  @Prop()
  thumbnail: UploadedImageData;

  @Prop({ required: true })
  content: Content;

  @Prop({ required: true })
  audio: UploadedAudioData;

  @Prop({ required: true })
  previewContent: string;

  @Prop({ required: true })
  author: Author;
}

export const PostSchema = SchemaFactory.createForClass(Post);
