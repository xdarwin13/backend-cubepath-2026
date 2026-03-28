import { env } from '../config/env';

export interface YouTubeVideo {
  title: string;
  url: string;
  videoId: string;
}

/**
 * Search YouTube for videos related to a query using the Data API v3.
 * Falls back to generating search URL suggestions if no API key is configured.
 */
export const searchYouTubeVideos = async (
  query: string,
  maxResults: number = 3
): Promise<YouTubeVideo[]> => {
  const apiKey = env.YOUTUBE_API_KEY;

  if (!apiKey) {
    // Fallback: return search URL when no API key is available
    console.warn('YOUTUBE_API_KEY not configured — skipping YouTube search');
    return [];
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: String(maxResults),
      relevanceLanguage: 'es',
      videoEmbeddable: 'true',
      key: apiKey,
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('YouTube API error:', response.status, errorBody);
      return [];
    }

    const data = (await response.json()) as { items?: Array<{ id: { videoId: string }; snippet?: { title?: string } }> };

    if (!data.items || !Array.isArray(data.items)) {
      return [];
    }

    return data.items.map((item) => ({
      title: item.snippet?.title || 'Video',
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      videoId: item.id.videoId,
    }));
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return [];
  }
};

/**
 * Build a context string with YouTube video links for inclusion in AI prompts.
 */
export const buildYouTubeContext = (videos: YouTubeVideo[]): string => {
  if (videos.length === 0) return '';

  const videoList = videos
    .map((v, i) => `${i + 1}. "${v.title}" — ${v.url}`)
    .join('\n');

  return `\n\nVideos de YouTube relevantes que DEBES incluir en el contenido (insértalos de forma natural donde sean más útiles, cada URL en su propia línea separada por líneas vacías):\n${videoList}`;
};
