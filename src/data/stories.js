const markdownFiles = import.meta.glob('../../story/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
});

function parseScalar(value) {
  const trimmed = value.trim();

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if (/^0x[\da-f]+$/i.test(trimmed)) {
    return Number.parseInt(trimmed.slice(2), 16);
  }

  if (/^#[\da-f]{6}$/i.test(trimmed)) {
    return Number.parseInt(trimmed.slice(1), 16);
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseMetadata(source, filePath) {
  const normalized = source.replace(/^\uFEFF/, '').trimStart();
  const match = normalized.match(/^<!--\s*([\s\S]*?)\s*-->/);

  if (!match) {
    console.warn(`Story file has no metadata comment: ${filePath}`);
    return null;
  }

  const metadata = {};

  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    if (key) metadata[key] = parseScalar(value);
  }

  const content = normalized.slice(match[0].length).trim();
  const pathMatch = filePath.match(/(?:^|\/)story\/(moon|mars)\/([^/]+)\.md$/i);

  if (!pathMatch) {
    console.warn(`Story must be inside story/moon or story/mars: ${filePath}`);
    return null;
  }

  const planet = pathMatch[1].toLowerCase();
  const slug = pathMatch[2];

  const story = {
    ...metadata,
    id: String(metadata.id ?? slug),
    name: String(metadata.name ?? slug),
    location: String(metadata.location ?? ''),
    latitude: Number(metadata.latitude),
    longitude: Number(metadata.longitude),
    color: Number(metadata.color),
    planet,
    slug,
    content
  };

  // A detail URL exists only when there is Markdown content after the comment.
  if (content.length > 0) {
    story.url = `/story/${planet}/${slug}`;
  }

  return story;
}

export function loadStories() {
  return Object.entries(markdownFiles)
    .map(([path, source]) => parseMetadata(source, path))
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getStoriesForPlanet(stories, planet) {
  return stories.filter((story) => story.planet === planet);
}

export function getStoryByUrl(stories, url) {
  return stories.find((story) => story.url === url) ?? null;
}
