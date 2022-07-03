import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppreciationsService } from './appreciations.service';
import {
  Appreciation,
  AppreciationSchema,
} from './schemas/appreciation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appreciation.name, schema: AppreciationSchema },
    ]),
  ],
  providers: [AppreciationsService],
  exports: [AppreciationsService],
})
export class AppreciationsModule {}
