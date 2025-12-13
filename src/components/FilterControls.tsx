'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Filter, 
  Waves, 
  Zap, 
  Settings2,
  Play,
  RotateCcw
} from 'lucide-react';

interface FilterControlsProps {
  onApplyFilters: (settings: FilterSettings) => void;
  isProcessing?: boolean;
}

export interface FilterSettings {
  applyBandpass: boolean;
  bandpassLow: number;
  bandpassHigh: number;
  applyNotch: boolean;
  notchFreq: 50 | 60;
  applyICA: boolean;
  icaThreshold: number;
}

export function FilterControls({ onApplyFilters, isProcessing }: FilterControlsProps) {
  const [settings, setSettings] = React.useState<FilterSettings>({
    applyBandpass: true,
    bandpassLow: 0.5,
    bandpassHigh: 45,
    applyNotch: true,
    notchFreq: 50,
    applyICA: true,
    icaThreshold: 3,
  });

  const handleReset = () => {
    setSettings({
      applyBandpass: true,
      bandpassLow: 0.5,
      bandpassHigh: 45,
      applyNotch: true,
      notchFreq: 50,
      applyICA: true,
      icaThreshold: 3,
    });
  };

  const handleApply = () => {
    onApplyFilters(settings);
  };

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-6 w-6 text-primary" />
          Signal Processing Controls
        </CardTitle>
        <CardDescription>
          Configure filters for noise removal and artifact rejection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bandpass Filter */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-blue-500" />
              <Label className="font-medium">Band-Pass Filter</Label>
            </div>
            <Switch
              checked={settings.applyBandpass}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, applyBandpass: checked }))
              }
            />
          </div>
          
          {settings.applyBandpass && (
            <div className="space-y-4 pl-7">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Low Cutoff</Label>
                  <span className="text-sm text-muted-foreground">{settings.bandpassLow} Hz</span>
                </div>
                <Slider
                  value={[settings.bandpassLow]}
                  min={0.1}
                  max={10}
                  step={0.1}
                  onValueChange={(v) => 
                    setSettings(prev => ({ ...prev, bandpassLow: v[0] }))
                  }
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">High Cutoff</Label>
                  <span className="text-sm text-muted-foreground">{settings.bandpassHigh} Hz</span>
                </div>
                <Slider
                  value={[settings.bandpassHigh]}
                  min={20}
                  max={100}
                  step={1}
                  onValueChange={(v) => 
                    setSettings(prev => ({ ...prev, bandpassHigh: v[0] }))
                  }
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                Removes frequencies outside {settings.bandpassLow}-{settings.bandpassHigh} Hz range
              </p>
            </div>
          )}
        </div>

        {/* Notch Filter */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <Label className="font-medium">Notch Filter (Power Line)</Label>
            </div>
            <Switch
              checked={settings.applyNotch}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, applyNotch: checked }))
              }
            />
          </div>
          
          {settings.applyNotch && (
            <div className="space-y-2 pl-7">
              <Label className="text-sm">Power Line Frequency</Label>
              <Select
                value={String(settings.notchFreq)}
                onValueChange={(v) => 
                  setSettings(prev => ({ ...prev, notchFreq: Number(v) as 50 | 60 }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 Hz (Europe, Asia)</SelectItem>
                  <SelectItem value="60">60 Hz (Americas)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Removes {settings.notchFreq} Hz electrical interference
              </p>
            </div>
          )}
        </div>

        {/* ICA Artifact Removal */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-green-500" />
              <Label className="font-medium">ICA Artifact Removal</Label>
            </div>
            <Switch
              checked={settings.applyICA}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, applyICA: checked }))
              }
            />
          </div>
          
          {settings.applyICA && (
            <div className="space-y-2 pl-7">
              <div className="flex justify-between">
                <Label className="text-sm">Artifact Threshold</Label>
                <span className="text-sm text-muted-foreground">{settings.icaThreshold}σ</span>
              </div>
              <Slider
                value={[settings.icaThreshold]}
                min={1}
                max={5}
                step={0.5}
                onValueChange={(v) => 
                  setSettings(prev => ({ ...prev, icaThreshold: v[0] }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Removes eye blinks, muscle artifacts, and other non-brain signals
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleApply} 
            className="flex-1"
            disabled={isProcessing}
          >
            <Play className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Apply Filters'}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Band-pass filter removes DC drift and high-frequency noise</p>
          <p>• Notch filter removes electrical power line interference</p>
          <p>• ICA removes eye blinks and muscle artifacts</p>
        </div>
      </CardContent>
    </Card>
  );
}
