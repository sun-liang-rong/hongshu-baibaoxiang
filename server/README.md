# 红薯百宝箱后端

“红薯百宝箱”微信小程序的 NestJS 后端，提供微信登录、素材去水印解析、AI 标题/文案生成、历史记录和收藏等 REST API。

## 技术栈

- NestJS 11
- TypeScript
- MySQL
- Prisma
- Swagger
- class-validator
- Jest

## 已实现功能

- 微信 `code` 换取 `openid`
- 通过独立远程服务解析分享链接与无水印素材
- 小红书风格标题生成
- 小红书风格文案生成
- 生成记录与解析记录持久化
- 历史记录查询、分页、删除和清空
- 收藏状态查询、收藏/取消收藏、分页和删除
- 去水印、标题和文案每日额度控制，默认每项每天 1 次
- 统一请求参数校验、响应结构和异常处理
- Swagger 接口文档和健康检查

`StatsModule` 与 `SystemConfigModule` 目前仍为预留模块，尚未实现具体统计和配置管理逻辑。

## 目录结构

```text
src/
├─ main.ts
├─ app.module.ts
├─ common/                 # 全局装饰器、异常过滤器、响应拦截器等
├─ config/                 # 环境配置与校验
├─ database/               # Prisma 数据库连接
├─ integrations/
│  ├─ ai-provider/         # OpenAI 兼容的大模型接口
│  ├─ watermark-parser/    # 远程去水印服务客户端
│  └─ wechat/              # 微信登录接口
└─ modules/
   ├─ auth/                # 微信登录
   ├─ favorite/            # 收藏
   ├─ generate/            # 标题与文案生成
   ├─ health/              # 健康检查
   ├─ history/             # 历史记录
   ├─ stats/               # 统计预留模块
   ├─ system-config/       # 系统配置预留模块
   └─ watermark/           # 去水印额度、历史与响应适配
```

## 环境配置

复制环境变量示例：

```bash
cp .env.example .env
```

主要配置：

```dotenv
PORT=3000
DATABASE_URL="mysql://root:password@localhost:3306/redbook_toolbox"
DATABASE_CONNECT_ON_START=false

WECHAT_APP_ID=""
WECHAT_APP_SECRET=""

WATERMARK_PARSER_URL="http://hongshu.sale:5555/api/v1/parse"
WATERMARK_PARSER_TIMEOUT_MS=30000

AI_PROVIDER="starapi"
AI_BASE_URL="https://www.starapi.cc/"
AI_API_KEY=""
AI_MODEL="gpt-5.5"

GENERATE_WATERMARK_DAILY_LIMIT=1
GENERATE_TITLE_DAILY_LIMIT=1
GENERATE_COPYWRITING_DAILY_LIMIT=1
```

三项每日额度配置的含义：

| 环境变量 | 含义 |
| --- | --- |
| `GENERATE_WATERMARK_DAILY_LIMIT` | 每个用户每天可成功去水印的次数 |
| `GENERATE_TITLE_DAILY_LIMIT` | 每个用户每天可成功生成标题的次数 |
| `GENERATE_COPYWRITING_DAILY_LIMIT` | 每个用户每天可成功生成文案的次数 |

没有配置时默认值都是 `1`；配置为 `0` 时对应功能不可用。额度按北京时间自然日统计，只计算成功记录。修改这些环境变量后，需要完整重启后端进程才能生效。

去水印由 `WATERMARK_PARSER_URL` 指向的独立服务处理。后端会向该地址发送 `POST { "link": "分享文本或链接" }`，本项目不再包含平台抓取与解析逻辑。

`POST /api/v1/watermark/parse` 在统一的 `{ code, message, data }` 响应外壳中完整保留远程服务的 `{ success, data, request_id }`，并在同级追加 `quota`。小程序以远程服务的蛇形字段为统一模型，不再使用旧的 `videoUrl`、`coverUrl` 等二次映射字段。

## 本地运行

```bash
npm install
npm run start:dev
```

- API 前缀：`/api/v1`
- 健康检查：`GET /api/v1/health`
- Swagger：`GET /api/docs`

小程序开发环境默认请求 `http://127.0.0.1:3000/api/v1`。

## 主要接口

```text
POST   /api/v1/auth/openid

GET    /api/v1/watermark/quota
POST   /api/v1/watermark/parse

GET    /api/v1/generate/quota
POST   /api/v1/generate/titles
POST   /api/v1/generate/copywriting

GET    /api/v1/history
DELETE /api/v1/history/:id
DELETE /api/v1/history

GET    /api/v1/favorites
GET    /api/v1/favorites/status
POST   /api/v1/favorites
DELETE /api/v1/favorites/:id
```

除登录和健康检查外，业务接口通过 `x-openid` 请求头识别用户。

## 数据库

Prisma 模型位于 `prisma/schema.prisma`，当前包含：

- `GenerateRecord`：去水印、标题和文案的成功/失败记录
- `Favorite`：用户收藏

执行数据库迁移和生成 Prisma Client：

```bash
npx prisma migrate deploy
npx prisma generate
```

## 常用命令

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```

注意：`npm run lint` 当前包含 `--fix`，会直接格式化或修改源码。

## 当前限制

- `openid` 目前由客户端通过请求头传入，尚未使用 JWT 或服务端会话验证。
- 统计和系统配置模块尚未实现业务逻辑。
- 每日额度依赖成功记录统计，因此生产环境需要启用可用的 MySQL 数据库连接。数据库暂时不可用时，额度查询会按未使用降级，解析和生成可以继续，但这段时间不会严格限制次数，记录也可能无法持久化。
