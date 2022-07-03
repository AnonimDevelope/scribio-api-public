import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HistoryDocument = History & Document;

@Schema()
class Author {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  username: string;
}

@Schema()
class Post {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  author: Author;
}

@Schema()
export class History {
  @Prop({ required: true })
  uid: string;

  @Prop({ required: true })
  date: number;

  @Prop({ required: true })
  post: Post;
}

export const HistorySchema = SchemaFactory.createForClass(History);
