import {
  Controller,
  Post,
  Get,
  UseGuards,
  Body,
  Req,
  Res,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { User } from 'src/decorators/user.decorator';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserDocument } from 'src/users/schemas/user.schema';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CookieOptions, Request, Response } from 'express';
import config from 'src/config';
import { FinishSignUpDto } from './dto/finish-signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from './types/jwt-payload.type';
import { UsersService } from 'src/users/users.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { InitPasswordResetDto } from './dto/init-password-reset.dto';
import { CheckPasswordResetDto } from './dto/check-password-reset.dto';
import { FinishPasswordResetDto } from './dto/finish-password-reset.dto';
import mongoQueries from 'src/mongoQueries';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  readonly refreshTokenCookieOpts: CookieOptions = {
    httpOnly: true,
    signed: true,
    path: '/',
    maxAge: config.refreshTokenExpireInDays * 24 * 60 * 60 * 1000,
    sameSite: 'none',
    secure: true,
  };

  @UseGuards(LocalAuthGuard)
  @Post('logIn')
  async login(
    @User() user: UserDocument,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Return user profile with jwt
    const profile = await this.authService.login(user);

    // Set refreshToken in cookie
    response.cookie(
      'refresh_token',
      profile.refresh_token,
      this.refreshTokenCookieOpts,
    );

    return profile;
  }

  @Post('initSignUp')
  async initSignUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.initSignUp(createUserDto);
  }

  @Post('finishSignUp')
  async signUp(
    @Body() finishSignUpDto: FinishSignUpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const profile = await this.authService.finishSignUp(finishSignUpDto);

    // Set refreshToken in cookie
    response.cookie(
      'refresh_token',
      profile.refresh_token,
      this.refreshTokenCookieOpts,
    );

    return profile;
  }

  @Get('refreshAccessToken')
  async refreshAccessToken(@Req() request: Request) {
    // Get refresh token from cookie
    const refresh_token = request.signedCookies['refresh_token'];

    if (!refresh_token)
      throw new HttpException(
        'refreshToken cookie is not present!',
        HttpStatus.BAD_REQUEST,
      );

    // Sign new access token
    const access_token = await this.authService.getNewAccessToken(
      refresh_token,
    );

    return { message: 'success', access_token };
  }

  @Post('logOut')
  logOut(@Res({ passthrough: true }) response: Response) {
    // Delete refresh token cookie
    response.cookie('refresh_token', '', {
      ...this.refreshTokenCookieOpts,
      maxAge: 0,
    });

    return { message: 'success' };
  }

  @Post('google')
  async googleAuth(
    @Body() googleAuthDto: GoogleAuthDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const profile = await this.authService.googleAuth(googleAuthDto);

    // Set refreshToken in cookie
    response.cookie(
      'refresh_token',
      profile.refresh_token,
      this.refreshTokenCookieOpts,
    );

    return profile;
  }

  @Post('initPasswordReset')
  initPasswordReset(@Body() initPasswordResetDto: InitPasswordResetDto) {
    return this.authService.initPasswordReset(initPasswordResetDto);
  }

  @Post('checkPasswordReset')
  checkPasswordReset(@Body() checkPasswordResetDto: CheckPasswordResetDto) {
    return this.authService.checkPasswordReset(checkPasswordResetDto);
  }

  @Post('finishPasswordReset')
  async finishPasswordReset(
    @Body() finishPasswordResetDto: FinishPasswordResetDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const profile = await this.authService.finishPasswordReset(
      finishPasswordResetDto,
    );

    // Set refreshToken in cookie
    response.cookie(
      'refresh_token',
      profile.refresh_token,
      this.refreshTokenCookieOpts,
    );

    return profile;
  }
}
