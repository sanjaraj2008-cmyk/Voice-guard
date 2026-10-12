import { jsPDF } from 'jspdf';
import { DocumentVerificationData } from '../types/edge';
import { getVerdictConfig } from './edgePipeline';

export async function generateAndDownloadDossierPdf(data: DocumentVerificationData): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4' // 210 x 297 mm
  });

  const verdict = getVerdictConfig(data.verdict);

  // Background deep dark blue
  pdf.setFillColor(2, 4, 18);
  pdf.rect(0, 0, 210, 297, 'F');

  // Top header card
  pdf.setFillColor(9, 11, 40);
  pdf.roundedRect(12, 10, 186, 30, 3, 3, 'F');
  pdf.setDrawColor(30, 40, 85);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(12, 10, 186, 30, 3, 3, 'S');

  // Brand title
  pdf.setTextColor(139, 92, 246);
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DOCUGUARD EDGE  ·  AI FORENSIC INTELLIGENCE COMMAND CENTER', 20, 19);

  pdf.setTextColor(248, 250, 252);
  pdf.setFontSize(14);
  pdf.text('Identity Document Forensic Dossier', 20, 28);

  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Document ID: ${data.documentId}`, 20, 35);
  pdf.text(`Analyzed: ${new Date(data.generatedAt).toUTCString()}`, 85, 35);
  pdf.text('Engine: Edge-WASM v2.4', 155, 35);

  // Score Badge
  const badgeColor = data.verdict === 'Real' ? [16, 185, 129] : data.verdict === 'Suspicious' ? [245, 158, 11] : [225, 29, 72];
  pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  pdf.roundedRect(152, 12, 42, 26, 2.5, 2.5, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text(verdict.badge, 173, 21, { align: 'center' });
  pdf.setFontSize(15);
  pdf.text(`${data.score}/100`, 173, 32, { align: 'center' });

  let p = 46;

  const sectionHeader = (title: string, rgb: [number, number, number]) => {
    pdf.setFillColor(12, 15, 50);
    pdf.roundedRect(12, p, 186, 7, 1.5, 1.5, 'F');
    pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);
    pdf.setLineWidth(0.5);
    pdf.line(12, p, 12, p + 7);
    pdf.setTextColor(rgb[0], rgb[1], rgb[2]);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, 17, p + 4.8);
    p += 10;
  };

  const metricRow = (label: string, value: string, isAccent: boolean = false) => {
    pdf.setFillColor(6, 8, 28);
    pdf.rect(12, p, 186, 6.5, 'F');
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(label.toUpperCase(), 17, p + 4.3);

    if (isAccent) {
      pdf.setTextColor(34, 211, 238);
      pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setTextColor(241, 245, 249);
      pdf.setFont('helvetica', 'normal');
    }
    pdf.text(value, 85, p + 4.3);
    p += 7.5;
  };

  // 1. FORENSIC EXECUTIVE SUMMARY
  sectionHeader('1. FORENSIC EXECUTIVE SUMMARY & METRIC GAUGES', [34, 211, 238]);
  metricRow('Overall Trust Index', `${data.score} / 100`, true);
  metricRow('Verdict Classification', verdict.label, true);
  metricRow('OCR Plausibility Score', `${(100 * data.ocr.confidence).toFixed(1)}%`);
  metricRow('Boundary Geometric Alignment', `${(100 * data.boundaryConfidence).toFixed(1)}%`);
  metricRow('Compression Variance', `${(100 * data.compressionArtifacts.inconsistencyScore).toFixed(1)}%`);
  metricRow('Image Quality Screen', data.qualityCheck.passed ? 'PASSED (Clean)' : 'FAILED (Degraded)');
  metricRow('EXIF Metadata State', data.metadata.exifPresent ? 'Present (Captured)' : 'Stripped / Clean');
  p += 2;

  // 2. EXTRACTED OCR INTELLIGENCE REGISTRY
  sectionHeader('2. EXTRACTED OCR INTELLIGENCE REGISTRY', [139, 92, 246]);
  if (Object.keys(data.ocr.fields).length > 0) {
    for (const [key, val] of Object.entries(data.ocr.fields)) {
      if (val) metricRow(key, String(val));
    }
  } else {
    metricRow('OCR Fields', 'No structured key-value template recognized');
  }

  if (data.ocr.rawText) {
    pdf.setFillColor(6, 8, 28);
    pdf.rect(12, p, 186, 12, 'F');
    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(6.5);
    pdf.text('RAW EXTRACTED TEXT STREAM', 17, p + 4);
    pdf.setTextColor(203, 213, 225);
    const splitLines = pdf.splitTextToSize(data.ocr.rawText.replace(/\n/g, '  |  '), 170);
    pdf.text(splitLines.slice(0, 2), 17, p + 8.5);
    p += 15;
  }

  p += 2;

  // 3. ITEMIZED FORENSIC EVIDENCE & ANOMALY SIGNALS
  sectionHeader('3. ITEMIZED FORENSIC EVIDENCE & ANOMALY SIGNALS', [232, 121, 249]);
  for (const ev of data.evidence) {
    if (p > 260) {
      pdf.addPage();
      pdf.setFillColor(2, 4, 18);
      pdf.rect(0, 0, 210, 297, 'F');
      p = 15;
    }

    const sevColor = ev.severity === 'pass' ? [16, 185, 129] : ev.severity === 'warn' ? [245, 158, 11] : [225, 29, 72];
    pdf.setFillColor(6, 8, 28);
    pdf.roundedRect(12, p, 186, 12, 1, 1, 'F');
    pdf.setDrawColor(sevColor[0], sevColor[1], sevColor[2]);
    pdf.setLineWidth(0.4);
    pdf.line(12, p, 12, p + 12);

    pdf.setTextColor(sevColor[0], sevColor[1], sevColor[2]);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`[${ev.category.toUpperCase()}] ${ev.severity.toUpperCase()} (${(ev.confidence * 100).toFixed(0)}% Conf.)`, 16, p + 4);

    pdf.setTextColor(241, 245, 249);
    pdf.setFontSize(6.8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(ev.observation, 16, p + 8);

    pdf.setTextColor(148, 163, 184);
    pdf.setFontSize(6.2);
    pdf.setFont('helvetica', 'normal');
    pdf.text(ev.explanation, 16, p + 11);

    p += 14;
  }

  // Footer banner
  pdf.setFillColor(9, 11, 40);
  pdf.rect(0, 287, 210, 10, 'F');
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(6.5);
  pdf.text('DOCUGUARD EDGE  ·  SIH-26188 PROTOTYPE  ·  ZERO-KNOWLEDGE BROWSER-NATIVE FORENSICS', 105, 293, { align: 'center' });

  pdf.save(`DocuGuard_Forensic_Dossier_${data.documentId}.pdf`);
}
