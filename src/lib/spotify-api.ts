// Spotify API integration for music recommendations
// Using official Spotify Web API with Client Credentials

// Spotify API Credentials (Hardcoded)
const SPOTIFY_CLIENT_ID = "00953e5f30d54024a8cf0a72dc6b766f";
const SPOTIFY_CLIENT_SECRET = "30be2eeee20541849a379333aefa4842";

export type MusicGenre = 'pop' | 'rock' | 'jazz' | 'classical' | 'electronic' | 'hiphop' | 'rnb' | 'ambient';

export interface SpotifyTrack {
  title: string;
  artist: string;
  duration: string;
  url: string;
  imageUrl?: string;
  previewUrl?: string;
}

export interface SpotifySearchResult {
  tracks: SpotifyTrack[];
  query: string;
}

export interface MusicRecommendation {
  emotion: string;
  genre: MusicGenre;
  searchQuery: string;
  tracks: SpotifyTrack[];
}

// Emotion to music query mapping
const emotionMusicMap: Record<string, Record<MusicGenre, string[]>> = {
  happy: {
    pop: ['happy upbeat pop', 'feel good pop hits', 'summer vibes pop'],
    rock: ['uplifting rock', 'happy rock songs', 'feel good rock'],
    jazz: ['happy jazz', 'upbeat jazz', 'swing jazz'],
    classical: ['joyful classical', 'uplifting orchestra', 'happy symphony'],
    electronic: ['happy electronic', 'uplifting EDM', 'euphoric dance'],
    hiphop: ['happy hip hop', 'feel good rap', 'positive vibes hip hop'],
    rnb: ['happy rnb', 'feel good soul', 'upbeat rnb'],
    ambient: ['happy ambient', 'uplifting chillout', 'positive vibes ambient']
  },
  neutral: {
    pop: ['chill pop', 'relaxing pop', 'soft pop hits'],
    rock: ['soft rock', 'mellow rock', 'acoustic rock'],
    jazz: ['smooth jazz', 'cool jazz', 'café jazz'],
    classical: ['relaxing classical', 'peaceful piano', 'calm orchestra'],
    electronic: ['chillwave', 'downtempo', 'lofi beats'],
    hiphop: ['lofi hip hop', 'chill rap', 'relaxed hip hop'],
    rnb: ['smooth rnb', 'chill soul', 'relaxing rnb'],
    ambient: ['calm ambient', 'peaceful soundscapes', 'meditation music']
  },
  sad: {
    pop: ['sad pop songs', 'emotional pop', 'melancholic pop'],
    rock: ['emotional rock', 'sad rock ballads', 'melancholic rock'],
    jazz: ['sad jazz', 'melancholic jazz', 'blue jazz'],
    classical: ['sad classical', 'emotional orchestra', 'melancholic piano'],
    electronic: ['sad electronic', 'emotional ambient', 'melancholic beats'],
    hiphop: ['sad hip hop', 'emotional rap', 'melancholic hip hop'],
    rnb: ['sad rnb', 'emotional soul', 'heartbreak rnb'],
    ambient: ['sad ambient', 'melancholic soundscapes', 'emotional ambient']
  }
};

// Get search query based on emotion and genre
export function getSearchQuery(emotion: string, genre: MusicGenre): string {
  const queries = emotionMusicMap[emotion]?.[genre] || emotionMusicMap.neutral[genre];
  return queries[Math.floor(Math.random() * queries.length)];
}

// Get Spotify access token using Client Credentials flow
let cachedToken: { token: string; expires: number } | null = null;

async function getSpotifyToken(): Promise<string | null> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expires) {
    return cachedToken.token;
  }

  try {
    const authString = `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`;
    const authBase64 = btoa(authString);

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authBase64}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the token (expires_in is in seconds, subtract 60 for safety margin)
    cachedToken = {
      token: data.access_token,
      expires: Date.now() + (data.expires_in - 60) * 1000
    };

    return data.access_token;
  } catch (error) {
    console.error('Failed to get Spotify token:', error);
    return null;
  }
}

// Search Spotify using the official API
export async function searchSpotify(query: string): Promise<SpotifySearchResult> {
  try {
    const token = await getSpotifyToken();
    if (!token) {
      throw new Error('Failed to get access token');
    }

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse the response based on the API structure
    const tracks: SpotifyTrack[] = [];
    
    if (data?.tracks?.items) {
      for (const item of data.tracks.items) {
        tracks.push({
          title: item.name || 'Unknown Title',
          artist: item.artists?.map((a: { name: string }) => a.name).join(', ') || 'Unknown Artist',
          duration: formatDuration(item.duration_ms || 0),
          url: item.external_urls?.spotify || '',
          imageUrl: item.album?.images?.[0]?.url,
          previewUrl: item.preview_url
        });
      }
    }
    
    return { tracks, query };
  } catch (error) {
    console.error('Spotify search error:', error);
    return { tracks: [], query };
  }
}

// Get music recommendations based on emotion and genre
export async function getMusicRecommendation(
  emotion: string,
  genre: MusicGenre
): Promise<MusicRecommendation> {
  const searchQuery = getSearchQuery(emotion, genre);
  const searchResult = await searchSpotify(searchQuery);
  
  return {
    emotion,
    genre,
    searchQuery,
    tracks: searchResult.tracks
  };
}

// Format duration from milliseconds
function formatDuration(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor(ms / 1000 / 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Genre display names
export const genreDisplayNames: Record<MusicGenre, string> = {
  pop: '🎵 Pop',
  rock: '🎸 Rock',
  jazz: '🎷 Jazz',
  classical: '🎻 Classical',
  electronic: '🎹 Electronic',
  hiphop: '🎤 Hip Hop',
  rnb: '🎙️ R&B',
  ambient: '🌙 Ambient'
};

// Get all genres
export function getAllGenres(): MusicGenre[] {
  return ['pop', 'rock', 'jazz', 'classical', 'electronic', 'hiphop', 'rnb', 'ambient'];
}
