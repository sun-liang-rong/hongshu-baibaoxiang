import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).default('change-me-in-production'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  WECHAT_APP_ID: Joi.string().allow('').default(''),
  WECHAT_APP_SECRET: Joi.string().allow('').default(''),
  WATERMARK_PARSER_URL: Joi.string()
    .uri()
    .default('http://hongshu.sale:5555/api/v1/parse'),
  WATERMARK_PARSER_TIMEOUT_MS: Joi.number().integer().min(1000).default(30000),
  AI_PROVIDER: Joi.string().allow('').default('starapi'),
  AI_BASE_URL: Joi.string().uri().allow('').default(''),
  AI_API_KEY: Joi.string().allow('').default(''),
  AI_MODEL: Joi.string().allow('').default(''),
  GENERATE_WATERMARK_DAILY_LIMIT: Joi.number().integer().min(0).default(1),
  GENERATE_TITLE_DAILY_LIMIT: Joi.number().integer().min(0).default(1),
  GENERATE_COPYWRITING_DAILY_LIMIT: Joi.number().integer().min(0).default(1),
});
