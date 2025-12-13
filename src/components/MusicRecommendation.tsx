'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MusicGenre, 
  SpotifyTrack, 
  getAllGenres, 
  genreDisplayNames,
  getMusicRecommendation,
  getTrackDownloadUrl
} from '@/lib/spotify-api';
import { 
  Music, 
  Play, 
  Download, 
  Loader2, 
  ExternalLink,
  Disc3,
  Clock,
  User
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface MusicRecommendationProps {
  emotion: string | null;
  apiKey: string;
}

export function MusicRecommendation({ emotion, apiKey }: MusicRecommendationProps) {
  const [selectedGenre, setSelectedGenre] = useState<MusicGenre>('pop');
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingTrack, setDownloadingTrack] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!apiKey) {
      toast({
        title: 'API Key Required',
        description: 'Please enter your Spotify API key in settings',
        variant: 'destructive'
      });
      return;
    }

    if (!emotion) {
      toast({
        title: 'No Emotion Detected',
        description: 'Please analyze a signal first to detect emotion',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await getMusicRecommendation(apiKey, emotion, selectedGenre);
      setTracks(result.tracks);
      setSearchQuery(result.searchQuery);
      
      if (result.tracks.length === 0) {
        toast({
          title: 'No Results',
          description: 'No tracks found for this search. Try a different genre.',
        });
      }
    } catch (error) {
      toast({
        title: 'Search Failed',
        description: 'Failed to search for music. Please check your API key.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (track: SpotifyTrack) => {
    if (!track.url) {
      toast({
        title: 'No URL',
        description: 'Track URL not available',
        variant: 'destructive'
      });
      return;
    }

    setDownloadingTrack(track.title);
    try {
      const downloadUrl = await getTrackDownloadUrl(apiKey, track.url);
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
        toast({
          title: 'Download Started',
          description: `Downloading "${track.title}"`,
        });
      } else {
        // If no download URL, open the track URL
        window.open(track.url, '_blank');
        toast({
          title: 'Opening Track',
          description: `Opening "${track.title}" on Spotify`,
        });
      }
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to get download link',
        variant: 'destructive'
      });
    } finally {
      setDownloadingTrack(null);
    }
  };

  const emotionEmoji = {
    happy: '😊',
    neutral: '😐',
    sad: '😢'
  }[emotion || 'neutral'] || '🎵';

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-6 w-6 text-primary" />
          Music Recommendation
        </CardTitle>
        <CardDescription>
          Get music that matches your brain&apos;s emotional state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Emotion */}
        {emotion && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <span className="text-2xl">{emotionEmoji}</span>
            <div>
              <p className="text-sm font-medium">Detected Emotion</p>
              <p className="text-lg capitalize font-semibold text-primary">{emotion}</p>
            </div>
          </div>
        )}

        {/* Genre Selection */}
        <div className="space-y-2">
          <Label>Select Music Genre</Label>
          <Select value={selectedGenre} onValueChange={(v) => setSelectedGenre(v as MusicGenre)}>
            <SelectTrigger>
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              {getAllGenres().map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genreDisplayNames[genre]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <Button 
          onClick={handleSearch} 
          disabled={isLoading || !emotion}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Find Music
            </>
          )}
        </Button>

        {/* Search Query */}
        {searchQuery && (
          <p className="text-xs text-muted-foreground text-center">
            Searched: &quot;{searchQuery}&quot;
          </p>
        )}

        {/* Track List */}
        {tracks.length > 0 && (
          <div className="space-y-3 mt-4">
            <h4 className="text-sm font-medium">Recommended Tracks</h4>
            {tracks.map((track, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                {/* Track Icon/Image */}
                <div className="w-12 h-12 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                  {track.imageUrl ? (
                    <img 
                      src={track.imageUrl} 
                      alt={track.title}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <Disc3 className="h-6 w-6 text-primary" />
                  )}
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{track.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{track.artist}</span>
                    {track.duration && (
                      <>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{track.duration}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  {track.url && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => window.open(track.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDownload(track)}
                    disabled={downloadingTrack === track.title}
                  >
                    {downloadingTrack === track.title ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && tracks.length === 0 && emotion && (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Click &quot;Find Music&quot; to get recommendations</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
