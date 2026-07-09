import {
  buildNoWatermarkUrl,
  extractAwemeId,
  extractDouyinDetail,
  extractDouyinDetailFromHtml,
  extractDouyinUrl,
  extractVideoFromXgContainer,
  isDouyinUrl,
  normalizeDouyinVideoUrl,
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

    expect(
      extractAwemeId('https://www.douyin.com/video/7080001112223334444'),
    ).toBe('7080001112223334444');

    expect(
      extractAwemeId(
        'https://www.douyin.com/discover?modal_id=7080001112223334444',
      ),
    ).toBe('7080001112223334444');
  });

  it('normalizes share url to canonical douyin video url', () => {
    expect(
      normalizeDouyinVideoUrl(
        'https://www.iesdouyin.com/share/video/7658268141127282289/?region=CN',
      ),
    ).toBe('https://www.douyin.com/video/7658268141127282289');
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

  it('extracts video src from xg-video-container html', () => {
    const detail = extractVideoFromXgContainer(`
      <div class="player xg-video-container">
        <video src="//example.com/video.mp4" poster="https://example.com/poster.jpeg"></video>
      </div>
    `);

    expect(detail.videoUrl).toBe('https://example.com/video.mp4');
    expect(detail.coverUrl).toBe('https://example.com/poster.jpeg');
  });

  it('extracts normalized detail from douyin render html', () => {
    const state = {
      loaderData: {
        video: {
          aweme: {
            awemeId: '7080001112223334444',
            desc: '页面文案',
            video: {
              cover: {
                urlList: ['https://example.com/cover.jpeg'],
              },
              playAddr: {
                urlList: [
                  'https://aweme.snssdk.com/aweme/v1/playwm/?video_id=v0200',
                ],
              },
            },
            music: {
              playUrl: {
                urlList: ['https://example.com/music.mp3'],
              },
            },
          },
        },
      },
    };
    const encoded = encodeURIComponent(JSON.stringify(state));
    const detail = extractDouyinDetailFromHtml(
      `<script id="RENDER_DATA" type="application/json">${encoded}</script>`,
      '7080001112223334444',
    );

    expect(detail).toEqual({
      noteId: '7080001112223334444',
      title: '',
      content: '页面文案',
      type: 'video',
      images: [],
      coverUrl: 'https://example.com/cover.jpeg',
      videoUrl: 'https://aweme.snssdk.com/aweme/v1/play/?video_id=v0200',
      musicUrl: 'https://example.com/music.mp3',
    });
  });

  it('extracts normalized detail from douyin universal hydration html', () => {
    const state = {
      defaultScope: {
        webapp: {
          item: {
            id: '7080001112223334444',
            desc: 'hydration 文案',
            video: {
              bitRateList: [
                {
                  playAddr: {
                    urlList: [
                      '//aweme.snssdk.com/aweme/v1/playwm/?video_id=v0201',
                    ],
                  },
                },
              ],
              dynamicCover: 'https://example.com/dynamic.webp',
            },
          },
        },
      },
    };
    const detail = extractDouyinDetailFromHtml(
      `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">${JSON.stringify(state)}</script>`,
      '7080001112223334444',
    );

    expect(detail.videoUrl).toBe(
      'https://aweme.snssdk.com/aweme/v1/play/?video_id=v0201',
    );
    expect(detail.coverUrl).toBe('https://example.com/dynamic.webp');
    expect(detail.content).toBe('hydration 文案');
  });
});
