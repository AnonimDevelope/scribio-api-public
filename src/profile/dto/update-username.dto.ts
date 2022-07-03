import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateUsernameDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  username: string;
}
