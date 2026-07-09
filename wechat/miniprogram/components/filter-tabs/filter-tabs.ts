Component({
  properties: {
    filters: {
      type: Array,
      value: [],
    },
    active: {
      type: String,
      value: '',
    },
  },
  methods: {
    change(e: WechatMiniprogram.TouchEvent) {
      this.triggerEvent('change', {
        value: e.currentTarget.dataset.value || '',
      });
    },
  },
});
