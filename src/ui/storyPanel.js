
export function createStoryPanel(container, navigate) {
  const panel = document.createElement('aside');
  panel.className = 'quick-story-panel';

  panel.innerHTML = `
    <button class="quick-story-close" type="button" aria-label="Close story">×</button>
    <p class="eyebrow">LUNAR ARCHIVE ENTRY</p>
    <h2 class="quick-story-title"></h2>
    <p class="quick-story-location"></p>
    <p class="quick-story-description"></p>
    <p class="quick-story-fact"></p>
    <a class="quick-story-link" hidden>Read the full story →</a>
  `;

  container.appendChild(panel);

  const closeButton = panel.querySelector('.quick-story-close');
  const storyLink = panel.querySelector('.quick-story-link');

  closeButton.addEventListener('click', hide);

  storyLink.addEventListener('click', (event) => {
    event.preventDefault();

    if (storyLink.href && navigate) {
      navigate(storyLink.getAttribute('href'));
    }
  });

  function show(site) {
    panel.querySelector('.quick-story-title').textContent = site.name;
    panel.querySelector('.quick-story-location').textContent =
      site.location || '';
    panel.querySelector('.quick-story-description').textContent =
      site.description || '';
    panel.querySelector('.quick-story-fact').textContent =
      site.fact || '';

    if (site.url) {
      storyLink.href = site.url;
      storyLink.hidden = false;
    } else {
      storyLink.removeAttribute('href');
      storyLink.hidden = true;
    }

    panel.classList.add('is-visible');
  }

  function hide() {
    panel.classList.remove('is-visible');
  }

  function destroy() {
    closeButton.removeEventListener('click', hide);
    panel.remove();
  }

  return { show, hide, destroy };
}
