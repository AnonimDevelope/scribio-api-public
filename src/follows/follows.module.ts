import { Module } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Follow, FollowSchema } from './schemas/follow.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Follow.name, schema: FollowSchema }]),
  ],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}
