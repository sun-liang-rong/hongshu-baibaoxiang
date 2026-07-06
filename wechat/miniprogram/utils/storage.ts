export const getStorage = <T>(key: string, fallback: T): T => {
  try {
    const value = wx.getStorageSync(key) as T | '';
    return value === '' ? fallback : value;
  } catch (_error) {
    return fallback;
  }
};

export const setStorage = <T>(key: string, value: T) => {
  wx.setStorageSync(key, value);
};

export const removeStorage = (key: string) => {
  wx.removeStorageSync(key);
};

