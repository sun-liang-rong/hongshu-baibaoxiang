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
  xhs: {
    parserBaseUrl: process.env.XHS_PARSER_BASE_URL || '',
    parserApiKey: process.env.XHS_PARSER_API_KEY || '',
  },
  ai: {
    baseUrl: process.env.AI_BASE_URL || '',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || '',
  },
});
