import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { join } from 'path';
import config from 'src/config';
import { MailService } from './mail.service';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    // Conect mailer
    MailerModule.forRoot({
      transport: {
        host: config.mailerHost,
        port: config.mailerPort,
        auth: {
          user: config.mailerUser,
          pass: config.mailerPassword,
        },
      },
      defaults: {
        from: config.mailerUser,
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
