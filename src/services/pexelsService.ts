import { env } from '../config/env';

const PEXELS_BASE_URL = 'https://api.pexels.com/v1';

interface PexelsPhoto {
  id: number;
  url: string;
  photographer: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
  };
  alt: string;
}

interface PexelsResponse {
  photos: PexelsPhoto[];
  total_results: number;
}

export const searchImages = async (query: string, perPage: number = 10): Promise<PexelsPhoto[]> => {
  const response = await fetch(
    `${PEXELS_BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    {
      headers: {
        Authorization: env.PEXELS_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status}`);
  }

  const data = (await response.json()) as PexelsResponse;
  return data.photos;
};

export const getRandomImage = async (query: string): Promise<string | null> => {
  const photos = await searchImages(query, 15);
  if (photos.length === 0) return null;
  // Pexels returns results sorted by relevance; pick from top 3 for variety while staying relevant
  const topCount = Math.min(3, photos.length);
  const randomIndex = Math.floor(Math.random() * topCount);
  return photos[randomIndex].src.large;
};
