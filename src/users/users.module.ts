import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilesModule } from 'src/files/files.module';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PostsModule } from 'src/posts/posts.module';
import { FollowsModule } from 'src/follows/follows.module';

@Module({
  imports: [
    // Import mongoose models
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    FilesModule,
    FollowsModule,
    forwardRef(() => PostsModule), // Circular dependency fix
  ],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
