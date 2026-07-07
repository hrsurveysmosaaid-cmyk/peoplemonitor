const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Register fonts with Arabic support if available; otherwise use built-in core fonts without registration.
// Returns the font family names to use for regular/bold/italic.
const registerPrimaryFonts = (doc) => {
  const fontsDir = path.resolve(__dirname, 'fonts');
  const arabicRegular = path.join(fontsDir, 'NotoNaskhArabic-Regular.ttf');
  const arabicBold = path.join(fontsDir, 'NotoNaskhArabic-Bold.ttf');

  if (fs.existsSync(arabicRegular) && fs.existsSync(arabicBold)) {
    doc.registerFont('Primary-Regular', arabicRegular);
    doc.registerFont('Primary-Bold', arabicBold);
    // Use bold also for italic if no dedicated italic font is provided
    doc.registerFont('Primary-Italic', arabicBold);
    return { regular: 'Primary-Regular', bold: 'Primary-Bold', italic: 'Primary-Italic' };
  }
  // Use PDFKit's standard 14 fonts directly (do NOT register them)
  return { regular: 'Times-Roman', bold: 'Times-Bold', italic: 'Times-Italic' };
};

const normalizeText = (value) => {
  if (!value && value !== 0) {
    return '';
  }
  return String(value).trim();
};

const formatDateRange = (startDate, endDate) => {
  const start = normalizeText(startDate);
  const end = normalizeText(endDate);
  if (start && end) {
    return `${start} — ${end}`;
  }
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

const addHeading = (doc, text, fonts, isArabic) => {
  const t = safeText(text);
  const opts = {
    width: textWidth(doc),
    align: isArabic ? 'right' : 'left',
    lineGap: 4,
    paragraphGap: 8,
  };
  doc.font(fonts.bold).fontSize(12).text(t, opts);
};

const addSubheading = (doc, text, fonts, isArabic) => {
  const t = safeText(text);
  const opts = {
    width: textWidth(doc),
    align: isArabic ? 'right' : 'left',
    lineGap: 3,
    paragraphGap: 4,
  };
  doc.font(fonts.italic).fontSize(11).text(t, opts);
};

const addParagraph = (doc, text, fonts, isArabic) => {
  const paragraph = safeText(text);
  if (!paragraph) return;
  const opts = {
    width: textWidth(doc),
    align: isArabic ? 'right' : 'left',
    lineGap: 3,
    paragraphGap: 4,
  };
  doc.font(fonts.regular).fontSize(11).text(paragraph, opts);
};

// Split paragraph text by newlines and print each line as a clean bullet point
const addBulletPoints = (doc, text, fonts, isArabic) => {
  if (!text) return;
  const lines = String(text)
    .split(/\r?\n/)
    .map(line => line.trim().replace(/^[-*•\s]+/, ''))
    .filter(line => line.length > 0);

  if (lines.length === 0) return;

  const bullet = '• ';
  const align = isArabic ? 'right' : 'left';

  lines.forEach(line => {
    const fullText = isArabic ? `${line} ${bullet}` : `${bullet}${line}`;
    doc.font(fonts.regular).fontSize(10.5).text(fullText, {
      width: textWidth(doc) - 15,
      align: align,
      lineGap: 2.5,
      paragraphGap: 3.5,
      indent: isArabic ? 0 : 12,
    });
  });
};

const addVerticalSpacing = (doc, lines = 1) => {
  for (let i = 0; i < lines; i += 1) {
    doc.moveDown(0.35);
  }
};

const enforcePageBreak = (doc) => {
  if (doc.y > doc.page.height - 100) {
    doc.addPage();
  }
};

const generateAtsPdf = async (payload) => {
  return new Promise((resolve, reject) => {
    try {
      const data = payload || {};
      const doc = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: true });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Register fonts (Arabic-enabled if present) and get family names to use
      const fonts = registerPrimaryFonts(doc);

      // Determine document-wide primary language alignment
      const checkText = (data.personal?.fullName || '') + ' ' + (data.summary || '');
      const isArabic = containsArabic(checkText);

      // Header: Name and Title
      const headerName = safeText(data.personal?.fullName || data.fullName || 'Professional Resume');
      doc.font(fonts.bold).fontSize(18).text(headerName, {
        width: textWidth(doc),
        align: 'center',
      });
      // Centered subtitle (job title)
      const headerTitle = safeText(data.personal?.jobTitle || data.jobTitle || '');
      if (headerTitle) {
        doc.font(fonts.regular).fontSize(12).text(headerTitle, {
          width: textWidth(doc),
          align: 'center',
        });
      }
      addVerticalSpacing(doc, 0.5);

      // --- ROW 1: Phone, Email, Location ---
      const row1Parts = [];
      const email = safeText(data.personal?.email);
      const phone = safeText(data.personal?.phone);
      const loc = safeText(data.personal?.location);
      if (phone) row1Parts.push(phone);
      if (email) row1Parts.push(email);
      if (loc) row1Parts.push(loc);

      const row1Text = row1Parts.join('  |  ');
      if (row1Text) {
        doc.font(fonts.regular).fontSize(9.5).text(row1Text, {
          width: textWidth(doc),
          align: 'center',
        });
      }

      // --- ROW 2: Accounts & Portfolio URL ---
      const row2Parts = [];
      const linkedin = safeText(data.personal?.linkedin);
      const behance = safeText(data.personal?.behance);
      const github = safeText(data.personal?.github);
      const website = safeText(data.personal?.website);

      if (linkedin) row2Parts.push(`LinkedIn: ${linkedin}`);
      if (behance) row2Parts.push(`Behance: ${behance}`);
      if (github) row2Parts.push(`GitHub: ${github}`);
      if (website) row2Parts.push(`Website: ${website}`);

      const row2Text = row2Parts.join('  |  ');
      if (row2Text) {
        doc.font(fonts.regular).fontSize(8.5).text(row2Text, {
          width: textWidth(doc),
          align: 'center',
        });
      }

      // --- ROW 3: Nationality, Birth, Residency ---
      const row3Parts = [];
      const nat = safeText(data.personal?.nationality);
      const resStatus = safeText(data.personal?.residencyStatus);
      const dob = [data.personal?.birthYear || '', data.personal?.birthMonth || ''].filter(Boolean).join('-');

      if (nat) row3Parts.push(isArabic ? `الجنسية: ${nat}` : `Nationality: ${nat}`);
      if (dob) row3Parts.push(isArabic ? `تاريخ الميلاد: ${dob}` : `Date of Birth: ${dob}`);
      if (resStatus) row3Parts.push(isArabic ? `الإقامة: ${resStatus}` : `Residency: ${resStatus}`);

      const row3Text = row3Parts.join('  |  ');
      if (row3Text) {
        doc.font(fonts.regular).fontSize(9).text(row3Text, {
          width: textWidth(doc),
          align: 'center',
        });
      }

      addVerticalSpacing(doc, 0.5);
      doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
      addVerticalSpacing(doc, 1);

      // Languages row (right after header divider)
      const languages = Array.isArray(data.personal?.languages) ? data.personal.languages : [];
      if (languages.length > 0) {
        const langText = languages.map(l => l.language + (l.proficiency ? ` (${l.proficiency})` : '')).join('  |  ');
        const label = isArabic ? 'اللغات: ' : 'Languages: ';
        doc.font(fonts.bold).fontSize(9.5).text(label, { continued: true, align: isArabic ? 'right' : 'left', width: textWidth(doc) });
        doc.font(fonts.regular).fontSize(9.5).text(langText, { align: isArabic ? 'right' : 'left', width: textWidth(doc) });
        addVerticalSpacing(doc, 0.5);
      }

      // Summary
      if (data.summary || data.professionalSummary) {
        addHeading(doc, isArabic ? 'الخلاصة المهنية' : 'Professional Summary', fonts, isArabic);
        addParagraph(doc, data.summary || data.professionalSummary, fonts, isArabic);
        addVerticalSpacing(doc, 1);
      }

      // Experiences
      const experiences = Array.isArray(data.experiences) ? data.experiences : data.experienceBlocks || [];
      if (experiences.length > 0) {
        addHeading(doc, isArabic ? 'خبرات العمل' : 'Work Experience', fonts, isArabic);
        experiences.forEach((experience) => {
          enforcePageBreak(doc);
          const title = safeText(experience.title || experience.role_designation || '');
          const company = safeText(experience.company || experience.institution_title || '');
          const country = safeText(experience.location || ''); // company location/country
          const dateRange = formatDateRange(experience.startDate || experience.date_start, experience.endDate || experience.date_end);

          // Job Title & Date on the same row, opposite to each other
          const startY = doc.y;
          doc.font(fonts.bold).fontSize(11).text(title, doc.page.margins.left, startY, {
            width: textWidth(doc),
            align: isArabic ? 'right' : 'left',
          });
          if (dateRange) {
            doc.font(fonts.regular).fontSize(10.5).text(dateRange, doc.page.margins.left, startY, {
              width: textWidth(doc),
              align: isArabic ? 'left' : 'right',
            });
          }

          // Move down to print Company Name & Company Country under it
          doc.y = startY + 14;
          const companyLocationText = [company, country].filter(Boolean).join(', ');
          if (companyLocationText) {
            doc.font(fonts.italic).fontSize(10).text(companyLocationText, {
              width: textWidth(doc),
              align: isArabic ? 'right' : 'left',
            });
          }

          doc.moveDown(0.3);

          // Job descriptions as bullet points
          addBulletPoints(doc, experience.description || experience.description_narrative || '', fonts, isArabic);
          addVerticalSpacing(doc, 0.6);
        });
        addVerticalSpacing(doc, 1);
      }

      // Education
      const education = Array.isArray(data.education) ? data.education : data.educationBlocks || [];
      if (education.length > 0) {
        addHeading(doc, isArabic ? 'التعليم والمؤهلات' : 'Education & Qualifications', fonts, isArabic);
        education.forEach((item) => {
          enforcePageBreak(doc);
          const institution = safeText(item.institution || item.institution_title || '');
          const degree = safeText(item.degree || item.role_designation || '');
          const country = safeText(item.location || ''); // institution country/city
          const dateRange = formatDateRange(item.startDate || item.date_start, item.endDate || item.date_end);

          // Institution & Country on the same line, date at the opposite side
          const startY = doc.y;
          const instWithCountry = [institution, country].filter(Boolean).join(', ');
          
          doc.font(fonts.bold).fontSize(11).text(instWithCountry, doc.page.margins.left, startY, {
            width: textWidth(doc),
            align: isArabic ? 'right' : 'left',
          });
          if (dateRange) {
            doc.font(fonts.regular).fontSize(10.5).text(dateRange, doc.page.margins.left, startY, {
              width: textWidth(doc),
              align: isArabic ? 'left' : 'right',
            });
          }

          // Degree name on next line
          doc.y = startY + 14;
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
          addVerticalSpacing(doc, 0.6);
        });
        addVerticalSpacing(doc, 1);
      }

      // Skills Section: 3-column table/grid layout
      const skills = data.skills || data.skillsClassified || data.skills_classified_json || {};
      const hasSkills = skills && (skills.technical || skills.interpersonal || skills.workRelated);
      if (hasSkills) {
        // Updated Header Name to "Key Skills" or "المهارات الأساسية"
        addHeading(doc, isArabic ? 'المهارات الأساسية' : 'Key Skills', fonts, isArabic);
        
        const usableWidth = textWidth(doc);
        const colWidth = usableWidth / 3;
        const startY = doc.y;
        
        const cols = [
          { title: isArabic ? 'المهارات التقنية' : 'Technical Skills', val: skills.technical },
          { title: isArabic ? 'المهارات الشخصية' : 'Interpersonal Skills', val: skills.interpersonal },
          { title: isArabic ? 'المهارات المرتبطة بالعمل' : 'Work-Related Skills', val: skills.workRelated }
        ];

        let maxColumnY = startY;

        cols.forEach((col, idx) => {
          doc.y = startY;
          const colX = doc.page.margins.left + (idx * colWidth);
          
          doc.font(fonts.bold).fontSize(10.5).text(col.title, colX, doc.y, {
            width: colWidth - 10,
            align: isArabic ? 'right' : 'left',
          });
          
          doc.moveDown(0.4);
          
          const skillsLines = String(col.val || '')
            .split(/[\n,;•]+/)
            .map(line => line.trim())
            .filter(line => line.length > 0);

          skillsLines.forEach(line => {
            const lineText = isArabic ? `${line} •` : `• ${line}`;
            doc.font(fonts.regular).fontSize(9.5).text(lineText, colX, doc.y, {
              width: colWidth - 10,
              align: isArabic ? 'right' : 'left',
              lineGap: 2,
            });
          });

          if (doc.y > maxColumnY) {
            maxColumnY = doc.y;
          }
        });

        doc.y = maxColumnY;
        addVerticalSpacing(doc, 1.5);
      }

      // Additional Items (Projects, Awards, Volunteer) in 3 columns/rows format
      const additionalItems = Array.isArray(data.dynamicItems) ? data.dynamicItems : data.additionalItems || [];
      if (additionalItems.length > 0) {
        const projects = additionalItems.filter(it => it.type === 'project');
        const awards = additionalItems.filter(it => it.type === 'award');
        const volunteers = additionalItems.filter(it => it.type === 'volunteer');

        // Only draw the section if there are actually items in it
        if (projects.length > 0 || awards.length > 0 || volunteers.length > 0) {
          // Alignment updated to LTR for English, RTL for Arabic
          addHeading(doc, isArabic ? 'معلومات إضافية' : 'Additional Information', fonts, isArabic);
          
          const usableWidth = textWidth(doc);
          const colWidth = usableWidth / 3;
          const startY = doc.y;

          const categories = [
            { title: isArabic ? 'المشاريع' : 'Projects', items: projects },
            { title: isArabic ? 'الجوائز' : 'Awards', items: awards },
            { title: isArabic ? 'التطوع' : 'Volunteer Work', items: volunteers }
          ];

          let maxCatY = startY;

          categories.forEach((cat, idx) => {
            // Render columns from left to right or right to left
            doc.y = startY;
            const colX = doc.page.margins.left + (idx * colWidth);

            // Column Header
            doc.font(fonts.bold).fontSize(10.5).text(cat.title, colX, doc.y, {
              width: colWidth - 10,
              align: isArabic ? 'right' : 'left',
            });

            doc.moveDown(0.4);

            // Print entries as sub-titles (Project/Award name) with bullet and descriptions below them
            cat.items.forEach(item => {
              const itemTitle = safeText(item.title);
              const itemDesc = safeText(item.description);
              const bulletText = isArabic ? `${itemTitle} •` : `• ${itemTitle}`;
              
              doc.font(fonts.bold).fontSize(9.5).text(bulletText, colX, doc.y, {
                width: colWidth - 10,
                align: isArabic ? 'right' : 'left',
              });
              
              if (itemDesc) {
                // Indent bullet descriptions slightly
                const descLines = itemDesc
                  .split(/\r?\n/)
                  .map(line => line.trim())
                  .filter(line => line.length > 0);

                descLines.forEach(line => {
                  doc.font(fonts.regular).fontSize(8.5).text(line, colX + (isArabic ? -6 : 10), doc.y, {
                    width: colWidth - 20,
                    align: isArabic ? 'right' : 'left',
                    lineGap: 2,
                  });
                });
              }
              doc.moveDown(0.4);
            });

            if (doc.y > maxCatY) {
              maxCatY = doc.y;
            }
          });

          doc.y = maxCatY;
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
