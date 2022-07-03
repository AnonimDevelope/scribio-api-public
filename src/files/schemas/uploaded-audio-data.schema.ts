import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class UploadedAudioData {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  key: string;
}
