'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  generateHappySignal, 
  generateNeutralSignal, 
  generateSadSignal,
  BrainSignal
} from '@/lib/signal-generator';
import { calculateBandPowers, preprocessSignal } from '@/lib/signal-processing';
import { predictEmotion, EmotionPrediction } from '@/lib/emotion-classifier';
import { useToast } from '@/components/ui/use-toast';
import {
  Brain,
  Leaf,
  Sun,
  Cloud,
  CloudRain,
  Flower2,
  TreeDeciduous,
  Bird,
  Home,
  Play,
  Pause,
  RotateCcw,
  Heart,
  Sparkles,
  Wind
} from 'lucide-react';
import Link from 'next/link';

// Game state types
type WeatherState = 'sunny' | 'cloudy' | 'rainy';
type GrowthStage = 0 | 1 | 2 | 3 | 4 | 5;

interface GameState {
  weather: WeatherState;
  growthStage: GrowthStage;
  health: number;
  flowers: number;
  birds: number;
  weeds: number;
  score: number;
  isPlaying: boolean;
  emotionHistory: EmotionPrediction[];
}

// Animated Tree Component
const AnimatedTree: React.FC<{ stage: GrowthStage; health: number; weather: WeatherState }> = ({ 
  stage, 
  health, 
  weather 
}) => {
  const getTreeColor = () => {
    if (health > 70) return 'text-green-500';
    if (health > 40) return 'text-yellow-500';
    return 'text-gray-400';
  };

  const getTreeSize = () => {
    const sizes = ['w-8 h-8', 'w-12 h-12', 'w-16 h-16', 'w-24 h-24', 'w-32 h-32', 'w-40 h-40'];
    return sizes[stage];
  };

  return (
    <div className={`transition-all duration-1000 ${getTreeSize()} ${getTreeColor()}`}>
      {stage === 0 ? (
        <Leaf className="w-full h-full animate-pulse" />
      ) : (
        <TreeDeciduous className="w-full h-full tree-sway" />
      )}
    </div>
  );
};

// Weather Background Component
const WeatherBackground: React.FC<{ weather: WeatherState; children: React.ReactNode }> = ({ 
  weather, 
  children 
}) => {
  const getBackgroundClass = () => {
    switch (weather) {
      case 'sunny':
        return 'garden-sunny';
      case 'cloudy':
        return 'garden-cloudy';
      case 'rainy':
        return 'garden-rainy';
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl transition-all duration-2000 ${getBackgroundClass()}`}>
      {/* Sun */}
      <div className={`absolute top-4 right-4 transition-all duration-1000 ${
        weather === 'sunny' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
      }`}>
        <Sun className="w-16 h-16 text-yellow-400 sun-pulse" />
      </div>

      {/* Clouds */}
      <div className={`absolute top-8 left-8 transition-all duration-1000 ${
        weather !== 'sunny' ? 'opacity-100' : 'opacity-30'
      }`}>
        <Cloud className={`w-12 h-12 cloud-float ${weather === 'rainy' ? 'text-gray-500' : 'text-gray-300'}`} />
      </div>
      <div className={`absolute top-12 left-24 transition-all duration-1000 ${
        weather !== 'sunny' ? 'opacity-100' : 'opacity-20'
      }`}>
        <Cloud className={`w-8 h-8 cloud-float-slow ${weather === 'rainy' ? 'text-gray-600' : 'text-gray-400'}`} />
      </div>

      {/* Rain drops */}
      {weather === 'rainy' && (
        <div className="rain-container">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="rain-drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`
              }}
            />
          ))}
        </div>
      )}

      {children}
    </div>
  );
};

// Flowers Component
const GardenFlowers: React.FC<{ count: number; health: number }> = ({ count, health }) => {
  const flowers = Array(Math.min(count, 8)).fill(null);
  
  return (
    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
      {flowers.map((_, i) => (
        <Flower2 
          key={i}
          className={`w-6 h-6 transition-all duration-500 flower-bloom ${
            health > 50 ? 'text-pink-400' : 'text-gray-400'
          }`}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
};

// Birds Component
const GardenBirds: React.FC<{ count: number }> = ({ count }) => {
  const birds = Array(Math.min(count, 3)).fill(null);
  
  return (
    <>
      {birds.map((_, i) => (
        <Bird
          key={i}
          className="absolute w-6 h-6 text-blue-400 bird-fly"
          style={{
            top: `${20 + i * 15}%`,
            animationDelay: `${i * 1.5}s`
          }}
        />
      ))}
    </>
  );
};

// Weeds Component
const GardenWeeds: React.FC<{ count: number }> = ({ count }) => {
  const weeds = Array(Math.min(count, 5)).fill(null);
  
  return (
    <div className="absolute bottom-0 left-0 right-0 flex justify-around">
      {weeds.map((_, i) => (
        <Leaf
          key={i}
          className="w-4 h-4 text-gray-500 weed-grow"
          style={{ transform: 'rotate(180deg)', animationDelay: `${i * 0.3}s` }}
        />
      ))}
    </div>
  );
};

// Emotion Indicator Component
const EmotionIndicator: React.FC<{ prediction: EmotionPrediction | null }> = ({ prediction }) => {
  if (!prediction) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Brain className="w-5 h-5" />
        <span>در انتظار سیگنال...</span>
      </div>
    );
  }

  const getEmotionEmoji = () => {
    switch (prediction.emotion) {
      case 'happy': return '😊';
      case 'neutral': return '😐';
      case 'sad': return '😢';
    }
  };

  const getEmotionLabel = () => {
    switch (prediction.emotion) {
      case 'happy': return 'خوشحال';
      case 'neutral': return 'خنثی';
      case 'sad': return 'ناراحت';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl">{getEmotionEmoji()}</span>
      <div>
        <div className="font-medium">{getEmotionLabel()}</div>
        <div className="text-sm text-muted-foreground">
          اطمینان: {(prediction.confidence * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
};

export default function MindGardenPage() {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState>({
    weather: 'cloudy',
    growthStage: 0,
    health: 50,
    flowers: 0,
    birds: 0,
    weeds: 0,
    score: 0,
    isPlaying: false,
    emotionHistory: []
  });
  const [currentEmotion, setCurrentEmotion] = useState<EmotionPrediction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate brain signal and get emotion
  const processSignal = useCallback(async () => {
    if (!gameState.isPlaying) return;
    
    setIsProcessing(true);
    
    try {
      // Randomly select a signal type to simulate real brain activity
      const signalTypes = ['happy', 'neutral', 'sad'] as const;
      const weights = [0.4, 0.35, 0.25]; // Slightly favor positive emotions
      
      // Add some persistence - tend to stay in current state
      let selectedType: typeof signalTypes[number];
      if (currentEmotion && Math.random() < 0.6) {
        selectedType = currentEmotion.emotion;
      } else {
        const random = Math.random();
        let cumulative = 0;
        selectedType = 'neutral';
        for (let i = 0; i < weights.length; i++) {
          cumulative += weights[i];
          if (random < cumulative) {
            selectedType = signalTypes[i];
            break;
          }
        }
      }
      
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
      
      // Process and predict
      const prediction = await predictEmotion(signal.data, signal.sampleRate);
      setCurrentEmotion(prediction);
      
      // Update game state based on emotion
      updateGameState(prediction);
      
    } catch (error) {
      console.error('Signal processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [gameState.isPlaying, currentEmotion]);

  // Update game state based on detected emotion
  const updateGameState = useCallback((prediction: EmotionPrediction) => {
    setGameState(prev => {
      let newState = { ...prev };
      
      // Add to history
      newState.emotionHistory = [...prev.emotionHistory.slice(-9), prediction];
      
      if (prediction.emotion === 'happy') {
        // Positive state: sun shines, growth increases
        newState.weather = 'sunny';
        newState.health = Math.min(100, prev.health + 5);
        newState.flowers = Math.min(8, prev.flowers + (Math.random() > 0.7 ? 1 : 0));
        newState.birds = Math.min(3, prev.birds + (Math.random() > 0.8 ? 1 : 0));
        newState.weeds = Math.max(0, prev.weeds - 1);
        newState.score += 10;
        
        // Growth stage increases
        if (prev.health > 70 && prev.growthStage < 5) {
          newState.growthStage = Math.min(5, prev.growthStage + 1) as GrowthStage;
        }
      } else if (prediction.emotion === 'sad') {
        // Negative state: rain, weeds grow
        newState.weather = 'rainy';
        newState.health = Math.max(0, prev.health - 8);
        newState.flowers = Math.max(0, prev.flowers - (Math.random() > 0.5 ? 1 : 0));
        newState.birds = Math.max(0, prev.birds - 1);
        newState.weeds = Math.min(5, prev.weeds + (Math.random() > 0.5 ? 1 : 0));
        
        // Health decreases, might lose growth stage
        if (prev.health < 30 && prev.growthStage > 0) {
          newState.growthStage = Math.max(0, prev.growthStage - 1) as GrowthStage;
        }
      } else {
        // Neutral state: cloudy, slow growth
        newState.weather = 'cloudy';
        newState.health = Math.min(100, prev.health + 1);
        newState.score += 2;
      }
      
      return newState;
    });
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState.isPlaying) {
      gameLoopRef.current = setInterval(() => {
        processSignal();
      }, 2000); // Process every 2 seconds
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, processSignal]);

  // Start game
  const startGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: true }));
    toast({
      title: 'بازی شروع شد! 🌱',
      description: 'سعی کن با تمرکز و آرامش، باغچه‌ات رو رشد بدی',
    });
  };

  // Pause game
  const pauseGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: false }));
  };

  // Reset game
  const resetGame = () => {
    setGameState({
      weather: 'cloudy',
      growthStage: 0,
      health: 50,
      flowers: 0,
      birds: 0,
      weeds: 0,
      score: 0,
      isPlaying: false,
      emotionHistory: []
    });
    setCurrentEmotion(null);
    toast({
      title: 'بازی ریست شد',
      description: 'یه بار دیگه از اول شروع کن!',
    });
  };

  // Get growth stage label
  const getGrowthLabel = () => {
    const labels = ['دانه 🌰', 'جوانه 🌱', 'نهال کوچک 🌿', 'درخت جوان 🌳', 'درخت بالغ 🌲', 'درخت کامل 🎄'];
    return labels[gameState.growthStage];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-green-500">باغبان ذهن</h1>
              <p className="text-xs text-muted-foreground">The Mind Garden</p>
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
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Game Canvas */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreeDeciduous className="h-6 w-6 text-green-500" />
                  باغچه شما
                </CardTitle>
                <CardDescription>
                  با کنترل احساساتتان، این گیاه را به یک درخت تبدیل کنید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WeatherBackground weather={gameState.weather}>
                  <div className="relative h-80 flex flex-col items-center justify-end pb-16">
                    {/* Birds */}
                    <GardenBirds count={gameState.birds} />
                    
                    {/* Tree */}
                    <div className="relative z-10 mb-4">
                      <AnimatedTree 
                        stage={gameState.growthStage} 
                        health={gameState.health}
                        weather={gameState.weather}
                      />
                    </div>
                    
                    {/* Ground */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-800/50 to-transparent" />
                    
                    {/* Flowers */}
                    <GardenFlowers count={gameState.flowers} health={gameState.health} />
                    
                    {/* Weeds */}
                    <GardenWeeds count={gameState.weeds} />
                  </div>
                </WeatherBackground>

                {/* Game Controls */}
                <div className="flex justify-center gap-4 mt-6">
                  {!gameState.isPlaying ? (
                    <Button onClick={startGame} className="gap-2 bg-green-600 hover:bg-green-700">
                      <Play className="h-4 w-4" />
                      شروع بازی
                    </Button>
                  ) : (
                    <Button onClick={pauseGame} variant="secondary" className="gap-2">
                      <Pause className="h-4 w-4" />
                      توقف
                    </Button>
                  )}
                  <Button onClick={resetGame} variant="outline" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    شروع مجدد
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Panel */}
          <div className="space-y-6">
            {/* Current Emotion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-primary" />
                  وضعیت ذهنی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmotionIndicator prediction={currentEmotion} />
                {isProcessing && (
                  <div className="mt-3 text-sm text-muted-foreground animate-pulse">
                    در حال پردازش سیگنال...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Garden Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  آمار باغچه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Health */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>سلامت گیاه</span>
                    <span>{gameState.health}%</span>
                  </div>
                  <Progress 
                    value={gameState.health} 
                    className="h-2"
                  />
                </div>

                {/* Growth Stage */}
                <div className="flex justify-between items-center">
                  <span className="text-sm">مرحله رشد</span>
                  <span className="font-medium">{getGrowthLabel()}</span>
                </div>

                {/* Flowers */}
                <div className="flex justify-between items-center">
                  <span className="text-sm">گل‌ها</span>
                  <div className="flex gap-1">
                    {[...Array(8)].map((_, i) => (
                      <Flower2 
                        key={i}
                        className={`w-4 h-4 ${i < gameState.flowers ? 'text-pink-400' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Birds */}
                <div className="flex justify-between items-center">
                  <span className="text-sm">پرندگان</span>
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <Bird 
                        key={i}
                        className={`w-4 h-4 ${i < gameState.birds ? 'text-blue-400' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Weeds */}
                <div className="flex justify-between items-center">
                  <span className="text-sm">علف‌های هرز</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Leaf 
                        key={i}
                        className={`w-4 h-4 ${i < gameState.weeds ? 'text-gray-500' : 'text-gray-800'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Score */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">امتیاز کل</span>
                    <span className="text-2xl font-bold text-primary">{gameState.score}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                  راهنمای آرامش
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>🧘 نفس عمیق بکش و روی تنفست تمرکز کن</p>
                <p>😊 به یه خاطره خوب فکر کن</p>
                <p>🎵 آهنگ آرامش‌بخش گوش بده</p>
                <p>🌈 به چیزهای مثبت زندگیت فکر کن</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-6 w-6 text-cyan-500" />
              چطور بازی کنیم؟
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Sun className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-medium text-green-500">حالت مثبت ☀️</h4>
                  <p className="text-sm text-muted-foreground">
                    وقتی خوشحال باشی، خورشید می‌تابه، گل‌ها باز میشن و پرنده‌ها میان!
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center flex-shrink-0">
                  <Cloud className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-400">حالت خنثی ☁️</h4>
                  <p className="text-sm text-muted-foreground">
                    وقتی آروم باشی، هوا ابری میشه و همه چیز ثابت می‌مونه.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <CloudRain className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-400">حالت منفی 🌧️</h4>
                  <p className="text-sm text-muted-foreground">
                    وقتی ناراحت باشی، بارون میاد و علف‌های هرز شروع به رشد می‌کنن!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>ساخته شده با</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>برای پروژه سیگنال‌های مغزی</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Mind Garden © 2024
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
