import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { UserDocument } from 'src/users/schemas/user.schema';
import config from 'src/config';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { RedisService } from 'src/redis/redis.service';
import { MailService } from 'src/mail/mail.service';
import { FinishSignUpDto } from './dto/finish-signup.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { google, Auth } from 'googleapis';
import { InitPasswordResetDto } from './dto/init-password-reset.dto';
import { FinishPasswordResetDto } from './dto/finish-password-reset.dto';
import { CheckPasswordResetDto } from './dto/check-password-reset.dto';
import mongoQueries from 'src/mongoQueries';

@Injectable()
export class AuthService {
  oauthClient: Auth.OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {
    this.oauthClient = new google.auth.OAuth2(
      config.googleAuthClientId,
      config.googleAuthClientSecret,
    );
  }

  // Generate 5 digit verification code
  getConfirmationCode() {
    return Math.floor(Math.random() * 90000) + 10000;
  }

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findOneByEmail(
      email,
      mongoQueries.userInclPassword,
    );

    // If user is not found, throw an error
    if (!user) throw new BadRequestException('Incorrect email or password!');

    // Check if user has an password
    if (!user.password)
      throw new ForbiddenException("User doesn't have password set!");

    // Compare passwords
    const check = await compare(pass, user.password);

    // If password is incorrect, throw error
    if (!check) throw new BadRequestException('Incorrect email or password!');

    // Return user doc
    return user;
  }

  async login(user: UserDocument) {
    const payload: JwtPayload = {
      email: user.email,
      username: user.username,
      _id: user._id,
    };

    // Sign access token
    const access_token = this.jwtService.sign(payload);

    // Sign refresh token
    const refresh_token = this.jwtService.sign(
      { _id: user._id },
      { expiresIn: config.refreshTokenExpireInDays * 24 * 60 * 60 * 1000 },
    );

    return { access_token, refresh_token, ...user.toObject() };
  }

  async getNewAccessToken(refresh_token: string) {
    // Verify refresh token
    const { _id } = await this.jwtService.verify(refresh_token);

    // Get user data
    const { email, username } = await this.usersService.findOneById(
      _id,
      mongoQueries.userPrivate,
    );

    // Sign new access token
    const access_token = this.jwtService.sign({ _id, email, username });

    return access_token;
  }

  async initSignUp(createUserDto: CreateUserDto) {
    // Check password Length
    if (createUserDto.password.length < config.minPasswordLength)
      throw new HttpException(
        `Password too short! Minimal length: ${config.minPasswordLength}`,
        HttpStatus.BAD_REQUEST,
      );

    // Check username length
    if (createUserDto.username.length < config.minPasswordLength)
      throw new HttpException(
        `Username too short! Minimal length: ${config.minUsernameLength}`,
        HttpStatus.BAD_REQUEST,
      );

    // Check if email is already used
    const emailExist = await this.usersService.exists({
      email: createUserDto.email,
    });
    if (emailExist)
      throw new HttpException('E-mail already used!', HttpStatus.BAD_REQUEST);

    // Check if username is already used
    const usernameExist = await this.usersService.exists({
      username: createUserDto.username,
    });
    if (usernameExist)
      throw new HttpException('Username already used!', HttpStatus.BAD_REQUEST);

    // Hash password
    const hashedPass = await hash(createUserDto.password, 10);

    // Generate 5 digit confirmation code
    const confirmation_code = this.getConfirmationCode();

    await Promise.all([
      // Save data in cache until email confirmation
      this.redisService.setSignUpUserData({
        confirmation_code,
        user: {
          ...createUserDto,
          password: hashedPass,
        },
      }),
      // Send email with code
      this.mailService.sendEmailVerificationCode(
        createUserDto.email,
        createUserDto.username,
        confirmation_code,
      ),
    ]);

    return { message: 'Confirmation code sent!' };
  }

  async finishSignUp(finishSignUpDto: FinishSignUpDto) {
    // Get user data from cache
    const { confirmation_code, user } =
      await this.redisService.getSignUpUserData(finishSignUpDto.email);

    // Check if code is correct
    if (parseInt(finishSignUpDto.confirmation_code) !== confirmation_code) {
      throw new HttpException('Incorrect code!', HttpStatus.BAD_REQUEST);
    }

    // Create new user
    const newUser = await this.usersService.create(user);

    // Return user profile with jwt
    const profile = await this.login(newUser);

    return profile;
  }

  async getGoogleUserData(token: string) {
    const userInfoClient = google.oauth2('v2').userinfo;

    this.oauthClient.setCredentials({
      access_token: token,
    });

    const userInfoResponse = await userInfoClient.get({
      auth: this.oauthClient,
    });

    return userInfoResponse.data;
  }

  async googleAuth({ token }: GoogleAuthDto) {
    const tokenInfo = await this.oauthClient.getTokenInfo(token);

    const email = tokenInfo.email;

    if (!email) throw new NotFoundException('Error. Possibly incorrect token!');

    try {
      const user = await this.usersService.findOneByEmail(
        email,
        mongoQueries.userPrivate,
      );
      return await this.login(user);
    } catch (error) {
      const userData = await this.getGoogleUserData(token);

      const user = await this.usersService.create({
        email: userData.email,
        username: userData.name,
      });

      return await this.login(user);
    }
  }

  async initPasswordReset({ email }: InitPasswordResetDto) {
    // Check if user with given email exist
    const user = await this.usersService.findOneByEmail(
      email,
      mongoQueries.userPrivate,
    );
    if (!user)
      throw new NotFoundException('User with given email does not exist!');

    const confirmation_code = this.getConfirmationCode();

    await Promise.all([
      //Send email with code
      this.mailService.sendPasswordResetVerificationCode(
        email,
        user.username,
        confirmation_code,
      ),
      //Save data in cache
      this.redisService.setPasswordResetData({ email, confirmation_code }),
    ]);

    return { message: 'Verification code sent!' };
  }

  async checkPasswordReset({
    email,
    confirmation_code,
  }: CheckPasswordResetDto) {
    const data = await this.redisService.getPasswordResetData(email);

    // Check if code is correct
    if (parseInt(confirmation_code) !== data.confirmation_code)
      throw new NotAcceptableException('Incorrect code!');

    return { message: 'success' };
  }

  async finishPasswordReset({
    email,
    confirmation_code,
    new_password,
  }: FinishPasswordResetDto) {
    await this.checkPasswordReset({ email, confirmation_code });

    // Hash password
    const hashedPass = await hash(new_password, 10);

    const user = await this.usersService.findOneAndUpdate(
      { email },
      { password: hashedPass },
    );

    return await this.login(user);
  }
}
