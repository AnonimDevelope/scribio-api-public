import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsModule } from './posts/posts.module';

import config from './config';

@Module({
  imports: [
    AuthModule,

    // Connect MongoDB
    MongooseModule.forRoot(config.mongoUri),

    PostsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
