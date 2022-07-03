import { IsEmail, IsNotEmpty, IsNumberString } from 'class-validator';

export class FinishSignUpDto {
  @IsEmail()
  email: string;

  @IsNumberString()
  @IsNotEmpty()
  confirmation_code: string;
}
