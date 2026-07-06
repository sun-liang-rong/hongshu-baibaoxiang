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
  XHS_PARSER_BASE_URL: Joi.string().uri().allow('').default(''),
  XHS_PARSER_API_KEY: Joi.string().allow('').default(''),
  AI_BASE_URL: Joi.string().uri().allow('').default(''),
  AI_API_KEY: Joi.string().allow('').default(''),
  AI_MODEL: Joi.string().allow('').default(''),
});
