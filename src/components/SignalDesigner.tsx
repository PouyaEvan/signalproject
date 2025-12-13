'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomSignalParams } from '@/lib/signal-generator';
import { Brain, Zap, Activity, Moon, Sun, Sparkles, Play, RotateCcw } from 'lucide-react';

interface SignalDesignerProps {
  onGenerateSignal: (params: CustomSignalParams, duration: number) => void;
}

export function SignalDesigner({ onGenerateSignal }: SignalDesignerProps) {
  const [params, setParams] = useState<CustomSignalParams>({
    alpha: 0.5,
    beta: 0.5,
    theta: 0.3,
    delta: 0.2,
    gamma: 0.3,
    noiseLevel: 0.2,
    powerNoiseFreq: 50,
    powerNoiseLevel: 0.25,
  });

  const [duration, setDuration] = useState(10);

  const handleSliderChange = (key: keyof CustomSignalParams, value: number[]) => {
    setParams(prev => ({ ...prev, [key]: value[0] }));
  };

  const handleReset = () => {
    setParams({
      alpha: 0.5,
      beta: 0.5,
      theta: 0.3,
      delta: 0.2,
      gamma: 0.3,
      noiseLevel: 0.2,
      powerNoiseFreq: 50,
      powerNoiseLevel: 0.25,
    });
    setDuration(10);
  };

  const handleGenerate = () => {
    onGenerateSignal(params, duration);
  };

  // Preset configurations
  const applyPreset = (preset: 'relaxed' | 'focused' | 'sleepy' | 'excited') => {
    const presets: Record<string, Partial<CustomSignalParams>> = {
      relaxed: { alpha: 0.9, beta: 0.3, theta: 0.4, delta: 0.2, gamma: 0.2 },
      focused: { alpha: 0.4, beta: 0.8, theta: 0.2, delta: 0.1, gamma: 0.7 },
      sleepy: { alpha: 0.3, beta: 0.1, theta: 0.8, delta: 0.9, gamma: 0.1 },
      excited: { alpha: 0.7, beta: 0.9, theta: 0.2, delta: 0.1, gamma: 0.6 },
    };
    setParams(prev => ({ ...prev, ...presets[preset] }));
  };

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          Signal Designer
        </CardTitle>
        <CardDescription>
          Design your own brain signal by adjusting wave components
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Presets */}
        <div className="space-y-2">
          <Label>Quick Presets</Label>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => applyPreset('relaxed')}>
              <Sun className="h-4 w-4 mr-1" />
              Relaxed
            </Button>
            <Button size="sm" variant="outline" onClick={() => applyPreset('focused')}>
              <Zap className="h-4 w-4 mr-1" />
              Focused
            </Button>
            <Button size="sm" variant="outline" onClick={() => applyPreset('sleepy')}>
              <Moon className="h-4 w-4 mr-1" />
              Sleepy
            </Button>
            <Button size="sm" variant="outline" onClick={() => applyPreset('excited')}>
              <Sparkles className="h-4 w-4 mr-1" />
              Excited
            </Button>
          </div>
        </div>

        {/* Wave Components */}
        <div className="space-y-4">
          <Label className="text-base">Brain Wave Components</Label>
          
          {/* Delta */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                Delta (0.5-4 Hz) - Deep Sleep
              </Label>
              <span className="text-sm text-muted-foreground">{(params.delta * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.delta]}
              max={1}
              step={0.01}
              onValueChange={(v) => handleSliderChange('delta', v)}
              className="[&>span]:bg-red-500"
            />
          </div>

          {/* Theta */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                Theta (4-8 Hz) - Drowsiness
              </Label>
              <span className="text-sm text-muted-foreground">{(params.theta * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.theta]}
              max={1}
              step={0.01}
              onValueChange={(v) => handleSliderChange('theta', v)}
              className="[&>span]:bg-orange-500"
            />
          </div>

          {/* Alpha */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                Alpha (8-13 Hz) - Relaxation
              </Label>
              <span className="text-sm text-muted-foreground">{(params.alpha * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.alpha]}
              max={1}
              step={0.01}
              onValueChange={(v) => handleSliderChange('alpha', v)}
              className="[&>span]:bg-green-500"
            />
          </div>

          {/* Beta */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                Beta (13-30 Hz) - Active Thinking
              </Label>
              <span className="text-sm text-muted-foreground">{(params.beta * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.beta]}
              max={1}
              step={0.01}
              onValueChange={(v) => handleSliderChange('beta', v)}
              className="[&>span]:bg-blue-500"
            />
          </div>

          {/* Gamma */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                Gamma (30-100 Hz) - High Cognition
              </Label>
              <span className="text-sm text-muted-foreground">{(params.gamma * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.gamma]}
              max={1}
              step={0.01}
              onValueChange={(v) => handleSliderChange('gamma', v)}
              className="[&>span]:bg-purple-500"
            />
          </div>
        </div>

        {/* Noise Settings */}
        <div className="space-y-4">
          <Label className="text-base">Noise Configuration</Label>
          
          {/* Random Noise */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Random Noise Level</Label>
              <span className="text-sm text-muted-foreground">{(params.noiseLevel * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.noiseLevel]}
              max={1}
              step={0.01}
              onValueChange={(v) => handleSliderChange('noiseLevel', v)}
            />
          </div>

          {/* Power Line Noise */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Power Line Noise ({params.powerNoiseFreq} Hz)</Label>
              <span className="text-sm text-muted-foreground">{(params.powerNoiseLevel * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[params.powerNoiseLevel]}
              max={1}
              step={0.01}
              onValueChange={(v) => handleSliderChange('powerNoiseLevel', v)}
            />
          </div>

          {/* Power Line Frequency */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Power Line Frequency</Label>
            <Select
              value={String(params.powerNoiseFreq)}
              onValueChange={(v) => setParams(prev => ({ ...prev, powerNoiseFreq: Number(v) as 50 | 60 }))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 Hz</SelectItem>
                <SelectItem value="60">60 Hz</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-sm">Signal Duration</Label>
            <span className="text-sm text-muted-foreground">{duration} seconds</span>
          </div>
          <Slider
            value={[duration]}
            min={1}
            max={30}
            step={1}
            onValueChange={(v) => setDuration(v[0])}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleGenerate} className="flex-1">
            <Play className="h-4 w-4 mr-2" />
            Generate Signal
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
