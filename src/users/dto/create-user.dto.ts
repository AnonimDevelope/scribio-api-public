import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  password?: string;
}
