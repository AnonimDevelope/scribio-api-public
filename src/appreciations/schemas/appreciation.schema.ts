import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AppreciationDocument = Appreciation & Document;

@Schema()
export class Appreciation {
  @Prop({ required: true })
  uid: string;

  @Prop({ required: true })
  type: 'post' | 'comment';

  @Prop({ required: true })
  targetId: string; // Can be post or comment id

  @Prop({ required: true })
  appreciation: 'like' | 'dislike';
}

export const AppreciationSchema = SchemaFactory.createForClass(Appreciation);
