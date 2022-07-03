import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { User } from 'src/decorators/user.decorator';
import { FilesService } from 'src/files/files.service';
import { FollowsService } from 'src/follows/follows.service';
import { MailService } from 'src/mail/mail.service';
import mongoQueries from 'src/mongoQueries';
import { PostsService } from 'src/posts/posts.service';
import { RedisService } from 'src/redis/redis.service';
import { UsersService } from 'src/users/users.service';
import { ConfirmationCodeDto } from './dto/confirmation-code.dto';
import { UpdateDescriptionDto } from './dto/update-description.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
    private readonly followsService: FollowsService,
    private readonly postsService: PostsService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  @Get('')
  async getProfile(@User() userPayload: JwtPayload) {
    const profile = await this.usersService.findOneById(
      userPayload._id,
      mongoQueries.userPrivate,
    );

    return profile;
  }

  @Patch('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadUserAvatar(
    @UploadedFile() file: Express.Multer.File,
    @User() jwtPayload: JwtPayload,
  ) {
    if (!file) throw new BadRequestException('Image is required!');

    // Upload avatar
    const uploadData = await this.filesService.uploadImage(
      file.buffer,
      file.originalname,
      170,
      170,
    );

    // Update user avatar
    await this.usersService.updateOne(
      { _id: jwtPayload._id },
      { avatar: uploadData },
    );

    await Promise.all([
      // Update posts
      this.postsService.updateMany(
        { 'author._id': jwtPayload._id },
        { 'author.avatar': uploadData },
      ),

      // update follows
      this.followsService.updateMany(
        { 'follower._id': jwtPayload._id },
        { 'follower.avatar': uploadData },
      ),
      this.followsService.updateMany(
        { 'following._id': jwtPayload._id },
        { 'following.avatar': uploadData },
      ),
    ]);

    return 'success';
  }

  @Patch('username')
  async updateUsername(
    @Body() { username }: UpdateUsernameDto,
    @User() { _id }: JwtPayload,
  ) {
    await this.usersService.updateOne({ _id }, { username });

    await Promise.all([
      // Update posts
      this.postsService.updateMany(
        { 'author._id': _id },
        { 'author.username': username },
      ),

      // update follows
      this.followsService.updateMany(
        { 'follower._id': _id },
        { 'follower.username': username },
      ),
      this.followsService.updateMany(
        { 'following._id': _id },
        { 'following.username': username },
      ),

      // Update history items
      this.profileService.updateManyHistoryItems(
        { 'post.author._id': _id },
        { 'post.author.username': username },
      ),
    ]);

    return 'success';
  }

  @Patch('description')
  async updateDescription(
    @Body() { description }: UpdateDescriptionDto,
    @User() { _id }: JwtPayload,
  ) {
    await this.usersService.updateOne({ _id }, { description });

    return 'success';
  }

  @Patch('email/init')
  async initEmailUpdate(
    @Body() { email }: UpdateEmailDto,
    @User() { _id, username }: JwtPayload,
  ) {
    // 5 digit confirmation code
    const confirmationCode = Math.floor(Math.random() * 90000) + 10000;

    await this.mailService.sendEmailVerificationCode(
      email,
      username,
      confirmationCode,
    );

    await this.redisService.setEmailUpdateData({
      new_email: email,
      user_id: _id,
      confirmation_code: confirmationCode,
    });

    return 'success';
  }

  @Patch('email/finish')
  async finishEmailUpdate(
    @Body() { code }: ConfirmationCodeDto,
    @User() { _id }: JwtPayload,
  ) {
    const data = await this.redisService.getEmailUpdateData(_id);

    if (data.confirmation_code !== code)
      throw new BadRequestException('Invalid code!');

    await this.usersService.updateOne({ _id }, { email: data.new_email });

    return 'success';
  }

  @Get('history')
  getUserHistory(@User() jwtPayload: JwtPayload, @Query('p') p: string) {
    return this.profileService.getUserHistory(jwtPayload._id, +p || 0);
  }

  @Delete('history')
  async clearUserHistory(@User() jwtPayload: JwtPayload) {
    await this.profileService.clearUserHistory(jwtPayload._id);

    return 'success';
  }

  @Delete('history/:id')
  async deleteHistoryItem(
    @User() jwtPayload: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.profileService.deleteHistoryItem(jwtPayload._id, id);

    return 'success';
  }

  @Get('followings')
  getUserFollowings(@User() { _id: uid }: JwtPayload) {
    return this.followsService.getFollowings(uid);
  }

  @Get('followers')
  getUserFollowers(@User() { _id: uid }: JwtPayload) {
    return this.followsService.getFollowers(uid);
  }

  @Get('saves')
  async getUserSaves(@User() { _id: uid }: JwtPayload) {
    const saves = await this.profileService.getUserSaves(uid);

    if (saves.length === 0) return [];

    const ids = saves.map((save) => save.postId);

    const savedPosts = await this.postsService.findManyByIds(
      ids,
      mongoQueries.postPreview,
    );

    return savedPosts;
  }
}
