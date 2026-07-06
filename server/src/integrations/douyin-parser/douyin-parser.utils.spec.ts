import {
  buildNoWatermarkUrl,
  extractAwemeId,
  extractDouyinDetail,
  extractDouyinUrl,
  isDouyinUrl,
} from './douyin-parser.utils';

describe('douyin-parser utils', () => {
  it('extracts douyin short link from shared text', () => {
    const text = '复制这段内容，打开抖音 https://v.douyin.com/abc123/ 看视频';

    expect(extractDouyinUrl(text)).toBe('https://v.douyin.com/abc123/');
  });

  it('detects douyin hosts', () => {
    expect(isDouyinUrl('https://v.douyin.com/abc123/')).toBe(true);
    expect(isDouyinUrl('https://www.iesdouyin.com/share/video/123')).toBe(true);
    expect(isDouyinUrl('https://www.xiaohongshu.com/explore/123')).toBe(false);
  });

  it('extracts aweme id from share video url', () => {
    expect(
      extractAwemeId(
        'https://www.iesdouyin.com/share/video/7080001112223334444/?region=CN',
      ),
    ).toBe('7080001112223334444');
  });

  it('converts playwm video url to play url', () => {
    expect(
      buildNoWatermarkUrl(
        'https://aweme.snssdk.com/aweme/v1/playwm/?video_id=v0200fg10000',
      ),
    ).toBe('https://aweme.snssdk.com/aweme/v1/play/?video_id=v0200fg10000');
  });

  it('extracts normalized detail from douyin iteminfo response', () => {
    const detail = extractDouyinDetail({
      item_list: [
        {
          aweme_id: '7080001112223334444',
          desc: '测试文案',
          video: {
            cover: { url_list: ['https://example.com/cover.jpeg'] },
            play_addr: {
              url_list: [
                'https://aweme.snssdk.com/aweme/v1/playwm/?video_id=v0200',
              ],
            },
          },
          music: {
            play_url: { url_list: ['https://example.com/music.mp3'] },
          },
        },
      ],
    });

    expect(detail).toEqual({
      noteId: '7080001112223334444',
      title: '',
      content: '测试文案',
      type: 'video',
      images: [],
      coverUrl: 'https://example.com/cover.jpeg',
      videoUrl: 'https://aweme.snssdk.com/aweme/v1/play/?video_id=v0200',
      musicUrl: 'https://example.com/music.mp3',
    });
  });
});
