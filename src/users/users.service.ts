import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { UploadedImageData } from 'src/files/schemas/uploaded-Image-data.schema';

import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly UserModel: Model<UserDocument>,
  ) {}

  async findOneById(uid: string, query: string) {
    return await this.UserModel.findById(uid).select(query);
  }

  // Check user existance
  async exists(filter: FilterQuery<UserDocument>) {
    return await this.UserModel.exists(filter);
  }

  async findOneByEmail(email: string, query: string) {
    return await this.UserModel.findOne({ email }).select(query);
  }

  async create(createUserDto: CreateUserDto) {
    const avatarUrl = `https://avatars.dicebear.com/api/identicon/${createUserDto.username}.svg?background=%23ffffff`;

    const avatar: UploadedImageData = {
      height: 150,
      width: 150,
      key: Date.now().toString(),
      url: avatarUrl,
      placeholder: avatarUrl,
    };

    // Create and save user
    const newUser = new this.UserModel({
      registerDate: Date.now(),
      username: createUserDto.username,
      email: createUserDto.email,
      password: createUserDto.password,
      avatar: avatar,
      followers: 0,
      posts: 0,
      totalViews: 0,
    });

    try {
      await newUser.save();
    } catch (error) {
      throw new HttpException('Unable to create user!', 500);
    }

    return newUser;
  }

  async updateOne(
    filter: FilterQuery<UserDocument>,
    updateQuery: UpdateQuery<UserDocument>,
  ) {
    try {
      return await this.UserModel.updateOne(filter, updateQuery);
    } catch (error) {
      throw new HttpException('Unable to update user!', 500);
    }
  }

  async findOneAndUpdate(
    filter: FilterQuery<UserDocument>,
    updateQuery: UpdateQuery<UserDocument>,
  ) {
    try {
      return await this.UserModel.findOneAndUpdate(filter, updateQuery);
    } catch (error) {
      throw new HttpException('Unable to update user!', 500);
    }
  }

  async getAllUsersId() {
    const data = await this.UserModel.find().select('_id');
    const ids = data.map((item) => item._id);

    return ids;
  }

  async addFollower(uid: string) {
    return await this.updateOne({ _id: uid }, { $inc: { followers: 1 } });
  }

  async removeFollower(uid: string) {
    return await this.updateOne({ _id: uid }, { $inc: { followers: -1 } });
  }

  async addPost(uid: string) {
    return await this.updateOne({ _id: uid }, { $inc: { posts: 1 } });
  }

  async removePost(uid: string) {
    return await this.updateOne({ _id: uid }, { $inc: { posts: -1 } });
  }

  async addView(uid: string) {
    return await this.updateOne({ _id: uid }, { $inc: { totalViews: 1 } });
  }

  // Extract profile data from document
  // getProfileFromDocument(user: UserDocument) {
  //   return {
  //     username: user.username,
  //     email: user.email,
  //     _id: user._id,
  //     avatar: user.avatar,
  //   };
  // }
}
