# 红薯百宝箱后端

这是“红薯百宝箱去水印生成文案”的 NestJS 后端项目框架。

当前阶段只搭建基础框架，不包含具体业务实现。

## 技术栈

- NestJS
- TypeScript
- MySQL
- Prisma
- JWT 预留
- Swagger
- class-validator

## 目录结构

```text
src/
├─ main.ts
├─ app.module.ts
├─ common/                 # 全局公共能力
│  ├─ constants/
│  ├─ decorators/
│  ├─ filters/
│  ├─ guards/
│  └─ interceptors/
├─ config/                 # 环境配置
├─ database/               # Prisma 数据库连接
├─ integrations/           # 第三方接口封装
│  ├─ ai-provider/
│  ├─ wechat/
│  └─ xhs-parser/
└─ modules/                # 业务模块
   ├─ auth/
   ├─ favorite/
   ├─ generate/
   ├─ health/
   ├─ history/
   ├─ stats/
   ├─ system-config/
   ├─ users/
   └─ watermark/
```

## 环境配置

复制环境变量示例：

```bash
cp .env.example .env
```

至少需要配置：

```text
DATABASE_URL="mysql://root:password@localhost:3306/redbook_toolbox"
DATABASE_CONNECT_ON_START=false
JWT_SECRET="please-change-this-secret"
```

`DATABASE_CONNECT_ON_START=false` 时服务启动不会强制连接数据库，方便先验证框架。真正接入业务和数据库后可改为 `true`。

## 本地运行

```bash
npm install
npm run start:dev
```

接口前缀：

```text
/api/v1
```

健康检查：

```text
GET /api/v1/health
```

Swagger 文档：

```text
GET /api/docs
```

## 常用命令

```bash
npm run build
npm run lint
npm run test
npm run test:e2e
```

## 当前已完成

- NestJS 项目初始化
- 全局 API 前缀 `/api/v1`
- Swagger 文档入口
- 全局参数校验管道
- 统一响应结构
- 统一异常结构
- 环境变量校验
- Prisma 数据库连接层
- 健康检查接口
- 业务模块空壳
- 第三方集成模块空壳

## 后续业务实现建议

建议按以下顺序继续：

1. 微信登录 `AuthModule`
2. 用户资料 `UsersModule`
3. 小红书去水印 `WatermarkModule`
4. 标题和文案生成 `GenerateModule`
5. 历史记录 `HistoryModule`
6. 收藏 `FavoriteModule`
7. 后台统计 `StatsModule`
