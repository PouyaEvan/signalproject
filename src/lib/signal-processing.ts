// Signal processing utilities: Bandpass and Notch filters

export interface FilterParams {
  lowFreq?: number;
  highFreq?: number;
  sampleRate: number;
  order?: number;
}

// Simple Butterworth coefficients calculation
function butterworthCoeffs(cutoffFreq: number, sampleRate: number, order: number = 2): { a: number[], b: number[] } {
  const wc = Math.tan(Math.PI * cutoffFreq / sampleRate);
  const wc2 = wc * wc;
  const sqrt2 = Math.sqrt(2);
  
  // Second order low-pass Butterworth
  const k = 1 + sqrt2 * wc + wc2;
  const b0 = wc2 / k;
  const b1 = 2 * wc2 / k;
  const b2 = wc2 / k;
  const a1 = 2 * (wc2 - 1) / k;
  const a2 = (1 - sqrt2 * wc + wc2) / k;
  
  return {
    b: [b0, b1, b2],
    a: [1, a1, a2]
  };
}

// Apply IIR filter
function applyIIRFilter(signal: number[], b: number[], a: number[]): number[] {
  const output: number[] = new Array(signal.length).fill(0);
  const order = Math.max(b.length, a.length);
  
  for (let i = 0; i < signal.length; i++) {
    let sum = 0;
    
    // Feed-forward (b coefficients)
    for (let j = 0; j < b.length; j++) {
      if (i - j >= 0) {
        sum += b[j] * signal[i - j];
      }
    }
    
    // Feedback (a coefficients)
    for (let j = 1; j < a.length; j++) {
      if (i - j >= 0) {
        sum -= a[j] * output[i - j];
      }
    }
    
    output[i] = sum;
  }
  
  return output;
}

// Forward-backward filtering for zero phase distortion
function filtfilt(signal: number[], b: number[], a: number[]): number[] {
  // Forward filter
  let filtered = applyIIRFilter(signal, b, a);
  
  // Reverse the signal
  filtered = filtered.reverse();
  
  // Backward filter
  filtered = applyIIRFilter(filtered, b, a);
  
  // Reverse back to original orientation
  return filtered.reverse();
}

// Low-pass filter
export function lowPassFilter(signal: number[], cutoffFreq: number, sampleRate: number): number[] {
  const { b, a } = butterworthCoeffs(cutoffFreq, sampleRate, 2);
  return filtfilt(signal, b, a);
}

// High-pass filter (using low-pass complement)
export function highPassFilter(signal: number[], cutoffFreq: number, sampleRate: number): number[] {
  const lowPassed = lowPassFilter(signal, cutoffFreq, sampleRate);
  return signal.map((v, i) => v - lowPassed[i]);
}

// Band-pass filter (0.5-45 Hz for EEG)
export function bandPassFilter(
  signal: number[],
  lowFreq: number = 0.5,
  highFreq: number = 45,
  sampleRate: number = 256
): number[] {
  // Apply high-pass first, then low-pass
  const highPassed = highPassFilter(signal, lowFreq, sampleRate);
  const bandPassed = lowPassFilter(highPassed, highFreq, sampleRate);
  return bandPassed;
}

// Notch filter for power line interference (50/60 Hz)
export function notchFilter(
  signal: number[],
  notchFreq: number = 50,
  sampleRate: number = 256,
  bandwidth: number = 2
): number[] {
  // Calculate notch filter coefficients
  const w0 = 2 * Math.PI * notchFreq / sampleRate;
  const Q = notchFreq / bandwidth;
  const alpha = Math.sin(w0) / (2 * Q);
  
  const b0 = 1;
  const b1 = -2 * Math.cos(w0);
  const b2 = 1;
  const a0 = 1 + alpha;
  const a1 = -2 * Math.cos(w0);
  const a2 = 1 - alpha;
  
  // Normalize coefficients
  const b = [b0 / a0, b1 / a0, b2 / a0];
  const a = [1, a1 / a0, a2 / a0];
  
  return filtfilt(signal, b, a);
}

// Full preprocessing pipeline
export interface PreprocessingResult {
  original: number[];
  afterBandpass: number[];
  afterNotch: number[];
  final: number[];
}

export function preprocessSignal(
  signal: number[],
  sampleRate: number = 256,
  bandpassLow: number = 0.5,
  bandpassHigh: number = 45,
  notchFreq: number = 50
): PreprocessingResult {
  // Step 1: Band-pass filter
  const afterBandpass = bandPassFilter(signal, bandpassLow, bandpassHigh, sampleRate);
  
  // Step 2: Notch filter
  const afterNotch = notchFilter(afterBandpass, notchFreq, sampleRate);
  
  return {
    original: signal,
    afterBandpass,
    afterNotch,
    final: afterNotch
  };
}

// Calculate signal statistics
export interface SignalStats {
  mean: number;
  std: number;
  min: number;
  max: number;
  rms: number;
}

export function calculateSignalStats(signal: number[]): SignalStats {
  const n = signal.length;
  if (n === 0) {
    return { mean: 0, std: 0, min: 0, max: 0, rms: 0 };
  }
  
  const mean = signal.reduce((a, b) => a + b, 0) / n;
  const variance = signal.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);
  const min = Math.min(...signal);
  const max = Math.max(...signal);
  const rms = Math.sqrt(signal.reduce((sum, v) => sum + v * v, 0) / n);
  
  return { mean, std, min, max, rms };
}

// Simple FFT for frequency analysis (using DFT for simplicity)
export function computeFFT(signal: number[], sampleRate: number): { frequencies: number[], magnitudes: number[] } {
  const n = signal.length;
  const frequencies: number[] = [];
  const magnitudes: number[] = [];
  
  // Compute DFT magnitudes for positive frequencies
  const numFreqs = Math.floor(n / 2);
  
  for (let k = 0; k < numFreqs; k++) {
    let real = 0;
    let imag = 0;
    
    for (let t = 0; t < n; t++) {
      const angle = (2 * Math.PI * k * t) / n;
      real += signal[t] * Math.cos(angle);
      imag -= signal[t] * Math.sin(angle);
    }
    
    frequencies.push((k * sampleRate) / n);
    magnitudes.push(Math.sqrt(real * real + imag * imag) / n);
  }
  
  return { frequencies, magnitudes };
}

// Calculate power spectral density in frequency bands
export interface BandPowers {
  delta: number;  // 0.5-4 Hz
  theta: number;  // 4-8 Hz
  alpha: number;  // 8-13 Hz
  beta: number;   // 13-30 Hz
  gamma: number;  // 30-45 Hz
}

export function calculateBandPowers(signal: number[], sampleRate: number): BandPowers {
  const { frequencies, magnitudes } = computeFFT(signal, sampleRate);
  
  let delta = 0, theta = 0, alpha = 0, beta = 0, gamma = 0;
  let deltaCount = 0, thetaCount = 0, alphaCount = 0, betaCount = 0, gammaCount = 0;
  
  for (let i = 0; i < frequencies.length; i++) {
    const freq = frequencies[i];
    const power = magnitudes[i] * magnitudes[i];
    
    if (freq >= 0.5 && freq < 4) {
      delta += power;
      deltaCount++;
    } else if (freq >= 4 && freq < 8) {
      theta += power;
      thetaCount++;
    } else if (freq >= 8 && freq < 13) {
      alpha += power;
      alphaCount++;
    } else if (freq >= 13 && freq < 30) {
      beta += power;
      betaCount++;
    } else if (freq >= 30 && freq <= 45) {
      gamma += power;
      gammaCount++;
    }
  }
  
  // Normalize by number of frequency bins
  return {
    delta: deltaCount > 0 ? delta / deltaCount : 0,
    theta: thetaCount > 0 ? theta / thetaCount : 0,
    alpha: alphaCount > 0 ? alpha / alphaCount : 0,
    beta: betaCount > 0 ? beta / betaCount : 0,
    gamma: gammaCount > 0 ? gamma / gammaCount : 0
  };
}
