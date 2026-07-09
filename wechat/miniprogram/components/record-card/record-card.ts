Component({
  properties: {
    item: {
      type: Object,
      value: {},
    },
  },
  methods: {
    open() {
      this.triggerAction('open');
    },
    copy() {
      this.triggerAction('copy');
    },
    remove() {
      this.triggerAction('remove');
    },
    triggerAction(action: string) {
      const item = this.data.item as { id?: string };
      this.triggerEvent(action, { id: item.id || '' });
    },
  },
});
