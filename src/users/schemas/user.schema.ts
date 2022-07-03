import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UploadedImageData } from 'src/files/schemas/uploaded-Image-data.schema';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  registerDate: number;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ select: false, required: false })
  password?: string;

  @Prop({ required: false })
  avatar?: UploadedImageData;

  @Prop({ required: true })
  followers: number;

  @Prop({ required: true })
  posts: number;

  @Prop({ required: true })
  totalViews: number;

  @Prop({ required: false })
  description: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
