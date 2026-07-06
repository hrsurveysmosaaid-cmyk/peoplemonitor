const { generateAtsPdf } = require('../services/pdfService');

const exportPdf = async (req, res, next) => {
  try {
    const data = req.body;
    const pdfBuffer = await generateAtsPdf(data);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="peopleos-ats-resume.pdf"');
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportPdf,
};
