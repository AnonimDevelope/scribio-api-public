import { IsNotEmpty, IsString } from 'class-validator';

export class InitPasswordResetDto {
  @IsString()
  @IsNotEmpty()
  email: string;
}
