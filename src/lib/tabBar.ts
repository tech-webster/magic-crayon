let hideImpl: (() => void) | null = null;
let showImpl: (() => void) | null = null;

export function registerTabBar(hide: () => void, show: () => void) {
  hideImpl = hide;
  showImpl = show;
}

export function hideTabBar() {
  hideImpl?.();
}

export function showTabBar() {
  showImpl?.();
}
