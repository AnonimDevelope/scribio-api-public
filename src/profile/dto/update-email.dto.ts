import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class UpdateEmailDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
}
