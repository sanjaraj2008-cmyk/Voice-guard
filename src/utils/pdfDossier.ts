import { jsPDF } from 'jspdf';
import { DocumentVerificationData, ForensicEvidenceItem } from '../types/edge';
import { getVerdictConfig } from './edgePipeline';

/**
 * Generates and downloads a human-centered, readable PDF screening report.
 * Designed to be clear, transparent, and approachable for non-technical users.
 */
export async function generateAndDownloadDossierPdf(data: DocumentVerificationData): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4' // 210 x 297 mm
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 178 mm
  let y = margin;

  const verdict = getVerdictConfig(data.verdict);
  const isPass = data.verdict === 'Real';
  const isWarn = data.verdict === 'Suspicious';

  const badgeBg = isPass ? [240, 253, 244] : isWarn ? [255, 251, 235] : [254, 242, 242];
  const badgeBorder = isPass ? [187, 247, 208] : isWarn ? [253, 230, 138] : [254, 202, 202];
  const badgeText = isPass ? [21, 128, 61] : isWarn ? [180, 83, 9] : [185, 28, 28];

  // Helper for adding new pages with consistent headers/footers
  let currentPage = 1;

  const renderHeader = () => {
    // Top banner card
    pdf.setFillColor(247, 248, 250); // #F7F8FA
    pdf.setDrawColor(226, 231, 239); // #E2E7EF
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

    // Accent strip
    pdf.setFillColor(49, 94, 251); // #315EFB
    pdf.rect(margin, y, 3, 24, 'F');

    // Logo & Title
    pdf.setTextColor(23, 32, 51); // #172033
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Voice Guard', margin + 7, y + 8);

    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(88, 101, 121); // #586579
    pdf.text('Document Image Screening Report', margin + 7, y + 14);
    pdf.text('100% In-Browser Privacy · No Cloud Upload', margin + 7, y + 19);

    // Document Meta (right side)
    pdf.setFontSize(7.5);
    pdf.setTextColor(88, 101, 121);
    pdf.text(`Reference: ${data.documentId}`, pageWidth - margin - 4, y + 8, { align: 'right' });
    pdf.text(`File: ${data.fileName.length > 32 ? data.fileName.substring(0, 30) + '...' : data.fileName}`, pageWidth - margin - 4, y + 13, { align: 'right' });
    pdf.text(`Date: ${new Date(data.generatedAt).toLocaleDateString()} ${new Date(data.generatedAt).toLocaleTimeString()}`, pageWidth - margin - 4, y + 18, { align: 'right' });

    y += 28;
  };

  const renderFooter = (page: number, total: number) => {
    const footerY = pageHeight - 12;
    pdf.setDrawColor(226, 231, 239);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

    pdf.setTextColor(140, 150, 165);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Voice Guard · Automated document image screening tool · Not an official legal certification', margin, footerY);
    pdf.text(`Page ${page} of ${total}`, pageWidth - margin, footerY, { align: 'right' });
  };

  // Initial Header
  renderHeader();

  // ─── OUTCOME SUMMARY CARD ──────────────────────────────────────────────────
  pdf.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
  pdf.setDrawColor(badgeBorder[0], badgeBorder[1], badgeBorder[2]);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  pdf.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(verdict.label, margin + 6, y + 8);

  pdf.setTextColor(88, 101, 121);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  const summaryText = pdf.splitTextToSize(verdict.sub, contentWidth - 45);
  pdf.text(summaryText, margin + 6, y + 15);

  // Score Pill on Right
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(badgeBorder[0], badgeBorder[1], badgeBorder[2]);
  pdf.roundedRect(pageWidth - margin - 34, y + 4, 28, 18, 2, 2, 'FD');

  pdf.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${data.score}/100`, pageWidth - margin - 20, y + 12, { align: 'center' });

  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(88, 101, 121);
  pdf.text('Integrity Score', pageWidth - margin - 20, y + 18, { align: 'center' });

  y += 31;

  // ─── SECTION 1: WHAT WE CHECKED ────────────────────────────────────────────
  pdf.setFillColor(23, 32, 51); // #172033
  pdf.setFontSize(9.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text('1. What we checked', margin, y);

  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(88, 101, 121);
  pdf.text('This screening examined only the checks supported by your browser sandbox:', margin + 35, y);
  y += 4;

  const checksList = [
    { name: 'Image Sharpness & Focus', desc: 'Laplacian edge variance filter across the document bitmap' },
    { name: 'Compression Uniformity', desc: '16x16 macroblock JPEG Error Level Analysis (ELA)' },
    { name: 'Display Screen Patterns', desc: 'Spatial frequency spectrum for electronic screen pixels' },
    { name: 'Metadata & Software Tags', desc: 'Header scan for editing applications (Photoshop, Canva, GIMP)' },
    { name: 'Neural Texture Analysis', desc: 'In-browser lightweight CNN evaluating texture & splice patterns' }
  ];

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 231, 239);
  pdf.roundedRect(margin, y, contentWidth, 23, 1.5, 1.5, 'FD');

  let checkCol1Y = y + 5;
  checksList.slice(0, 3).forEach(c => {
    pdf.setFillColor(49, 94, 251);
    pdf.circle(margin + 5, checkCol1Y - 1, 1, 'F');
    pdf.setTextColor(23, 32, 51);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(c.name, margin + 8, checkCol1Y);
    pdf.setTextColor(88, 101, 121);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`— ${c.desc}`, margin + 42, checkCol1Y);
    checkCol1Y += 6;
  });

  let checkCol2Y = y + 5;
  checksList.slice(3).forEach(c => {
    pdf.setFillColor(49, 94, 251);
    pdf.circle(margin + 95, checkCol2Y - 1, 1, 'F');
    pdf.setTextColor(23, 32, 51);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(c.name, margin + 98, checkCol2Y);
    pdf.setTextColor(88, 101, 121);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`— ${c.desc}`, margin + 132, checkCol2Y);
    checkCol2Y += 6;
  });

  y += 28;

  // ─── SECTION 2: WHAT WE FOUND & DETAILED OBSERVATIONS ──────────────────────
  pdf.setTextColor(23, 32, 51);
  pdf.setFontSize(9.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text('2. What we found & detailed observations', margin, y);
  y += 5;

  data.evidence.forEach((item: ForensicEvidenceItem, index: number) => {
    // Check if we need a new page
    if (y > 235) {
      pdf.addPage();
      currentPage++;
      y = margin;
      renderHeader();
      pdf.setTextColor(23, 32, 51);
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. Detailed observations (continued)', margin, y);
      y += 6;
    }

    const itemPass = item.severity === 'pass';
    const itemWarn = item.severity === 'warn';
    const pillBg = itemPass ? [240, 253, 244] : itemWarn ? [255, 251, 235] : [254, 242, 242];
    const pillBorder = itemPass ? [187, 247, 208] : itemWarn ? [253, 230, 138] : [254, 202, 202];
    const pillText = itemPass ? [21, 128, 61] : itemWarn ? [180, 83, 9] : [185, 28, 28];
    const statusLabel = itemPass ? 'Normal' : itemWarn ? 'Caution' : 'Warning';

    // Finding Card Container
    const cardStartY = y;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 231, 239);
    pdf.setLineWidth(0.3);

    // Left border indicator
    pdf.roundedRect(margin, y, contentWidth, 26, 1.5, 1.5, 'FD');
    pdf.setFillColor(pillText[0], pillText[1], pillText[2]);
    pdf.rect(margin, y, 2.5, 26, 'F');

    // Observation Title & Status
    pdf.setTextColor(23, 32, 51);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    const obsTitle = `${index + 1}. ${item.observation}`;
    pdf.text(obsTitle.length > 80 ? obsTitle.substring(0, 78) + '...' : obsTitle, margin + 6, y + 5.5);

    // Status Badge
    pdf.setFillColor(pillBg[0], pillBg[1], pillBg[2]);
    pdf.setDrawColor(pillBorder[0], pillBorder[1], pillBorder[2]);
    pdf.roundedRect(pageWidth - margin - 20, y + 2.5, 16, 5, 1, 1, 'FD');
    pdf.setTextColor(pillText[0], pillText[1], pillText[2]);
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text(statusLabel, pageWidth - margin - 12, y + 6, { align: 'center' });

    // 4-Part Structure Breakdown
    let lineY = y + 10.5;

    // Line 1: Why it matters
    pdf.setFontSize(6.8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(88, 101, 121);
    pdf.text('Why it matters:', margin + 6, lineY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(23, 32, 51);
    const whyText = pdf.splitTextToSize(item.whyItMatters || item.explanation, contentWidth - 36);
    pdf.text(whyText[0] || '', margin + 28, lineY);

    // Line 2: How checked
    lineY += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(88, 101, 121);
    pdf.text('How checked:', margin + 6, lineY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(23, 32, 51);
    const howText = pdf.splitTextToSize(item.howChecked || 'Standard heuristic inspection', contentWidth - 36);
    pdf.text(howText[0] || '', margin + 28, lineY);

    // Line 3: Limitations
    lineY += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(140, 150, 165);
    pdf.text('Limitation:', margin + 6, lineY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    const limText = pdf.splitTextToSize(item.limitations || 'Findings are indicative and not legally conclusive.', contentWidth - 36);
    pdf.text(limText[0] || '', margin + 28, lineY);

    y += 29;
  });

  // Check if we need a new page for Section 3 & Guidance
  if (y > 215) {
    pdf.addPage();
    currentPage++;
    y = margin;
    renderHeader();
  }

  // ─── SECTION 3: WHAT TO DO NEXT (RECOMMENDED ACTIONS) ──────────────────────
  pdf.setTextColor(23, 32, 51);
  pdf.setFontSize(9.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text('3. What to do next (practical advice)', margin, y);
  y += 5;

  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 231, 239);
  pdf.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'FD');

  const adviceSteps = isPass ? [
    '• Manual Inspection: Confirm that critical fields (name, dates, ID number) match records without visual smudging.',
    '• Issuer Verification: For high-trust identity or legal verification, verify credentials through the original issuing organization.',
    '• Screening Boundary: Remember that automated screening can miss novel forgeries or unmodified fake documents.'
  ] : [
    '• Closer Examination: Request an uncompressed camera photo or inspect the physical card under natural lighting.',
    '• Cross-Verification: Contact the issuing body or organization directly before accepting high-value claims.',
    '• Consider Context: Compression or focus flaws may be caused by messaging compression (WhatsApp/Telegram) rather than forgery.'
  ];

  let advY = y + 5;
  adviceSteps.forEach(step => {
    pdf.setFontSize(7.2);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    pdf.text(step, margin + 4, advY);
    advY += 5.5;
  });

  y += 27;

  // ─── HONEST TRANSPARENCY NOTICE ────────────────────────────────────────────
  pdf.setFillColor(255, 251, 235); // #FFFBEB
  pdf.setDrawColor(253, 230, 138); // #FDE68A
  pdf.roundedRect(margin, y, contentWidth, 15, 1.5, 1.5, 'FD');

  pdf.setTextColor(146, 64, 14); // #92400E
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Important Notice & Transparency Statement:', margin + 4, y + 4.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.8);
  pdf.setTextColor(120, 53, 15);
  pdf.text(
    'Automated screening can make mistakes. A clean result does not guarantee that a document is genuine. Voice Guard evaluates digital image anomalies and compression characteristics locally in your browser. It does not replace official physical or laboratory verification.',
    margin + 4,
    y + 9.5,
    { maxWidth: contentWidth - 8 }
  );

  // Render footers on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    renderFooter(i, totalPages);
  }

  // Save the PDF
  pdf.save(`VoiceGuard_Screening_Report_${data.documentId}.pdf`);
}

