'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface SignalChartProps {
  data: number[];
  title: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
}

export function SignalChart({
  data,
  title,
  color = '#8b5cf6',
  height = 200,
  showGrid = true
}: SignalChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.clearRect(0, 0, width, chartHeight);

    // Calculate signal bounds
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = range * 0.1;

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;

      // Horizontal lines
      for (let i = 0; i <= 4; i++) {
        const y = (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical lines
      for (let i = 0; i <= 10; i++) {
        const x = (width / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, chartHeight);
        ctx.stroke();
      }
    }

    // Draw signal
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const step = width / (data.length - 1);

    for (let i = 0; i < data.length; i++) {
      const x = i * step;
      const normalizedValue = (data[i] - min + padding) / (range + 2 * padding);
      const y = chartHeight - normalizedValue * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, [data, color, showGrid]);

  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" style={{ color }} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height }}
          className="signal-canvas rounded-lg"
        />
      </CardContent>
    </Card>
  );
}

// Multiple signals comparison chart
interface MultiSignalChartProps {
  signals: {
    data: number[];
    label: string;
    color: string;
  }[];
  title: string;
  height?: number;
}

export function MultiSignalChart({
  signals,
  title,
  height = 300
}: MultiSignalChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || signals.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, chartHeight);

    // Find global min/max
    let globalMin = Infinity;
    let globalMax = -Infinity;
    for (const signal of signals) {
      globalMin = Math.min(globalMin, ...signal.data);
      globalMax = Math.max(globalMax, ...signal.data);
    }
    const range = globalMax - globalMin || 1;
    const padding = range * 0.1;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw each signal
    for (const signal of signals) {
      ctx.strokeStyle = signal.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const step = width / (signal.data.length - 1);

      for (let i = 0; i < signal.data.length; i++) {
        const x = i * step;
        const normalizedValue = (signal.data[i] - globalMin + padding) / (range + 2 * padding);
        const y = chartHeight - normalizedValue * chartHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }
  }, [signals]);

  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex flex-wrap gap-3 mt-2">
          {signals.map((signal, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: signal.color }}
              />
              <span className="text-xs text-muted-foreground">{signal.label}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height }}
          className="signal-canvas rounded-lg"
        />
      </CardContent>
    </Card>
  );
}
