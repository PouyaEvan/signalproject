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
import { predictEmotion, EmotionPrediction } from '@/lib/emotion-classifier';
import { useToast } from '@/components/ui/use-toast';
import {
  Brain,
  BookOpen,
  Timer,
  Home,
  Play,
  Pause,
  RotateCcw,
  Heart,
  Sparkles,
  Zap,
  Coffee,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trophy,
  Target,
  TrendingUp,
  Music,
  Volume2
} from 'lucide-react';
import Link from 'next/link';

// Mental state types
type MentalState = 'stressed' | 'flow' | 'bored';
type Difficulty = 'easy' | 'medium' | 'hard' | 'bonus';

interface Question {
  id: number;
  question: string;
  answer: number;
  options: number[];
  difficulty: Difficulty;
}

interface GameStats {
  correct: number;
  incorrect: number;
  streak: number;
  maxStreak: number;
  score: number;
  questionsAnswered: number;
}

// Generate math questions based on difficulty
const generateQuestion = (difficulty: Difficulty): Question => {
  const id = Date.now();
  let a: number, b: number, answer: number, question: string;
  
  switch (difficulty) {
    case 'easy':
      // Simple addition
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      answer = a + b;
      question = `${a} + ${b} = ?`;
      break;
    case 'medium':
      // Multiplication or subtraction
      if (Math.random() > 0.5) {
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
        answer = a * b;
        question = `${a} × ${b} = ?`;
      } else {
        a = Math.floor(Math.random() * 50) + 20;
        b = Math.floor(Math.random() * 20) + 1;
        answer = a - b;
        question = `${a} - ${b} = ?`;
      }
      break;
    case 'hard':
      // Complex operations
      const ops = ['multiply-add', 'divide', 'square'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      if (op === 'multiply-add') {
        a = Math.floor(Math.random() * 10) + 2;
        b = Math.floor(Math.random() * 10) + 2;
        const c = Math.floor(Math.random() * 10) + 1;
        answer = a * b + c;
        question = `(${a} × ${b}) + ${c} = ?`;
      } else if (op === 'divide') {
        b = Math.floor(Math.random() * 10) + 2;
        answer = Math.floor(Math.random() * 15) + 2;
        a = b * answer;
        question = `${a} ÷ ${b} = ?`;
      } else {
        a = Math.floor(Math.random() * 12) + 2;
        answer = a * a;
        question = `${a}² = ?`;
      }
      break;
    case 'bonus':
      // Bonus round - challenging but fun
      a = Math.floor(Math.random() * 15) + 5;
      b = Math.floor(Math.random() * 15) + 5;
      const c = Math.floor(Math.random() * 10) + 1;
      answer = a * b - c;
      question = `🏆 BONUS: (${a} × ${b}) - ${c} = ?`;
      break;
    default:
      a = 1; b = 1; answer = 2; question = '1 + 1 = ?';
  }
  
  // Generate wrong options
  const options = [answer];
  while (options.length < 4) {
    const offset = Math.floor(Math.random() * 20) - 10;
    const wrongAnswer = answer + offset;
    if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  // Shuffle options
  options.sort(() => Math.random() - 0.5);
  
  return { id, question, answer, options, difficulty };
};

// Mental State Indicator Component
const MentalStateIndicator: React.FC<{ state: MentalState }> = ({ state }) => {
  const getStateInfo = () => {
    switch (state) {
      case 'stressed':
        return {
          icon: AlertTriangle,
          label: 'استرس / خستگی',
          sublabel: 'آرام باش، سوالات ساده‌تر شدن',
          color: 'text-blue-400',
          bg: 'bg-blue-500/20'
        };
      case 'flow':
        return {
          icon: Zap,
          label: 'ناحیه جریان',
          sublabel: 'عالی! در بهترین حالتی',
          color: 'text-green-400',
          bg: 'bg-green-500/20'
        };
      case 'bored':
        return {
          icon: Coffee,
          label: 'بی‌حوصلگی',
          sublabel: 'بیدار شو! چالش بیشتر!',
          color: 'text-orange-400',
          bg: 'bg-orange-500/20'
        };
    }
  };
  
  const info = getStateInfo();
  const Icon = info.icon;
  
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl ${info.bg}`}>
      <Icon className={`w-8 h-8 ${info.color}`} />
      <div>
        <div className={`font-bold ${info.color}`}>{info.label}</div>
        <div className="text-sm text-muted-foreground">{info.sublabel}</div>
      </div>
    </div>
  );
};

// Music Visualizer Component
const MusicVisualizer: React.FC<{ state: MentalState }> = ({ state }) => {
  const bars = 12;
  
  const getAnimationClass = () => {
    switch (state) {
      case 'stressed':
        return 'visualizer-slow';
      case 'flow':
        return 'visualizer-medium';
      case 'bored':
        return 'visualizer-fast';
    }
  };
  
  const getBarColor = () => {
    switch (state) {
      case 'stressed':
        return 'bg-blue-400';
      case 'flow':
        return 'bg-green-400';
      case 'bored':
        return 'bg-orange-400';
    }
  };
  
  return (
    <div className="flex items-end justify-center gap-1 h-16">
      {[...Array(bars)].map((_, i) => (
        <div
          key={i}
          className={`w-2 rounded-t ${getBarColor()} ${getAnimationClass()}`}
          style={{
            animationDelay: `${i * 0.1}s`,
            height: `${20 + Math.random() * 40}%`
          }}
        />
      ))}
    </div>
  );
};

// Timer Component
const TimerDisplay: React.FC<{ seconds: number; isActive: boolean; state: MentalState }> = ({ 
  seconds, 
  isActive,
  state 
}) => {
  if (state === 'stressed') {
    return (
      <div className="flex items-center gap-2 text-blue-400">
        <Timer className="w-5 h-5" />
        <span className="text-lg">بدون محدودیت زمانی</span>
        <span className="text-sm text-muted-foreground">(حالت آرام)</span>
      </div>
    );
  }
  
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  return (
    <div className={`flex items-center gap-2 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
      <Timer className="w-5 h-5" />
      <span className="text-2xl font-mono">
        {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
};

export default function NeuroTutorPage() {
  const { toast } = useToast();
  
  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [mentalState, setMentalState] = useState<MentalState>('flow');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState(0);
  const [stats, setStats] = useState<GameStats>({
    correct: 0,
    incorrect: 0,
    streak: 0,
    maxStreak: 0,
    score: 0,
    questionsAnswered: 0
  });
  const [currentEmotion, setCurrentEmotion] = useState<EmotionPrediction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get difficulty based on mental state
  const getDifficultyForState = useCallback((): Difficulty => {
    switch (mentalState) {
      case 'stressed':
        return 'easy';
      case 'flow':
        return 'medium';
      case 'bored':
        return Math.random() > 0.3 ? 'hard' : 'bonus';
    }
  }, [mentalState]);

  // Process brain signal
  const processSignal = useCallback(async () => {
    if (!isPlaying) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate brain signal based on performance and randomness
      const signalTypes = ['happy', 'neutral', 'sad'] as const;
      let selectedType: typeof signalTypes[number];
      
      // Use performance to influence emotion detection
      const recentPerformance = stats.streak > 2 ? 0.7 : stats.streak > 0 ? 0.5 : 0.3;
      const random = Math.random();
      
      if (random < recentPerformance * 0.6) {
        selectedType = 'happy'; // Flow state
      } else if (random < recentPerformance * 0.6 + 0.25) {
        selectedType = 'neutral'; // Could be bored
      } else {
        selectedType = 'sad'; // Stressed
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
      
      const prediction = await predictEmotion(signal.data, signal.sampleRate);
      setCurrentEmotion(prediction);
      
      // Map emotion to mental state
      let newState: MentalState;
      if (prediction.emotion === 'sad') {
        newState = 'stressed';
      } else if (prediction.emotion === 'happy') {
        newState = 'flow';
      } else {
        // Neutral could be bored if streak is low
        newState = stats.streak < 1 ? 'bored' : 'flow';
      }
      
      if (newState !== mentalState) {
        setMentalState(newState);
        
        // Notify user of state change
        const messages = {
          stressed: { title: '😌 حالت آرام فعال شد', desc: 'سوالات ساده‌تر شدن، نفس عمیق بکش' },
          flow: { title: '🚀 در ناحیه جریان هستی!', desc: 'عالی! ادامه بده' },
          bored: { title: '⚡ چالش بیشتر!', desc: 'وقتشه بیدار بشی!' }
        };
        
        toast({
          title: messages[newState].title,
          description: messages[newState].desc,
        });
      }
      
    } catch (error) {
      console.error('Signal processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isPlaying, mentalState, stats.streak, toast]);

  // Generate new question
  const generateNewQuestion = useCallback(() => {
    const difficulty = getDifficultyForState();
    const question = generateQuestion(difficulty);
    setCurrentQuestion(question);
    setSelectedAnswer(null);
    setShowResult(false);
  }, [getDifficultyForState]);

  // Handle answer selection
  const handleAnswer = useCallback((answer: number) => {
    if (showResult || !currentQuestion) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const isCorrect = answer === currentQuestion.answer;
    
    setStats(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const bonusMultiplier = currentQuestion.difficulty === 'bonus' ? 3 : 
                              currentQuestion.difficulty === 'hard' ? 2 : 1;
      const scoreGain = isCorrect ? 10 * bonusMultiplier * (1 + newStreak * 0.1) : 0;
      
      return {
        correct: prev.correct + (isCorrect ? 1 : 0),
        incorrect: prev.incorrect + (isCorrect ? 0 : 1),
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        score: Math.round(prev.score + scoreGain),
        questionsAnswered: prev.questionsAnswered + 1
      };
    });
    
    // Show next question after delay
    setTimeout(() => {
      generateNewQuestion();
    }, 1500);
  }, [showResult, currentQuestion, generateNewQuestion]);

  // Timer effect
  useEffect(() => {
    if (isPlaying && mentalState !== 'stressed') {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, mentalState]);

  // Brain signal processing loop
  useEffect(() => {
    if (isPlaying) {
      gameLoopRef.current = setInterval(() => {
        processSignal();
      }, 3000);
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
  }, [isPlaying, processSignal]);

  // Start game
  const startGame = () => {
    setIsPlaying(true);
    setTimer(0);
    setStats({
      correct: 0,
      incorrect: 0,
      streak: 0,
      maxStreak: 0,
      score: 0,
      questionsAnswered: 0
    });
    setMentalState('flow');
    generateNewQuestion();
    
    toast({
      title: '📚 شروع آزمون!',
      description: 'سعی کن در ناحیه جریان بمونی',
    });
  };

  // Pause game
  const pauseGame = () => {
    setIsPlaying(false);
  };

  // Reset game
  const resetGame = () => {
    setIsPlaying(false);
    setCurrentQuestion(null);
    setTimer(0);
    setStats({
      correct: 0,
      incorrect: 0,
      streak: 0,
      maxStreak: 0,
      score: 0,
      questionsAnswered: 0
    });
    setMentalState('flow');
    setCurrentEmotion(null);
    
    toast({
      title: 'بازی ریست شد',
      description: 'دوباره شروع کن!',
    });
  };

  // Get theme class based on mental state
  const getThemeClass = () => {
    switch (mentalState) {
      case 'stressed':
        return 'neuro-stressed';
      case 'flow':
        return 'neuro-flow';
      case 'bored':
        return 'neuro-bored';
    }
  };

  // Get button style based on answer state
  const getButtonStyle = (option: number) => {
    if (!showResult) {
      return 'border-border hover:border-primary hover:bg-primary/10';
    }
    
    if (option === currentQuestion?.answer) {
      return 'border-green-500 bg-green-500/20 text-green-400';
    }
    
    if (option === selectedAnswer && option !== currentQuestion?.answer) {
      return 'border-red-500 bg-red-500/20 text-red-400';
    }
    
    return 'border-border opacity-50';
  };

  return (
    <div className={`min-h-screen transition-all duration-1000 ${getThemeClass()}`}>
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-purple-400">نورو توتور</h1>
              <p className="text-xs text-muted-foreground">NeuroTutor - معلم تطبیق‌پذیر</p>
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
          
          {/* Question Area */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-6 w-6 text-purple-500" />
                    آزمون ریاضی
                  </CardTitle>
                  <TimerDisplay seconds={timer} isActive={isPlaying} state={mentalState} />
                </div>
                <CardDescription>
                  سوالات بر اساس وضعیت ذهنی شما تنظیم می‌شوند
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isPlaying && !currentQuestion ? (
                  // Start screen
                  <div className="text-center py-12 space-y-6">
                    <div className="w-24 h-24 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Brain className="w-12 h-12 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">به نورو توتور خوش آمدید!</h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        این سیستم سوالات را بر اساس وضعیت ذهنی شما تنظیم می‌کند.
                        سعی کنید در "ناحیه جریان" باقی بمانید.
                      </p>
                    </div>
                    <Button onClick={startGame} size="lg" className="gap-2 bg-purple-600 hover:bg-purple-700">
                      <Play className="h-5 w-5" />
                      شروع آزمون
                    </Button>
                  </div>
                ) : currentQuestion ? (
                  // Question display
                  <div className="space-y-8">
                    {/* Difficulty indicator */}
                    <div className="flex justify-center">
                      <span className={`px-4 py-1 rounded-full text-sm font-medium ${
                        currentQuestion.difficulty === 'easy' ? 'bg-blue-500/20 text-blue-400' :
                        currentQuestion.difficulty === 'medium' ? 'bg-green-500/20 text-green-400' :
                        currentQuestion.difficulty === 'hard' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {currentQuestion.difficulty === 'easy' ? '🌱 ساده' :
                         currentQuestion.difficulty === 'medium' ? '🌿 متوسط' :
                         currentQuestion.difficulty === 'hard' ? '🌳 سخت' :
                         '🏆 جایزه‌دار'}
                      </span>
                    </div>
                    
                    {/* Question */}
                    <div className="text-center py-8">
                      <div className={`text-4xl md:text-5xl font-bold ${
                        currentQuestion.difficulty === 'bonus' ? 'text-yellow-400' : ''
                      }`}>
                        {currentQuestion.question}
                      </div>
                    </div>
                    
                    {/* Options */}
                    <div className="grid grid-cols-2 gap-4">
                      {currentQuestion.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswer(option)}
                          disabled={showResult}
                          className={`p-6 text-2xl font-bold rounded-xl border-2 transition-all ${getButtonStyle(option)}`}
                        >
                          {option}
                          {showResult && option === currentQuestion.answer && (
                            <CheckCircle className="inline ml-2 w-6 h-6 text-green-400" />
                          )}
                          {showResult && option === selectedAnswer && option !== currentQuestion.answer && (
                            <XCircle className="inline ml-2 w-6 h-6 text-red-400" />
                          )}
                        </button>
                      ))}
                    </div>
                    
                    {/* Result message */}
                    {showResult && (
                      <div className={`text-center text-xl font-bold ${
                        selectedAnswer === currentQuestion.answer ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedAnswer === currentQuestion.answer ? '✅ آفرین! درست بود!' : '❌ اشتباه! سوال بعدی...'}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Game Controls */}
                {(isPlaying || currentQuestion) && (
                  <div className="flex justify-center gap-4 mt-8 pt-6 border-t">
                    {isPlaying ? (
                      <Button onClick={pauseGame} variant="secondary" className="gap-2">
                        <Pause className="h-4 w-4" />
                        توقف
                      </Button>
                    ) : (
                      <Button onClick={() => setIsPlaying(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
                        <Play className="h-4 w-4" />
                        ادامه
                      </Button>
                    )}
                    <Button onClick={resetGame} variant="outline" className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      شروع مجدد
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats Panel */}
          <div className="space-y-6">
            {/* Mental State */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-purple-500" />
                  وضعیت ذهنی
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <MentalStateIndicator state={mentalState} />
                
                {/* Music Visualizer */}
                <div className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Volume2 className="w-4 h-4" />
                    <span>ریتم محیط</span>
                  </div>
                  <MusicVisualizer state={mentalState} />
                </div>
                
                {isProcessing && (
                  <div className="text-sm text-muted-foreground animate-pulse text-center">
                    در حال پردازش سیگنال مغزی...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  آمار عملکرد
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score */}
                <div className="text-center pb-4 border-b">
                  <div className="text-sm text-muted-foreground">امتیاز</div>
                  <div className="text-4xl font-bold text-purple-400">{stats.score}</div>
                </div>
                
                {/* Accuracy */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>دقت</span>
                    <span>
                      {stats.questionsAnswered > 0 
                        ? Math.round((stats.correct / stats.questionsAnswered) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={stats.questionsAnswered > 0 
                      ? (stats.correct / stats.questionsAnswered) * 100 
                      : 0} 
                    className="h-2"
                  />
                </div>
                
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 rounded-lg bg-green-500/10">
                    <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-green-400">{stats.correct}</div>
                    <div className="text-xs text-muted-foreground">درست</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-500/10">
                    <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-red-400">{stats.incorrect}</div>
                    <div className="text-xs text-muted-foreground">غلط</div>
                  </div>
                </div>
                
                {/* Streak */}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm">پشت سر هم</span>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="font-bold">{stats.streak}</span>
                    <span className="text-muted-foreground text-sm">(بیشترین: {stats.maxStreak})</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  راهنما
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mt-1" />
                  <div>
                    <span className="font-medium text-blue-400">آبی/سبز:</span>
                    <span className="text-muted-foreground"> حالت آرام، سوالات ساده</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1" />
                  <div>
                    <span className="font-medium text-green-400">سبز:</span>
                    <span className="text-muted-foreground"> ناحیه جریان، بهترین حالت</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mt-1" />
                  <div>
                    <span className="font-medium text-orange-400">نارنجی:</span>
                    <span className="text-muted-foreground"> بی‌حوصلگی، چالش بیشتر</span>
                  </div>
                </div>
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
              <span>برای پروژه سیگنال‌های مغزی</span>
            </div>
            <div className="text-sm text-muted-foreground">
              NeuroTutor © 2024
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
