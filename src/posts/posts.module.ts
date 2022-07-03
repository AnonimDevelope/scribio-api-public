import { forwardRef, Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from './schemas/post.schema';
import { FilesModule } from 'src/files/files.module';
import { UsersModule } from 'src/users/users.module';
import { AppreciationsModule } from 'src/appreciations/appreciations.module';
import { PostsAppreciationController } from './posts-appreciation.controller';
import { ProfileModule } from 'src/profile/profile.module';

@Module({
  imports: [
    // Import mongoose models
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    FilesModule,
    AppreciationsModule,
    ProfileModule,
    forwardRef(() => UsersModule), // Circular dependency fix
  ],
  controllers: [PostsController, PostsAppreciationController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
