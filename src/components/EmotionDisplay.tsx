'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { EmotionPrediction, getEmotionEmoji, getEmotionColor } from '@/lib/emotion-classifier';
import { Brain, Smile, Meh, Frown, TrendingUp } from 'lucide-react';

interface EmotionDisplayProps {
  prediction: EmotionPrediction | null;
  isProcessing?: boolean;
}

export function EmotionDisplay({ prediction, isProcessing }: EmotionDisplayProps) {
  if (isProcessing) {
    return (
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary animate-pulse" />
            Analyzing Emotion...
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/50 to-primary animate-pulse flex items-center justify-center">
            <Brain className="h-10 w-10 text-white animate-spin" />
          </div>
          <p className="mt-4 text-muted-foreground">Processing brain signals with LSTM...</p>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Emotion Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Meh className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="mt-4 text-muted-foreground">Select a signal to analyze emotion</p>
        </CardContent>
      </Card>
    );
  }

  const EmotionIcon = {
    happy: Smile,
    neutral: Meh,
    sad: Frown,
  }[prediction.emotion];

  const emotionColor = getEmotionColor(prediction.emotion);
  const emoji = getEmotionEmoji(prediction.emotion);

  return (
    <Card className="card-hover overflow-hidden">
      <div 
        className="h-2"
        style={{ backgroundColor: emotionColor }}
      />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          Emotion Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Emotion Display */}
        <div className="flex flex-col items-center py-4">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-5xl animate-pulse-glow"
            style={{ 
              backgroundColor: `${emotionColor}20`,
              border: `3px solid ${emotionColor}`
            }}
          >
            {emoji}
          </div>
          <h3 
            className="mt-4 text-2xl font-bold capitalize"
            style={{ color: emotionColor }}
          >
            {prediction.emotion}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>{(prediction.confidence * 100).toFixed(1)}% confidence</span>
          </div>
        </div>

        {/* Probability Bars */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Emotion Probabilities</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                <Smile className="h-4 w-4 text-green-500" />
                Happy
              </span>
              <span className="text-sm text-muted-foreground">
                {(prediction.probabilities.happy * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={prediction.probabilities.happy * 100} 
              className="h-2 [&>div]:bg-green-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                <Meh className="h-4 w-4 text-gray-500" />
                Neutral
              </span>
              <span className="text-sm text-muted-foreground">
                {(prediction.probabilities.neutral * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={prediction.probabilities.neutral * 100}
              className="h-2 [&>div]:bg-gray-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                <Frown className="h-4 w-4 text-red-500" />
                Sad
              </span>
              <span className="text-sm text-muted-foreground">
                {(prediction.probabilities.sad * 100).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={prediction.probabilities.sad * 100}
              className="h-2 [&>div]:bg-red-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
