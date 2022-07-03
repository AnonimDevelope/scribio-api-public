import { forwardRef, Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { UsersModule } from 'src/users/users.module';
import { FilesModule } from 'src/files/files.module';
import { History, HistorySchema } from './schemas/history.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowsModule } from 'src/follows/follows.module';
import { PostsModule } from 'src/posts/posts.module';
import { RedisModule } from 'src/redis/redis.module';
import { MailModule } from 'src/mail/mail.module';
import { Save, SaveSchema } from './schemas/save.schema';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    FilesModule,
    RedisModule,
    MailModule,
    FollowsModule,
    forwardRef(() => PostsModule),
    MongooseModule.forFeature([
      { name: Save.name, schema: SaveSchema },
      { name: History.name, schema: HistorySchema },
    ]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
