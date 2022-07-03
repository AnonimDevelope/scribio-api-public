export default {
  port: parseInt(process.env.PORT),

  minPasswordLength: 5,
  minUsernameLength: 4,

  cookieSecret: process.env.COOKIE_SECRET,
  mongoUri: process.env.MONGO_URI,
  frontendUrl: process.env.FRONTEND_URL, // Example https://scribio.com (Without slash at the end)
  awsBucketName: process.env.AWS_BUCKET_NAME,

  // JWT
  refreshTokenExpireInDays: 60,
  accessTokenExpireInMinutes: 20,
  jwtSecret: process.env.JWT_SECRET,

  // Google
  googleAuthClientId: process.env.GOOGLE_AUTH_CLIENT_ID,
  googleAuthClientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,

  // Redis
  redisPort: parseInt(process.env.REDIS_PORT),
  redisHost: process.env.REDIS_HOST,
  redisAuthPassword: process.env.REDIS_AUTH_PASSWORD,

  // Mailer
  mailerHost: process.env.MAILER_HOST,
  mailerPort: parseInt(process.env.MAILER_PORT),
  mailerUser: process.env.MAILER_USER,
  mailerPassword: process.env.MAILER_PASSWORD,
};
