const LINK_PATTERN = /https?:\/\/[^\s\])]+/i;

export const isValidSupportedLinkText = (text: string) =>
  LINK_PATTERN.test(text);

export const normalizeInput = (text: string) =>
  text.trim().replace(/\s+/g, " ");
