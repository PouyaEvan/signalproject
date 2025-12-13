// Spotify API integration for music recommendations

export type MusicGenre = 'pop' | 'rock' | 'jazz' | 'classical' | 'electronic' | 'hiphop' | 'rnb' | 'ambient';

export interface SpotifyTrack {
  title: string;
  artist: string;
  duration: string;
  url: string;
  imageUrl?: string;
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

// Search Spotify using the API
export async function searchSpotify(
  apiKey: string,
  query: string
): Promise<SpotifySearchResult> {
  try {
    const response = await fetch(
      `https://api.fast-creat.ir/spotify?apikey=${encodeURIComponent(apiKey)}&action=search&query=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse the response based on the API structure
    const tracks: SpotifyTrack[] = [];
    
    if (data && Array.isArray(data.result)) {
      for (const item of data.result.slice(0, 5)) { // Get top 5 results
        tracks.push({
          title: item.title || item.name || 'Unknown Title',
          artist: item.artist || item.artists?.join(', ') || 'Unknown Artist',
          duration: item.duration || item.duration_ms ? formatDuration(item.duration_ms) : '0:00',
          url: item.url || item.link || item.external_urls?.spotify || '',
          imageUrl: item.image || item.album?.images?.[0]?.url
        });
      }
    }
    
    return { tracks, query };
  } catch (error) {
    console.error('Spotify search error:', error);
    return { tracks: [], query };
  }
}

// Download/get track URL
export async function getTrackDownloadUrl(
  apiKey: string,
  trackUrl: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.fast-creat.ir/spotify?apikey=${encodeURIComponent(apiKey)}&action=dl&url=${encodeURIComponent(trackUrl)}`
    );
    
    if (!response.ok) {
      throw new Error(`Download API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.download_url || data.url || data.result?.url || null;
  } catch (error) {
    console.error('Track download error:', error);
    return null;
  }
}

// Get music recommendations based on emotion and genre
export async function getMusicRecommendation(
  apiKey: string,
  emotion: string,
  genre: MusicGenre
): Promise<MusicRecommendation> {
  const searchQuery = getSearchQuery(emotion, genre);
  const searchResult = await searchSpotify(apiKey, searchQuery);
  
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
