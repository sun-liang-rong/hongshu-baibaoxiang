type ShareParams = Record<string, string | number | boolean | undefined>;

export const TOOLBOX_SHARE_TITLE = '红薯百宝箱｜素材提取、标题和文案一站完成';

export function enableShareMenu(includeTimeline = true) {
  wx.showShareMenu({
    withShareTicket: false,
    menus: includeTimeline
      ? ['shareAppMessage', 'shareTimeline']
      : ['shareAppMessage'],
  });
}

export function buildShareQuery(params: ShareParams) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && String(value).trim() !== '')
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');
}

export function buildSharePath(path: string, params: ShareParams = {}) {
  const query = buildShareQuery(params);
  return query ? `${path}?${query}` : path;
}

export function decodeShareParam(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function buildCreatorShareTitle(topic: string, contentLabel: string) {
  const normalizedTopic = topic.trim().replace(/\s+/g, ' ').slice(0, 18);
  return normalizedTopic
    ? `一起写「${normalizedTopic}」${contentLabel}，打开就能用`
    : `红薯百宝箱｜输入主题，快速生成${contentLabel}`;
}
