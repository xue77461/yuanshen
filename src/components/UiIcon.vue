<template>
  <span :class="['ui-icon', `ui-icon-${size}`]" aria-hidden="true">
    <svg xmlns="http://www.w3.org/2000/svg" :viewBox="icon.viewBox" fill="none" v-html="icon.content" />
  </span>
</template>

<script>
const iconMap = {
  sparkles: {
    viewBox: '0 0 24 24',
    content: '<path d="M12 2.8l1.6 4.8 4.8 1.6-4.8 1.6L12 15.6l-1.6-4.8-4.8-1.6 4.8-1.6L12 2.8Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M19 3.8l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" fill="currentColor"/><path d="M5.2 15.8l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" fill="currentColor"/>'
  },
  all: {
    viewBox: '0 0 24 24',
    content: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6" stroke="currentColor" stroke-width="1.6"/>'
  },
  pending: {
    viewBox: '0 0 24 24',
    content: '<circle cx="12" cy="12" r="8.25" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.7v4.9l3.1 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  finished: {
    viewBox: '0 0 24 24',
    content: '<circle cx="12" cy="12" r="8.3" stroke="currentColor" stroke-width="1.6"/><path d="M8.4 12.3l2.4 2.4 4.8-5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  cancelled: {
    viewBox: '0 0 24 24',
    content: '<circle cx="12" cy="12" r="8.3" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
  },
  coin: {
    viewBox: '0 0 24 24',
    content: '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4.1" stroke="currentColor" stroke-width="1.4" stroke-dasharray="1.6 1.6"/><path d="M10.4 10.2c.4-.7 1.1-1.1 1.8-1.1 1.1 0 2 .7 2 1.7 0 .8-.6 1.3-1.4 1.7l-1 .5c-.9.4-1.4.9-1.4 1.7 0 1.1.9 1.8 2.2 1.8.8 0 1.6-.3 2-.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  calendar: {
    viewBox: '0 0 24 24',
    content: '<rect x="3.5" y="5.5" width="17" height="15" rx="2.4" stroke="currentColor" stroke-width="1.6"/><path d="M7.5 3.8v3.4M16.5 3.8v3.4M3.8 9.2h16.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M8 13h3M13 13h3M8 17h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
  },
  reload: {
    viewBox: '0 0 24 24',
    content: '<path d="M18 8.2A6.8 6.8 0 0 0 6.8 7.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.4 3.8v4h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 15.8a6.8 6.8 0 0 0 11.2.9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.6 20.2v-4h-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  search: {
    viewBox: '0 0 24 24',
    content: '<circle cx="10.5" cy="10.5" r="5.7" stroke="currentColor" stroke-width="1.7"/><path d="M14.8 14.8 20 20" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>'
  },
  guide: {
    viewBox: '0 0 24 24',
    content: '<path d="M12 3.5 14 8l4.9.5-3.7 3 1.2 4.8L12 13.9 7.6 16.3l1.2-4.8-3.7-3L10 8l2-4.5Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M9 4.5h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M10.5 2.9h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'
  },
  hydro: {
    viewBox: '0 0 24 24',
    content: '<path d="M12 4.1c2.8 3 5.2 5.9 5.2 8.7A5.2 5.2 0 0 1 12 18a5.2 5.2 0 0 1-5.2-5.2c0-2.8 2.4-5.7 5.2-8.7Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 13.6c.2 1.2 1 2.1 2 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
  },
  pyro: {
    viewBox: '0 0 24 24',
    content: '<path d="M13.7 4.5c.5 2-1 3.5-1 5.1 0 1.2.8 1.8 1.7 2.5 1.1.9 1.9 1.9 1.9 3.6A4.3 4.3 0 0 1 12 20a4.8 4.8 0 0 1-4.8-4.8c0-3.2 2.2-4.8 3.4-6.7.7-1.1.9-2.2.8-3.5 1 .6 1.8 1.5 2.3 3 .7-.7 1.3-1.8 1.4-3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10.8 14.2c.8.6 1.5 1.2 1.5 2.2 0 .7-.5 1.3-1.2 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
  },
  map: {
    viewBox: '0 0 24 24',
    content: '<path d="M4 6.1 9.4 4l5.2 2 5.4-2.1v14L14.6 20 9.4 18 4 20.1v-14Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9.4 4v14M14.6 6v14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'
  },
  plus: {
    viewBox: '0 0 24 24',
    content: '<circle cx="12" cy="12" r="8.3" stroke="currentColor" stroke-width="1.6"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
  },
  left: {
    viewBox: '0 0 24 24',
    content: '<path d="M14.8 5.5 8.2 12l6.6 6.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  right: {
    viewBox: '0 0 24 24',
    content: '<path d="M9.2 5.5 15.8 12 9.2 18.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  traveler: {
    viewBox: '0 0 24 24',
    content: '<circle cx="12" cy="12" r="8.2" stroke="currentColor" stroke-width="1.6"/><path d="M12 6.6 13.8 11 18 12l-4.2 1-1.8 4.4L10.2 13 6 12l4.2-1L12 6.6Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>'
  },
  edit: {
    viewBox: '0 0 24 24',
    content: '<path d="M5 19l3.4-.8L18 8.6 15.4 6 5.8 15.6 5 19Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13.8 7.6 16.4 10.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
  },
  trash: {
    viewBox: '0 0 24 24',
    content: '<path d="M5.5 7.5h13M9.2 4.8h5.6M8 7.5v10a1.8 1.8 0 0 0 1.8 1.8h4.4A1.8 1.8 0 0 0 16 17.5v-10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.3 10.2v5.6M13.7 10.2v5.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
  }
};

export default {
  name: 'UiIcon',
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: String,
      default: 'md'
    }
  },
  computed: {
    icon() {
      return iconMap[this.name] || iconMap.sparkles;
    }
  }
};
</script>