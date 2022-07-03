import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { PostDocument } from 'src/posts/schemas/post.schema';
import {
  Follow,
  FollowDocument,
  FollowUserData,
} from './schemas/follow.schema';

@Injectable()
export class FollowsService {
  constructor(
    @InjectModel(Follow.name)
    private FollowModel: Model<FollowDocument>,
  ) {}

  async updateMany(
    filter: FilterQuery<PostDocument>,
    updateQuery: UpdateQuery<PostDocument>,
  ) {
    try {
      return await this.FollowModel.updateMany(filter, updateQuery);
    } catch (error) {
      throw new HttpException('Unable to update posts!', 500);
    }
  }

  async isFollowing(followerUid: string, followingUid: string) {
    return await this.FollowModel.exists({
      'follower._id': followerUid,
      'following._id': followingUid,
    });
  }

  async newFollow(follower: FollowUserData, following: FollowUserData) {
    return await this.FollowModel.create({
      follower,
      following,
      date: Date.now(),
    });
  }

  async deleteFollow(followerUid: string, followingUid: string) {
    return await this.FollowModel.deleteOne({
      'follower._id': followerUid,
      'following._id': followingUid,
    });
  }

  async getFollowings(followerUid: string) {
    const data = await this.FollowModel.find({
      'follower._id': followerUid,
    })
      .sort({ date: -1 })
      .select('following'); // Get one more item

    const follows = data.map(({ following }) => following);

    return follows;
  }

  async getFollowers(followingUid: string) {
    const data = await this.FollowModel.find({
      'following._id': followingUid,
    })
      .sort({ date: -1 })
      .select('follower'); // Get one more item

    const followers = data.map(({ follower }) => follower);

    return followers;
  }
}
