import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { Express } from 'express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from 'src/files/files.service';
import { v4 as uuid } from 'uuid';
import { UsersService } from 'src/users/users.service';
import mongoQueries from 'src/mongoQueries';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { AppreciationsService } from 'src/appreciations/appreciations.service';
import { ProfileService } from 'src/profile/profile.service';
import { PostDocument } from './schemas/post.schema';
import { UpdateQuery } from 'mongoose';
import { stripHtml } from 'string-strip-html';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
    private readonly appreciationsService: AppreciationsService,
    private readonly profileService: ProfileService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('thumbnail'))
  async create(
    @Body() createPostDto: CreatePostDto,
    @User() jwtPayload: JwtPayload,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {
    const user = await this.usersService.findOneById(
      jwtPayload._id,
      mongoQueries.userPublic,
    );

    const thumbnailUploadData = await this.filesService.uploadImage(
      thumbnail.buffer,
      thumbnail.filename,
      350,
    );

    // Text to speech
    const audio = await this.postsService.getSpeechFromContent(
      JSON.parse(createPostDto.content),
    );

    // Upload
    const audioUploadData = await this.filesService.uploadAudio(audio);

    const res = await this.postsService.create(
      createPostDto,
      user,
      thumbnailUploadData,
      audioUploadData,
    );

    await this.usersService.addPost(jwtPayload._id);

    return res;
  }

  @Get()
  getPosts(@Query('p') p: string, @Query('search') searchQuery: string) {
    return this.postsService.getPosts(+p || 0, searchQuery);
  }

  @Get('ids')
  getAllIds() {
    return this.postsService.getAllIds();
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPostImage(@UploadedFile() file: Express.Multer.File) {
    const uploadData = await this.filesService.uploadImage(
      file.buffer,
      file.originalname,
      750,
    );

    return {
      success: 1,
      file: uploadData,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('uploadByUrl')
  async uploadPostImageByUrl(@Body('url') url: string) {
    if (!url) throw new BadRequestException('Url is required!');

    const imageBuffer = await this.filesService.downloadImage(url);

    const uploadData = await this.filesService.uploadImage(
      imageBuffer,
      uuid(),
      750,
    );

    return {
      success: 1,
      file: uploadData,
    };
  }

  @Get(':id')
  getPost(@Param('id') id: string) {
    return this.postsService.findById(id, mongoQueries.fullPost);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('thumbnail'))
  async updatePost(
    @Param('id') id: string,
    @User() jwtPayload: JwtPayload,
    @Body() updateData: CreatePostDto,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {
    const content = JSON.parse(updateData.content);

    // Text to speech
    const audio = await this.postsService.getSpeechFromContent(content);

    // Upload
    const audioUploadData = await this.filesService.uploadAudio(audio);

    const updateQuery: UpdateQuery<PostDocument> = {
      content,
      title: updateData.title,
      timeToRead: this.postsService.getTimeToRead(content),
      previewContent: stripHtml(this.postsService.getPreviewContent(content))
        .result,
      audio: audioUploadData,
    };

    if (thumbnail) {
      const uploadData = await this.filesService.uploadImage(
        thumbnail.buffer,
        thumbnail.filename,
        350,
      );

      updateQuery.thumbnail = uploadData;
    }

    await this.postsService.updateOne(
      {
        _id: id,
        'author._id': jwtPayload._id,
      },
      updateQuery,
    );

    return 'success';
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(@Param('id') id: string, @User() jwtPayload: JwtPayload) {
    // Check if authenticated user is author of this post
    const exists = await this.postsService.exists({
      _id: id,
      'author._id': jwtPayload._id,
    });

    if (!exists) throw new ForbiddenException('Unable to delete post!');

    await this.postsService.delete(id);

    await Promise.all([
      this.usersService.removePost(jwtPayload._id),
      this.appreciationsService.deleteMany({ targetId: id }),
      this.profileService.deletePostSaves(id),
    ]);

    return 'success';
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post(':id/registerView')
  async registerView(
    @Param('id') id: string,
    @User() jwtPayload: JwtPayload, // NOTE: payload may be undefined
  ) {
    const {
      author: { _id: authorId },
    } = await this.postsService.findById(id, 'author._id');

    if (jwtPayload) {
      const post = await this.postsService.findById(id, 'title author');

      await Promise.all([
        this.profileService.createHistoryItem(
          jwtPayload._id,
          post._id,
          post.title,
          post.author._id,
          post.author.username,
        ),
        this.postsService.addView(id),
        this.usersService.addView(authorId), // Increment author total views
      ]);
    } else {
      await Promise.all([
        this.postsService.addView(id),
        this.usersService.addView(authorId), // Increment author total views
      ]);
    }

    return 'success';
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/metrics')
  async getPostMetrics(
    @Param('id') id: string,
    @User() jwtPayload: JwtPayload, // NOTE: payload may be undefined
  ) {
    if (jwtPayload) {
      const [userAppreciationDoc, { likes, dislikes, saves, views }, isSaved] =
        await Promise.all([
          this.appreciationsService.getUserAppreciation(
            jwtPayload._id,
            id,
            'post',
          ),
          this.postsService.findById(id, mongoQueries.postMetrics),
          this.profileService.isSaved(jwtPayload?._id, id),
        ]);

      return {
        likes: likes || 0,
        dislikes: dislikes || 0,
        saves: saves || 0,
        views: views || 0,
        userAppreciation: userAppreciationDoc?.appreciation || null,
        isSaved,
      };
    } else {
      const { likes, dislikes, saves, views } =
        await this.postsService.findById(id, mongoQueries.postMetrics);

      return {
        likes: likes || 0,
        dislikes: dislikes || 0,
        saves: saves || 0,
        views: views || 0,
        userAppreciation: null,
        isSaved: false,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  async savePost(@User() { _id: uid }: JwtPayload, @Param('id') id: string) {
    await this.profileService.newSave(uid, id);

    await this.postsService.addSave(id);

    return 'success';
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/save')
  async unsavePost(@User() { _id: uid }: JwtPayload, @Param('id') id: string) {
    await this.profileService.deleteSave(uid, id);

    await this.postsService.removeSave(id);

    return 'success';
  }
}
