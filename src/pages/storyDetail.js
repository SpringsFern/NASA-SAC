import { renderMarkdown } from '../data/markdown.js';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createStoryDetailPage(story) {
  const element = document.createElement('section');
  element.className = 'content-page story-detail-page';

  if (!story) {
    element.innerHTML = `
      <div class="not-found">
        <p class="eyebrow">ARCHIVE ENTRY NOT FOUND</p>
        <h1>This story isn't here.</h1>
        <p>The address may be incorrect, or this entry may not have an article yet.</p>
        <a class="text-link" href="/story/moon" data-link>← Browse Moon stories</a>
      </div>
    `;
    return { element };
  }

  const planetLabel = story.planet === 'moon' ? 'MOON STORY' : 'MARS STORY';
  const coordinates = Number.isFinite(story.latitude) && Number.isFinite(story.longitude)
    ? `${story.latitude}°, ${story.longitude}°`
    : '';

  element.innerHTML = `
    <article class="story-article">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/story/moon" data-link>Moon Stories</a>
        <span>/</span>
        <span>${escapeHtml(story.name)}</span>
      </nav>

      <header class="article-header">
        <p class="eyebrow">${planetLabel}</p>
        <h1>${escapeHtml(story.name)}</h1>
        <p class="article-location">${escapeHtml(story.location)}</p>
        ${story.description
          ? `<p class="article-deck">${escapeHtml(story.description)}</p>`
          : ''}
        ${coordinates
          ? `<p class="article-coordinates">LOCATION · ${escapeHtml(coordinates)}</p>`
          : ''}
      </header>

      <div class="article-rule"></div>

      <div class="markdown-content">
        ${renderMarkdown(story.content)}
      </div>

      ${story.fact
        ? `<aside class="article-fact">
             <p class="eyebrow">THE STORY LEFT BEHIND</p>
             <p>${escapeHtml(story.fact)}</p>
           </aside>`
        : ''}

      <footer class="article-footer">
        <a class="text-link" href="/story/${story.planet}" data-link>← Back to ${story.planet} stories</a>
      </footer>
    </article>
  `;

  return { element };
}
