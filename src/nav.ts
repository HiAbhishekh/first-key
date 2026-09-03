export function go(href: string, event?: { preventDefault: () => void }) {
  event?.preventDefault();
  window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
