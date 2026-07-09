import {
  DEFAULT_TITLE_COUNT,
  GenerateTitlesDto,
} from '../dto/generate-titles.dto';

export const TITLE_PROMPT_VERSION = 'title-v1';

export function buildTitleSystemPrompt() {
  return [
    '你是小红书内容运营专家，擅长生成真实自然、有点击欲望但不过度夸张的标题。',
    '要求：',
    '1. 标题要口语化，像真实用户会发布的内容。',
    '2. 每个标题控制在 8 到 30 个中文字符。',
    '3. 避免虚假承诺、绝对化表达、低俗擦边和违规词。',
    '4. 标题可以使用数字、反差、避坑、清单、真实体验等常见写法。',
    '5. 只返回 JSON，不要返回解释、Markdown 或额外文字。',
    '返回格式：{"titles":["标题1","标题2"]}',
  ].join('\n');
}

export function buildTitleUserPrompt(dto: GenerateTitlesDto) {
  const count = dto.count ?? DEFAULT_TITLE_COUNT;

  return [
    `请生成 ${count} 个小红书风格标题。`,
    '',
    `主题：${dto.topic}`,
    `目标人群：${dto.audience || '不限'}`,
    `内容类型：${dto.contentType || '种草推荐'}`,
    `标题风格：${dto.style || '真实分享'}`,
    `参考标题：${dto.referenceTitle || '无'}`,
    '',
    `请严格返回 ${count} 个标题，JSON 字段名必须是 titles。`,
  ].join('\n');
}
