
export function createStoryPanel(container) {
  const panel = document.createElement('aside');

  panel.id = 'story-panel';

  panel.innerHTML = `
    <button id="close-panel" aria-label="Close story">×</button>

    <p class="panel-label">LUNAR MISSION ARCHIVE</p>

    <h2 id="story-title"></h2>

    <p id="story-location"></p>

    <div class="panel-divider"></div>

    <p id="story-description"></p>

    <div class="panel-fact">
      <strong>THE STORY LEFT BEHIND</strong>
      <p id="story-fact"></p>
    </div>

    <p id="story-coordinates"></p>
  `;

  container.appendChild(panel);

  panel.querySelector('#close-panel').addEventListener(
    'click',
    () => {
      panel.classList.remove('visible');
    }
  );

  function show(site) {
    panel.querySelector('#story-title').textContent =
      site.name;

    panel.querySelector('#story-location').textContent =
      site.location;

    panel.querySelector('#story-description').textContent =
      site.description;

    panel.querySelector('#story-fact').textContent =
      site.fact;

    panel.querySelector('#story-coordinates').textContent =
      `Coordinates: ${site.latitude}° N, ${site.longitude}° E`;

    panel.classList.add('visible');
  }

  function hide() {
    panel.classList.remove('visible');
  }

  return { show, hide };
}
