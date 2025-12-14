'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
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
  VolumeX,
  Wind,
  Waves,
  Moon,
  Sun,
  Activity,
  Zap,
  Music
} from 'lucide-react';
import Link from 'next/link';

// Therapy mode types
type TherapyMode = 'anxiety' | 'balanced' | 'depression';

interface AudioState {
  isPlaying: boolean;
  volume: number;
  leftFreq: number;
  rightFreq: number;
  binauralFreq: number;
}

interface TherapySettings {
  mode: TherapyMode;
  intensity: number; // -100 to 100 (-100 = anxiety, 0 = balanced, 100 = depression)
}

// Binaural frequency ranges
const THETA_RANGE = { min: 4, max: 8 };   // Relaxation, meditation
const ALPHA_RANGE = { min: 8, max: 13 };  // Calm, creative
const BETA_RANGE = { min: 15, max: 30 };  // Alert, focused

// Base carrier frequency
const BASE_FREQ = 200; // Hz

// Breathing Circle Component
const BreathingCircle: React.FC<{ mode: TherapyMode; isActive: boolean }> = ({ mode, isActive }) => {
  const getBreathingDuration = () => {
    switch (mode) {
      case 'anxiety':
        return '8s'; // Slow breathing for anxiety
      case 'balanced':
        return '6s';
      case 'depression':
        return '4s'; // Faster rhythm for depression
    }
  };

  const getGradient = () => {
    switch (mode) {
      case 'anxiety':
        return 'from-blue-500/30 via-cyan-500/20 to-teal-500/30';
      case 'balanced':
        return 'from-purple-500/30 via-violet-500/20 to-indigo-500/30';
      case 'depression':
        return 'from-orange-500/30 via-amber-500/20 to-yellow-500/30';
    }
  };

  const getInnerGlow = () => {
    switch (mode) {
      case 'anxiety':
        return 'shadow-[0_0_60px_rgba(34,211,238,0.4)]';
      case 'balanced':
        return 'shadow-[0_0_60px_rgba(167,139,250,0.4)]';
      case 'depression':
        return 'shadow-[0_0_60px_rgba(251,191,36,0.4)]';
    }
  };

  return (
    <div className="relative flex items-center justify-center h-80">
      {/* Outer glow rings */}
      <div 
        className={`absolute w-72 h-72 rounded-full bg-gradient-to-br ${getGradient()} ${
          isActive ? 'breathing-circle' : ''
        }`}
        style={{ animationDuration: getBreathingDuration() }}
      />
      <div 
        className={`absolute w-56 h-56 rounded-full bg-gradient-to-br ${getGradient()} ${
          isActive ? 'breathing-circle' : ''
        }`}
        style={{ animationDuration: getBreathingDuration(), animationDelay: '0.5s' }}
      />
      
      {/* Main breathing circle */}
      <div 
        className={`absolute w-40 h-40 rounded-full bg-gradient-to-br ${getGradient()} ${getInnerGlow()} ${
          isActive ? 'breathing-circle' : ''
        } flex items-center justify-center`}
        style={{ animationDuration: getBreathingDuration(), animationDelay: '1s' }}
      >
        <div className="text-center">
          {isActive ? (
            <>
              <Wind className="w-8 h-8 mx-auto mb-2 text-white/70" />
              <span className="text-sm text-white/70">نفس عمیق</span>
            </>
          ) : (
            <>
              <Music className="w-8 h-8 mx-auto mb-2 text-white/50" />
              <span className="text-sm text-white/50">شروع کنید</span>
            </>
          )}
        </div>
      </div>

      {/* Breathing instruction */}
      {isActive && (
        <div className="absolute bottom-0 text-center">
          <p className="text-sm text-muted-foreground breathing-text">
            با ریتم دایره نفس بکشید...
          </p>
        </div>
      )}
    </div>
  );
};

// Frequency Display Component
const FrequencyDisplay: React.FC<{ audioState: AudioState; mode: TherapyMode }> = ({ 
  audioState, 
  mode 
}) => {
  const getWaveType = () => {
    switch (mode) {
      case 'anxiety':
        return { name: 'تتا (Theta)', range: '4-8 Hz', desc: 'آرامش عمیق' };
      case 'balanced':
        return { name: 'آلفا (Alpha)', range: '8-13 Hz', desc: 'تعادل و خلاقیت' };
      case 'depression':
        return { name: 'بتا (Beta)', range: '15-30 Hz', desc: 'هوشیاری و انرژی' };
    }
  };

  const waveInfo = getWaveType();

  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      <div className="p-4 rounded-xl bg-card/50">
        <div className="text-2xl font-mono font-bold text-primary">
          {audioState.leftFreq.toFixed(1)}
        </div>
        <div className="text-xs text-muted-foreground">گوش چپ (Hz)</div>
      </div>
      <div className="p-4 rounded-xl bg-primary/20">
        <div className="text-2xl font-mono font-bold text-primary">
          {audioState.binauralFreq.toFixed(1)}
        </div>
        <div className="text-xs text-muted-foreground">ضربان مغزی (Hz)</div>
        <div className="text-xs text-primary mt-1">{waveInfo.name}</div>
      </div>
      <div className="p-4 rounded-xl bg-card/50">
        <div className="text-2xl font-mono font-bold text-primary">
          {audioState.rightFreq.toFixed(1)}
        </div>
        <div className="text-xs text-muted-foreground">گوش راست (Hz)</div>
      </div>
    </div>
  );
};

// Audio Visualizer Component
const AudioVisualizer: React.FC<{ isActive: boolean; mode: TherapyMode }> = ({ isActive, mode }) => {
  const bars = 24;

  const getBarColor = () => {
    switch (mode) {
      case 'anxiety':
        return 'bg-gradient-to-t from-blue-600 to-cyan-400';
      case 'balanced':
        return 'bg-gradient-to-t from-purple-600 to-violet-400';
      case 'depression':
        return 'bg-gradient-to-t from-orange-600 to-amber-400';
    }
  };

  const getAnimationSpeed = () => {
    switch (mode) {
      case 'anxiety':
        return '3s';
      case 'balanced':
        return '2s';
      case 'depression':
        return '1s';
    }
  };

  return (
    <div className="flex items-end justify-center gap-1 h-24">
      {[...Array(bars)].map((_, i) => (
        <div
          key={i}
          className={`w-2 rounded-t ${getBarColor()} ${isActive ? 'audio-bar' : 'opacity-30'}`}
          style={{
            height: isActive ? `${20 + Math.sin(i * 0.5) * 30 + 30}%` : '20%',
            animationDelay: `${i * 0.1}s`,
            animationDuration: getAnimationSpeed()
          }}
        />
      ))}
    </div>
  );
};

// Mode Indicator Component
const ModeIndicator: React.FC<{ mode: TherapyMode }> = ({ mode }) => {
  const getModeInfo = () => {
    switch (mode) {
      case 'anxiety':
        return {
          icon: Moon,
          title: 'درمان اضطراب',
          subtitle: 'امواج تتا برای آرامش عمیق',
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/20'
        };
      case 'balanced':
        return {
          icon: Sparkles,
          title: 'حالت متعادل',
          subtitle: 'امواج آلفا برای تعادل ذهنی',
          color: 'text-violet-400',
          bg: 'bg-violet-500/20'
        };
      case 'depression':
        return {
          icon: Sun,
          title: 'درمان افسردگی',
          subtitle: 'امواج بتا برای انرژی و هوشیاری',
          color: 'text-amber-400',
          bg: 'bg-amber-500/20'
        };
    }
  };

  const info = getModeInfo();
  const Icon = info.icon;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl ${info.bg}`}>
      <Icon className={`w-8 h-8 ${info.color}`} />
      <div>
        <div className={`font-bold ${info.color}`}>{info.title}</div>
        <div className="text-sm text-muted-foreground">{info.subtitle}</div>
      </div>
    </div>
  );
};

export default function SoulResonancePage() {
  const { toast } = useToast();
  const audioContextRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    volume: 0.3,
    leftFreq: BASE_FREQ,
    rightFreq: BASE_FREQ + 10,
    binauralFreq: 10
  });

  const [therapySettings, setTherapySettings] = useState<TherapySettings>({
    mode: 'balanced',
    intensity: 0
  });

  const [currentEmotion, setCurrentEmotion] = useState<EmotionPrediction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  const signalLoopRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate frequencies based on therapy mode
  const calculateFrequencies = useCallback((mode: TherapyMode, intensity: number) => {
    let binauralFreq: number;
    
    switch (mode) {
      case 'anxiety':
        // Theta waves (4-8 Hz) for deep relaxation
        binauralFreq = THETA_RANGE.min + (THETA_RANGE.max - THETA_RANGE.min) * (1 - Math.abs(intensity) / 100);
        break;
      case 'depression':
        // Beta waves (15-30 Hz) for alertness
        binauralFreq = BETA_RANGE.min + (BETA_RANGE.max - BETA_RANGE.min) * (Math.abs(intensity) / 100);
        break;
      default:
        // Alpha waves (8-13 Hz) for balance
        binauralFreq = ALPHA_RANGE.min + (ALPHA_RANGE.max - ALPHA_RANGE.min) * 0.5;
    }

    const leftFreq = BASE_FREQ;
    const rightFreq = BASE_FREQ + binauralFreq;

    return { leftFreq, rightFreq, binauralFreq };
  }, []);

  // Update audio frequencies
  const updateAudioFrequencies = useCallback((mode: TherapyMode, intensity: number) => {
    const { leftFreq, rightFreq, binauralFreq } = calculateFrequencies(mode, intensity);

    if (leftOscRef.current && rightOscRef.current) {
      leftOscRef.current.frequency.setTargetAtTime(leftFreq, audioContextRef.current!.currentTime, 0.5);
      rightOscRef.current.frequency.setTargetAtTime(rightFreq, audioContextRef.current!.currentTime, 0.5);
    }

    setAudioState(prev => ({
      ...prev,
      leftFreq,
      rightFreq,
      binauralFreq
    }));
  }, [calculateFrequencies]);

  // Initialize Web Audio API
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;

    // Create stereo panner for left channel
    const leftPanner = ctx.createStereoPanner();
    leftPanner.pan.value = -1;

    // Create stereo panner for right channel
    const rightPanner = ctx.createStereoPanner();
    rightPanner.pan.value = 1;

    // Create oscillators
    leftOscRef.current = ctx.createOscillator();
    rightOscRef.current = ctx.createOscillator();

    leftOscRef.current.type = 'sine';
    rightOscRef.current.type = 'sine';

    const { leftFreq, rightFreq, binauralFreq } = calculateFrequencies(
      therapySettings.mode, 
      therapySettings.intensity
    );

    leftOscRef.current.frequency.value = leftFreq;
    rightOscRef.current.frequency.value = rightFreq;

    // Create gain node for volume control
    gainNodeRef.current = ctx.createGain();
    gainNodeRef.current.gain.value = audioState.volume;

    // Connect nodes
    leftOscRef.current.connect(leftPanner);
    rightOscRef.current.connect(rightPanner);
    leftPanner.connect(gainNodeRef.current);
    rightPanner.connect(gainNodeRef.current);
    gainNodeRef.current.connect(ctx.destination);

    // Start oscillators
    leftOscRef.current.start();
    rightOscRef.current.start();

    setAudioState(prev => ({
      ...prev,
      isPlaying: true,
      leftFreq,
      rightFreq,
      binauralFreq
    }));

  }, [calculateFrequencies, therapySettings, audioState.volume]);

  // Stop audio
  const stopAudio = useCallback(() => {
    if (leftOscRef.current) {
      leftOscRef.current.stop();
      leftOscRef.current = null;
    }
    if (rightOscRef.current) {
      rightOscRef.current.stop();
      rightOscRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current = null;
    }

    setAudioState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (audioState.isPlaying) {
      stopAudio();
      toast({
        title: '⏸️ درمان متوقف شد',
        description: 'جلسه موسیقی‌درمانی متوقف شد',
      });
    } else {
      initAudio();
      toast({
        title: '🎵 درمان شروع شد',
        description: 'برای بهترین نتیجه از هدفون استفاده کنید',
      });
    }
  }, [audioState.isPlaying, initAudio, stopAudio, toast]);

  // Update volume
  const updateVolume = useCallback((newVolume: number) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(newVolume, audioContextRef.current!.currentTime, 0.1);
    }
    setAudioState(prev => ({ ...prev, volume: newVolume }));
  }, []);

  // Handle intensity slider change
  const handleIntensityChange = useCallback((value: number[]) => {
    const intensity = value[0];
    let mode: TherapyMode;

    if (intensity < -30) {
      mode = 'anxiety';
    } else if (intensity > 30) {
      mode = 'depression';
    } else {
      mode = 'balanced';
    }

    setTherapySettings({ mode, intensity });
    updateAudioFrequencies(mode, intensity);
  }, [updateAudioFrequencies]);

  // Process brain signal
  const processSignal = useCallback(async () => {
    if (!audioState.isPlaying) return;

    setIsProcessing(true);

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

      // Auto-adjust therapy based on detected emotion
      if (prediction.emotion === 'sad') {
        // Detected stress/anxiety - switch to calming mode
        handleIntensityChange([-70]);
      } else if (prediction.emotion === 'happy') {
        // Detected positive state - balanced mode
        handleIntensityChange([0]);
      } else {
        // Neutral - could be low energy
        handleIntensityChange([50]);
      }

    } catch (error) {
      console.error('Signal processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [audioState.isPlaying, handleIntensityChange]);

  // Session timer
  useEffect(() => {
    if (audioState.isPlaying) {
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [audioState.isPlaying]);

  // Signal processing loop
  useEffect(() => {
    if (audioState.isPlaying) {
      signalLoopRef.current = setInterval(() => {
        processSignal();
      }, 5000);
    } else {
      if (signalLoopRef.current) {
        clearInterval(signalLoopRef.current);
      }
    }

    return () => {
      if (signalLoopRef.current) {
        clearInterval(signalLoopRef.current);
      }
    };
  }, [audioState.isPlaying, processSignal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAudio]);

  // Format session time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Get theme class based on mode
  const getThemeClass = () => {
    switch (therapySettings.mode) {
      case 'anxiety':
        return 'soul-anxiety';
      case 'balanced':
        return 'soul-balanced';
      case 'depression':
        return 'soul-depression';
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-2000 ${getThemeClass()}`}>
      {/* Header */}
      <header className="border-b bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-rose-400">طنین روح</h1>
              <p className="text-xs text-muted-foreground">Soul Resonance - موسیقی‌درمانی تطبیق‌پذیر</p>
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
          
          {/* Main Therapy Area */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-6 w-6 text-rose-500" />
                  امواج دوگوشی (Binaural Beats)
                </CardTitle>
                <CardDescription>
                  برای بهترین نتیجه از هدفون استفاده کنید
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Breathing Circle */}
                <BreathingCircle 
                  mode={therapySettings.mode} 
                  isActive={audioState.isPlaying} 
                />

                {/* Audio Visualizer */}
                <AudioVisualizer 
                  isActive={audioState.isPlaying} 
                  mode={therapySettings.mode} 
                />

                {/* Frequency Display */}
                <FrequencyDisplay 
                  audioState={audioState} 
                  mode={therapySettings.mode} 
                />

                {/* Intensity Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Moon className="w-5 h-5" />
                      <span className="text-sm">اضطراب/PTSD</span>
                    </div>
                    <div className="flex items-center gap-2 text-amber-400">
                      <span className="text-sm">افسردگی/کم‌انرژی</span>
                      <Sun className="w-5 h-5" />
                    </div>
                  </div>
                  <Slider
                    value={[therapySettings.intensity]}
                    onValueChange={handleIntensityChange}
                    min={-100}
                    max={100}
                    step={1}
                    className="therapy-slider"
                  />
                  <div className="text-center text-sm text-muted-foreground">
                    اسلایدر را به سمت نیاز خود حرکت دهید
                  </div>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-4">
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                  <Slider
                    value={[audioState.volume * 100]}
                    onValueChange={(v) => updateVolume(v[0] / 100)}
                    min={0}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <Volume2 className="w-5 h-5 text-muted-foreground" />
                </div>

                {/* Play/Pause Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={toggleAudio}
                    size="lg"
                    className={`gap-3 text-lg px-8 py-6 ${
                      audioState.isPlaying 
                        ? 'bg-rose-600 hover:bg-rose-700' 
                        : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600'
                    }`}
                  >
                    {audioState.isPlaying ? (
                      <>
                        <Pause className="h-6 w-6" />
                        توقف درمان
                      </>
                    ) : (
                      <>
                        <Play className="h-6 w-6" />
                        شروع درمان
                      </>
                    )}
                  </Button>
                </div>

                {/* Session Time */}
                {audioState.isPlaying && (
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">مدت جلسه</div>
                    <div className="text-2xl font-mono font-bold text-primary">
                      {formatTime(sessionTime)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Current Mode */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-rose-500" />
                  حالت درمان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ModeIndicator mode={therapySettings.mode} />
                
                {isProcessing && (
                  <div className="mt-3 text-sm text-muted-foreground animate-pulse text-center">
                    در حال تحلیل سیگنال مغزی...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Brain State */}
            {currentEmotion && (
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="h-5 w-5 text-purple-500" />
                    وضعیت ذهنی تشخیص داده شده
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
                        {currentEmotion.emotion === 'happy' ? 'آرام و مثبت' :
                         currentEmotion.emotion === 'sad' ? 'استرس/اضطراب' : 'خنثی/کم‌انرژی'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        سیستم در حال تنظیم خودکار...
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scientific Info */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  مبانی علمی
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="p-3 rounded-lg bg-cyan-500/10">
                  <div className="font-medium text-cyan-400">امواج تتا (4-8 Hz)</div>
                  <p className="text-muted-foreground">
                    خواب عمیق و مدیتیشن. کاهش ضربان قلب و اضطراب.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-violet-500/10">
                  <div className="font-medium text-violet-400">امواج آلفا (8-13 Hz)</div>
                  <p className="text-muted-foreground">
                    آرامش و خلاقیت. تعادل بین هوشیاری و استراحت.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10">
                  <div className="font-medium text-amber-400">امواج بتا (15-30 Hz)</div>
                  <p className="text-muted-foreground">
                    هوشیاری و تمرکز. مناسب برای افسردگی و کم‌انرژی.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                  نکات مهم
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>🎧 حتماً از هدفون استفاده کنید</p>
                <p>🧘 در محیط آرام بنشینید</p>
                <p>👁️ چشمان خود را ببندید</p>
                <p>🌬️ با ریتم دایره نفس بکشید</p>
                <p>⏱️ حداقل ۱۵ دقیقه گوش دهید</p>
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
              <span>برای سلامت ذهن</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Soul Resonance © 2024
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
