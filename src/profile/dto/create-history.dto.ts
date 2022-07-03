import { IsNotEmpty, IsString } from 'class-validator';

export class CreateHistoryDto {
  @IsNotEmpty()
  @IsString()
  postId: string;
}
