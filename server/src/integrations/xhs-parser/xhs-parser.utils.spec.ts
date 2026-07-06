import {
  buildNoWatermarkImageUrl,
  extractInitialState,
  extractNoteUrl,
  normalizeXhsNoteUrl,
  parseNoteFromInitialState,
  pickFirstStreamUrl,
} from './xhs-parser.utils';

describe('xhs-parser utils', () => {
  it('extracts the first link from shared text', () => {
    const text =
      '有点好玩呀，搓了半天 http://xhslink.com/o/7RVbLuOxlIq 先复制这段';

    expect(extractNoteUrl(text)).toBe('http://xhslink.com/o/7RVbLuOxlIq');
  });

  it('normalizes discovery item urls to explore urls', () => {
    const url =
      'https://www.xiaohongshu.com/discovery/item/6a464244000000000603631e?app_platform=android&xsec_source=app_share&type=normal&xsec_token=abc%3D';

    expect(normalizeXhsNoteUrl(url)).toBe(
      'https://www.xiaohongshu.com/explore/6a464244000000000603631e?xsec_token=abc%3D&xsec_source=app_share',
    );
  });

  it('parses INITIAL_STATE and converts undefined values', () => {
    const html = `
      <script>
        window.__INITIAL_STATE__ = {"note":{"noteDetailMap":{"id1":{"note":{"title":"测试","desc":undefined}}}}};
      </script>
    `;

    const state = extractInitialState(html) as {
      note: {
        noteDetailMap: Record<string, { note: { title: string; desc: null } }>;
      };
    };

    expect(state.note.noteDetailMap.id1.note.title).toBe('测试');
    expect(state.note.noteDetailMap.id1.note.desc).toBeNull();
  });

  it('builds no-watermark image urls from traceId or fileId', () => {
    expect(
      buildNoWatermarkImageUrl({
        url: 'https://sns-img-bd.xhscdn.com/demo',
        traceId: 'trace-001',
        fileId: 'spectrum/file-001',
      }),
    ).toBe('https://sns-img-bd.xhscdn.com/demo');

    expect(
      buildNoWatermarkImageUrl({
        traceId: 'trace-001',
        fileId: 'spectrum/file-001',
      }),
    ).toBe('https://ci.xiaohongshu.com/trace-001?imageView2/2/format/png');

    expect(buildNoWatermarkImageUrl({ fileId: 'spectrum/file-001' })).toBe(
      'https://ci.xiaohongshu.com/file-001?imageView2/2/format/png',
    );
  });

  it('picks h264 stream before h265 and av1', () => {
    expect(
      pickFirstStreamUrl({
        h265: [{ masterUrl: 'https://example.com/h265.mp4' }],
        h264: [{ masterUrl: 'https://example.com/h264.mp4' }],
        av1: [{ masterUrl: 'https://example.com/av1.mp4' }],
      }),
    ).toBe('https://example.com/h264.mp4');
  });

  it('extracts note text, images, live photo video and main video', () => {
    const state = {
      note: {
        noteDetailMap: {
          abc: {
            note: {
              title: '夏天防晒分享',
              desc: '这篇是正文',
              type: 'video',
              imageList: [
                {
                  urlDefault: 'https://sns-img-bd.xhscdn.com/image-real',
                  traceId: 'image-trace-1',
                  livePhoto: {
                    media: {
                      stream: {
                        h264: [{ masterUrl: 'https://example.com/live.mp4' }],
                      },
                    },
                  },
                },
              ],
              video: {
                media: {
                  stream: {
                    h264: [{ masterUrl: 'https://example.com/video.mp4' }],
                  },
                },
              },
            },
          },
        },
      },
    };

    expect(parseNoteFromInitialState(state)).toEqual({
      title: '夏天防晒分享',
      content: '这篇是正文',
      type: 'video',
      images: [
        {
          index: 1,
          url: 'https://sns-img-bd.xhscdn.com/image-real',
          source: 'url',
          livePhotoVideoUrl: 'https://example.com/live.mp4',
        },
      ],
      videoUrl: 'https://example.com/video.mp4',
    });
  });
});
