// LSTM-based Emotion Classification
// Client-side implementation using TensorFlow.js

import * as tf from '@tensorflow/tfjs';
import { EmotionType } from './signal-generator';
import { calculateBandPowers, BandPowers } from './signal-processing';

export interface EmotionPrediction {
  emotion: EmotionType;
  confidence: number;
  probabilities: {
    happy: number;
    neutral: number;
    sad: number;
  };
}

export interface LSTMConfig {
  inputSize: number;
  hiddenSize: number;
  outputSize: number;
  sequenceLength: number;
}

const defaultConfig: LSTMConfig = {
  inputSize: 5,      // 5 frequency bands
  hiddenSize: 32,
  outputSize: 3,     // 3 emotions
  sequenceLength: 10 // Number of windows
};

let model: tf.LayersModel | null = null;

// Create LSTM model
export async function createLSTMModel(config: LSTMConfig = defaultConfig): Promise<tf.LayersModel> {
  const model = tf.sequential();
  
  // LSTM layer
  model.add(tf.layers.lstm({
    units: config.hiddenSize,
    inputShape: [config.sequenceLength, config.inputSize],
    returnSequences: false,
    activation: 'tanh',
    recurrentActivation: 'sigmoid'
  }));
  
  // Dropout for regularization
  model.add(tf.layers.dropout({ rate: 0.3 }));
  
  // Dense hidden layer
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu'
  }));
  
  // Output layer
  model.add(tf.layers.dense({
    units: config.outputSize,
    activation: 'softmax'
  }));
  
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
  });
  
  return model;
}

// Extract features from signal (band powers over time windows)
export function extractFeatures(
  signal: number[],
  sampleRate: number = 256,
  windowSize: number = 256,
  sequenceLength: number = 10
): number[][] {
  const features: number[][] = [];
  const stepSize = Math.floor((signal.length - windowSize) / (sequenceLength - 1));
  
  for (let i = 0; i < sequenceLength; i++) {
    const start = i * stepSize;
    const end = start + windowSize;
    const window = signal.slice(start, Math.min(end, signal.length));
    
    // Pad if necessary
    while (window.length < windowSize) {
      window.push(0);
    }
    
    const bandPowers = calculateBandPowers(window, sampleRate);
    features.push([
      bandPowers.delta,
      bandPowers.theta,
      bandPowers.alpha,
      bandPowers.beta,
      bandPowers.gamma
    ]);
  }
  
  return features;
}

// Normalize features
function normalizeFeatures(features: number[][]): number[][] {
  // Find min/max for each feature
  const numFeatures = features[0].length;
  const mins = new Array(numFeatures).fill(Infinity);
  const maxs = new Array(numFeatures).fill(-Infinity);
  
  for (const row of features) {
    for (let i = 0; i < numFeatures; i++) {
      mins[i] = Math.min(mins[i], row[i]);
      maxs[i] = Math.max(maxs[i], row[i]);
    }
  }
  
  // Normalize to [0, 1]
  return features.map(row => 
    row.map((v, i) => {
      const range = maxs[i] - mins[i];
      return range > 0 ? (v - mins[i]) / range : 0.5;
    })
  );
}

// Train the model with synthetic data
export async function trainModel(
  signals: { signal: number[], emotion: EmotionType }[],
  sampleRate: number = 256,
  epochs: number = 50
): Promise<tf.LayersModel> {
  if (!model) {
    model = await createLSTMModel();
  }
  
  // Prepare training data
  const X: number[][][] = [];
  const y: number[][] = [];
  
  const emotionToLabel: Record<EmotionType, number[]> = {
    'happy': [1, 0, 0],
    'neutral': [0, 1, 0],
    'sad': [0, 0, 1]
  };
  
  for (const { signal, emotion } of signals) {
    const features = extractFeatures(signal, sampleRate);
    const normalizedFeatures = normalizeFeatures(features);
    X.push(normalizedFeatures);
    y.push(emotionToLabel[emotion]);
  }
  
  const xTensor = tf.tensor3d(X);
  const yTensor = tf.tensor2d(y);
  
  await model.fit(xTensor, yTensor, {
    epochs,
    batchSize: Math.min(32, signals.length),
    validationSplit: 0.2,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        console.log(`Epoch ${epoch + 1}: loss = ${logs?.loss?.toFixed(4)}, accuracy = ${logs?.acc?.toFixed(4)}`);
      }
    }
  });
  
  xTensor.dispose();
  yTensor.dispose();
  
  return model;
}

// Predict emotion from signal
export async function predictEmotion(
  signal: number[],
  sampleRate: number = 256
): Promise<EmotionPrediction> {
  // If model not trained, use rule-based classification
  if (!model) {
    return ruleBasedClassification(signal, sampleRate);
  }
  
  const features = extractFeatures(signal, sampleRate);
  const normalizedFeatures = normalizeFeatures(features);
  
  const input = tf.tensor3d([normalizedFeatures]);
  const prediction = model.predict(input) as tf.Tensor;
  const probs = await prediction.data();
  
  input.dispose();
  prediction.dispose();
  
  const probabilities = {
    happy: probs[0],
    neutral: probs[1],
    sad: probs[2]
  };
  
  // Find the emotion with highest probability
  let maxProb = 0;
  let emotion: EmotionType = 'neutral';
  
  if (probabilities.happy > maxProb) {
    maxProb = probabilities.happy;
    emotion = 'happy';
  }
  if (probabilities.neutral > maxProb) {
    maxProb = probabilities.neutral;
    emotion = 'neutral';
  }
  if (probabilities.sad > maxProb) {
    maxProb = probabilities.sad;
    emotion = 'sad';
  }
  
  return {
    emotion,
    confidence: maxProb,
    probabilities
  };
}

// Rule-based classification when model is not trained
function ruleBasedClassification(signal: number[], sampleRate: number): EmotionPrediction {
  const bandPowers = calculateBandPowers(signal, sampleRate);
  
  // Normalize band powers
  const total = bandPowers.delta + bandPowers.theta + bandPowers.alpha + bandPowers.beta + bandPowers.gamma;
  const normalized = {
    delta: bandPowers.delta / total,
    theta: bandPowers.theta / total,
    alpha: bandPowers.alpha / total,
    beta: bandPowers.beta / total,
    gamma: bandPowers.gamma / total
  };
  
  // Calculate emotion scores based on typical EEG patterns
  // Happy: High alpha, moderate beta, some gamma (positive valence)
  const happyScore = normalized.alpha * 1.5 + normalized.beta * 0.8 + normalized.gamma * 1.2;
  
  // Neutral: Balanced patterns
  const neutralScore = normalized.alpha * 1.0 + normalized.beta * 1.0 + normalized.theta * 0.5;
  
  // Sad: High theta, high delta, low alpha (low arousal, negative valence)
  const sadScore = normalized.theta * 1.5 + normalized.delta * 1.2 - normalized.alpha * 0.5;
  
  // Softmax normalization
  const expHappy = Math.exp(happyScore);
  const expNeutral = Math.exp(neutralScore);
  const expSad = Math.exp(sadScore * 0.8); // Scale down sad score
  const expSum = expHappy + expNeutral + expSad;
  
  const probabilities = {
    happy: expHappy / expSum,
    neutral: expNeutral / expSum,
    sad: expSad / expSum
  };
  
  // Find max
  let emotion: EmotionType = 'neutral';
  let maxProb = probabilities.neutral;
  
  if (probabilities.happy > maxProb) {
    maxProb = probabilities.happy;
    emotion = 'happy';
  }
  if (probabilities.sad > maxProb) {
    maxProb = probabilities.sad;
    emotion = 'sad';
  }
  
  return {
    emotion,
    confidence: maxProb,
    probabilities
  };
}

// Get emotion emoji
export function getEmotionEmoji(emotion: EmotionType): string {
  const emojis: Record<EmotionType, string> = {
    'happy': '😊',
    'neutral': '😐',
    'sad': '😢'
  };
  return emojis[emotion];
}

// Get emotion color
export function getEmotionColor(emotion: EmotionType): string {
  const colors: Record<EmotionType, string> = {
    'happy': '#22c55e',  // Green
    'neutral': '#6b7280', // Gray
    'sad': '#ef4444'     // Red
  };
  return colors[emotion];
}
