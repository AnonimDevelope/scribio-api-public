import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmailVerificationCode(to: string, username: string, code: number) {
    return await this.mailerService.sendMail({
      to: to, // list of receivers
      subject: 'Welcome to Scribio! Confirm your Email', // Subject line
      template: '/email-confirmation',
      context: {
        username,
        code,
      },
    });
  }

  async sendPasswordResetVerificationCode(
    to: string,
    username: string,
    code: number,
  ) {
    return await this.mailerService.sendMail({
      to: to,
      subject: 'Password reset confirmation code',
      template: '/password-reset',
      context: {
        username,
        code,
      },
    });
  }
}
