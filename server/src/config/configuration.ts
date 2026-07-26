export default () => ({
  app: {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3000),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
  },
  watermarkParser: {
    url:
      process.env.WATERMARK_PARSER_URL ||
      'http://hongshu.sale:5555/api/v1/parse',
    timeoutMs: Number(process.env.WATERMARK_PARSER_TIMEOUT_MS || 30000),
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'starapi',
    baseUrl: process.env.AI_BASE_URL || '',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || '',
  },
  generate: {
    watermarkDailyLimit: Number(
      process.env.GENERATE_WATERMARK_DAILY_LIMIT || 1,
    ),
    titleDailyLimit: Number(process.env.GENERATE_TITLE_DAILY_LIMIT || 1),
    copywritingDailyLimit: Number(
      process.env.GENERATE_COPYWRITING_DAILY_LIMIT || 1,
    ),
  },
});
