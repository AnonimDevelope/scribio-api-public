import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UploadedImageData } from 'src/files/schemas/uploaded-Image-data.schema';

export type FollowDocument = Follow & Document;

@Schema()
export class FollowUserData {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  avatar: UploadedImageData;
}

@Schema()
export class Follow {
  @Prop({ required: true })
  follower: FollowUserData;

  @Prop({ required: true })
  following: FollowUserData;

  @Prop({ required: true })
  date: number;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);
