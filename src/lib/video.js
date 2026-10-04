const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

// Accepts a bare video id or any common YouTube URL shape and returns the
// 11-character video id, or null if it can't find one.
function parseYouTubeId(input) {
  const value = String(input || '').trim();
  if (!value) return null;
  if (YOUTUBE_ID.test(value)) return value;

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '');
  let id = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else {
      const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      if (match) id = match[1];
    }
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

function youTubeEmbedUrl(id) {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`;
}

module.exports = { parseYouTubeId, youTubeEmbedUrl };
