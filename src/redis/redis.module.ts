import { CacheModule, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import * as redisStore from 'cache-manager-redis-store';
import config from 'src/config';

@Module({
  imports: [
    // Init cache
    CacheModule.register({
      store: redisStore,
      ttl: 10000,
      host: config.redisHost,
      port: config.redisPort,
      auth_pass: config.redisAuthPassword,
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
