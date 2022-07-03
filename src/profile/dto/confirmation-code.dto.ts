import { IsNotEmpty, IsNumber } from 'class-validator';

export class ConfirmationCodeDto {
  @IsNumber()
  @IsNotEmpty()
  code: number;
}
