import { GenerateCopywritingDto } from '../dto/generate-copywriting.dto';

export const COPYWRITING_PROMPT_VERSION = 'copywriting-v1';

const lengthDescriptions = {
  short: '短文案，约 120 到 200 字，适合快速发布',
  medium: '中等文案，约 250 到 450 字，结构完整但不啰嗦',
  long: '长文案，约 600 到 900 字，适合教程、测评或深度种草',
};

export function buildCopywritingSystemPrompt() {
  return [
    '你是小红书文案策划，擅长写真实自然的种草、避坑、测评、教程和探店内容。',
    '要求：',
    '1. 文案要像真实用户分享，不要像硬广。',
    '2. 结构清晰，有标题、正文、话题标签和配图建议。',
    '3. 不编造具体数据、功效、医疗承诺、获奖背书或无法验证的信息。',
    '4. 避免绝对化用语、低俗擦边和违规内容。',
    '5. 只返回 JSON，不要返回解释、Markdown 或额外文字。',
    '返回格式：{"title":"文案标题","body":"正文内容","tags":["标签1"],"imageSuggestions":["配图建议1"]}',
  ].join('\n');
}

export function buildCopywritingUserPrompt(dto: GenerateCopywritingDto) {
  const length = dto.length ?? 'medium';

  return [
    '请生成一篇小红书风格文案。',
    '',
    `主题：${dto.topic}`,
    `产品名称：${dto.productName || '无'}`,
    `卖点或重点：${dto.sellingPoints || '无'}`,
    `目标人群：${dto.audience || '不限'}`,
    `文案风格：${dto.style || '真实分享'}`,
    `文案长度：${lengthDescriptions[length]}`,
    `是否需要话题标签：${dto.includeTags === false ? '否' : '是'}`,
    '',
    '正文请自然分段，适当使用小标题或列表感表达，但不要输出 Markdown。',
    'JSON 字段名必须是 title、body、tags、imageSuggestions。',
  ].join('\n');
}
