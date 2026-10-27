export type VerdictType = 'Real' | 'Suspicious' | 'Tampered';

export interface VerdictConfig {
  hex: string;
  glow: string;
  bg: string;
  border: string;
  label: string;
  sub: string;
  badge: string;
}

export interface ForensicEvidenceItem {
  category: 'texture' | 'compression' | 'metadata' | 'layout' | 'ocr';
  weight: number;
  observation: string;
  explanation: string;
  severity: 'pass' | 'warn' | 'fail';
  confidence: number;
  // Human-centered 4-part breakdown
  howChecked?: string;
  whyItMatters?: string;
  limitations?: string;
}

export interface OCRFields {
  fullName?: string;
  documentId?: string;
  dateOfBirth?: string;
  gender?: string;
  expiryDate?: string;
  address?: string;
  documentType?: string;
  [key: string]: string | undefined;
}

export interface DocumentVerificationData {
  documentId: string;
  fileName: string;
  generatedAt: string;
  score: number; // 0 to 100
  verdict: VerdictType;
  imageBlobUrl: string;
  croppedImage?: Blob;
  boundaryConfidence: number;
  qr: string | null;
  faceRegion: { x: number; y: number; width: number; height: number } | null;
  compressionArtifacts: {
    inconsistencyScore: number;
  };
  qualityCheck: {
    blurScore: number;
    brightnessOk: boolean;
    passed: boolean;
  };
  metadata: {
    exifPresent: boolean;
    software?: string;
    anomalies: string[];
  };
  ocr: {
    fields: OCRFields;
    rawText: string;
    confidence: number;
  };
  evidence: ForensicEvidenceItem[];
}

export interface SampleDocPreset {
  id: string;
  label: string;
  color: string;
  bg: string;
  documentName: string;
  score: number;
  verdict: VerdictType;
  fields: OCRFields;
  rawText: string;
  evidence: ForensicEvidenceItem[];
  generateImage: () => string;
}
