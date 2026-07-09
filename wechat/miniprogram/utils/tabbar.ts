export function syncTabBar(instance: WechatMiniprogram.Component.TrivialInstance, selected: number) {
  const maybeWithTabBar = instance as WechatMiniprogram.Component.TrivialInstance & {
    getTabBar?: () => WechatMiniprogram.Component.TrivialInstance | undefined;
  };
  const tabBar = maybeWithTabBar.getTabBar?.();
  if (tabBar) {
    tabBar.setData({ selected });
  }
}
