import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import config from 'src/config';
import { v4 as uuid } from 'uuid';
import axios from 'axios';
import imageSize from 'image-size';
import * as sharp from 'sharp';
import { getPlaiceholder } from 'plaiceholder';
import { UploadedImageData } from './schemas/uploaded-Image-data.schema';

@Injectable()
export class FilesService {
  private async uploadFile(
    file: Buffer | Uint8Array | string,
    filename: string,
  ) {
    try {
      const s3 = new S3();

      const res = await s3
        .upload({
          Bucket: config.awsBucketName,
          Body: file,
          Key: `${uuid()}-${filename}`,
        })
        .promise();

      return { location: res.Location, key: res.Key };
    } catch (error) {
      throw new HttpException('Unable to upload file!', 500);
    }
  }

  async uploadAudio(audio: Uint8Array | string) {
    const { location, key } = await this.uploadFile(audio, 'audio.mp3');

    return { url: location, key };
  }

  async uploadImage(
    imageBuffer: Buffer,
    filename: string,
    imageMaxWidth: number,
    imageMaxHeight?: number,
  ): Promise<UploadedImageData> {
    let image = imageBuffer;

    // Get image size
    let imageSizes = imageSize(imageBuffer);

    // Check if image width is more than needed
    if (imageSizes.width > imageMaxWidth) {
      // Resize image
      image = await sharp(imageBuffer)
        .resize(imageMaxWidth, imageMaxHeight)
        .toBuffer();

      // Re assign sizes
      imageSizes = imageSize(image);
    }

    // Run in parallel
    const [uploadRes, { base64 }] = await Promise.all([
      // Upload image to s3 bucket
      this.uploadFile(image, filename),

      // Generate low res base64 encoded image
      getPlaiceholder(imageBuffer),
    ]);

    return {
      url: uploadRes.location,
      key: uploadRes.key,
      height: imageSizes.height,
      width: imageSizes.width,
      placeholder: base64,
    };
  }

  // Download image by url and return buffer
  async downloadImage(url: string) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });

    if (!res.data)
      throw new BadRequestException('Unable to download image from given url!');

    const imageBuffer = Buffer.from(res.data, 'utf-8');
    return imageBuffer;
  }
}
