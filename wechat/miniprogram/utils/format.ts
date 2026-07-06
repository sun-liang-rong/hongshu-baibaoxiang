export const formatDateTime = (input: string) => {
  const date = new Date(input);
  const pad = (value: number) => value.toString().padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const typeLabel = (type: string) => {
  const labels: Record<string, string> = {
    watermark: '去水印',
    title: '标题',
    copywriting: '文案',
  };

  return labels[type] || '全部';
};

