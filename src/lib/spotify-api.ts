// Spotify API integration for music recommendations
// Using official Spotify Web API with Client Credentials

// Spotify API Credentials (Hardcoded)
const SPOTIFY_CLIENT_ID = "00953e5f30d54024a8cf0a72dc6b766f";
const SPOTIFY_CLIENT_SECRET = "30be2eeee20541849a379333aefa4842";

export type MusicGenre = 'pop' | 'rock' | 'jazz' | 'classical' | 'electronic' | 'hiphop' | 'rnb' | 'ambient';
export type MusicRegion = 'international' | 'persian';

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
  region: MusicRegion;
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

const persianSuffixes = ['persian', 'iranian', 'farsi', 'ایرانی', 'موزیک فارسی'];

const genreSeedMap: Record<MusicGenre, string> = {
  pop: 'pop',
  rock: 'rock',
  jazz: 'jazz',
  classical: 'classical',
  electronic: 'electronic',
  hiphop: 'hip-hop',
  rnb: 'r-n-b',
  ambient: 'ambient'
};

// Get search query based on emotion, genre, and region
export function getSearchQuery(emotion: string, genre: MusicGenre, region: MusicRegion = 'international'): string {
  const queries = emotionMusicMap[emotion]?.[genre] || emotionMusicMap.neutral[genre];
  let query = queries[Math.floor(Math.random() * queries.length)];

  if (region === 'persian') {
    const suffix = persianSuffixes[Math.floor(Math.random() * persianSuffixes.length)];
    query = `${query} ${suffix}`;
  } else {
    query = `${query} best`;
  }

  return query;
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

function toMarket(region: MusicRegion): string {
  return region === 'persian' ? 'IR' : 'US';
}

function dedupeTracks(tracks: SpotifyTrack[]): SpotifyTrack[] {
  const seen = new Set<string>();
  const out: SpotifyTrack[] = [];
  for (const t of tracks) {
    const key = t.url || `${t.title}-${t.artist}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(t);
    }
  }
  return out;
}

// Search Spotify using the official API with genre + region awareness
export async function searchSpotify(
  query: string,
  genre: MusicGenre,
  region: MusicRegion = 'international'
): Promise<SpotifySearchResult> {
  try {
    const token = await getSpotifyToken();
    if (!token) {
      throw new Error('Failed to get access token');
    }

    const market = toMarket(region);
    const seed = genreSeedMap[genre];

    const headers = { 'Authorization': `Bearer ${token}` };
    const results: SpotifyTrack[] = [];

    // 1) Recommendations endpoint by seed genre (richer, genre-aware)
    if (seed) {
      const recUrl = `https://api.spotify.com/v1/recommendations?limit=8&market=${market}&seed_genres=${encodeURIComponent(seed)}`;
      const recRes = await fetch(recUrl, { headers });
      if (recRes.ok) {
        const recData = await recRes.json();
        if (recData?.tracks) {
          for (const item of recData.tracks) {
            results.push({
              title: item.name || 'Unknown Title',
              artist: item.artists?.map((a: { name: string }) => a.name).join(', ') || 'Unknown Artist',
              duration: formatDuration(item.duration_ms || 0),
              url: item.external_urls?.spotify || '',
              imageUrl: item.album?.images?.[0]?.url,
              previewUrl: item.preview_url
            });
          }
        }
      }
    }

    // 2) Fallback: Search with genre filter (for region and keyword alignment)
    const searchQuery = `${query} genre:"${seed || genre}"`;
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=8&market=${market}`;
    const searchRes = await fetch(searchUrl, { headers });
    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data?.tracks?.items) {
        for (const item of data.tracks.items) {
          results.push({
            title: item.name || 'Unknown Title',
            artist: item.artists?.map((a: { name: string }) => a.name).join(', ') || 'Unknown Artist',
            duration: formatDuration(item.duration_ms || 0),
            url: item.external_urls?.spotify || '',
            imageUrl: item.album?.images?.[0]?.url,
            previewUrl: item.preview_url
          });
        }
      }
    }

    const deduped = dedupeTracks(results).slice(0, 8);
    return { tracks: deduped, query: searchQuery };
  } catch (error) {
    console.error('Spotify search error:', error);
    return { tracks: [], query };
  }
}

// Get music recommendations based on emotion and genre
export async function getMusicRecommendation(
  emotion: string,
  genre: MusicGenre,
  region: MusicRegion = 'international'
): Promise<MusicRecommendation> {
  const searchQuery = getSearchQuery(emotion, genre, region);
  const searchResult = await searchSpotify(searchQuery, genre, region);
  
  return {
    emotion,
    genre,
    region,
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

export const regionDisplayNames: Record<MusicRegion, string> = {
  international: '🌍 International',
  persian: '🇮🇷 Persian'
};

// Get all genres
export function getAllGenres(): MusicGenre[] {
  return ['pop', 'rock', 'jazz', 'classical', 'electronic', 'hiphop', 'rnb', 'ambient'];
}
