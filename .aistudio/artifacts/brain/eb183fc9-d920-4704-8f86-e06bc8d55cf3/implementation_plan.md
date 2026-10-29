# Full Codebase, Forensic Algorithm & Reinforcement Learning Rectification Plan

## 1. Executive Summary & Audit Findings
A complete audit of the codebase, forensic algorithms, and Reinforcement Learning (`RLPolicyAgent`) revealed several concrete bugs and architectural dissimilarities:

1. **RL Score Freezing in `recomputeVerdictWithRL` (`src/utils/edgePipeline.ts`)**:
   - `let finalScore = typeof currentData.score === 'number' ? currentData.score : rlPred.calibratedScore;` prevented the document's score from updating when RL policy weights changed, when the sensitivity slider was moved, or when OCR fields/checksums were edited (`updateDocumentOCRFields`), unless a hardcoded SHA-256 memory override occurred.
2. **Unused Evidence Penalties & RL Noise Multiplier (`src/utils/edgePipeline.ts`)**:
   - `runEdgeVerificationPipeline` computed `scorePenalties` using `rlPolicyAgent.getNoisePenaltyMultiplier()`, but then discarded `scorePenalties` and assigned `finalScore = rlPred.calibratedScore`.
3. **RL Policy Gradient Stability & SHA-256 Memory Blending (`src/utils/rlEngine.ts`)**:
   - `learnFromFeedback` lacked L2 weight decay and weight clamping (`[-8, 8]`), risking logit saturation on repeated confirmations, and assigned a positive reward (`+0.4`) when a tampered document (`targetGroundTruth = 2`) was misclassified as suspicious (`predictedAction = 1`).
   - `predictVerdict` returned static probabilities (`[0.96, 0.03, 0.01]`) on a SHA-256 memory hit, completely ignoring live OCR/checksum edits (`features[5]`) and sensitivity adjustments.
4. **Broken Sample Document Presets (`src/pages/VerifyPage.tsx` & `src/utils/edgePipeline.ts`)**:
   - `VerifyPage.tsx` passed preset IDs `'clean'`, `'suspicious'`, and `'tampered'` to `handleLoadPreset`, while `SAMPLE_PRESETS` in `edgePipeline.ts` used `'clean-id'`, `'suspicious-id'`, and `'forged-id'`, causing sample buttons to fail silently.
   - Filename matchers in `edgePipeline.ts` checked `suspicious_rephoto` and `forged_tampered`, which did not match `Suspicious_ID_Compression_Mismatch.png` or `Forged_Screen_Photo_Tampered.png`.
5. **Validator & Cross-Page UI/UX Dissimilarities**:
   - `validatePanCard` (`src/utils/checksumValidators.ts`) matched `L` and `J` in its regex but omitted `'L': 'Local Authority'` and `'J': 'Artificial Juridical Person'` from `typeMap`.
   - `HomePage.tsx` and `VerifyPage.tsx` were missing the previously requested smooth vertical scroll-up hero text carousel and the PDF export settings modal (`Standard` vs. `Forensic Report` toggle) plus the collapsible OCR diagnostics/error log drawer.
   - `InsightsPage.tsx`, `SecurityPage.tsx`, and `SettingsPage.tsx` used legacy light-theme classes (`bg-[#F7F8FA]`, `vg-card`) instead of the unified dark forensic theme (`#0b0e14` / `#121624`), and `SettingsPage.tsx` cleared `localStorage` without resetting the in-memory `rlPolicyAgent` singleton.

---

## 2. Proposed Architecture & Code Changes

### A. Reinforcement Learning Engine (`src/utils/rlEngine.ts`)
- **Mathematical Stability & Weight Regularization**:
  - Add L2 weight regularization (`decay = 0.005`) and clamp weights to `[-8.0, 8.0]` and biases to `[-4.0, 4.0]` inside `learnFromFeedback` to prevent softmax saturation and `NaN`/`Infinity` drift.
  - Ensure all features in `getActionProbabilities` are finite numbers bounded in `[0, 1]`.
  - Fix reward assignment when `targetGroundTruth === 2 && predictedAction === 1` so partial detection of a tampered document applies a corrective gradient toward class `2` (`Tampered`) while recording an accurate reward signal.
- **Memory Prior + Live Policy & OCR Blending (`predictVerdict`)**:
  - When a document's SHA-256 is found in `memoryCache`, blend the remembered ground-truth distribution with the live policy softmax distribution (`getActionProbabilities(features)`) and apply a live penalty if the user subsequently edits OCR fields into an invalid checksum (`features[5] === 0`), while still respecting `isMemoryMatch: true` for intact remembered documents.

### B. Edge Verification Pipeline & Score Synchronization (`src/utils/edgePipeline.ts`)
- **Blended Score Computation (`computeBlendedForensicScore`)**:
  - Create a shared helper used by both `runEdgeVerificationPipeline` and `recomputeVerdictWithRL` that blends the RL policy's `calibratedScore` (65% weight) with the evidence-based score `100 - scorePenalties` (35% weight, scaled by `rlPolicyAgent.getNoisePenaltyMultiplier()` and adjusted by `sensitivityOffset`).
  - Ensure editing OCR fields (`updateDocumentOCRFields`), re-scanning OCR (`reScanDocumentOCR`), providing RL feedback, or sliding the strictness threshold immediately recalculates `finalScore`, `verdict`, `conceptEvaluation`, and `rlCalibration` in lockstep.
- **Sample Preset ID & Filename Alignment**:
  - Support both `'clean'` / `'clean-id'`, `'suspicious'` / `'suspicious-id'`, and `'tampered'` / `'forged-id'` in preset lookup and align `isCleanPreset`, `isSuspiciousPreset`, and `isForgedPreset` matchers with `SAMPLE_PRESETS` document names.

### C. Checksum & Chronology Validators (`src/utils/checksumValidators.ts`)
- Add `'L': 'Local Authority'` and `'J': 'Artificial Juridical Person'` to `validatePanCard`'s `typeMap`.
- Validate calendar day/month bounds strictly in `validateDateOfBirth` (rejecting invalid calendar rollovers like `31/02/1995`).

### D. Unified UI Theme & Restored Features (`src/pages/*` & `src/utils/pdfDossier.ts`)
- **`HomePage.tsx`**:
  - Restore the smooth vertical scroll-up cycling headline carousel in the hero section (`with confidence and privacy.`, `with zero cloud exposure.`, `with instant pixel forensics.`, `with neural OCR precision.`).
- **`VerifyPage.tsx` & `pdfDossier.ts`**:
  - Fix sample preset buttons so clicking Genuine, Screen Re-photography, or Digitally Altered ID loads and runs the full verification pipeline.
  - Restore the PDF Export Settings Modal allowing users to toggle between **Standard Summary** and **Forensic Report** (with optional SHA-256 provenance and raw OCR text inclusion) before downloading.
  - Enhance the OCR Diagnostics & Error Log panel to clearly surface pass counts, engine status, and actionable troubleshooting reasons when recognition encounters low-contrast or degraded inputs.
- **`InsightsPage.tsx`, `SecurityPage.tsx`, `SettingsPage.tsx`**:
  - Unify styling with the dark forensic theme (`bg-[#0b0e14]`, `bg-[#121624]`, `border-slate-800`) and ensure "Clear session data" in `SettingsPage.tsx` also calls `rlPolicyAgent.resetToFactory()`.

---

## 3. Verification & Testing Plan
- Expand `test/run-tests.ts` to test:
  - Blended RL + evidence penalty score calculation and live score updates in `recomputeVerdictWithRL` and `updateDocumentOCRFields`.
  - RL weight clamping, L2 regularization, and memory-match + OCR checksum interaction.
  - All 10 PAN entity types (`P, C, H, F, A, T, B, L, J, G`) and strict calendar date validation.
  - Sample preset ID and filename resolution.
- Run `npm test`, `lint_applet`, and `compile_applet` to verify zero errors and 100% passing tests.
