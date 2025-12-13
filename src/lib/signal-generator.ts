// Signal generation and pre-defined brain signals

export type EmotionType = 'happy' | 'neutral' | 'sad';

export interface BrainSignal {
  data: number[];
  sampleRate: number;
  duration: number;
  emotion: EmotionType;
  label: string;
}

// Generate sine wave
function generateSineWave(
  frequency: number,
  amplitude: number,
  duration: number,
  sampleRate: number,
  phase: number = 0
): number[] {
  const samples = Math.floor(duration * sampleRate);
  const signal: number[] = [];
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    signal.push(amplitude * Math.sin(2 * Math.PI * frequency * t + phase));
  }
  
  return signal;
}

// Generate white noise
function generateNoise(length: number, amplitude: number): number[] {
  const noise: number[] = [];
  for (let i = 0; i < length; i++) {
    noise.push((Math.random() - 0.5) * 2 * amplitude);
  }
  return noise;
}

// Generate 50/60 Hz power line noise
function generatePowerLineNoise(
  duration: number,
  sampleRate: number,
  frequency: number = 50,
  amplitude: number = 0.3
): number[] {
  return generateSineWave(frequency, amplitude, duration, sampleRate);
}

// Add signals together
function addSignals(...signals: number[][]): number[] {
  const maxLength = Math.max(...signals.map(s => s.length));
  const result: number[] = new Array(maxLength).fill(0);
  
  for (const signal of signals) {
    for (let i = 0; i < signal.length; i++) {
      result[i] += signal[i];
    }
  }
  
  return result;
}

// Generate Alpha waves (8-13 Hz) - relaxation
function generateAlphaWaves(duration: number, sampleRate: number): number[] {
  const alpha1 = generateSineWave(10, 0.8, duration, sampleRate, 0);
  const alpha2 = generateSineWave(11, 0.4, duration, sampleRate, Math.PI / 4);
  return addSignals(alpha1, alpha2);
}

// Generate Beta waves (13-30 Hz) - active thinking
function generateBetaWaves(duration: number, sampleRate: number): number[] {
  const beta1 = generateSineWave(18, 0.5, duration, sampleRate, 0);
  const beta2 = generateSineWave(22, 0.3, duration, sampleRate, Math.PI / 3);
  const beta3 = generateSineWave(26, 0.2, duration, sampleRate, Math.PI / 6);
  return addSignals(beta1, beta2, beta3);
}

// Generate Theta waves (4-8 Hz) - drowsiness
function generateThetaWaves(duration: number, sampleRate: number): number[] {
  const theta1 = generateSineWave(5, 0.6, duration, sampleRate, 0);
  const theta2 = generateSineWave(7, 0.4, duration, sampleRate, Math.PI / 5);
  return addSignals(theta1, theta2);
}

// Generate Delta waves (0.5-4 Hz) - deep sleep
function generateDeltaWaves(duration: number, sampleRate: number): number[] {
  const delta1 = generateSineWave(1, 1.0, duration, sampleRate, 0);
  const delta2 = generateSineWave(2.5, 0.5, duration, sampleRate, Math.PI / 4);
  return addSignals(delta1, delta2);
}

// Generate Gamma waves (30-100 Hz) - high cognitive activity
function generateGammaWaves(duration: number, sampleRate: number): number[] {
  const gamma1 = generateSineWave(40, 0.2, duration, sampleRate, 0);
  const gamma2 = generateSineWave(50, 0.1, duration, sampleRate, Math.PI / 2);
  return addSignals(gamma1, gamma2);
}

// Generate Happy brain signal
export function generateHappySignal(duration: number = 10, sampleRate: number = 256): BrainSignal {
  // Happy: High alpha, moderate beta, some gamma
  const alpha = generateAlphaWaves(duration, sampleRate);
  const beta = generateBetaWaves(duration, sampleRate);
  const gamma = generateGammaWaves(duration, sampleRate);
  const noise = generateNoise(alpha.length, 0.2);
  const powerNoise = generatePowerLineNoise(duration, sampleRate, 50, 0.25);
  
  // Weight the components
  const signal = alpha.map((v, i) => 
    v * 1.2 + (beta[i] || 0) * 0.6 + (gamma[i] || 0) * 0.3 + noise[i] + (powerNoise[i] || 0)
  );
  
  return {
    data: signal,
    sampleRate,
    duration,
    emotion: 'happy',
    label: '😊 Happy Brain Signal'
  };
}

// Generate Neutral brain signal
export function generateNeutralSignal(duration: number = 10, sampleRate: number = 256): BrainSignal {
  // Neutral: Balanced alpha and beta
  const alpha = generateAlphaWaves(duration, sampleRate);
  const beta = generateBetaWaves(duration, sampleRate);
  const theta = generateThetaWaves(duration, sampleRate);
  const noise = generateNoise(alpha.length, 0.15);
  const powerNoise = generatePowerLineNoise(duration, sampleRate, 50, 0.2);
  
  const signal = alpha.map((v, i) => 
    v * 0.8 + (beta[i] || 0) * 0.5 + (theta[i] || 0) * 0.3 + noise[i] + (powerNoise[i] || 0)
  );
  
  return {
    data: signal,
    sampleRate,
    duration,
    emotion: 'neutral',
    label: '😐 Neutral Brain Signal'
  };
}

// Generate Sad brain signal
export function generateSadSignal(duration: number = 10, sampleRate: number = 256): BrainSignal {
  // Sad: High theta, high delta, low alpha
  const alpha = generateAlphaWaves(duration, sampleRate);
  const theta = generateThetaWaves(duration, sampleRate);
  const delta = generateDeltaWaves(duration, sampleRate);
  const noise = generateNoise(alpha.length, 0.2);
  const powerNoise = generatePowerLineNoise(duration, sampleRate, 50, 0.3);
  
  const signal = alpha.map((v, i) => 
    v * 0.4 + (theta[i] || 0) * 1.2 + (delta[i] || 0) * 0.8 + noise[i] + (powerNoise[i] || 0)
  );
  
  return {
    data: signal,
    sampleRate,
    duration,
    emotion: 'sad',
    label: '😢 Sad Brain Signal'
  };
}

// Custom signal generator
export interface CustomSignalParams {
  alpha: number;      // 0-1 weight
  beta: number;       // 0-1 weight
  theta: number;      // 0-1 weight
  delta: number;      // 0-1 weight
  gamma: number;      // 0-1 weight
  noiseLevel: number; // 0-1 noise amplitude
  powerNoiseFreq: 50 | 60; // Power line frequency
  powerNoiseLevel: number; // 0-1 power noise amplitude
}

export function generateCustomSignal(
  params: CustomSignalParams,
  duration: number = 10,
  sampleRate: number = 256
): BrainSignal {
  const alpha = generateAlphaWaves(duration, sampleRate);
  const beta = generateBetaWaves(duration, sampleRate);
  const theta = generateThetaWaves(duration, sampleRate);
  const delta = generateDeltaWaves(duration, sampleRate);
  const gamma = generateGammaWaves(duration, sampleRate);
  const noise = generateNoise(alpha.length, params.noiseLevel);
  const powerNoise = generatePowerLineNoise(duration, sampleRate, params.powerNoiseFreq, params.powerNoiseLevel);
  
  const signal = alpha.map((v, i) => 
    v * params.alpha + 
    (beta[i] || 0) * params.beta + 
    (theta[i] || 0) * params.theta + 
    (delta[i] || 0) * params.delta + 
    (gamma[i] || 0) * params.gamma + 
    noise[i] + 
    (powerNoise[i] || 0)
  );
  
  // Determine emotion based on wave composition
  let emotion: EmotionType = 'neutral';
  if (params.alpha > 0.8 && params.gamma > 0.2) {
    emotion = 'happy';
  } else if (params.theta > 0.8 || params.delta > 0.6) {
    emotion = 'sad';
  }
  
  return {
    data: signal,
    sampleRate,
    duration,
    emotion,
    label: '🎛️ Custom Signal'
  };
}

// Get all pre-defined signals
export function getPreDefinedSignals(duration: number = 10, sampleRate: number = 256): BrainSignal[] {
  return [
    generateHappySignal(duration, sampleRate),
    generateNeutralSignal(duration, sampleRate),
    generateSadSignal(duration, sampleRate),
  ];
}
