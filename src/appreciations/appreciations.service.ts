import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import {
  Appreciation,
  AppreciationDocument,
} from './schemas/appreciation.schema';

type AppreciationType = 'post' | 'comment';

@Injectable()
export class AppreciationsService {
  constructor(
    @InjectModel(Appreciation.name)
    private AppreciationModel: Model<AppreciationDocument>,
  ) {}

  async like(uid: string, targetId: string, type: AppreciationType) {
    const exists = await this.AppreciationModel.exists({
      uid,
      targetId,
      type,
    });

    if (exists) {
      const { appreciation } = await this.getUserAppreciation(
        uid,
        targetId,
        type,
      );

      // Update appreciation if it already exists but is different
      if (appreciation === 'dislike') {
        await this.AppreciationModel.updateOne(
          { uid, targetId, type },
          { appreciation: 'like' },
        );

        return 'updated';
      } else {
        throw new ConflictException('Appreciation already exists!');
      }
    }

    await this.AppreciationModel.create({
      uid,
      type,
      targetId,
      appreciation: 'like',
    });

    return 'success';
  }

  async dislike(uid: string, targetId: string, type: AppreciationType) {
    const exists = await this.AppreciationModel.exists({
      uid,
      targetId,
      type,
    });

    if (exists) {
      const { appreciation } = await this.getUserAppreciation(
        uid,
        targetId,
        type,
      );

      // Update appreciation if it already exists but is different
      if (appreciation === 'like') {
        await this.AppreciationModel.updateOne(
          { uid, targetId, type },
          { appreciation: 'dislike' },
        );

        return 'updated';
      } else {
        throw new ConflictException('Appreciation already exists!');
      }
    }

    await this.AppreciationModel.create({
      uid,
      type,
      targetId,
      appreciation: 'dislike',
    });

    return 'success';
  }

  async delete(uid: string, targetId: string, type: string) {
    const appreciationDoc = await this.getUserAppreciation(uid, targetId, type);

    if (!appreciationDoc)
      throw new NotFoundException('Appreciation not found!');

    const appreciation = appreciationDoc.appreciation;

    await appreciationDoc.delete();

    return appreciation === 'like' ? 'like deleted' : 'dislike deleted';
  }

  async deleteMany(filter: FilterQuery<AppreciationDocument>) {
    try {
      return await this.AppreciationModel.deleteMany(filter);
    } catch (error) {
      throw new Error('Unable to delete appreciations!');
    }
  }

  async getUserAppreciation(uid: string, targetId: string, type: string) {
    const appreciationDoc = await this.AppreciationModel.findOne({
      uid,
      targetId,
      type,
    }).select('appreciation');

    return appreciationDoc;
  }
}
