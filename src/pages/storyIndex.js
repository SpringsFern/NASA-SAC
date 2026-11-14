function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createStoryIndexPage({ stories, planet }) {
  const element = document.createElement('section');
  element.className = 'content-page story-index-page';

  const isMoon = planet === 'moon';
  const title = isMoon ? 'Stories of the Moon' : 'Stories of Mars';
  const intro = isMoon
    ? 'Explore the missions, equipment and traces left across the lunar surface.'
    : 'Mars stories will be added in a future chapter of the project.';

  const cards = stories.map((story) => {
    const content = `
      <span class="story-card-kicker">${escapeHtml(story.location || 'Lunar location')}</span>
      <h2>${escapeHtml(story.name)}</h2>
      <p>${escapeHtml(story.description || 'A documented location in the mission archive.')}</p>
      <span class="story-card-action">${story.url ? 'Read the story →' : 'Story details not available'}</span>
    `;

    return story.url
      ? `<a class="story-card" href="${story.url}" data-link>${content}</a>`
      : `<article class="story-card is-unavailable">${content}</article>`;
  }).join('');

  element.innerHTML = `
    <header class="page-heading">
      <p class="eyebrow">${isMoon ? 'LUNAR ARCHIVE' : 'FUTURE ARCHIVE'}</p>
      <h1>${title}</h1>
      <p class="page-intro">${intro}</p>
    </header>
    ${stories.length
      ? `<div class="story-grid">${cards}</div>`
      : `<div class="empty-state"><p>No stories have been added here yet.</p></div>`}
  `;

  return { element };
}
