const NAV_ITEMS = [
  { label: 'Moon', href: '/', icon: '◐', group: 'explore' },
  { label: 'Moon Stories', href: '/story/moon', icon: '▤', group: 'explore' },
  { label: 'Mars', href: '#', icon: '◉', group: 'later', disabled: true },
  { label: 'Mars Stories', href: '#', icon: '▤', group: 'later', disabled: true }
];

export function createSidebar(root) {
  root.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-brand">
        <a class="brand-link" href="/" data-link aria-label="Beyond the Mission home">
          <span class="brand-mark">◒</span>
          <span class="brand-name">BEYOND THE MISSION</span>
        </a>
        <button class="sidebar-toggle" type="button" aria-label="Collapse sidebar" title="Collapse sidebar">
          <span class="toggle-glyph">‹</span>
        </button>
      </div>
      <nav class="sidebar-nav" aria-label="Main navigation">
        <p class="nav-section-label">EXPLORE</p>
        <div class="nav-group" data-group="explore"></div>
        <p class="nav-section-label later-label">COMING LATER</p>
        <div class="nav-group" data-group="later"></div>
      </nav>
      <div class="sidebar-footer">
        <span class="footer-dot"></span>
        <span class="footer-label">LUNAR ARCHIVE</span>
      </div>
    </div>
  `;

  const sidebar = root.querySelector('.sidebar');
  const toggle = root.querySelector('.sidebar-toggle');

  for (const item of NAV_ITEMS) {
    const group = root.querySelector(`[data-group="${item.group}"]`);
    const link = document.createElement('a');

    link.className = `nav-link${item.disabled ? ' is-disabled' : ''}`;
    link.href = item.href;
    link.innerHTML = `
      <span class="nav-icon" aria-hidden="true">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
      ${item.disabled ? '<span class="soon-label">SOON</span>' : ''}
    `;

    if (item.disabled) {
      link.setAttribute('aria-disabled', 'true');
      link.addEventListener('click', (event) => event.preventDefault());
    } else {
      link.dataset.link = '';
    }

    group.appendChild(link);
  }

  const savedCollapsed = localStorage.getItem('beyond-sidebar-collapsed') === 'true';
  sidebar.classList.toggle('is-collapsed', savedCollapsed);

  toggle.addEventListener('click', () => {
    const collapsed = sidebar.classList.toggle('is-collapsed');
    localStorage.setItem('beyond-sidebar-collapsed', String(collapsed));
    toggle.setAttribute(
      'aria-label',
      collapsed ? 'Expand sidebar' : 'Collapse sidebar'
    );
    toggle.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  });

  function setActivePath(path) {
    root.querySelectorAll('.nav-link[data-link]').forEach((link) => {
      const active = link.getAttribute('href') === path ||
        (link.getAttribute('href') === '/story/moon' && path.startsWith('/story/moon/'));
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  return {
    setActivePath,
    destroy() {
      toggle.replaceWith(toggle.cloneNode(true));
    }
  };
}
