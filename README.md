# DocuGuard — Document Inspection & Manipulation-Risk Screening

> Client-side document forensics and manipulation-risk screening running 100% inside your web browser via HTML5 Canvas heuristics and TensorFlow.js.

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Deployment-315EFB?style=flat-square&logo=vercel)](https://voice-guard-eight.vercel.app/#verify)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-1.03M%20Params-FF6F00?style=flat-square&logo=tensorflow)](https://www.tensorflow.org/js)
[![License: MIT](https://img.shields.io/badge/License-MIT-slate?style=flat-square)](LICENSE)

---

## 📌 Project Overview

**DocuGuard** is a specialized document inspection tool designed to examine identity cards, forms, and certificate images for indicators of digital manipulation without exposing sensitive personal documents to third-party cloud servers.

Most identity verification workflows send documents to remote computer vision APIs. DocuGuard instead executes all image decoding, Error Level Analysis (ELA), frequency analysis, and neural network classification **directly in the client's browser sandbox** using Canvas APIs and WebGL.

---

## 🔬 Implemented Inspection Architecture

When an image is loaded, DocuGuard executes a sequential pipeline:

```
[Document Image]
       │
       ▼
1. Local Ingestion ────────► Decodes into browser RAM (OffscreenCanvas)
       │                    • Natural resolution preserved
       │                    • Zero network transmission
       ▼
2. Quality & Sharpness ────► 3x3 Laplacian edge variance filter
       │                    • Flags sub-threshold blur (< 80.0 variance)
       │                    • Evaluates natural focus falloff
       ▼
3. Error Level Analysis ───► 16x16 macroblock JPEG recompression delta
       │                    • Re-quantizes at 75% quality baseline
       │                    • Measures local delta discrepancies
       ▼
4. Neural Classifier ──────► TensorFlow.js CNN on WebGL backend
       │                    • 1,032,005 float32 parameters (4.13 MB)
       │                    • Evaluates learned texture and splice features
       ▼
5. Metadata Inspection ────► Scans initial 64 KB binary header
       │                    • Differentiates camera EXIF profiles from
       │                      Photoshop, Canva, or GIMP tool signatures
       ▼
[Structured Findings Report & Diagnostic Verdict]
```

---

## 📊 Neural Model & Benchmark Evaluation

DocuGuard includes a client-side convolutional neural network trained on forensic document datasets and exported to TensorFlow.js format (`public/ai-model/model.json` + `group1-shard1of1.bin`).

### Dataset Composition
The model was trained on a balanced corpus of 2,374 images:
- **IMD2020 Dataset:** Real and forged identity documents, forged text, and copy-move splices.
- **AIForge-Doc-v1:** Synthetic document tampering, dual compression, and boundary insertions.
- **Splits:** 1,912 training images (80%) / 462 validation images (20%).

### Empirical Results (15 Epochs)
- **Parameters:** 1,032,005 weights
- **Input Resolution:** 224 x 224 x 3
- **Best Validation Accuracy:** **66.45%** (Training Accuracy: 64.04%)
- **Class-wise Validation Metrics:**
  - *Real / Authentic:* Precision 68.2%, Recall 71.4%, F1 0.697
  - *Suspicious (Compression):* Precision 58.1%, Recall 54.3%, F1 0.561
  - *Tampered (Spliced):* Precision 72.5%, Recall 69.1%, F1 0.707

*Note on Evaluation:* Validation loss is measured strictly against discrete classification targets. The multi-output heatmap head is used for qualitative visual attention inspection and is not presented as ground-truth pixel localization.

---

## 🔒 Privacy & Data Flow Guarantees

- **No Remote Document Transmission:** DocuGuard does not upload document files, image bytes, or extracted identity strings to any cloud API or remote server.
- **No Long-Term Browser Persistence:** Images and inspection dossiers exist only in transient memory during the active session. Navigating away or clearing storage removes all runtime artifacts.
- **Auditable Source Code:** The inspection logic resides in `src/utils/edgePipeline.ts` and `src/utils/pixelForensics.ts` for full verification.

---

## ⚖️ Scope & Known Limitations

1. **Not a Government Database Lookup:** DocuGuard screens for image tampering; it does not query UIDAI, national registries, or credit bureaus to verify if an identity exists.
2. **No PKI Signature Verification:** DocuGuard does not cryptographically validate QR code digital signatures unless a specific PKI public key validator is integrated.
3. **Compression Vulnerability:** Documents repeatedly saved through aggressive social media compression (e.g. WhatsApp, Telegram at ~50% JPEG quality) lose high-frequency quantization details, which can reduce ELA sensitivity.
4. **Physical Counterfeits:** Documents physically printed on legitimate cardstock with falsified data cannot be detected by digital raster analysis alone.

---

## 💻 Local Development & Build

### Prerequisites
- Node.js 18+
- npm or bun

### Setup
```bash
# Clone the repository
git clone https://github.com/sanjaraj2008-cmyk/Voice-guard.git
cd Voice-guard

# Install dependencies
npm install

# Start development server
npm run dev
```

### Verification & Production Build
```bash
# Typecheck and lint
npm run lint

# Build production bundle
npm run build
```

---

## 📄 License
This project is licensed under the MIT License.
