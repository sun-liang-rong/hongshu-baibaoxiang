export const showToast = (title: string, icon: WechatMiniprogram.ShowToastOption['icon'] = 'none') => {
  wx.showToast({
    title,
    icon,
    duration: 1800,
  });
};

export const copyText = (data: string, successText = '已复制') => {
  if (!data.trim()) {
    showToast('暂无可复制内容');
    return;
  }

  wx.setClipboardData({
    data,
    success: () => showToast(successText, 'success'),
  });
};

export const confirmAction = (content: string) =>
  new Promise<boolean>((resolve) => {
    wx.showModal({
      title: '确认操作',
      content,
      confirmColor: '#ff2442',
      success: (res) => resolve(res.confirm),
      fail: () => resolve(false),
    });
  });
