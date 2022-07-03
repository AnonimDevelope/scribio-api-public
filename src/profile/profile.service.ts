import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { HistoryDocument, History } from './schemas/history.schema';
import { Save, SaveDocument } from './schemas/save.schema';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(History.name)
    private readonly HistoryModel: Model<HistoryDocument>,
    @InjectModel(Save.name)
    private readonly SaveModel: Model<SaveDocument>,
  ) {}

  async createHistoryItem(
    uid: string,
    postId: string,
    postTitle: string,
    postAuthorUid: string,
    postAuthorUsername: string,
  ) {
    const historyItem = new this.HistoryModel({
      uid,
      date: Date.now(),
      post: {
        _id: postId,
        title: postTitle,
        author: {
          _id: postAuthorUid,
          username: postAuthorUsername,
        },
      },
    });

    return await historyItem.save();
  }

  // async getHistoryItem(id: string) {
  //   return await this.HistoryModel.findById(id);
  // }

  async deleteHistoryItem(uid: string, id: string) {
    return await this.HistoryModel.deleteOne({ _id: id, uid });
  }

  async clearUserHistory(uid: string) {
    return await this.HistoryModel.deleteMany({ uid });
  }

  async getUserHistory(uid: string, page = 0) {
    const itemsPerPage = 20;

    const history = await this.HistoryModel.find({ uid })
      .sort({ date: -1 })
      .skip(page * itemsPerPage)
      .limit(itemsPerPage + 1); // Get one more item

    const hasMore = history.length === itemsPerPage + 1;

    if (hasMore) history.pop(); // Remove last item

    return {
      page,
      hasMore,
      data: history,
    };
  }

  async updateManyHistoryItems(
    filter: FilterQuery<HistoryDocument>,
    updateQuery: UpdateQuery<HistoryDocument>,
  ) {
    try {
      return await this.HistoryModel.updateMany(filter, updateQuery);
    } catch (error) {
      throw new HttpException('Unable to update history items', 500);
    }
  }

  async newSave(uid: string, postId: string) {
    // Check if save already exists
    const exists = await this.SaveModel.exists({ uid, postId });

    if (exists) throw new ConflictException('Save already exists!');

    await this.SaveModel.create({ uid, postId, date: Date.now() });

    return 'success';
  }

  async deleteSave(uid: string, postId: string) {
    const { deletedCount } = await this.SaveModel.deleteOne({ uid, postId });

    if (deletedCount === 0) throw new NotFoundException('Save not found!');

    return 'success';
  }

  getUserSaves(uid: string) {
    return this.SaveModel.find({ uid }).sort({ date: -1 });
  }

  isSaved(uid: string, postId: string) {
    return this.SaveModel.exists({ uid, postId });
  }

  deletePostSaves(postId) {
    return this.SaveModel.deleteMany({ postId });
  }
}
