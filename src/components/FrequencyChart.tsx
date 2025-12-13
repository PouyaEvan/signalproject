'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BandPowers } from '@/lib/signal-processing';
import { BarChart3 } from 'lucide-react';

interface FrequencyBandsChartProps {
  bandPowers: BandPowers;
  title?: string;
}

const bandInfo = [
  { key: 'delta', label: 'Delta (0.5-4 Hz)', color: '#ef4444', description: 'Deep Sleep' },
  { key: 'theta', label: 'Theta (4-8 Hz)', color: '#f97316', description: 'Drowsy' },
  { key: 'alpha', label: 'Alpha (8-13 Hz)', color: '#22c55e', description: 'Relaxed' },
  { key: 'beta', label: 'Beta (13-30 Hz)', color: '#3b82f6', description: 'Active' },
  { key: 'gamma', label: 'Gamma (30-45 Hz)', color: '#a855f7', description: 'Focused' },
];

export function FrequencyBandsChart({ bandPowers, title = 'Frequency Band Powers' }: FrequencyBandsChartProps) {
  // Find max for normalization
  const powers = [bandPowers.delta, bandPowers.theta, bandPowers.alpha, bandPowers.beta, bandPowers.gamma];
  const maxPower = Math.max(...powers, 0.001);

  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bandInfo.map((band, index) => {
          const power = powers[index];
          const percentage = (power / maxPower) * 100;

          return (
            <div key={band.key} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{band.label}</span>
                <span className="text-xs text-muted-foreground">{band.description}</span>
              </div>
              <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: band.color,
                    boxShadow: `0 0 10px ${band.color}50`
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {(power * 100).toFixed(2)} μV²
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// Circular frequency visualization
export function FrequencyCircleChart({ bandPowers }: FrequencyBandsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 200;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const maxRadius = size / 2 - 20;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Normalize powers
    const powers = [bandPowers.delta, bandPowers.theta, bandPowers.alpha, bandPowers.beta, bandPowers.gamma];
    const maxPower = Math.max(...powers, 0.001);
    const normalizedPowers = powers.map(p => (p / maxPower) * maxRadius);

    // Draw circles
    const colors = ['#ef4444', '#f97316', '#22c55e', '#3b82f6', '#a855f7'];

    for (let i = 0; i < powers.length; i++) {
      const startAngle = (i / powers.length) * 2 * Math.PI - Math.PI / 2;
      const endAngle = ((i + 1) / powers.length) * 2 * Math.PI - Math.PI / 2;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, normalizedPowers[i], startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = colors[i] + '80';
      ctx.fill();

      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#1f2937';
    ctx.fill();
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [bandPowers]);

  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Brain Wave Spectrum</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <canvas
          ref={canvasRef}
          style={{ width: 200, height: 200 }}
        />
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {bandInfo.map((band) => (
            <div key={band.key} className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: band.color }}
              />
              <span className="text-xs">{band.key.charAt(0).toUpperCase() + band.key.slice(1)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
