import {
  Controller,
  Delete,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

import { AppreciationsService } from 'src/appreciations/appreciations.service';
import { User } from 'src/decorators/user.decorator';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';

@Controller('posts/:id')
@UseGuards(JwtAuthGuard)
export class PostsAppreciationController {
  constructor(
    private readonly postsService: PostsService,
    private readonly appreciationsService: AppreciationsService,
  ) {}

  private async checkPostExistence(postId: string) {
    const exists = await this.postsService.exists({ _id: postId });
    if (!exists) throw new NotFoundException('post not found');
  }

  @Post('like')
  async likePost(@Param('id') id: string, @User() jwtPayload: JwtPayload) {
    this.checkPostExistence(id);

    const res = await this.appreciationsService.like(
      jwtPayload._id,
      id,
      'post',
    );

    if (res === 'updated') {
      await Promise.all([
        this.postsService.removeDislike(id),
        this.postsService.addLike(id),
      ]);

      return 'updated';
    }

    await this.postsService.addLike(id);

    return 'success';
  }

  @Post('dislike')
  async dislikePost(@Param('id') id: string, @User() jwtPayload: JwtPayload) {
    this.checkPostExistence(id);

    const res = await this.appreciationsService.dislike(
      jwtPayload._id,
      id,
      'post',
    );

    if (res === 'updated') {
      await Promise.all([
        this.postsService.removeLike(id),
        this.postsService.addDislike(id),
      ]);

      return 'updated';
    }

    await this.postsService.addDislike(id);

    return 'success';
  }

  @Delete('appreciation')
  async deletePostLike(
    @Param('id') id: string,
    @User() jwtPayload: JwtPayload,
  ) {
    this.checkPostExistence(id);

    const res = await this.appreciationsService.delete(
      jwtPayload._id,
      id,
      'post',
    );

    if (res === 'like deleted') {
      // Remove like
      this.postsService.removeLike(id);
    } else {
      // Remove Dislike
      this.postsService.removeDislike(id);
    }

    return 'success';
  }
}
