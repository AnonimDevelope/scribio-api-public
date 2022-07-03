import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import config from 'src/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { MailModule } from 'src/mail/mail.module';
import { RedisModule } from 'src/redis/redis.module';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    MailModule,
    RedisModule,
    FilesModule,

    // Configure jwt
    JwtModule.register({
      secret: config.jwtSecret,
      signOptions: { expiresIn: `${config.accessTokenExpireInMinutes}m` },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
