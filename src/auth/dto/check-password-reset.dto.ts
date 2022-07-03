import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class CheckPasswordResetDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsNumberString()
  @IsNotEmpty()
  confirmation_code: string;
}
