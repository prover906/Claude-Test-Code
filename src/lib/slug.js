function slugify(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/#/g, ' sharp ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

// Returns `base`, or `base-2`, `base-3`... — the first one `isTaken` rejects.
function uniqueSlug(base, isTaken) {
  const root = slugify(base) || 'item';
  let candidate = root;
  for (let n = 2; isTaken(candidate); n++) candidate = `${root}-${n}`;
  return candidate;
}

module.exports = { slugify, uniqueSlug };
