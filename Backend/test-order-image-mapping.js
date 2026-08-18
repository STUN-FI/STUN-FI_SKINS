const assert = require('node:assert/strict');

function normalizeSurfaceKey(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getSurfaceAliases(surface = {}) {
  const names = [surface.name, surface.surface, surface.label, surface.slug, surface.key];
  const normalized = new Set();

  for (const value of names) {
    if (!value) continue;
    const key = normalizeSurfaceKey(value);
    if (key) normalized.add(key);

    const aliases = [
      key,
      key.replace(/-artwork$/, ''),
      key.replace(/-photo$/, ''),
      key.replace(/-reference$/, ''),
      key.replace(/-design$/, ''),
      key.replace(/-surface$/, ''),
      key.replace(/-wrap$/, ''),
      key.replace(/^reference-/, ''),
      key.replace(/^artwork-/, ''),
      key.replace(/^photo-/, ''),
      key.replace(/^design-/, ''),
      key.replace(/^(?:reference|artwork|photo|design)-?/, ''),
    ];

    aliases.forEach((alias) => {
      if (alias) normalized.add(alias);
    });
  }

  return [...normalized];
}

function resolveUploadedSurfaceUrls(surfaces, uploadedUrlsByField = {}) {
  if (!Array.isArray(surfaces) || Object.keys(uploadedUrlsByField).length === 0) {
    return surfaces;
  }

  const surfaceUrlMap = new Map();

  Object.entries(uploadedUrlsByField).forEach(([fieldName, url]) => {
    const candidates = [
      normalizeSurfaceKey(fieldName),
      normalizeSurfaceKey(fieldName.replace(/^artwork_/, '')),
      normalizeSurfaceKey(fieldName.replace(/^reference_/, '')),
      normalizeSurfaceKey(fieldName.replace(/^artwork-/, '')),
      normalizeSurfaceKey(fieldName.replace(/^reference-/, '')),
      normalizeSurfaceKey(fieldName.replace(/^artwork/, '').replace(/^reference/, '')),
    ];

    candidates.forEach((candidate) => {
      if (candidate) surfaceUrlMap.set(candidate, url);
    });
  });

  return surfaces.map((surface) => {
    const aliases = getSurfaceAliases(surface);
    const match = aliases.find((alias) => surfaceUrlMap.has(alias));
    const matchedUrl = match ? surfaceUrlMap.get(match) : '';

    if (matchedUrl) {
      return { ...surface, imageUrl: matchedUrl };
    }

    return {
      ...surface,
      imageUrl:
        surface?.imageUrl && typeof surface.imageUrl === 'string' && !surface.imageUrl.startsWith('blob:')
          ? surface.imageUrl
          : '',
    };
  });
}

const surfaces = [
  { name: 'Top Lid', imageUrl: '', monogramText: '' },
  { name: 'Phone Artwork', imageUrl: '', monogramText: '' },
  { name: 'Reference Photo', imageUrl: '', monogramText: '' },
];

const surfaceDesigns = [
  { surface: 'top-lid', customText: '', imageUrl: '' },
  { surface: 'keyboard-deck', customText: '', imageUrl: '' },
  { surface: 'bottom-base', customText: '', imageUrl: '' },
];

const uploadedUrlsByField = {
  artwork_top_lid: 'https://cdn.example.com/top.jpg',
  artwork_phone: 'https://cdn.example.com/phone.jpg',
  artwork_keyboard_deck: 'https://cdn.example.com/keyboard.jpg',
  artwork_bottom_base: 'https://cdn.example.com/bottom.jpg',
  reference_photo: 'https://cdn.example.com/photo.jpg',
};

const resolved = resolveUploadedSurfaceUrls(surfaces, uploadedUrlsByField);
const resolvedDesigns = resolveUploadedSurfaceUrls(surfaceDesigns, uploadedUrlsByField);

assert.equal(resolved[0].imageUrl, 'https://cdn.example.com/top.jpg');
assert.equal(resolved[1].imageUrl, 'https://cdn.example.com/phone.jpg');
assert.equal(resolved[2].imageUrl, 'https://cdn.example.com/photo.jpg');
assert.equal(resolvedDesigns[0].imageUrl, 'https://cdn.example.com/top.jpg');
assert.equal(resolvedDesigns[1].imageUrl, 'https://cdn.example.com/keyboard.jpg');
assert.equal(resolvedDesigns[2].imageUrl, 'https://cdn.example.com/bottom.jpg');

console.log('order image mapping regression check passed');
