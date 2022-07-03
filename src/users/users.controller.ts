import {
  ConflictException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { User } from 'src/decorators/user.decorator';

import { FollowsService } from 'src/follows/follows.service';
import mongoQueries from 'src/mongoQueries';
import { PostsService } from 'src/posts/posts.service';
import { PostSort } from 'src/posts/types/post-sort.type';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
    private readonly followsService: FollowsService,
  ) {}

  @Get('ids')
  getAllUserIds() {
    return this.usersService.getAllUsersId();
  }

  @Get(':uid')
  async getUserProfile(@Param('uid') uid: string) {
    const profile = await this.usersService.findOneById(
      uid,
      mongoQueries.userPublicProfile,
    );

    if (!profile) throw new NotFoundException('User not found!');

    return profile;
  }

  @Get(':uid/description')
  async getUserAbout(@Param('uid') uid: string) {
    const { description } = await this.usersService.findOneById(
      uid,
      'description',
    );

    return description || '';
  }

  @Get(':uid/views')
  async getUserTotalViews(@Param('uid') uid: string) {
    const { totalViews } = await this.usersService.findOneById(
      uid,
      'totalViews',
    );

    return totalViews;
  }

  @Get(':uid/posts')
  async getUserPosts(
    @Param('uid') uid: string,
    @Query('p') p: string,
    @Query('sort') sort: PostSort,
  ) {
    return this.postsService.getUserPosts(uid, +p || 0, sort);
  }

  @Get(':uid/posts/id')
  async getUserPostsId(@Param('uid') uid: string) {
    const posts = await this.postsService.findByAuthor(uid, '_id');

    // return array of ids
    return posts.map((item) => item._id);
  }

  @Get(':uid/followers')
  async getUserFollowersNumber(@Param('uid') uid: string) {
    const { followers } = await this.usersService.findOneById(uid, 'followers');

    return followers || 0;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':uid/follow')
  async isFollowing(
    @Param('uid') followingUid: string,
    @User() { _id: followerUid }: JwtPayload,
  ) {
    return this.followsService.isFollowing(followerUid, followingUid);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':uid/follow')
  async followUser(
    @Param('uid') followingUid: string,
    @User() { _id: followerUid }: JwtPayload,
  ) {
    if (followerUid === followingUid)
      throw new ConflictException("can't follow yourself");

    const [follower, following, isFollowing] = await Promise.all([
      this.usersService.findOneById(followerUid, mongoQueries.userBasic),
      this.usersService.findOneById(followingUid, mongoQueries.userBasic),
      this.followsService.isFollowing(followerUid, followingUid), // Check if follow already exists
    ]);

    if (!follower || !following) throw new NotFoundException('user not found');
    if (isFollowing) throw new ConflictException('already following');

    await this.followsService.newFollow(
      {
        _id: follower._id,
        username: follower.username,
        avatar: follower.avatar,
      },
      {
        _id: following._id,
        username: following.username,
        avatar: following.avatar,
      },
    );

    await this.usersService.addFollower(followingUid);

    return 'success';
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':uid/follow')
  async unfollowUser(
    @Param('uid') followingUid: string,
    @User() { _id: followerUid }: JwtPayload,
  ) {
    const [deleteResult] = await Promise.all([
      this.followsService.deleteFollow(followerUid, followingUid),
      this.usersService.removeFollower(followingUid),
    ]);

    if (deleteResult.deletedCount === 0) {
      await this.usersService.addFollower(followingUid);
      throw new NotFoundException('follow not found');
    }

    return 'success';
  }
}
