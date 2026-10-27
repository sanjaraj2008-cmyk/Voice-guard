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

  // Clean white paper background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 210, 297, 'F');

  // Header Banner
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.rect(14, 12, 182, 28, 'FD');

  // Brand title
  pdf.setTextColor(49, 94, 251); // #315EFB
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Voice Guard — Document Screening Report', 20, 22);

  pdf.setTextColor(88, 101, 121); // #586579
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Document Reference: ${data.documentId}`, 20, 29);
  pdf.text(`File Name: ${data.fileName}`, 20, 34);
  pdf.text(`Screened: ${new Date(data.generatedAt).toUTCString()}`, 110, 29);
  pdf.text('Processing: 100% Client-Side In-Browser Analysis', 110, 34);

  // Verdict Summary Card
  let p = 46;
  const isPass = data.verdict === 'Real';
  const isWarn = data.verdict === 'Suspicious';

  const badgeBg = isPass ? [240, 253, 244] : isWarn ? [255, 251, 235] : [254, 242, 242];
  const badgeBorder = isPass ? [187, 247, 208] : isWarn ? [253, 230, 138] : [254, 202, 202];
  const badgeText = isPass ? [21, 128, 61] : isWarn ? [180, 83, 9] : [185, 28, 28];

  pdf.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
  pdf.setDrawColor(badgeBorder[0], badgeBorder[1], badgeBorder[2]);
  pdf.setLineWidth(0.5);
  pdf.rect(14, p, 182, 24, 'FD');

  pdf.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(verdict.label, 20, p + 9);

  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  const splitSub = pdf.splitTextToSize(verdict.sub, 130);
  pdf.text(splitSub, 20, p + 16);

  // Score on right
  pdf.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${data.score}/100`, 175, p + 12, { align: 'right' });
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Integrity Index', 175, p + 17, { align: 'right' });

  p += 30;

  // Findings Section Header
  pdf.setFillColor(241, 245, 249);
  pdf.setDrawColor(203, 213, 225);
  pdf.rect(14, p, 182, 7, 'FD');
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text('OBSERVED EVIDENCE FINDINGS & MEASUREMENTS', 18, p + 5);

  p += 11;

  // Render findings
  data.evidence.forEach((item, idx) => {
    if (p > 255) {
      pdf.addPage();
      p = 15;
    }

    const itemPass = item.severity === 'pass';
    const itemWarn = item.severity === 'warn';
    const pillRgb = itemPass ? [21, 128, 61] : itemWarn ? [180, 83, 9] : [185, 28, 28];

    pdf.setFillColor(pillRgb[0], pillRgb[1], pillRgb[2]);
    pdf.rect(14, p, 2, 14, 'F');

    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${idx + 1}. ${item.observation}`, 19, p + 4);

    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    const explLines = pdf.splitTextToSize(item.explanation, 170);
    pdf.text(explLines, 19, p + 8.5);

    p += 17;
  });

  // Footer & Limitations
  const footerY = 270;
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(14, footerY, 196, footerY);

  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    'Notice: Automated screening can make mistakes. A clean result does not guarantee that a document is genuine.',
    14,
    footerY + 4
  );
  pdf.text(
    'This report evaluates visual inconsistencies and digital compression characteristics locally in your browser. It is not an official certificate of authenticity.',
    14,
    footerY + 8
  );

  pdf.text('Voice Guard · Document Image Screening Tool', 105, footerY + 14, { align: 'center' });

  // Save PDF
  pdf.save(`VoiceGuard_Inspection_${data.documentId}.pdf`);
}
