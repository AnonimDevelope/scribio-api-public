import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class UploadedImageData {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  height: number;

  @Prop({ required: true })
  width: number;

  @Prop({ required: true })
  placeholder: string;
}
