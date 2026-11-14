export function createRouter(onRoute) {
  let started = false;

  function currentPath() {
    const path = window.location.pathname.replace(/\/+$/, '');
    return path || '/';
  }

  function navigate(path) {
    if (!path || path === currentPath()) return;
    window.history.pushState({}, '', path);
    onRoute(currentPath());
  }

  function handleDocumentClick(event) {
    const link = event.target.closest('a[data-link]');
    if (!link || event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey) return;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;

    event.preventDefault();
    navigate(url.pathname);
  }

  function handlePopState() {
    onRoute(currentPath());
  }

  function start() {
    if (started) return;
    started = true;
    document.addEventListener('click', handleDocumentClick);
    window.addEventListener('popstate', handlePopState);
    onRoute(currentPath());
  }

  function destroy() {
    document.removeEventListener('click', handleDocumentClick);
    window.removeEventListener('popstate', handlePopState);
    started = false;
  }

  return { start, navigate, destroy };
}
