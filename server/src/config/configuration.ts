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
  douyin: {
    renderBrowserExecutablePath:
      process.env.DOUYIN_RENDER_BROWSER_EXECUTABLE_PATH || '',
    renderBrowserDisabled:
      process.env.DOUYIN_RENDER_BROWSER_DISABLED === 'true',
    renderNavigationTimeoutMs: Number(
      process.env.DOUYIN_RENDER_NAVIGATION_TIMEOUT_MS || 30000,
    ),
    renderSettleTimeoutMs: Number(
      process.env.DOUYIN_RENDER_SETTLE_TIMEOUT_MS || 8000,
    ),
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'starapi',
    baseUrl: process.env.AI_BASE_URL || '',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || '',
  },
  generate: {
    watermarkDailyLimit: Number(
      process.env.GENERATE_WATERMARK_DAILY_LIMIT || 20,
    ),
    titleDailyLimit: Number(process.env.GENERATE_TITLE_DAILY_LIMIT || 10),
    copywritingDailyLimit: Number(
      process.env.GENERATE_COPYWRITING_DAILY_LIMIT || 5,
    ),
  },
});
