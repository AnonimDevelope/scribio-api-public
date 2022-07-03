import { IsString, MaxLength } from 'class-validator';

export class UpdateDescriptionDto {
  @IsString()
  @MaxLength(1000)
  description: string;
}
