import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SaveDocument = Save & Document;

@Schema()
export class Save {
  @Prop({ required: true })
  uid: string;

  @Prop({ required: true })
  postId: string;

  @Prop({ required: true })
  date: number;
}

export const SaveSchema = SchemaFactory.createForClass(Save);
