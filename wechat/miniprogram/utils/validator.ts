const SUPPORTED_LINK_PATTERNS = [
  /xiaohongshu\.com/i,
  /xhslink\.com/i,
  /xhsurl\.com/i,
  /douyin\.com/i,
  /iesdouyin\.com/i,
  /v\.douyin\.com/i,
];

export const isValidSupportedLinkText = (text: string) => SUPPORTED_LINK_PATTERNS.some((pattern) => pattern.test(text));

export const normalizeInput = (text: string) => text.trim().replace(/\s+/g, ' ');
