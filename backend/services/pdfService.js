const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Register fonts with Arabic support if available; otherwise use built-in core fonts.
const registerPrimaryFonts = (doc) => {
  const fontsDir = path.resolve(__dirname, 'fonts');
  const arabicRegular = path.join(fontsDir, 'NotoNaskhArabic-Regular.ttf');
  const arabicBold = path.join(fontsDir, 'NotoNaskhArabic-Bold.ttf');

  if (fs.existsSync(arabicRegular) && fs.existsSync(arabicBold)) {
    doc.registerFont('Primary-Regular', arabicRegular);
    doc.registerFont('Primary-Bold', arabicBold);
    doc.registerFont('Primary-Italic', arabicBold);
    return { regular: 'Primary-Regular', bold: 'Primary-Bold', italic: 'Primary-Italic' };
  }
  return { regular: 'Times-Roman', bold: 'Times-Bold', italic: 'Times-Italic' };
};

const normalizeText = (value) => {
  if (!value && value !== 0) return '';
  return String(value).trim();
};

/**
 * Formats a raw date string:
 * - If it looks like YYYY-MM-DD or YYYY-MM, extract Month Year (e.g. "Jan 2023")
 * - If it is a text like "now", "present", "current", return it as-is (capitalized)
 * - Otherwise return as-is
 */
const formatDate = (rawDate) => {
  const s = normalizeText(rawDate);
  if (!s) return '';

  // Check for non-numeric text (e.g. "now", "present", "currently")
  if (!/^\d/.test(s)) {
    // Capitalize first letter
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // Try to extract YYYY-MM from "YYYY-MM-DD" or "YYYY-MM"
  const match = s.match(/^(\d{4})[.\-\/](\d{1,2})/);
  if (match) {
    const year = match[1];
    const month = parseInt(match[2], 10);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[month - 1] || '';
    return monthName ? `${monthName} ${year}` : year;
  }

  return s;
};

const formatDateRange = (startDate, endDate) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return end;
  return '';
};

const safeText = (value) => {
  const text = normalizeText(value);
  return text.replace(/\r\n|\r|\n/g, ' ').replace(/\s+/g, ' ').trim();
};

const containsArabic = (s = '') => /[\u0600-\u06FF]/.test(s);
const textWidth = (doc) => doc.page.width - doc.page.margins.left - doc.page.margins.right;

// ─── Typography helpers ───────────────────────────────────────────────────────

const addSectionDivider = (doc) => {
  doc.moveDown(0.3);
  doc.moveTo(doc.page.margins.left, doc.y)
     .lineTo(doc.page.width - doc.page.margins.right, doc.y)
     .lineWidth(0.5)
     .stroke();
  doc.moveDown(0.4);
};

const addHeading = (doc, text, fonts, isArabic) => {
  const t = safeText(text);
  doc.font(fonts.bold).fontSize(11.5).text(t, {
    width: textWidth(doc),
    align: isArabic ? 'right' : 'left',
    lineGap: 2,
    paragraphGap: 4,
  });
  addSectionDivider(doc);
};

const addParagraph = (doc, text, fonts, isArabic) => {
  const paragraph = safeText(text);
  if (!paragraph) return;
  doc.font(fonts.regular).fontSize(10).text(paragraph, {
    width: textWidth(doc),
    align: isArabic ? 'right' : 'justify',
    lineGap: 3,
    paragraphGap: 3,
  });
};

// Bullet list from newline- or comma-separated text
const addBulletPoints = (doc, text, fonts, isArabic) => {
  if (!text) return;
  const lines = String(text)
    .split(/\r?\n/)
    .map(line => line.trim().replace(/^[-*•\s]+/, ''))
    .filter(line => line.length > 0);

  if (lines.length === 0) return;

  const bullet = isArabic ? ' •' : '• ';
  const align = isArabic ? 'right' : 'left';

  lines.forEach(line => {
    const fullText = isArabic ? `${line}${bullet}` : `${bullet}${line}`;
    doc.font(fonts.regular).fontSize(10).text(fullText, {
      width: textWidth(doc) - 10,
      align,
      lineGap: 2,
      paragraphGap: 3,
      indent: isArabic ? 0 : 10,
    });
  });
};

const addVerticalSpacing = (doc, lines = 1) => {
  for (let i = 0; i < lines; i += 1) {
    doc.moveDown(0.3);
  }
};

const enforcePageBreak = (doc) => {
  if (doc.y > doc.page.height - 110) {
    doc.addPage();
  }
};

// ─── Main generator ───────────────────────────────────────────────────────────

const generateAtsPdf = async (payload) => {
  return new Promise((resolve, reject) => {
    try {
      const data = payload || {};

      // Tight margins: 40pt on all sides
      const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 40, left: 45, right: 45 }, autoFirstPage: true });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const fonts = registerPrimaryFonts(doc);

      const checkText = (data.personal?.fullName || '') + ' ' + (data.summary || '');
      const isArabic = containsArabic(checkText);

      // ── HEADER ─────────────────────────────────────────────────────────────
      const headerName = safeText(data.personal?.fullName || 'Professional Resume');
      doc.font(fonts.bold).fontSize(20).text(headerName, {
        width: textWidth(doc),
        align: 'center',
      });

      const headerTitle = safeText(data.personal?.jobTitle || '');
      if (headerTitle) {
        doc.font(fonts.regular).fontSize(11.5).text(headerTitle, {
          width: textWidth(doc),
          align: 'center',
        });
      }
      doc.moveDown(0.4);

      // ROW 1: Phone | Email | Location
      const row1Parts = [];
      const phone = safeText(data.personal?.phone);
      const email = safeText(data.personal?.email);
      const loc   = safeText(data.personal?.location);
      if (phone) row1Parts.push(phone);
      if (email) row1Parts.push(email);
      if (loc)   row1Parts.push(loc);
      if (row1Parts.length > 0) {
        doc.font(fonts.regular).fontSize(9.5).text(row1Parts.join('  |  '), {
          width: textWidth(doc),
          align: 'center',
        });
      }

      // ROW 2: LinkedIn | GitHub | Behance | Website
      const row2Parts = [];
      const linkedin = safeText(data.personal?.linkedin);
      const behance  = safeText(data.personal?.behance);
      const github   = safeText(data.personal?.github);
      const website  = safeText(data.personal?.website);
      if (linkedin) row2Parts.push(`LinkedIn: ${linkedin}`);
      if (behance)  row2Parts.push(`Behance: ${behance}`);
      if (github)   row2Parts.push(`GitHub: ${github}`);
      if (website)  row2Parts.push(`Website: ${website}`);
      if (row2Parts.length > 0) {
        doc.font(fonts.regular).fontSize(8.5).text(row2Parts.join('  |  '), {
          width: textWidth(doc),
          align: 'center',
        });
      }

      // ROW 3: Nationality | DOB | Residency
      const row3Parts = [];
      const nat       = safeText(data.personal?.nationality);
      const resStatus = safeText(data.personal?.residencyStatus);
      const dob = [data.personal?.birthYear || '', data.personal?.birthMonth || ''].filter(Boolean).join('-');
      if (nat)       row3Parts.push(isArabic ? `الجنسية: ${nat}` : `Nationality: ${nat}`);
      if (dob)       row3Parts.push(isArabic ? `تاريخ الميلاد: ${dob}` : `Date of Birth: ${dob}`);
      if (resStatus) row3Parts.push(isArabic ? `الإقامة: ${resStatus}` : `Residency: ${resStatus}`);
      if (row3Parts.length > 0) {
        doc.font(fonts.regular).fontSize(9).text(row3Parts.join('  |  '), {
          width: textWidth(doc),
          align: 'center',
        });
      }

      doc.moveDown(0.5);
      doc.moveTo(doc.page.margins.left, doc.y)
         .lineTo(doc.page.width - doc.page.margins.right, doc.y)
         .lineWidth(1)
         .stroke();
      doc.moveDown(0.6);

      // Languages (inline row)
      const languages = Array.isArray(data.personal?.languages) ? data.personal.languages : [];
      if (languages.length > 0) {
        const langText = languages
          .map(l => l.language + (l.proficiency ? ` (${l.proficiency})` : ''))
          .join('  |  ');
        const label = isArabic ? 'اللغات: ' : 'Languages: ';
        doc.font(fonts.bold).fontSize(9.5).text(label, { continued: true, align: isArabic ? 'right' : 'left', width: textWidth(doc) });
        doc.font(fonts.regular).fontSize(9.5).text(langText, { align: isArabic ? 'right' : 'left', width: textWidth(doc) });
        doc.moveDown(0.6);
      }

      // ── PROFESSIONAL SUMMARY ────────────────────────────────────────────────
      if (data.summary || data.professionalSummary) {
        addHeading(doc, isArabic ? 'الخلاصة المهنية' : 'Professional Summary', fonts, isArabic);
        addParagraph(doc, data.summary || data.professionalSummary, fonts, isArabic);
        doc.moveDown(1);
      }

      // ── WORK EXPERIENCE ─────────────────────────────────────────────────────
      const experiences = Array.isArray(data.experiences) ? data.experiences : data.experienceBlocks || [];
      if (experiences.length > 0) {
        addHeading(doc, isArabic ? 'خبرات العمل' : 'Work Experience', fonts, isArabic);
        experiences.forEach((exp) => {
          enforcePageBreak(doc);

          const title     = safeText(exp.title || exp.role_designation || '');
          const company   = safeText(exp.company || exp.institution_title || '');
          const location  = safeText(exp.location || '');
          const dateRange = formatDateRange(
            exp.startDate || exp.date_start,
            exp.endDate   || exp.date_end
          );

          // Row: Job Title (left) | Date range (right) — same Y
          const rowY = doc.y;
          if (title) {
            doc.font(fonts.bold).fontSize(10.5).text(title, doc.page.margins.left, rowY, {
              width: textWidth(doc),
              align: isArabic ? 'right' : 'left',
              lineBreak: false,
            });
          }
          if (dateRange) {
            doc.font(fonts.regular).fontSize(9.5).text(dateRange, doc.page.margins.left, rowY, {
              width: textWidth(doc),
              align: isArabic ? 'left' : 'right',
              lineBreak: false,
            });
          }

          // Next row: Company, Location
          doc.y = rowY + 14;
          const companyLine = [company, location].filter(Boolean).join(', ');
          if (companyLine) {
            doc.font(fonts.italic).fontSize(10).text(companyLine, {
              width: textWidth(doc),
              align: isArabic ? 'right' : 'left',
            });
          }

          doc.moveDown(0.25);
          addBulletPoints(doc, exp.description || exp.description_narrative || '', fonts, isArabic);
          doc.moveDown(0.7);
        });
        doc.moveDown(0.5);
      }

      // ── EDUCATION ───────────────────────────────────────────────────────────
      const education = Array.isArray(data.education) ? data.education : data.educationBlocks || [];
      if (education.length > 0) {
        addHeading(doc, isArabic ? 'التعليم والمؤهلات' : 'Education & Qualifications', fonts, isArabic);
        education.forEach((item) => {
          enforcePageBreak(doc);

          const institution = safeText(item.institution || item.institution_title || '');
          const degree      = safeText(item.degree || item.role_designation || '');
          const location    = safeText(item.location || '');
          const dateRange   = formatDateRange(
            item.startDate || item.date_start,
            item.endDate   || item.date_end
          );

          const rowY = doc.y;
          const instLine = [institution, location].filter(Boolean).join(', ');
          if (instLine) {
            doc.font(fonts.bold).fontSize(10.5).text(instLine, doc.page.margins.left, rowY, {
              width: textWidth(doc),
              align: isArabic ? 'right' : 'left',
              lineBreak: false,
            });
          }
          if (dateRange) {
            doc.font(fonts.regular).fontSize(9.5).text(dateRange, doc.page.margins.left, rowY, {
              width: textWidth(doc),
              align: isArabic ? 'left' : 'right',
              lineBreak: false,
            });
          }

          doc.y = rowY + 14;
          if (degree) {
            doc.font(fonts.italic).fontSize(10).text(degree, {
              width: textWidth(doc),
              align: isArabic ? 'right' : 'left',
            });
          }

          doc.moveDown(0.2);
          if (item.description || item.description_narrative) {
            addParagraph(doc, item.description || item.description_narrative, fonts, isArabic);
          }
          doc.moveDown(0.6);
        });
        doc.moveDown(0.5);
      }

      // ── KEY SKILLS ──────────────────────────────────────────────────────────
      const skills = data.skills || data.skillsClassified || data.skills_classified_json || {};
      const hasSkills = skills && (skills.technical || skills.interpersonal || skills.workRelated);
      if (hasSkills) {
        addHeading(doc, isArabic ? 'المهارات الأساسية' : 'Key Skills', fonts, isArabic);

        const usableWidth = textWidth(doc);
        const colWidth = usableWidth / 3;
        const startY = doc.y;

        const cols = [
          { title: isArabic ? 'المهارات التقنية'          : 'Technical Skills',       val: skills.technical },
          { title: isArabic ? 'المهارات الشخصية'          : 'Interpersonal Skills',   val: skills.interpersonal },
          { title: isArabic ? 'المهارات المرتبطة بالعمل' : 'Work-Related Skills',    val: skills.workRelated },
        ];

        let maxColY = startY;

        cols.forEach((col, idx) => {
          if (!col.val) return;
          doc.y = startY;
          const colX = doc.page.margins.left + idx * colWidth;

          doc.font(fonts.bold).fontSize(10).text(col.title, colX, doc.y, {
            width: colWidth - 8,
            align: isArabic ? 'right' : 'left',
          });
          doc.moveDown(0.3);

          const skillLines = String(col.val)
            .split(/[\n,;•]+/)
            .map(l => l.trim())
            .filter(l => l.length > 0);

          skillLines.forEach(line => {
            const lineText = isArabic ? `${line} •` : `• ${line}`;
            doc.font(fonts.regular).fontSize(9.5).text(lineText, colX, doc.y, {
              width: colWidth - 8,
              align: isArabic ? 'right' : 'left',
              lineGap: 2,
            });
          });

          if (doc.y > maxColY) maxColY = doc.y;
        });

        doc.y = maxColY;
        doc.moveDown(1.2);
      }

      // ── ADDITIONAL INFORMATION (vertical, by category, skip empty ones) ─────
      const additionalItems = Array.isArray(data.dynamicItems) ? data.dynamicItems : data.additionalItems || [];
      if (additionalItems.length > 0) {
        const categories = [
          { key: 'project',   title: isArabic ? 'المشاريع'  : 'Projects',       items: additionalItems.filter(it => it.type === 'project') },
          { key: 'award',     title: isArabic ? 'الجوائز'   : 'Awards',          items: additionalItems.filter(it => it.type === 'award') },
          { key: 'volunteer', title: isArabic ? 'التطوع'    : 'Volunteer Work',  items: additionalItems.filter(it => it.type === 'volunteer') },
        ].filter(cat => cat.items.length > 0); // ← skip empty categories

        if (categories.length > 0) {
          addHeading(doc, isArabic ? 'معلومات إضافية' : 'Additional Information', fonts, isArabic);

          categories.forEach((cat) => {
            enforcePageBreak(doc);

            // Category sub-title (bold, left-aligned)
            doc.font(fonts.bold).fontSize(10.5).text(cat.title, {
              width: textWidth(doc),
              align: isArabic ? 'right' : 'left',
              lineGap: 2,
            });
            doc.moveDown(0.25);

            cat.items.forEach(item => {
              enforcePageBreak(doc);
              const itemTitle = safeText(item.title);
              const itemDesc  = safeText(item.description);
              const itemLink  = safeText(item.link);

              // Bullet + item title
              const bulletText = isArabic ? `${itemTitle} •` : `• ${itemTitle}`;
              doc.font(fonts.bold).fontSize(10).text(bulletText, {
                width: textWidth(doc),
                align: isArabic ? 'right' : 'left',
                indent: isArabic ? 0 : 10,
              });

              if (itemDesc) {
                doc.font(fonts.regular).fontSize(9.5).text(itemDesc, {
                  width: textWidth(doc) - 20,
                  align: isArabic ? 'right' : 'left',
                  indent: isArabic ? 0 : 20,
                  lineGap: 2,
                });
              }

              if (itemLink) {
                doc.font(fonts.italic).fontSize(8.5).fillColor('#0066CC').text(itemLink, {
                  width: textWidth(doc) - 20,
                  align: isArabic ? 'right' : 'left',
                  indent: isArabic ? 0 : 20,
                  lineGap: 1,
                });
                doc.fillColor('black');
              }

              doc.moveDown(0.35);
            });

            doc.moveDown(0.5);
          });
        }
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateAtsPdf,
};
