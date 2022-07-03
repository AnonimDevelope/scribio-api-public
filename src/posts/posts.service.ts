import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { google } from '@google-cloud/text-to-speech/build/protos/protos';
import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PipelineStage, UpdateQuery } from 'mongoose';
import { UploadedAudioData } from 'src/files/schemas/uploaded-audio-data.schema';
import { UploadedImageData } from 'src/files/schemas/uploaded-Image-data.schema';
import mongoQueries from 'src/mongoQueries';
import { UserDocument } from 'src/users/schemas/user.schema';
import { stripHtml } from 'string-strip-html';
import { CreatePostDto } from './dto/create-post.dto';
import { Author, Content, Post, PostDocument } from './schemas/post.schema';
import { PostContent } from './types/post-content.type';
import { PostSort } from './types/post-sort.type';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private PostModel: Model<PostDocument>) {}

  async create(
    createPostDto: CreatePostDto,
    user: UserDocument,
    thumbnailData: UploadedImageData,
    audioData: UploadedAudioData,
  ) {
    const author: Author = {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
    };

    const content: Content = JSON.parse(createPostDto.content);

    const previewContent = stripHtml(this.getPreviewContent(content)).result;

    const timeToRead = this.getTimeToRead(content);

    const newPost = new this.PostModel({
      title: createPostDto.title,
      content: content,
      author,
      createdAt: Date.now(),
      timeToRead: timeToRead,
      thumbnail: thumbnailData,
      audio: audioData,
      previewContent,
      likes: 0,
      dislikes: 0,
      saves: 0,
      views: 0,
    });

    try {
      await newPost.save();
    } catch (error) {
      throw new HttpException('Unable to create post!', 500);
    }

    return { message: 'Post created successfully!', postId: newPost._id };
  }

  async getAll(query: string) {
    return await this.PostModel.find().sort({ createdAt: -1 }).select(query);
  }

  // Get an array of all posts id
  async getAllIds() {
    const posts = await this.PostModel.find().select('_id');

    const ids = posts.map((post) => post._id);

    return ids;
  }

  async findManyByIds(ids: string[], query: string) {
    const posts = await this.PostModel.find({ _id: { $in: ids } })
      .select(query)
      .sort({ date: -1 });

    return posts;
  }

  async findById(id: string, query: string) {
    const post = await this.PostModel.findById(id).select(query);

    if (!post) throw new NotFoundException('Post not found!');

    return post;
  }

  async findByAuthor(uid: string, query: string) {
    return await this.PostModel.find({ 'author._id': uid })
      .sort({
        createdAt: -1,
      })
      .select(query);
  }

  async exists(filter: FilterQuery<PostDocument>) {
    return await this.PostModel.exists(filter);
  }

  async updateOne(
    filter: FilterQuery<PostDocument>,
    updateQuery: UpdateQuery<PostDocument>,
  ) {
    try {
      return await this.PostModel.updateOne(filter, updateQuery);
    } catch (error) {
      throw new HttpException('Unable to update post!', 500);
    }
  }

  async updateMany(
    filter: FilterQuery<PostDocument>,
    updateQuery: UpdateQuery<PostDocument>,
  ) {
    try {
      return await this.PostModel.updateMany(filter, updateQuery);
    } catch (error) {
      throw new HttpException('Unable to update posts!', 500);
    }
  }

  async delete(postId: string) {
    try {
      return await this.PostModel.deleteOne({ _id: postId });
    } catch (error) {
      throw new HttpException('Unable to delete post!', 500);
    }
  }

  async addView(id: string) {
    return await this.updateOne({ _id: id }, { $inc: { views: 1 } });
  }

  async addLike(id: string) {
    return await this.updateOne({ _id: id }, { $inc: { likes: 1 } });
  }

  async removeLike(id: string) {
    return await this.updateOne({ _id: id }, { $inc: { likes: -1 } });
  }

  async addDislike(id: string) {
    return await this.updateOne({ _id: id }, { $inc: { dislikes: 1 } });
  }

  async removeDislike(id: string) {
    return await this.updateOne({ _id: id }, { $inc: { dislikes: -1 } });
  }

  async addSave(id: string) {
    return await this.updateOne({ _id: id }, { $inc: { saves: 1 } });
  }

  async removeSave(id: string) {
    return await this.updateOne({ _id: id }, { $inc: { saves: -1 } });
  }

  async search(query: string, limit: number, skip: number) {
    const pipeline: PipelineStage[] = [
      {
        $search: {
          index: 'posts search',
          text: {
            query,
            path: {
              wildcard: '*',
            },
            fuzzy: {},
          },
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          title: 1,
          content: 1,
          author: 1,
          thumbnail: 1,
          createdAt: 1,
          previewContent: 1,
          timeToRead: 1,
        },
      },
    ];

    const posts = await this.PostModel.aggregate(pipeline);

    return posts;
  }

  async getPosts(page = 0, searchQuery: string) {
    const itemsPerPage = 20;

    let posts;

    if (searchQuery) {
      posts = await this.search(
        searchQuery,
        itemsPerPage + 1,
        page * itemsPerPage,
      );
    } else {
      posts = await this.PostModel.find()
        .sort({ createdAt: -1 })
        .select(mongoQueries.postPreview)
        .skip(page * itemsPerPage)
        .limit(itemsPerPage + 1); // Get one more item
    }

    const hasMore = posts.length === itemsPerPage + 1;

    if (hasMore) posts.pop(); // Remove last item

    return {
      page,
      hasMore,
      data: posts,
    };
  }

  async getUserPosts(uid: string, page = 0, sort: PostSort = 'newer') {
    const itemsPerPage = 20;

    let sortQuery;

    if (sort === 'newer') sortQuery = { createdAt: -1 };
    else if (sort === 'older') sortQuery = { createdAt: 1 };
    else if (sort === 'popularity') sortQuery = { views: -1, createdAt: -1 };

    const posts = await this.PostModel.find({ 'author._id': uid })
      .select(mongoQueries.postPreview)
      .sort(sortQuery)
      .skip(page * itemsPerPage)
      .limit(itemsPerPage + 1); // Get one more item

    const hasMore = posts.length === itemsPerPage + 1;

    if (hasMore) posts.pop(); // Remove last item

    return {
      page,
      hasMore,
      data: posts,
    };
  }

  async getSpeechFromContent(content: Content) {
    const client = new TextToSpeechClient();

    // The text to synthesize
    const chunks = this.getSpeechChunksFromContent(content);

    const synthesizePromises: Promise<
      [
        google.cloud.texttospeech.v1.ISynthesizeSpeechResponse,
        google.cloud.texttospeech.v1.ISynthesizeSpeechRequest,
        Record<string, unknown>,
      ]
    >[] = [];

    chunks.forEach((chunk) => {
      synthesizePromises.push(
        client.synthesizeSpeech({
          input: { text: chunk },
          // Select the language and SSML voice gender (optional)
          voice: {
            languageCode: 'en-US',
            ssmlGender: 'FEMALE',
            name: 'en-US-Wavenet-G',
          },
          // select the type of audio encoding
          audioConfig: { audioEncoding: 'MP3' },
        }),
      );
    });

    try {
      // Perform the text-to-speech requests
      const res = await Promise.all(synthesizePromises);

      const audioArr = res.map((item) => {
        if (typeof item[0].audioContent !== 'string')
          return item[0].audioContent;
      });

      // Concatinate audio
      const buffer = Buffer.concat(
        audioArr,
        audioArr.reduce((len, a) => len + a.length, 0),
      );

      return buffer;
    } catch (error) {
      throw new console.error('Unable to synthesize speech!');
    }
  }

  private getSpeechChunksFromContent(content: Content) {
    let text = '';
    const final: string[] = [];

    // Get all text from post content
    content.blocks.forEach((block) => {
      if (block.type === 'paragraph' || block.type === 'header')
        text += block.data.text + '. ';
      else if (block.type === 'quote') {
        text += block.data.text + '. ';
        text = text + block.data.caption + '. ';
      }
    });

    // Split text in 5000 char chunks (because of google text to speech api limitations)

    // Get number of chunks
    const chunks = Math.ceil(text.length / 5000);

    for (let index = 0; index < chunks; index++) {
      const chunk = text.substring(index * 5000, index * 5000 + 5000);

      final.push(stripHtml(chunk).result);
    }

    return final;
  }

  getPreviewContent(content: Content) {
    let previewContent = '';

    content.blocks.forEach((block) => {
      if (block.type === 'paragraph' && previewContent.length <= 150) {
        previewContent += block.data.text;
      }
    });

    return previewContent.slice(0, 180);
  }

  getTimeToRead(content: PostContent) {
    const getWordsNumber = (text: string) => text.split(' ').length;

    // Total words number
    let wordsNum = 0;

    content.blocks.forEach((block) => {
      switch (block.type) {
        case 'header':
        case 'quote':
        case 'paragraph':
          wordsNum += getWordsNumber(block.data.text);
          break;
        case 'code':
          wordsNum += getWordsNumber(block.data.code);
          break;

        default:
          break;
      }
    });

    let minutes = Math.floor(wordsNum / 200); //200 words per minute
    let seconds = (wordsNum / 200 - minutes) * 60;

    if (seconds < 30) {
      // Round to 30 seconds
      seconds = 30;
    } else {
      // Round up to next minute
      seconds = 0;
      minutes++;
    }

    if (minutes === 0) return `${seconds} sec`;
    else if (minutes < 5)
      return `${minutes} min ${seconds ? seconds + ' sec' : ''}`;

    return `${minutes} min`;
  }
}
