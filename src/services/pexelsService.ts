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

export const searchImages = async (query: string, perPage: number = 5): Promise<PexelsPhoto[]> => {
  const response = await fetch(
    `${PEXELS_BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&locale=es-ES`,
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
  const photos = await searchImages(query, 5);
  if (photos.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * photos.length);
  return photos[randomIndex].src.large;
};
