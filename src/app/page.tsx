'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { SignalChart, MultiSignalChart } from '@/components/SignalChart';
import { FrequencyBandsChart, FrequencyCircleChart } from '@/components/FrequencyChart';
import { SignalDesigner } from '@/components/SignalDesigner';
import { EmotionDisplay } from '@/components/EmotionDisplay';
import { MusicRecommendation } from '@/components/MusicRecommendation';
import { FilterControls, FilterSettings } from '@/components/FilterControls';
import { 
  generateHappySignal, 
  generateNeutralSignal, 
  generateSadSignal,
  generateCustomSignal,
  BrainSignal,
  CustomSignalParams
} from '@/lib/signal-generator';
import { 
  preprocessSignal, 
  calculateBandPowers,
  BandPowers 
} from '@/lib/signal-processing';
import { removeArtifactsSimple } from '@/lib/ica-processing';
import { predictEmotion, EmotionPrediction } from '@/lib/emotion-classifier';
import { useToast } from '@/components/ui/use-toast';
import {
  Brain,
  Smile,
  Meh,
  Frown,
  Sparkles,
  Activity,
  Music,
  Settings,
  ChevronRight,
  Github,
  Heart,
  Zap,
  Waves,
  Leaf,
  Gamepad2,
  BookOpen,
  HeartPulse,
  ListMusic
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  // State
  const [currentSignal, setCurrentSignal] = useState<BrainSignal | null>(null);
  const [processedSignal, setProcessedSignal] = useState<number[] | null>(null);
  const [bandPowers, setBandPowers] = useState<BandPowers | null>(null);
  const [emotionPrediction, setEmotionPrediction] = useState<EmotionPrediction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Load a predefined signal
  const loadPredefinedSignal = useCallback((type: 'happy' | 'neutral' | 'sad') => {
    let signal: BrainSignal;
    switch (type) {
      case 'happy':
        signal = generateHappySignal();
        break;
      case 'neutral':
        signal = generateNeutralSignal();
        break;
      case 'sad':
        signal = generateSadSignal();
        break;
    }
    setCurrentSignal(signal);
    setProcessedSignal(null);
    setEmotionPrediction(null);
    setBandPowers(null);
    toast({
      title: 'Signal Loaded',
      description: `Loaded ${signal.label}`,
    });
  }, [toast]);

  // Generate custom signal
  const handleCustomSignal = useCallback((params: CustomSignalParams, duration: number) => {
    const signal = generateCustomSignal(params, duration);
    setCurrentSignal(signal);
    setProcessedSignal(null);
    setEmotionPrediction(null);
    setBandPowers(null);
    toast({
      title: 'Signal Generated',
      description: 'Custom signal created successfully',
    });
  }, [toast]);

  // Apply filters and process signal
  const handleApplyFilters = useCallback(async (settings: FilterSettings) => {
    if (!currentSignal) {
      toast({
        title: 'No Signal',
        description: 'Please load a signal first',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      let processed = [...currentSignal.data];

      // Apply band-pass filter
      if (settings.applyBandpass) {
        const result = preprocessSignal(
          processed,
          currentSignal.sampleRate,
          settings.bandpassLow,
          settings.bandpassHigh,
          settings.notchFreq
        );
        processed = settings.applyNotch ? result.afterNotch : result.afterBandpass;
      } else if (settings.applyNotch) {
        const result = preprocessSignal(
          processed,
          currentSignal.sampleRate,
          0.1,
          100,
          settings.notchFreq
        );
        processed = result.afterNotch;
      }

      // Apply ICA artifact removal
      if (settings.applyICA) {
        const icaResult = removeArtifactsSimple(processed, settings.icaThreshold);
        processed = icaResult.cleanSignal;
      }

      setProcessedSignal(processed);

      // Calculate band powers
      const powers = calculateBandPowers(processed, currentSignal.sampleRate);
      setBandPowers(powers);

      // Predict emotion
      const prediction = await predictEmotion(processed, currentSignal.sampleRate);
      setEmotionPrediction(prediction);

      toast({
        title: 'Processing Complete',
        description: `Detected emotion: ${prediction.emotion} (${(prediction.confidence * 100).toFixed(1)}% confidence)`,
      });

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'Processing Error',
        description: 'An error occurred during signal processing',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [currentSignal, toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Brain Signal Analyzer</h1>
              <p className="text-xs text-muted-foreground">EEG Processing & Emotion Detection</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/mind-garden">
              <Button variant="outline" size="sm" className="gap-2 border-green-500/50 text-green-500 hover:bg-green-500/10">
                <Leaf className="h-4 w-4" />
                <span className="hidden sm:inline">باغبان ذهن</span>
                <Gamepad2 className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/neuro-tutor">
              <Button variant="outline" size="sm" className="gap-2 border-purple-500/50 text-purple-500 hover:bg-purple-500/10">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">نورو توتور</span>
                <Brain className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/soul-resonance">
              <Button variant="outline" size="sm" className="gap-2 border-rose-500/50 text-rose-500 hover:bg-rose-500/10">
                <HeartPulse className="h-4 w-4" />
                <span className="hidden sm:inline">طنین روح</span>
                <Music className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/moodflow">
              <Button variant="outline" size="sm" className="gap-2 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10">
                <ListMusic className="h-4 w-4" />
                <span className="hidden sm:inline">MoodFlow</span>
              </Button>
            </Link>
            <div className="flex items-center gap-1 text-sm text-green-500">
              <Settings className="h-4 w-4" />
              <span>Spotify Connected</span>
            </div>
            <Button variant="ghost" size="icon" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="analyze" className="space-y-6">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3">
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="design" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Design
            </TabsTrigger>
            <TabsTrigger value="music" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Music
            </TabsTrigger>
          </TabsList>

          {/* Analyze Tab */}
          <TabsContent value="analyze" className="space-y-6">
            {/* Signal Selection */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-6 w-6 text-primary" />
                  Select Brain Signal
                </CardTitle>
                <CardDescription>
                  Choose a pre-defined brain signal pattern to analyze
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Happy Signal */}
                  <button
                    onClick={() => loadPredefinedSignal('happy')}
                    className={`p-4 rounded-xl border-2 transition-all hover:border-green-500 hover:bg-green-500/10 ${
                      currentSignal?.emotion === 'happy' ? 'border-green-500 bg-green-500/10' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Smile className="h-7 w-7 text-green-500" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold">Happy</h3>
                        <p className="text-xs text-muted-foreground">High alpha, moderate beta</p>
                      </div>
                    </div>
                  </button>

                  {/* Neutral Signal */}
                  <button
                    onClick={() => loadPredefinedSignal('neutral')}
                    className={`p-4 rounded-xl border-2 transition-all hover:border-gray-500 hover:bg-gray-500/10 ${
                      currentSignal?.emotion === 'neutral' ? 'border-gray-500 bg-gray-500/10' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-500/20 flex items-center justify-center">
                        <Meh className="h-7 w-7 text-gray-500" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold">Neutral</h3>
                        <p className="text-xs text-muted-foreground">Balanced alpha and beta</p>
                      </div>
                    </div>
                  </button>

                  {/* Sad Signal */}
                  <button
                    onClick={() => loadPredefinedSignal('sad')}
                    className={`p-4 rounded-xl border-2 transition-all hover:border-red-500 hover:bg-red-500/10 ${
                      currentSignal?.emotion === 'sad' ? 'border-red-500 bg-red-500/10' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Frown className="h-7 w-7 text-red-500" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold">Sad</h3>
                        <p className="text-xs text-muted-foreground">High theta, high delta</p>
                      </div>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Signal Display & Processing */}
            {currentSignal && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Signals */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Original Signal */}
                  <SignalChart
                    data={currentSignal.data.slice(0, 512)}
                    title={`Original Signal - ${currentSignal.label}`}
                    color="#8b5cf6"
                    height={180}
                  />

                  {/* Comparison Chart */}
                  {processedSignal && (
                    <MultiSignalChart
                      signals={[
                        { data: currentSignal.data.slice(0, 512), label: 'Original', color: '#8b5cf6' },
                        { data: processedSignal.slice(0, 512), label: 'Processed', color: '#22c55e' }
                      ]}
                      title="Signal Comparison"
                      height={200}
                    />
                  )}

                  {/* Frequency Analysis */}
                  {bandPowers && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FrequencyBandsChart bandPowers={bandPowers} />
                      <FrequencyCircleChart bandPowers={bandPowers} />
                    </div>
                  )}
                </div>

                {/* Right Column - Controls & Results */}
                <div className="space-y-6">
                  <FilterControls 
                    onApplyFilters={handleApplyFilters}
                    isProcessing={isProcessing}
                  />
                  <EmotionDisplay 
                    prediction={emotionPrediction}
                    isProcessing={isProcessing}
                  />
                </div>
              </div>
            )}

            {/* Empty State */}
            {!currentSignal && (
              <Card className="card-hover">
                <CardContent className="flex flex-col items-center py-16">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Brain className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Signal Selected</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Select a pre-defined brain signal above or go to the Design tab to create your own custom signal.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SignalDesigner onGenerateSignal={handleCustomSignal} />
              
              <div className="space-y-6">
                {currentSignal && (
                  <>
                    <SignalChart
                      data={currentSignal.data.slice(0, 512)}
                      title="Generated Signal Preview"
                      color="#8b5cf6"
                      height={200}
                    />
                    {bandPowers && (
                      <FrequencyBandsChart bandPowers={bandPowers} />
                    )}
                  </>
                )}
                
                {!currentSignal && (
                  <Card className="h-full min-h-[400px] flex items-center justify-center">
                    <CardContent className="text-center">
                      <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Design your signal using the controls on the left
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Music Tab */}
          <TabsContent value="music" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Instructions */}
                <Card className="card-hover">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-6 w-6 text-primary" />
                      How It Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Select or Design a Signal</h4>
                        <p className="text-sm text-muted-foreground">
                          Choose a pre-defined signal or create your own
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Process & Analyze</h4>
                        <p className="text-sm text-muted-foreground">
                          Apply filters and let LSTM detect the emotion
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Get Music Recommendations</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive music matching your detected mood
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current State */}
                <EmotionDisplay 
                  prediction={emotionPrediction}
                  isProcessing={isProcessing}
                />
              </div>

              <MusicRecommendation 
                emotion={emotionPrediction?.emotion || null}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Built with</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>using Next.js & shadcn/ui</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Brain Signal Analyzer © 2024
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
