import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

type UserData = {
  user: CreateUserDto;
  confirmation_code: number;
};

type ResetPasswordData = {
  email: string;
  confirmation_code: number;
};

type UpdateEmailData = {
  new_email: string;
  confirmation_code: number;
  user_id: string;
};

@Injectable()
export class RedisService {
  // IMPORTANT! if any prefix will be changed, already stored data will be inaccessible
  readonly SIGNUP_USER_CACHE_PREFIX = 'signup-cache';
  readonly PASSWORD_RESET_CACHE_PREFIX = 'password-reset-cache';
  readonly EMAIL_UPDATE_CACHE_PREFIX = 'email-update-cache-prefix';

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async setSignUpUserData(userData: UserData) {
    return await this.cacheManager.set(
      this.SIGNUP_USER_CACHE_PREFIX + userData.user.email,
      JSON.stringify(userData),
    );
  }

  async getSignUpUserData(email: string) {
    const data = (await this.cacheManager.get(
      this.SIGNUP_USER_CACHE_PREFIX + email,
    )) as string;

    if (!data) return;

    return JSON.parse(data) as UserData;
  }

  async setPasswordResetData(data: ResetPasswordData) {
    return await this.cacheManager.set(
      this.PASSWORD_RESET_CACHE_PREFIX + data.email,
      JSON.stringify(data),
    );
  }

  async getPasswordResetData(email: string) {
    const data = (await this.cacheManager.get(
      this.PASSWORD_RESET_CACHE_PREFIX + email,
    )) as string;

    if (!data) return;

    return JSON.parse(data) as ResetPasswordData;
  }

  async setEmailUpdateData(data: UpdateEmailData) {
    return await this.cacheManager.set(
      this.EMAIL_UPDATE_CACHE_PREFIX + data.user_id,
      JSON.stringify(data),
    );
  }

  async getEmailUpdateData(userId: string) {
    const data = (await this.cacheManager.get(
      this.EMAIL_UPDATE_CACHE_PREFIX + userId,
    )) as string;

    if (!data) return;

    return JSON.parse(data) as UpdateEmailData;
  }
}
