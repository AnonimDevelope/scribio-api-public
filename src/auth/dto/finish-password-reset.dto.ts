import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class FinishPasswordResetDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsNumberString()
  @IsNotEmpty()
  confirmation_code: string;

  @IsString()
  @IsNotEmpty()
  new_password: string;
}
