// Independent Component Analysis (ICA) for artifact removal
// Simplified implementation using FastICA algorithm

import { Matrix, EVD } from 'ml-matrix';

export interface ICAResult {
  cleanSignal: number[];
  components: number[][];
  removedArtifacts: number[];
  artifactIndices: number[];
}

// Center the data (subtract mean)
function centerData(data: number[][]): { centered: number[][], means: number[] } {
  const numChannels = data.length;
  const numSamples = data[0].length;
  const centered: number[][] = [];
  const means: number[] = [];
  
  for (let i = 0; i < numChannels; i++) {
    const mean = data[i].reduce((a, b) => a + b, 0) / numSamples;
    means.push(mean);
    centered.push(data[i].map(v => v - mean));
  }
  
  return { centered, means };
}

// Whiten the data using PCA
function whitenData(data: number[][]): { whitened: number[][], whiteningMatrix: Matrix } {
  const numChannels = data.length;
  const numSamples = data[0].length;
  
  // Create covariance matrix
  const dataMatrix = new Matrix(data);
  const covMatrix = dataMatrix.mmul(dataMatrix.transpose()).div(numSamples);
  
  // Eigenvalue decomposition
  const evd = new EVD(covMatrix);
  const eigenvalues = evd.realEigenvalues;
  const eigenvectors = evd.eigenvectorMatrix;
  
  // Create whitening matrix
  const D = Matrix.zeros(numChannels, numChannels);
  for (let i = 0; i < numChannels; i++) {
    D.set(i, i, 1 / Math.sqrt(Math.max(eigenvalues[i], 1e-10)));
  }
  
  const whiteningMatrix = D.mmul(eigenvectors.transpose());
  const whitened = whiteningMatrix.mmul(dataMatrix);
  
  return { 
    whitened: whitened.to2DArray(), 
    whiteningMatrix 
  };
}

// FastICA iteration
function fastICAIteration(
  w: number[],
  X: number[][],
  g: (u: number) => number,
  gPrime: (u: number) => number
): number[] {
  const numSamples = X[0].length;
  const numChannels = X.length;
  
  // Calculate w'X
  const wX: number[] = [];
  for (let j = 0; j < numSamples; j++) {
    let sum = 0;
    for (let i = 0; i < numChannels; i++) {
      sum += w[i] * X[i][j];
    }
    wX.push(sum);
  }
  
  // Calculate E[X * g(w'X)]
  const term1: number[] = new Array(numChannels).fill(0);
  for (let i = 0; i < numChannels; i++) {
    for (let j = 0; j < numSamples; j++) {
      term1[i] += X[i][j] * g(wX[j]);
    }
    term1[i] /= numSamples;
  }
  
  // Calculate E[g'(w'X)] * w
  let term2Scalar = 0;
  for (let j = 0; j < numSamples; j++) {
    term2Scalar += gPrime(wX[j]);
  }
  term2Scalar /= numSamples;
  
  // w_new = term1 - term2Scalar * w
  const wNew: number[] = [];
  for (let i = 0; i < numChannels; i++) {
    wNew.push(term1[i] - term2Scalar * w[i]);
  }
  
  // Normalize
  const norm = Math.sqrt(wNew.reduce((sum, v) => sum + v * v, 0));
  return wNew.map(v => v / (norm || 1));
}

// Non-linearity functions for ICA
const g = (u: number) => Math.tanh(u);
const gPrime = (u: number) => 1 - Math.pow(Math.tanh(u), 2);

// Detect artifact components based on statistical properties
function detectArtifacts(components: number[][]): number[] {
  const artifactIndices: number[] = [];
  
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    const n = comp.length;
    
    // Calculate statistics
    const mean = comp.reduce((a, b) => a + b, 0) / n;
    const variance = comp.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const std = Math.sqrt(variance);
    
    // Calculate kurtosis (excess kurtosis)
    const fourthMoment = comp.reduce((sum, v) => sum + Math.pow((v - mean) / std, 4), 0) / n;
    const kurtosis = fourthMoment - 3;
    
    // Calculate max amplitude
    const maxAmp = Math.max(...comp.map(Math.abs));
    
    // Artifact detection criteria:
    // 1. High kurtosis (spiky signals like eye blinks)
    // 2. Very high amplitude compared to others
    // 3. Low frequency dominance (muscle artifacts)
    
    if (kurtosis > 5 || maxAmp > std * 6) {
      artifactIndices.push(i);
    }
  }
  
  return artifactIndices;
}

// Main ICA function for artifact removal
export function removeArtifactsICA(
  signal: number[],
  numComponents: number = 4
): ICAResult {
  // For single channel, we create pseudo-channels using time-delayed versions
  const delayedSignals: number[][] = [];
  const delays = [0, 5, 10, 15]; // Sample delays
  
  for (const delay of delays.slice(0, numComponents)) {
    const delayed = [...signal.slice(delay), ...signal.slice(0, delay)];
    delayedSignals.push(delayed);
  }
  
  // Center the data
  const { centered, means } = centerData(delayedSignals);
  
  // Whiten the data
  const { whitened, whiteningMatrix } = whitenData(centered);
  
  // Initialize unmixing matrix
  const numChannels = whitened.length;
  const W: number[][] = [];
  
  for (let i = 0; i < numChannels; i++) {
    // Random initialization
    const w: number[] = [];
    for (let j = 0; j < numChannels; j++) {
      w.push(Math.random() - 0.5);
    }
    // Normalize
    const norm = Math.sqrt(w.reduce((sum, v) => sum + v * v, 0));
    W.push(w.map(v => v / norm));
  }
  
  // FastICA iterations
  const maxIter = 100;
  const tolerance = 1e-6;
  
  for (let c = 0; c < numChannels; c++) {
    let w = [...W[c]];
    
    for (let iter = 0; iter < maxIter; iter++) {
      const wNew = fastICAIteration(w, whitened, g, gPrime);
      
      // Decorrelate from previous components
      for (let p = 0; p < c; p++) {
        const dot = wNew.reduce((sum, v, i) => sum + v * W[p][i], 0);
        for (let i = 0; i < numChannels; i++) {
          wNew[i] -= dot * W[p][i];
        }
      }
      
      // Normalize
      const norm = Math.sqrt(wNew.reduce((sum, v) => sum + v * v, 0));
      for (let i = 0; i < numChannels; i++) {
        wNew[i] /= norm || 1;
      }
      
      // Check convergence
      const diff = Math.abs(1 - Math.abs(w.reduce((sum, v, i) => sum + v * wNew[i], 0)));
      w = wNew;
      
      if (diff < tolerance) break;
    }
    
    W[c] = w;
  }
  
  // Calculate independent components
  const wMatrix = new Matrix(W);
  const whitenedMatrix = new Matrix(whitened);
  const components = wMatrix.mmul(whitenedMatrix).to2DArray();
  
  // Detect artifacts
  const artifactIndices = detectArtifacts(components);
  
  // Remove artifact components
  const cleanComponents = components.map((comp, i) => {
    if (artifactIndices.includes(i)) {
      return new Array(comp.length).fill(0);
    }
    return comp;
  });
  
  // Reconstruct signal
  const wInverse = wMatrix.pseudoInverse();
  const cleanWhitened = wInverse.mmul(new Matrix(cleanComponents));
  
  // Un-whiten
  const whiteningInverse = whiteningMatrix.pseudoInverse();
  const cleanCentered = whiteningInverse.mmul(cleanWhitened);
  
  // Add means back
  const reconstructed = cleanCentered.to2DArray();
  const cleanSignal = reconstructed[0].map((v, i) => v + means[0]);
  
  // Calculate removed artifacts
  const removedArtifacts = signal.map((v, i) => v - cleanSignal[i]);
  
  return {
    cleanSignal,
    components,
    removedArtifacts,
    artifactIndices
  };
}

// Simplified artifact removal for single channel using statistical thresholding
export function removeArtifactsSimple(
  signal: number[],
  threshold: number = 3
): ICAResult {
  const n = signal.length;
  const mean = signal.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(signal.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n);
  
  const cleanSignal: number[] = [];
  const removedArtifacts: number[] = [];
  const artifactIndices: number[] = [];
  
  for (let i = 0; i < n; i++) {
    const deviation = Math.abs(signal[i] - mean) / std;
    if (deviation > threshold) {
      // Interpolate from neighbors
      const left = i > 0 ? signal[i - 1] : mean;
      const right = i < n - 1 ? signal[i + 1] : mean;
      cleanSignal.push((left + right) / 2);
      removedArtifacts.push(signal[i] - cleanSignal[i]);
      artifactIndices.push(i);
    } else {
      cleanSignal.push(signal[i]);
      removedArtifacts.push(0);
    }
  }
  
  return {
    cleanSignal,
    components: [signal],
    removedArtifacts,
    artifactIndices
  };
}
