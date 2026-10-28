/**
 * DocuGuard Reinforcement Learning (RL) Policy Calibration Engine
 * 
 * Implements a Policy-Gradient (REINFORCE) Contextual Agent that operates on
 * 7-dimensional forensic feature vectors extracted from document analysis.
 * 
 * User feedback signals (Authentic, Suspicious, Tampered) provide scalar rewards/penalties,
 * adapting decision boundaries, noise penalty multipliers, and softmax action distributions
 * in real-time with local persistence.
 */

import { VerdictType } from '../types/edge';

export type GroundTruthAction = 0 | 1 | 2; // 0 = Authentic, 1 = Suspicious, 2 = Tampered
export const ACTION_VERDICTS: VerdictType[] = [
  'NO_SIGNIFICANT_MANIPULATION',
  'POSSIBLE_MANIPULATION',
  'INTEGRITY_FAILED'
];

export const ACTION_LABELS = ['Authentic', 'Suspicious', 'Tampered'] as const;

export interface RLFeatureVector {
  // s0..s2: CNN layer softmax probabilities [p_real, p_susp, p_tamper]
  cnnRealProb: number;
  cnnSuspProb: number;
  cnnTamperProb: number;
  // s3: ELA / High-frequency error ratio [0, 1]
  elaIntensity: number;
  // s4: Moiré / Noise pattern inconsistency [0, 1]
  noiseInconsistency: number;
  // s5: OCR structural compliance [0, 1] (1 = valid syntax/checksum, 0.5 = neutral, 0 = syntax fail)
  ocrCompliance: number;
  // s6: EXIF / Raster software integrity [0, 1] (1 = verified clean, 0 = editor signature found)
  metadataIntegrity: number;
}

export interface RLEpisodeLog {
  id: string;
  timestamp: string;
  documentName?: string;
  features: number[];
  predictedAction: GroundTruthAction;
  targetAction: GroundTruthAction;
  reward: number;
  rewardExplanation: string;
  weightsNorm: number;
}

export interface DocumentFeedbackMemory {
  sha256: string;
  groundTruth: GroundTruthAction;
  verdict: VerdictType;
  score: number;
  timestamp: string;
  fileName?: string;
}

export interface RLPolicyState {
  version: number;
  epochs: number;
  cumulativeReward: number;
  averageReward: number;
  weights: number[][]; // 3 x 7 matrix
  biases: number[];    // 3 vector
  recentLogs: RLEpisodeLog[];
  noiseToleranceMultiplier: number;
}

const STORAGE_KEY = 'docuguard_rl_policy_v1';
const MEMORY_STORAGE_KEY = 'docuguard_feedback_memory_v1';
const LEARNING_RATE = 0.08;

// Initial prior weights (calibrated to give balanced priors rather than default suspicion)
const FACTORY_WEIGHTS: number[][] = [
  // Class 0 (Authentic): High positive on CNN real, OCR compliance, metadata integrity; negative on ELA/noise
  [ 2.2, -1.0, -2.5, -1.8, -1.5,  1.4,  1.1],
  // Class 1 (Suspicious): High on moderate ELA/noise, intermediate CNN susp
  [-1.0,  1.8, -0.5,  1.2,  1.1, -0.6, -0.8],
  // Class 2 (Tampered): Strong positive on CNN tamper, heavy ELA, failed checksums, editor metadata
  [-2.5, -0.4,  2.8,  2.4,  1.9, -2.0, -1.8]
];

const FACTORY_BIASES = [0.25, -0.15, -0.35];

export class RLPolicyAgent {
  private weights: number[][];
  private biases: number[];
  private epochs: number;
  private cumulativeReward: number;
  private logs: RLEpisodeLog[];
  private memoryCache: Map<string, DocumentFeedbackMemory>;

  constructor() {
    this.weights = FACTORY_WEIGHTS.map(row => [...row]);
    this.biases = [...FACTORY_BIASES];
    this.epochs = 0;
    this.cumulativeReward = 0;
    this.logs = [];
    this.memoryCache = new Map();

    this.loadFromStorage();
    this.loadMemoryFromStorage();
  }

  /**
   * Converts high-level forensic pipeline observations into a normalized 7-D feature vector.
   */
  public extractFeatureVector(input: {
    cnnProbabilities?: [number, number, number] | number[];
    compressionInconsistency?: number;
    photoRegionSpliceScore?: number;
    moireScore?: number;
    checksumPassed?: boolean;
    hasChecksumFail?: boolean;
    hasSoftwareSignature?: boolean;
    qualityPassed?: boolean;
  }): number[] {
    const cnn = input.cnnProbabilities || [0.65, 0.25, 0.10];
    const pReal = Math.max(0, Math.min(1, cnn[0] ?? 0.65));
    const pSusp = Math.max(0, Math.min(1, cnn[1] ?? 0.25));
    const pTamper = Math.max(0, Math.min(1, cnn[2] ?? 0.10));

    // Normalize ELA intensity combining splice score and compression delta
    const ela = Math.max(0, Math.min(1, Math.max(
      input.photoRegionSpliceScore || 0,
      input.compressionInconsistency || 0
    )));

    // Noise / Moiré pattern
    const noise = Math.max(0, Math.min(1, input.moireScore || 0));

    // OCR compliance: 1.0 = valid syntax, 0.0 = hard fail, 0.6 = neutral format
    const ocr = input.hasChecksumFail ? 0.0 : (input.checksumPassed ? 1.0 : 0.65);

    // Metadata integrity: 0.0 if photo editor found, 1.0 if clean
    const meta = input.hasSoftwareSignature ? 0.0 : 1.0;

    return [pReal, pSusp, pTamper, ela, noise, ocr, meta];
  }

  /**
   * Computes softmax action probability distribution π(a | s)
   */
  public getActionProbabilities(features: number[]): [number, number, number] {
    const logits: number[] = [0, 0, 0];

    for (let i = 0; i < 3; i++) {
      let sum = this.biases[i];
      for (let j = 0; j < 7; j++) {
        sum += this.weights[i][j] * (features[j] ?? 0);
      }
      logits[i] = sum;
    }

    // Stable softmax
    const maxLogit = Math.max(...logits);
    const exps = logits.map(l => Math.exp(l - maxLogit));
    const sumExps = exps.reduce((acc, val) => acc + val, 0);

    return [
      exps[0] / sumExps,
      exps[1] / sumExps,
      exps[2] / sumExps
    ];
  }

  /**
   * Predicts the most likely calibrated verdict and confidence
   */
  /**
   * Predicts the most likely calibrated verdict and confidence.
   * If a document hash matches prior human feedback in memory, returns the verified label immediately.
   */
  public predictVerdict(
    features: number[], 
    sensitivityOffset: number = 0,
    sha256?: string
  ): {
    action: GroundTruthAction;
    verdict: VerdictType;
    probabilities: [number, number, number];
    confidence: number;
    calibratedScore: number;
    isMemoryMatch?: boolean;
    memoryEntry?: DocumentFeedbackMemory;
  } {
    // 1. Direct Cryptographic Memory Match (Instant verified label)
    if (sha256) {
      const memoryMatch = this.lookupDocumentMemory(sha256);
      if (memoryMatch) {
        const probs: [number, number, number] = memoryMatch.groundTruth === 0
          ? [0.96, 0.03, 0.01]
          : memoryMatch.groundTruth === 1
          ? [0.05, 0.90, 0.05]
          : [0.01, 0.04, 0.95];

        return {
          action: memoryMatch.groundTruth,
          verdict: memoryMatch.verdict,
          probabilities: probs,
          confidence: 0.99,
          calibratedScore: memoryMatch.score,
          isMemoryMatch: true,
          memoryEntry: memoryMatch
        };
      }
    }

    const probs = this.getActionProbabilities(features);

    // Apply sensitivity offset (shifting bias towards authentic if sensitivity is relaxed)
    const adjustedProbs: [number, number, number] = [
      Math.max(0.01, probs[0] - sensitivityOffset),
      Math.max(0.01, probs[1] + sensitivityOffset * 0.5),
      Math.max(0.01, probs[2] + sensitivityOffset * 0.5)
    ];

    const total = adjustedProbs[0] + adjustedProbs[1] + adjustedProbs[2];
    const normProbs: [number, number, number] = [
      adjustedProbs[0] / total,
      adjustedProbs[1] / total,
      adjustedProbs[2] / total
    ];

    let bestAction: GroundTruthAction = 0;
    if (normProbs[2] > normProbs[0] && normProbs[2] > normProbs[1] && normProbs[2] > 0.35) {
      bestAction = 2;
    } else if (normProbs[1] > normProbs[0] && normProbs[1] > 0.40) {
      bestAction = 1;
    } else if (normProbs[0] >= 0.40) {
      bestAction = 0;
    } else {
      const maxP = Math.max(...normProbs);
      bestAction = normProbs.indexOf(maxP) as GroundTruthAction;
    }

    // Calibrated score out of 100 based on continuous expected trust
    const calibratedScore = Math.round(
      normProbs[0] * 95 + normProbs[1] * 62 + normProbs[2] * 18
    );

    return {
      action: bestAction,
      verdict: ACTION_VERDICTS[bestAction],
      probabilities: normProbs,
      confidence: Math.max(...normProbs),
      calibratedScore,
      isMemoryMatch: false
    };
  }

  /**
   * Delivers reward signal from user feedback, executes policy gradient update,
   * and persists the document's cryptographic SHA-256 fingerprint into verified memory.
   */
  public learnFromFeedback(
    features: number[],
    predictedAction: GroundTruthAction,
    targetGroundTruth: GroundTruthAction,
    documentName?: string,
    sha256?: string
  ): {
    reward: number;
    explanation: string;
    weightDeltaNorm: number;
    updatedProbabilities: [number, number, number];
    memoryEntry?: DocumentFeedbackMemory;
  } {
    // If document SHA-256 is provided, record into verified memory immediately!
    let memoryEntry: DocumentFeedbackMemory | undefined;
    if (sha256) {
      memoryEntry = this.rememberDocument(sha256, targetGroundTruth, documentName);
    }

    const probs = this.getActionProbabilities(features);

    // Compute scalar reward R
    let reward = 0;
    let explanation = '';

    if (predictedAction === targetGroundTruth) {
      if (targetGroundTruth === 0) {
        reward = 1.0;
        explanation = 'Accurate authentication confirmed (+1.0 reward)';
      } else if (targetGroundTruth === 2) {
        reward = 1.5;
        explanation = 'Forensic tamper detection reinforced (+1.5 reward)';
      } else {
        reward = 0.8;
        explanation = 'Suspicious boundary classification confirmed (+0.8 reward)';
      }
    } else {
      // Misclassification penalties
      if (targetGroundTruth === 0 && predictedAction === 1) {
        reward = -1.2;
        explanation = 'False Suspicion penalized; noise tolerance increased (-1.2 penalty)';
      } else if (targetGroundTruth === 0 && predictedAction === 2) {
        reward = -2.0;
        explanation = 'Severe false forgery penalized (-2.0 penalty)';
      } else if (targetGroundTruth === 2 && predictedAction === 0) {
        reward = -2.0;
        explanation = 'Critical missed tamper forgery penalized (-2.0 penalty)';
      } else if (targetGroundTruth === 2 && predictedAction === 1) {
        reward = 0.4;
        explanation = 'Detected anomaly but missed definitive tamper (+0.4 reward)';
      } else {
        reward = -0.8;
        explanation = 'Classification mismatch feedback recorded (-0.8 penalty)';
      }
    }

    // Policy Gradient alignment step:
    // Increases probability of targetGroundTruth, scaled by feedback reward magnitude.
    // Negative rewards (penalties for false suspicion / missed forgery) produce higher correction weights.
    const stepMagnitude = reward >= 0 ? Math.max(0.6, reward) : Math.abs(reward) * 1.5;
    let deltaNormSq = 0;
    const lr = LEARNING_RATE;

    for (let k = 0; k < 3; k++) {
      const indicator = k === targetGroundTruth ? 1 : 0;
      const gradMultiplier = lr * stepMagnitude * (indicator - probs[k]);

      // Update biases
      this.biases[k] += gradMultiplier;
      deltaNormSq += gradMultiplier * gradMultiplier;

      // Update weights
      for (let j = 0; j < 7; j++) {
        const dW = gradMultiplier * (features[j] ?? 0);
        this.weights[k][j] += dW;
        deltaNormSq += dW * dW;
      }
    }

    this.epochs += 1;
    this.cumulativeReward += reward;

    const logEntry: RLEpisodeLog = {
      id: 'ep_' + Date.now().toString(36),
      timestamp: new Date().toLocaleTimeString(),
      documentName,
      features: [...features],
      predictedAction,
      targetAction: targetGroundTruth,
      reward,
      rewardExplanation: explanation,
      weightsNorm: Math.sqrt(deltaNormSq)
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > 25) {
      this.logs.pop();
    }

    this.saveToStorage();

    return {
      reward,
      explanation,
      weightDeltaNorm: Math.sqrt(deltaNormSq),
      updatedProbabilities: this.getActionProbabilities(features),
      memoryEntry
    };
  }

  /**
   * Derives a dynamic noise penalty multiplier based on policy training.
   * If the agent has learned from feedback that benign compression is frequently
   * mislabeled as suspicious, this multiplier scales down the penalty weight of compression warnings.
   */
  public getNoisePenaltyMultiplier(): number {
    // Check learned weight on s4 (noise) and s3 (ELA) in the authentic vs suspicious class
    const authNoiseWeight = this.weights[0][4] + this.weights[0][3];
    const suspNoiseWeight = this.weights[1][4] + this.weights[1][3];

    // Baseline warning penalty scale is 0.45.
    // When RL learns from human feedback that minor compression is benign, delta shifts lower.
    const baselineFactoryDelta = -5.6;
    const delta = (authNoiseWeight - suspNoiseWeight) - baselineFactoryDelta;
    const multiplier = Math.max(0.20, Math.min(0.80, 0.45 - delta * 0.08));
    return multiplier;
  }

  public getStats(): {
    epochs: number;
    cumulativeReward: number;
    averageReward: number;
    recentLogs: RLEpisodeLog[];
    noiseTolerance: number;
    weights: number[][];
    biases: number[];
    memoryCount: number;
  } {
    const avg = this.epochs > 0 ? this.cumulativeReward / this.epochs : 0;
    return {
      epochs: this.epochs,
      cumulativeReward: Math.round(this.cumulativeReward * 10) / 10,
      averageReward: Math.round(avg * 100) / 100,
      recentLogs: this.logs,
      noiseTolerance: Math.round((1.2 - this.getNoisePenaltyMultiplier()) * 100),
      weights: this.weights.map(row => [...row]),
      biases: [...this.biases],
      memoryCount: this.memoryCache.size
    };
  }

  public rememberDocument(
    sha256: string,
    targetGroundTruth: GroundTruthAction,
    fileName?: string
  ): DocumentFeedbackMemory {
    const entry: DocumentFeedbackMemory = {
      sha256,
      groundTruth: targetGroundTruth,
      verdict: ACTION_VERDICTS[targetGroundTruth],
      score: targetGroundTruth === 0 ? 96 : targetGroundTruth === 1 ? 65 : 18,
      timestamp: new Date().toLocaleTimeString(),
      fileName
    };

    if (sha256) {
      this.memoryCache.set(sha256, entry);
      this.saveMemoryToStorage();
    }
    return entry;
  }

  public lookupDocumentMemory(sha256?: string): DocumentFeedbackMemory | null {
    if (!sha256) return null;
    return this.memoryCache.get(sha256) || null;
  }

  public getAllRememberedDocuments(): DocumentFeedbackMemory[] {
    return Array.from(this.memoryCache.values());
  }

  public clearMemory(): void {
    this.memoryCache.clear();
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(MEMORY_STORAGE_KEY);
      }
    } catch {}
  }

  public resetToFactory(): void {
    this.weights = FACTORY_WEIGHTS.map(row => [...row]);
    this.biases = [...FACTORY_BIASES];
    this.epochs = 0;
    this.cumulativeReward = 0;
    this.logs = [];
    this.memoryCache.clear();

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(MEMORY_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const payload: RLPolicyState = {
          version: 1,
          epochs: this.epochs,
          cumulativeReward: this.cumulativeReward,
          averageReward: this.epochs > 0 ? this.cumulativeReward / this.epochs : 0,
          weights: this.weights,
          biases: this.biases,
          recentLogs: this.logs.slice(0, 10),
          noiseToleranceMultiplier: this.getNoisePenaltyMultiplier()
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (e) {
      console.warn('[DocuGuard RL] Unable to persist policy to storage:', e);
    }
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as RLPolicyState;
          if (parsed && Array.isArray(parsed.weights) && parsed.weights.length === 3) {
            this.weights = parsed.weights;
            this.biases = parsed.biases || [...FACTORY_BIASES];
            this.epochs = parsed.epochs || 0;
            this.cumulativeReward = parsed.cumulativeReward || 0;
            this.logs = parsed.recentLogs || [];
          }
        }
      }
    } catch (e) {
      console.warn('[DocuGuard RL] Unable to load policy from storage, using defaults:', e);
    }
  }

  private saveMemoryToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const entries = Array.from(this.memoryCache.entries());
        window.localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(entries));
      }
    } catch (e) {
      console.warn('[DocuGuard RL] Unable to persist memory cache:', e);
    }
  }

  private loadMemoryFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(MEMORY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as [string, DocumentFeedbackMemory][];
          if (Array.isArray(parsed)) {
            this.memoryCache = new Map(parsed);
          }
        }
      }
    } catch (e) {
      console.warn('[DocuGuard RL] Unable to load memory cache:', e);
    }
  }
}

// Global Singleton Instance
export const rlPolicyAgent = new RLPolicyAgent();
