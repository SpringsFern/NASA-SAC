
const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

export function withBase(path) {
  const appPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${appPath}` || '/';
}

function removeBase(path) {
  if (!BASE_PATH) return path;

  if (path === BASE_PATH) return '/';

  if (path.startsWith(`${BASE_PATH}/`)) {
    return path.slice(BASE_PATH.length);
  }

  return path;
}

export function createRouter(onRoute) {
  let started = false;

  function currentPath() {
    const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
    return removeBase(pathname);
  }

  function navigate(path) {
    if (!path) return;

    const appPath = removeBase(path);
    if (appPath === currentPath()) return;

    window.history.pushState({}, '', withBase(appPath));
    onRoute(currentPath());
  }

  function handleDocumentClick(event) {
    const link = event.target.closest('a[data-link]');

    if (!link || event.defaultPrevented) return;
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

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
