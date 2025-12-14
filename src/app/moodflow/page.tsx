'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { 
  generateHappySignal, 
  generateNeutralSignal, 
  generateSadSignal,
  BrainSignal
} from '@/lib/signal-generator';
import { predictEmotion, EmotionPrediction } from '@/lib/emotion-classifier';
import { useToast } from '@/components/ui/use-toast';
import {
  Brain,
  Home,
  Play,
  Pause,
  Heart,
  Sparkles,
  Volume2,
  Music,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  ListMusic,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

// Spotify API credentials
const SPOTIFY_CLIENT_ID = '00953e5f30d54024a8cf0a72dc6b766f';
const SPOTIFY_CLIENT_SECRET = '30be2eeee20541849a379333aefa4842';

// Fast Creat API key
const FAST_CREAT_API_KEY = '5894416619:opSuiY7PUwHB8Ar@Api_ManagerRoBot';

// Mood types
type MoodType = 'sad' | 'neutral' | 'happy';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  preview_url: string | null;
  duration_ms: number;
}

interface PlayerState {
  isPlaying: boolean;
  currentTrack: SpotifyTrack | null;
  currentTime: number;
  duration: number;
  volume: number;
}

// Album Art Component
const AlbumArt: React.FC<{ 
  imageUrl: string; 
  isPlaying: boolean; 
  mood: MoodType 
}> = ({ imageUrl, isPlaying, mood }) => {
  const getMoodGlow = () => {
    switch (mood) {
      case 'sad':
        return 'shadow-[0_0_60px_rgba(96,125,139,0.5)]';
      case 'happy':
        return 'shadow-[0_0_60px_rgba(255,64,129,0.5)]';
      default:
        return 'shadow-[0_0_60px_rgba(0,150,136,0.5)]';
    }
  };

  return (
    <div className={`relative w-64 h-64 mx-auto rounded-2xl overflow-hidden ${getMoodGlow()} transition-all duration-500`}>
      <div 
        className={`w-full h-full bg-cover bg-center transition-transform duration-500 ${
          isPlaying ? 'album-pulse' : ''
        }`}
        style={{ backgroundImage: `url(${imageUrl || 'https://via.placeholder.com/250?text=MoodFlow'})` }}
      />
      {isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Music className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};

// Track Info Component
const TrackInfo: React.FC<{ 
  track: SpotifyTrack | null; 
  mood: MoodType 
}> = ({ track, mood }) => {
  const getMoodBadgeStyle = () => {
    switch (mood) {
      case 'sad':
        return 'bg-slate-500/20 text-slate-300';
      case 'happy':
        return 'bg-pink-500/20 text-pink-300';
      default:
        return 'bg-teal-500/20 text-teal-300';
    }
  };

  const getMoodLabel = () => {
    switch (mood) {
      case 'sad':
        return 'آرام / غمگین';
      case 'happy':
        return 'شاد / هیجانی';
      default:
        return 'خنثی / تمرکز';
    }
  };

  return (
    <div className="text-center space-y-2">
      <h2 className="text-xl font-bold truncate">
        {track?.name || 'آماده پخش'}
      </h2>
      <p className="text-sm text-muted-foreground">
        {track?.artists.map(a => a.name).join(', ') || 'منتظر انتخاب...'}
      </p>
      <span className={`inline-block px-3 py-1 rounded-full text-xs ${getMoodBadgeStyle()}`}>
        حالت: {getMoodLabel()}
      </span>
    </div>
  );
};

// Progress Bar Component
const ProgressBar: React.FC<{
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}> = ({ currentTime, duration, onSeek }) => {
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-2">
      <div 
        className="h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percent = (e.clientX - rect.left) / rect.width;
          onSeek(percent * duration);
        }}
      >
        <div 
          className="h-full bg-primary rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

// Playlist Item Component
const PlaylistItem: React.FC<{
  track: SpotifyTrack;
  isActive: boolean;
  onClick: () => void;
}> = ({ track, isActive, onClick }) => {
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
        isActive 
          ? 'bg-white/10 border-r-2 border-primary' 
          : 'bg-black/20 hover:bg-white/5'
      }`}
      onClick={onClick}
    >
      <img 
        src={track.album.images[2]?.url || track.album.images[0]?.url} 
        alt={track.name}
        className="w-10 h-10 rounded object-cover"
      />
      <div className="flex-1 min-w-0 text-right">
        <div className="text-sm font-medium truncate">{track.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {track.artists.map(a => a.name).join(', ')}
        </div>
      </div>
      {isActive && <Music className="w-4 h-4 text-primary animate-pulse" />}
    </div>
  );
};

// Loading Overlay Component
const LoadingOverlay: React.FC<{
  isVisible: boolean;
  message: string;
  error?: string;
}> = ({ isVisible, message, error }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center z-50">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="mt-3 text-sm">{message}</p>
      {error && (
        <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export default function MoodFlowPage() {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // State
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<SpotifyTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [mood, setMood] = useState<MoodType>('neutral');
  const [moodValue, setMoodValue] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTrack: null,
    currentTime: 0,
    duration: 0,
    volume: 0.7
  });

  const [currentEmotion, setCurrentEmotion] = useState<EmotionPrediction | null>(null);

  // Get Spotify token
  const getSpotifyToken = useCallback(async () => {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
        },
        body: 'grant_type=client_credentials'
      });
      const data = await response.json();
      setSpotifyToken(data.access_token);
      return data.access_token;
    } catch (error) {
      console.error('Token Error:', error);
      toast({
        title: 'خطا در اتصال',
        description: 'اتصال به اسپاتیفای برقرار نشد',
        variant: 'destructive'
      });
      return null;
    }
  }, [toast]);

  // Fetch recommendations based on mood
  const fetchSpotifyRecs = useCallback(async (token: string, currentMood: MoodType) => {
    setIsLoading(true);
    setLoadingMessage('جستجو در اسپاتیفای...');
    setError('');

    let query = '';
    switch (currentMood) {
      case 'sad':
        query = 'sad piano OR acoustic OR ambient';
        break;
      case 'happy':
        query = 'happy pop OR dance OR upbeat';
        break;
      default:
        query = 'lofi OR chill OR focus';
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
        {
          headers: { 'Authorization': 'Bearer ' + token }
        }
      );
      const data = await response.json();

      if (data.tracks && data.tracks.items.length > 0) {
        // Filter tracks with preview URLs
        const tracksWithPreviews = data.tracks.items.filter(
          (track: SpotifyTrack) => track.preview_url
        );
        
        setPlaylist(tracksWithPreviews.length > 0 ? tracksWithPreviews : data.tracks.items);
        
        if (currentIndex === -1 && tracksWithPreviews.length > 0) {
          setCurrentIndex(0);
          setPlayerState(prev => ({
            ...prev,
            currentTrack: tracksWithPreviews[0]
          }));
        }
      } else {
        throw new Error('No tracks found');
      }
    } catch (e) {
      console.error('Spotify search error:', e);
      // Fallback to Fast Creat API
      setLoadingMessage('جستجو در API جایگزین...');
      try {
        const fallbackResponse = await fetch(
          `https://api.fast-creat.ir/spotify?apikey=${FAST_CREAT_API_KEY}&action=search&query=${encodeURIComponent(query)}`
        );
        const fallbackData = await fallbackResponse.json();

        if (fallbackData.tracks && fallbackData.tracks.length > 0) {
          const fallbackTracks = fallbackData.tracks.map((item: any, index: number) => ({
            id: `fallback-${index}`,
            name: item.name,
            artists: [{ name: item.artist }],
            album: { 
              name: 'Unknown', 
              images: [{ url: 'https://via.placeholder.com/250?text=MoodFlow' }] 
            },
            preview_url: item.link,
            duration_ms: 30000
          }));

          setPlaylist(fallbackTracks);
          
          if (currentIndex === -1) {
            setCurrentIndex(0);
            setPlayerState(prev => ({
              ...prev,
              currentTrack: fallbackTracks[0]
            }));
          }
        } else {
          setError('هیچ آهنگی یافت نشد');
        }
      } catch (fallbackError) {
        console.error('Fallback search error:', fallbackError);
        setError('خطا در جستجو از هر دو API');
      }
    }

    setIsLoading(false);
  }, [currentIndex]);

  // Play track
  const playTrack = useCallback((track: SpotifyTrack) => {
    if (!audioRef.current) return;

    if (track.preview_url) {
      audioRef.current.src = track.preview_url;
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setPlayerState(prev => ({
          ...prev,
          isPlaying: true,
          currentTrack: track,
          duration: 30 // Preview is always 30 seconds
        }));
      }).catch(e => {
        console.error('Play error:', e);
        toast({
          title: 'خطا در پخش',
          description: 'این آهنگ قابل پخش نیست',
          variant: 'destructive'
        });
      });
    } else {
      toast({
        title: 'پیش‌نمایش ندارد',
        description: 'این آهنگ پیش‌نمایش ندارد، آهنگ بعدی...',
      });
      playNext();
    }
  }, [toast]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (!playerState.currentTrack && playlist.length > 0) {
      playTrack(playlist[0]);
      setCurrentIndex(0);
      return;
    }

    if (audioRef.current.paused) {
      audioRef.current.play();
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
    } else {
      audioRef.current.pause();
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    }
  }, [playerState.currentTrack, playlist, playTrack]);

  // Play next
  const playNext = useCallback(() => {
    if (currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      playTrack(playlist[nextIndex]);
    }
  }, [currentIndex, playlist, playTrack]);

  // Play previous
  const playPrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      playTrack(playlist[prevIndex]);
    }
  }, [currentIndex, playlist, playTrack]);

  // Handle mood slider change
  const handleMoodChange = useCallback((value: number[]) => {
    const val = value[0];
    setMoodValue(val);

    let newMood: MoodType;
    if (val < 30) {
      newMood = 'sad';
    } else if (val > 70) {
      newMood = 'happy';
    } else {
      newMood = 'neutral';
    }

    if (newMood !== mood) {
      setMood(newMood);
      if (spotifyToken) {
        fetchSpotifyRecs(spotifyToken, newMood);
      }
    }
  }, [mood, spotifyToken, fetchSpotifyRecs]);

  // Process brain signal
  const processSignal = useCallback(async () => {
    try {
      const signalTypes = ['happy', 'neutral', 'sad'] as const;
      const selectedType = signalTypes[Math.floor(Math.random() * signalTypes.length)];

      let signal: BrainSignal;
      switch (selectedType) {
        case 'happy':
          signal = generateHappySignal();
          break;
        case 'sad':
          signal = generateSadSignal();
          break;
        default:
          signal = generateNeutralSignal();
      }

      const prediction = await predictEmotion(signal.data, signal.sampleRate);
      setCurrentEmotion(prediction);

      // Auto-adjust mood based on brain signal
      let newMoodValue: number;
      if (prediction.emotion === 'sad') {
        newMoodValue = 20;
      } else if (prediction.emotion === 'happy') {
        newMoodValue = 80;
      } else {
        newMoodValue = 50;
      }

      handleMoodChange([newMoodValue]);
      setMoodValue(newMoodValue);

    } catch (error) {
      console.error('Signal processing error:', error);
    }
  }, [handleMoodChange]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setLoadingMessage('اتصال به اسپاتیفای...');
      
      const token = await getSpotifyToken();
      if (token) {
        await fetchSpotifyRecs(token, mood);
      }
      
      setIsLoading(false);
    };

    init();

    // Create audio element
    audioRef.current = new Audio();
    audioRef.current.volume = playerState.volume;

    // Audio event listeners
    const audio = audioRef.current;
    
    audio.addEventListener('timeupdate', () => {
      setPlayerState(prev => ({
        ...prev,
        currentTime: audio.currentTime
      }));
    });

    audio.addEventListener('ended', () => {
      playNext();
    });

    audio.addEventListener('loadedmetadata', () => {
      setPlayerState(prev => ({
        ...prev,
        duration: audio.duration
      }));
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Get theme color based on mood
  const getMoodTheme = () => {
    switch (mood) {
      case 'sad':
        return 'moodflow-sad';
      case 'happy':
        return 'moodflow-happy';
      default:
        return 'moodflow-neutral';
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-1000 ${getMoodTheme()}`}>
      {/* Header */}
      <header className="border-b bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Music className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-green-400">MoodFlow</h1>
              <p className="text-xs text-muted-foreground">پخش‌کننده هوشمند اسپاتیفای</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              صفحه اصلی
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">
          
          {/* Player Card */}
          <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border-white/10 relative overflow-hidden">
            <LoadingOverlay 
              isVisible={isLoading} 
              message={loadingMessage}
              error={error}
            />
            
            <CardContent className="p-8 space-y-6">
              {/* Album Art */}
              <AlbumArt 
                imageUrl={playerState.currentTrack?.album.images[0]?.url || ''} 
                isPlaying={playerState.isPlaying}
                mood={mood}
              />

              {/* Track Info */}
              <TrackInfo track={playerState.currentTrack} mood={mood} />

              {/* Progress Bar */}
              <ProgressBar 
                currentTime={playerState.currentTime}
                duration={playerState.duration}
                onSeek={(time) => {
                  if (audioRef.current) {
                    audioRef.current.currentTime = time;
                  }
                }}
              />

              {/* Controls */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
                  <Shuffle className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white/70 hover:text-white"
                  onClick={playNext}
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
                <Button 
                  size="lg"
                  className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90"
                  onClick={togglePlay}
                >
                  {playerState.isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 mr-0.5" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white/70 hover:text-white"
                  onClick={playPrev}
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

              {/* Playlist */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <ListMusic className="w-4 h-4" />
                    صف پخش
                  </span>
                  <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {playlist.map((track, index) => (
                    <PlaylistItem
                      key={track.id}
                      track={track}
                      isActive={index === currentIndex}
                      onClick={() => {
                        setCurrentIndex(index);
                        playTrack(track);
                      }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Control Panel */}
          <div className="w-full max-w-sm space-y-6">
            {/* Mood Sensor */}
            <Card className="bg-white text-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-purple-600" />
                  شبیه‌ساز وضعیت کاربر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 text-center">
                  {mood === 'sad' ? 'آرام / غمگین' : mood === 'happy' ? 'شاد / هیجانی' : 'خنثی / تمرکز'}
                  {' - '}
                  {moodValue}%
                </div>
                <Slider
                  value={[moodValue]}
                  onValueChange={handleMoodChange}
                  min={0}
                  max={100}
                  step={1}
                  className="mood-slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>غمگین (Sad)</span>
                  <span>شاد (Happy)</span>
                </div>

                <Button 
                  onClick={processSignal}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  تحلیل سیگنال مغزی
                </Button>
              </CardContent>
            </Card>

            {/* Brain State */}
            {currentEmotion && (
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    وضعیت ذهنی
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {currentEmotion.emotion === 'happy' ? '😊' : 
                       currentEmotion.emotion === 'sad' ? '😢' : '😐'}
                    </span>
                    <div>
                      <div className="font-medium">
                        {currentEmotion.emotion === 'happy' ? 'خوشحال' :
                         currentEmotion.emotion === 'sad' ? 'ناراحت' : 'خنثی'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        اطمینان: {(currentEmotion.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Music className="h-5 w-5 text-green-500" />
                  درباره MoodFlow
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>🎵 پخش موسیقی متناسب با حالت ذهنی</p>
                <p>🧠 تحلیل سیگنال مغزی برای تشخیص احساسات</p>
                <p>🎨 تغییر رنگ‌بندی بر اساس mood</p>
                <p>📱 اتصال به API اسپاتیفای</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>ساخته شده با</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>و اتصال به Spotify API</span>
            </div>
            <div className="text-sm text-muted-foreground">
              MoodFlow © 2024
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
