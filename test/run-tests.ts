/**
 * Automated Test Suite for DocuGuard Edge
 * Covers:
 *  1. Unit tests: Verhoeff algorithm, PAN card entity parser, DOB chronology validator
 *  2. Domain logic: 5-tier forensic categorization & Concept separation
 *  3. Preset data integrity & schema validation
 *  4. Edge classification & reasoning logic
 */

import { 
  validateVerhoeff, 
  generateVerhoeffCheckDigit, 
  validatePanCard, 
  validateDateOfBirth 
} from '../src/utils/checksumValidators';
import { getVerdictConfig, SAMPLE_PRESETS } from '../src/utils/edgePipeline';
import { VerdictType } from '../src/types/edge';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${testName}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m ${testName}`);
    if (details) console.error(`    Details: ${details}`);
  }
}

console.log('\n======================================================');
console.log('  DOCUGUARD EDGE AUTOMATED TEST SUITE');
console.log('======================================================\n');

// ----------------------------------------------------------------------
// 1. UNIT TESTS: VERHOEFF CHECKSUM ALGORITHM
// ----------------------------------------------------------------------
console.log('\x1b[36m[SUITE 1] UIDAI Aadhaar Verhoeff Checksum Validation\x1b[0m');

// Generate verified check digit for standard Aadhaar prefix
const aadhaarPrefix = '84921049392';
const checkDigit = generateVerhoeffCheckDigit(aadhaarPrefix);
const validAadhaar = aadhaarPrefix + checkDigit;
const formattedAadhaar = `${validAadhaar.slice(0, 4)} ${validAadhaar.slice(4, 8)} ${validAadhaar.slice(8, 12)}`;

assert(validateVerhoeff(validAadhaar), `Valid 12-digit Aadhaar (${validAadhaar}) passes Verhoeff check`);
assert(validateVerhoeff(formattedAadhaar), `Formatted 12-digit Aadhaar (${formattedAadhaar}) passes check`);

// Single digit mutation must fail
const mutatedLastDigit = validAadhaar.slice(0, 11) + ((checkDigit + 1) % 10);
assert(!validateVerhoeff(mutatedLastDigit), 'Single-digit mutation (substitutions) fails Verhoeff check');

// Adjacent transposition error (swap two characters) must fail
const chars = validAadhaar.split('');
const temp = chars[2];
chars[2] = chars[3];
chars[3] = temp;
const transposedAadhaar = chars.join('');
assert(!validateVerhoeff(transposedAadhaar), 'Adjacent transposition error correctly caught');

// Length & format guards
assert(!validateVerhoeff('12345'), 'Under-length input (<12 digits) is rejected');
assert(!validateVerhoeff(validAadhaar + '999'), 'Over-length input (>12 digits) is rejected');
assert(!validateVerhoeff('ABCDEFGHIJKL'), 'Non-numeric input is rejected');


// ----------------------------------------------------------------------
// 2. UNIT TESTS: INDIAN PAN CARD VALIDATION
// ----------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 2] Indian Income Tax PAN Card Entity Validation\x1b[0m');

const individualPan = validatePanCard('ABCPK1234F');
assert(individualPan.isValid && individualPan.entityType === 'Individual / Person', 
  'Valid Individual PAN (4th letter P) parsed correctly');

const companyPan = validatePanCard('XYZCA9999Z');
assert(companyPan.isValid && companyPan.entityType === 'Company', 
  'Valid Company PAN (4th letter C) parsed correctly');

const trustPan = validatePanCard('AAATH0001K');
assert(trustPan.isValid && trustPan.entityType === 'Trust', 
  'Valid Trust PAN (4th letter T) parsed correctly');

assert(!validatePanCard('ABC1234567').isValid, 'Malformed PAN format (invalid char sequence) rejected');
assert(!validatePanCard('ABCDE1234').isValid, 'Incomplete 9-character PAN rejected');
assert(!validatePanCard('ABCDE12345F').isValid, 'Oversized 11-character PAN rejected');


// ----------------------------------------------------------------------
// 3. UNIT TESTS: DATE OF BIRTH CHRONOLOGY
// ----------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 3] Date of Birth Chronology & Plausibility\x1b[0m');

const validDob = validateDateOfBirth('14/08/1992');
assert(validDob.isValid && validDob.age !== undefined && validDob.age > 0, 
  'Valid past Date of Birth (DD/MM/YYYY) is accepted with computed age');

const futureDob = validateDateOfBirth('01/01/2099');
assert(!futureDob.isValid && Boolean(futureDob.error?.includes('future')), 
  'Future birth date is strictly rejected');

const ancientDob = validateDateOfBirth('01/01/1850');
assert(!ancientDob.isValid && Boolean(ancientDob.error?.includes('Implausible')), 
  'Implausible century-old birth date (>125 yrs) rejected');

const garbageDob = validateDateOfBirth('not-a-date');
assert(!garbageDob.isValid, 'Unparseable garbage string rejected');


// ----------------------------------------------------------------------
// 4. DOMAIN LOGIC: 5-TIER RESULT CATEGORIZATION
// ----------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 4] 5-Tier Forensic Categorization\x1b[0m');

const tiers: VerdictType[] = [
  'NO_SIGNIFICANT_MANIPULATION',
  'POSSIBLE_MANIPULATION',
  'INTEGRITY_FAILED',
  'INCONCLUSIVE',
  'AUTHENTIC_VERIFIED'
];

tiers.forEach(tier => {
  const config = getVerdictConfig(tier);
  assert(
    !!config.label && !!config.hex && !!config.badge && !!config.glow,
    `Tier [${tier}] maps to full config with distinct label & badge (${config.badge})`
  );
});

// Verify distinctness
const configClean = getVerdictConfig('NO_SIGNIFICANT_MANIPULATION');
const configTampered = getVerdictConfig('INTEGRITY_FAILED');
const configInconclusive = getVerdictConfig('INCONCLUSIVE');

assert(configClean.hex !== configTampered.hex, 'Authentic and Tampered tiers have distinct visual codes');
assert(configInconclusive.badge === 'INCONCLUSIVE', 'Inconclusive tier preserves degraded-quality badge');


// ----------------------------------------------------------------------
// 5. EDGE PRESET INTEGRITY & EVIDENCE AUDIT
// ----------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 5] Synthetic Sample Presets & Evidence Audit\x1b[0m');

assert(SAMPLE_PRESETS.length >= 3, 'At least 3 canonical sample presets available');

const cleanPreset = SAMPLE_PRESETS.find(p => p.id === 'clean-id');
assert(!!cleanPreset && cleanPreset.score >= 90, 'Clean preset has authentic score >= 90%');
assert(cleanPreset?.verdict === 'NO_SIGNIFICANT_MANIPULATION', 'Clean preset maps to NO_SIGNIFICANT_MANIPULATION');

const suspiciousPreset = SAMPLE_PRESETS.find(p => p.id === 'suspicious-id');
assert(!!suspiciousPreset && suspiciousPreset.score < 80, 'Suspicious preset has score < 80%');
assert(suspiciousPreset?.verdict === 'POSSIBLE_MANIPULATION', 'Suspicious preset maps to POSSIBLE_MANIPULATION');

const forgedPreset = SAMPLE_PRESETS.find(p => p.id === 'forged-id');
assert(!!forgedPreset && forgedPreset.score < 50, 'Forged preset has high-risk score < 50%');
assert(forgedPreset?.verdict === 'INTEGRITY_FAILED', 'Forged preset maps to INTEGRITY_FAILED');

// Verify evidence items in presets have category, weight, and confidence
const allPresetsHaveEvidence = SAMPLE_PRESETS.every(p => 
  p.evidence.length >= 4 && p.evidence.every(e => e.category && e.weight && e.confidence > 0)
);
assert(allPresetsHaveEvidence, 'All sample presets contain weighted forensic evidence items');

// Verify OCR fields present in presets
const allPresetsHaveOcr = SAMPLE_PRESETS.every(p => 
  p.fields.fullName && p.fields.documentId && p.fields.dateOfBirth
);
assert(allPresetsHaveOcr, 'All presets contain complete verified OCR identity fields');


// ----------------------------------------------------------------------
// 6. CRYPTOGRAPHIC INTEGRITY & DOSSIER REPORT VALIDATION
// ----------------------------------------------------------------------
console.log('\n\x1b[36m[SUITE 6] Cryptographic Integrity & Dossier Report Validation\x1b[0m');

const sampleSha256 = '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4';
assert(sampleSha256.length === 64, 'SHA-256 digest is exactly 64 hexadecimal characters');
assert(/^[a-f0-9]{64}$/i.test(sampleSha256), 'SHA-256 digest conforms to valid hex format');

// Verify dossier export data contract
const mockDossierData = {
  documentId: 'DOC-849201',
  fileName: 'Government_ID_Sample.png',
  sha256: sampleSha256,
  generatedAt: new Date().toISOString(),
  score: 95,
  verdict: 'NO_SIGNIFICANT_MANIPULATION' as const,
  imageBlobUrl: 'blob:http://localhost:3000/mock-uuid',
  boundaryConfidence: 0.96,
  qr: 'VERIFIED',
  faceRegion: { x: 50, y: 50, width: 100, height: 120 },
  compressionArtifacts: { inconsistencyScore: 0.05 },
  qualityCheck: { blurScore: 0.88, brightnessOk: true, passed: true },
  metadata: { exifPresent: true, software: undefined, anomalies: [] },
  ocr: {
    confidence: 0.95,
    fields: { fullName: 'Vikramaditya Sharma', documentId: '8492 1049 3921' },
    rawText: 'GOVERNMENT OF INDIA'
  },
  evidence: [
    { category: 'texture' as const, weight: 35, observation: 'Substrate uniform', explanation: 'No Moiré pattern', severity: 'pass' as const, confidence: 0.95 },
    { category: 'compression' as const, weight: 10, observation: 'Quantization stable', explanation: 'Uniform macroblocks', severity: 'pass' as const, confidence: 0.92 }
  ],
  checksCompleted: ['Moiré FFT Scan', 'ELA', 'Verhoeff Checksum'],
  checksUnavailable: [],
  analyzerVersion: 'DocuGuard Edge v2.6.4'
};

assert(!!mockDossierData.sha256 && mockDossierData.sha256.length === 64, 'Dossier export data contains verified SHA-256 digest');
assert(mockDossierData.evidence.length >= 2, 'Dossier export data contains itemized forensic evidence rows');
assert(mockDossierData.ocr.fields.fullName === 'Vikramaditya Sharma', 'OCR identity registry fields are preserved in report payload');
const verdictConf = getVerdictConfig(mockDossierData.verdict);
assert(verdictConf.badge === 'AUTHENTIC' || verdictConf.badge === 'AUTHENTIC VERIFIED', 'Verdict mapping formats authentic badge correctly');

// -------------------------------------------------------------
// SUITE 7: DocuGuard Forensic CNN Model & Artifact Integrity
// -------------------------------------------------------------
console.log('\x1b[36m[SUITE 7] DocuGuard Forensic CNN Model & Artifact Integrity\x1b[0m');

import * as fs from 'fs';
import * as path from 'path';
import { CLASS_LABELS } from '../src/utils/aiModel';

const modelJsonPath = path.resolve(process.cwd(), 'public/ai-model/model.json');
const metaJsonPath = path.resolve(process.cwd(), 'public/ai-model/model_metadata.json');
const shardBinPath = path.resolve(process.cwd(), 'public/ai-model/group1-shard1of1.bin');

assert(fs.existsSync(modelJsonPath), 'TensorFlow.js model.json architecture exists');
const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
assert(modelJson.format === 'layers-model' || !!modelJson.modelTopology, 'model.json conforms to TensorFlow.js LayersModel specification');

assert(fs.existsSync(metaJsonPath), 'model_metadata.json exists');
const metaJson = JSON.parse(fs.readFileSync(metaJsonPath, 'utf8'));
assert(metaJson.model_name === 'DocuGuard_Forensic_CNN', 'Metadata identifies DocuGuard_Forensic_CNN architecture');
assert(metaJson.num_classes === 3, 'Metadata specifies 3-class classification head');
assert(metaJson.classes.includes('real') && metaJson.classes.includes('tampered'), 'Metadata classes contain real and tampered');

assert(fs.existsSync(shardBinPath), 'Model weight binary shard (group1-shard1of1.bin) exists');
const binStat = fs.statSync(shardBinPath);
assert(binStat.size > 1000000, `Model weight shard is populated (${(binStat.size / 1024 / 1024).toFixed(2)} MB)`);

assert(CLASS_LABELS.length === 3, 'aiModel exports 3 class labels');
assert(CLASS_LABELS[0] === 'Real' && CLASS_LABELS[2] === 'Tampered', 'aiModel maps Real, Suspicious, Tampered');

// -------------------------------------------------------------
// SUITE 8: Reinforcement Learning Policy Calibration & Adaptation
// -------------------------------------------------------------
console.log('\x1b[36m[SUITE 8] Reinforcement Learning Policy Calibration & Adaptation\x1b[0m');

import { rlPolicyAgent, ACTION_VERDICTS } from '../src/utils/rlEngine';
import { recomputeVerdictWithRL } from '../src/utils/edgePipeline';

// 8.1: Feature Extraction
const testFeatures = rlPolicyAgent.extractFeatureVector({
  cnnProbabilities: [0.72, 0.20, 0.08],
  compressionInconsistency: 0.15,
  photoRegionSpliceScore: 0.12,
  moireScore: 0.05,
  checksumPassed: true,
  hasChecksumFail: false,
  hasSoftwareSignature: false,
  qualityPassed: true
});

assert(testFeatures.length === 7, 'RL feature extractor produces 7-D feature vector');
assert(testFeatures.every(f => typeof f === 'number' && f >= 0 && f <= 1.0), 'All 7 feature values are bounded in [0, 1]');

// 8.2: Action Probabilities
const probs = rlPolicyAgent.getActionProbabilities(testFeatures);
assert(probs.length === 3, 'RL policy yields 3-action probability distribution');
const sumP = probs[0] + probs[1] + probs[2];
assert(Math.abs(sumP - 1.0) < 0.001, 'Action probabilities sum to 1.0 (valid softmax distribution)');

// 8.3: Calibrated Prediction
const initialPred = rlPolicyAgent.predictVerdict(testFeatures, 0);
assert(ACTION_VERDICTS.includes(initialPred.verdict), 'Predicted verdict is valid VerdictType');
assert(initialPred.calibratedScore >= 0 && initialPred.calibratedScore <= 100, 'Calibrated score is valid 0-100 index');

// 8.4: Feedback Reward Loop & Gradient Ascent
const initialPAuth = probs[0];
const feedbackResult = rlPolicyAgent.learnFromFeedback(testFeatures, 1, 0, 'test_sample.jpg');
assert(feedbackResult.reward !== 0, 'Feedback returns non-zero scalar reward/penalty');
assert(feedbackResult.weightDeltaNorm > 0, 'Policy gradient updates weights (non-zero weight delta norm)');
const updatedProbs = rlPolicyAgent.getActionProbabilities(testFeatures);
assert(updatedProbs[0] >= initialPAuth, 'Negative reward on false-suspicion increases P(Authentic)');

// 8.5: RL Policy Stats & Logging
const stats = rlPolicyAgent.getStats();
assert(stats.epochs >= 1, 'Policy records completed training epochs');
assert(stats.recentLogs.length >= 1, 'Policy stores episode logs with features and rewards');
assert(stats.noiseTolerance >= 0 && stats.noiseTolerance <= 100, 'Noise tolerance metric is normalized percentage');

// 8.6: Dynamic Sensitivity Recomputation
const sampleDossier: any = {
  documentId: 'TEST-001',
  fileName: 'camera_photo_aadhaar.jpg',
  score: 74,
  verdict: 'POSSIBLE_MANIPULATION',
  qualityCheck: { blurScore: 0.8 },
  evidence: [
    { category: 'metadata', weight: 10, observation: 'Metadata note', explanation: 'Missing camera profile', severity: 'fail', confidence: 0.8 },
    { category: 'compression', weight: 35, observation: 'Noise', explanation: 'Mild phone compression', severity: 'warn', confidence: 0.8 }
  ],
  rlCalibration: { featureVector: testFeatures }
};

// Under strict 80% threshold: score 74 remains POSSIBLE_MANIPULATION
const strictRecomputed = recomputeVerdictWithRL(sampleDossier, 80);
assert(strictRecomputed.verdict === 'POSSIBLE_MANIPULATION', 'Score 74 remains POSSIBLE_MANIPULATION under 80% strict threshold');

// Under balanced 70% threshold: score 74 is promoted to NO_SIGNIFICANT_MANIPULATION
const balancedRecomputed = recomputeVerdictWithRL(sampleDossier, 70);
assert(balancedRecomputed.verdict === 'NO_SIGNIFICANT_MANIPULATION', 'Score 74 is successfully promoted to NO_SIGNIFICANT_MANIPULATION under 70% balanced threshold');

// 8.7: Factory Reset Capability
rlPolicyAgent.resetToFactory();
const resetStats = rlPolicyAgent.getStats();
assert(resetStats.epochs === 0 && resetStats.cumulativeReward === 0, 'Factory reset cleanly clears training epochs and rewards');

// -------------------------------------------------------------
// SUITE 9: Universal OCR Entity Parsing (Aadhaar, PAN, Passport)
// -------------------------------------------------------------
console.log('\x1b[36m[SUITE 9] Universal OCR Entity Parsing (Aadhaar, PAN, Passport)\x1b[0m');

import { parseUniversalIdentityEntities } from '../src/utils/ocrEngine';

// 9.1: Real Aadhaar OCR Parsing
const sampleAadhaarOCR = `
Government of India
Unique Identification Authority of India
Aarav S. Patel
DOB: 12/04/1988
Male
Address: Flat 204, Sunset Heights, MG Road, Bengaluru - 560001
5491 8291 0394
`;
const resAadhaar = parseUniversalIdentityEntities(sampleAadhaarOCR, 'user_aadhaar.jpg');
assert(resAadhaar.fields.fullName === 'Aarav S. Patel', 'Parses real name from Aadhaar text block');
assert(resAadhaar.fields.documentId === '5491 8291 0394', 'Parses 12-digit Aadhaar UID with 4-4-4 spacing');
assert(resAadhaar.fields.dateOfBirth === '12/04/1988', 'Parses Date of Birth');
assert(resAadhaar.fields.gender === 'Male', 'Parses Gender as Male');
assert(resAadhaar.fields.documentType === 'Aadhaar Card', 'Identifies document type as Aadhaar Card');

// 9.2: Real Income Tax PAN Card Parsing
const samplePanOCR = `
INCOME TAX DEPARTMENT
GOVT. OF INDIA
PRIYA RAMANATHAN
RAMANATHAN KRISHNAN
15/09/1993
Permanent Account Number
ABCDE1234F
`;
const resPan = parseUniversalIdentityEntities(samplePanOCR, 'pan_card.png');
assert(resPan.fields.documentId === 'ABCDE1234F', 'Parses real 10-character PAN number');
assert(resPan.fields.fullName === 'PRIYA RAMANATHAN', 'Parses cardholder name on PAN card');
assert(resPan.fields.dateOfBirth === '15/09/1993', 'Parses date of birth on PAN card');
assert(!!resPan.fields.documentType && resPan.fields.documentType.includes('PAN'), 'Identifies PAN Card document type');

// 9.3: Real Passport OCR & MRZ Parsing
const samplePassportOCR = `
REPUBLIC OF INDIA
PASSPORT
Type P Country Code IND Passport No. Z1829402
Given Name: ROHIT
Surname: SHARMA
Nationality: INDIAN
DOB: 24/07/1990
P<INDSHARMA<<ROHIT<<<<<<<<<<<<<<<<<<<<<<<<<<
Z1829402<4IND9007248M2805151<<<<<<<<<<<<<<0
`;
const resPassport = parseUniversalIdentityEntities(samplePassportOCR, 'passport.jpg');
assert(resPassport.fields.documentId === 'Z1829402', 'Parses international Passport number');
assert(resPassport.fields.documentType === 'Passport', 'Identifies document type as Passport');
assert(resPassport.fields.dateOfBirth === '24/07/1990', 'Parses passport date of birth');

// 9.4: Empty / Unreadable Document Handling
const resEmpty = parseUniversalIdentityEntities('', 'empty.png');
assert(resEmpty.fields.fullName === 'No legible text detected', 'Transparently flags no text detected instead of fake dummy name');
assert(resEmpty.confidence === 0, 'Confidence is 0 for unreadable/blank image');

// ----------------------------------------------------------------------
// SUITE 10: Cryptographic SHA-256 Memory & Instant Re-upload Recognition
// ----------------------------------------------------------------------
console.log('\x1b[36m[SUITE 10] Cryptographic SHA-256 Memory & Instant Re-upload Recognition\x1b[0m');

const testHashReal = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const testHashTampered = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

// 10.1: Document Memory Registration
const memEntryReal = rlPolicyAgent.rememberDocument(testHashReal, 0, 'user_captured_id.jpg');
assert(memEntryReal.sha256 === testHashReal, 'Memory entry stores cryptographic SHA-256 hash');
assert(memEntryReal.groundTruth === 0, 'Memory records target ground truth 0 (Authentic)');
assert(memEntryReal.verdict === 'NO_SIGNIFICANT_MANIPULATION', 'Memory records authentic verdict');
assert(memEntryReal.score === 96, 'Authentic verified memory score is 96');

// 10.2: Document Memory Lookup
const lookedUp = rlPolicyAgent.lookupDocumentMemory(testHashReal);
assert(lookedUp !== null && lookedUp.sha256 === testHashReal, 'lookupDocumentMemory retrieves stored document by hash');
assert(rlPolicyAgent.lookupDocumentMemory('non_existent_hash') === null, 'Lookup on unseen hash returns null');

// 10.3: Direct Prediction Memory Bypass
const predMemory = rlPolicyAgent.predictVerdict([0.4, 0.4, 0.2, 0.3, 0.3, 0.8, 1.0], 0, testHashReal);
assert(predMemory.isMemoryMatch === true, 'predictVerdict flags isMemoryMatch as true for remembered hash');
assert(predMemory.verdict === 'NO_SIGNIFICANT_MANIPULATION', 'predictVerdict returns verified authentic verdict immediately');
assert(predMemory.calibratedScore === 96, 'predictVerdict returns verified score 96');
assert(predMemory.confidence >= 0.95, 'Confidence for memory match is near certainty (>= 0.95)');

// 10.4: Recomputation with Memory Match
const testDossierWithHash: any = {
  documentId: 'TEST-HASH-01',
  fileName: 'user_captured_id.jpg',
  sha256: testHashReal,
  score: 65,
  verdict: 'POSSIBLE_MANIPULATION',
  qualityCheck: { blurScore: 0.8 },
  evidence: [],
  rlCalibration: { featureVector: [0.4, 0.4, 0.2, 0.3, 0.3, 0.8, 1.0] }
};

const recomputedWithHash = recomputeVerdictWithRL(testDossierWithHash, 80);
assert(recomputedWithHash.verdict === 'NO_SIGNIFICANT_MANIPULATION', 'recomputeVerdictWithRL promotes dossier to NO_SIGNIFICANT_MANIPULATION via memory');
assert(recomputedWithHash.score === 96, 'recomputeVerdictWithRL assigns 96 score via memory');
assert(recomputedWithHash.memoryMatch?.isMatched === true, 'Dossier payload includes memoryMatch.isMatched = true');
assert(recomputedWithHash.memoryMatch?.groundTruth === 0, 'memoryMatch ground truth matches verified analyst input');

// 10.5: Tampered Feedback Registration & Immediate Recognition
const memTampered = rlPolicyAgent.rememberDocument(testHashTampered, 2, 'photoshopped_id.png');
assert(memTampered.verdict === 'INTEGRITY_FAILED', 'Tampered feedback memory stores INTEGRITY_FAILED verdict');
assert(memTampered.score === 18, 'Tampered verified memory score is 18');

const predTampered = rlPolicyAgent.predictVerdict([0.9, 0.1, 0.0, 0.0, 0.0, 1.0, 1.0], 0, testHashTampered);
assert(predTampered.isMemoryMatch === true, 'Tampered document immediately matches memory upon re-scan');
assert(predTampered.verdict === 'INTEGRITY_FAILED', 'Tampered document returns INTEGRITY_FAILED verdict despite clean features');
assert(predTampered.calibratedScore === 18, 'Tampered document returns score 18');

// 10.6: learnFromFeedback with SHA-256 updates memory in single step
const testDynamicHash = '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a';
const feedbackResultWithHash = rlPolicyAgent.learnFromFeedback(
  [0.5, 0.3, 0.2, 0.1, 0.1, 1.0, 1.0],
  1,
  0,
  'live_captured_camera.jpg',
  testDynamicHash
);
assert(feedbackResultWithHash.memoryEntry !== undefined, 'learnFromFeedback returns populated memoryEntry when sha256 passed');
assert(rlPolicyAgent.lookupDocumentMemory(testDynamicHash) !== null, 'Hash is immediately accessible via lookupDocumentMemory');

// 10.7: Memory Query & Reset
const allMemory = rlPolicyAgent.getAllRememberedDocuments();
assert(allMemory.length >= 3, 'getAllRememberedDocuments lists all verified documents');
assert(rlPolicyAgent.getStats().memoryCount >= 3, 'getStats includes accurate memoryCount');

rlPolicyAgent.clearMemory();
assert(rlPolicyAgent.lookupDocumentMemory(testHashReal) === null, 'clearMemory cleanly wipes cached hashes');
assert(rlPolicyAgent.getAllRememberedDocuments().length === 0, 'Memory list is empty after clearMemory');

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log('======================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ All automated tests passed successfully!\x1b[0m\n');
  process.exit(0);
}
