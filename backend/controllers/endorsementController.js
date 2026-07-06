const crypto = require('crypto');
const ExternalLiveEndorsementsModel = require('../models/ExternalLiveEndorsements');

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://peopleos.online';

const generateSecureHash = () => crypto.randomBytes(28).toString('hex');

const buildMailtoHtmlBody = ({ requestorFullName, requestorJobTitle, requestorPortfolioSlug, requestorExperienceTitle, requestorCompanyName, endorsementLink }) => {
  const htmlBody = `<!DOCTYPE html>
<html>
  <body>
    <p>السلام عليكم،</p>
    <p>أتشرف بدعوتك لكتابة رسالة توصية قصيرة عن تجربتنا في العمل معاً.</p>
    <p>الخبرة: <strong>${requestorExperienceTitle}</strong> في <strong>${requestorCompanyName}</strong></p>
    <p>إذا سمحت، يمكنك الوصول إلى نموذج التوصية الآمن من خلال الرابط التالي:</p>
    <p><a href="${endorsementLink}">${endorsementLink}</a></p>
    <p>مع خالص الشكر،</p>
    <p>${requestorFullName} — ${requestorJobTitle}</p>
  </body>
</html>`;
  return encodeURIComponent(htmlBody);
};

const requestEndorsement = async (req, res, next) => {
  try {
    const {
      requestorFullName,
      requestorEmail,
      requestorJobTitle,
      requestorPortfolioSlug,
      requestorExperienceTitle,
      requestorCompanyName,
      portfolioId = null,
      experienceBlockId = null,
    } = req.body;

    if (!requestorFullName || !requestorEmail || !requestorPortfolioSlug || !requestorExperienceTitle || !requestorCompanyName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required endorsement request fields',
      });
    }

    const token = generateSecureHash();
    const endorsementLink = `${PUBLIC_BASE_URL}/endorse/secure-token-${token}`;
    const mailtoSubject = encodeURIComponent('دعوة خاصة لحضرتكم لمساعدتي في كتابة رسالة توصية');
    const mailtoBody = buildMailtoHtmlBody({ requestorFullName, requestorJobTitle, requestorPortfolioSlug, requestorExperienceTitle, requestorCompanyName, endorsementLink });
    const mailtoLink = `mailto:?subject=${mailtoSubject}&body=${mailtoBody}`;

    await ExternalLiveEndorsementsModel.createPendingEndorsement({
      tokenAuthString: token,
      requestorPortfolioSlug,
      requestorFullName,
      requestorEmail,
      requestorJobTitle,
      requestorExperienceTitle,
      requestorCompanyName,
      portfolioId,
      experienceBlockId,
    });

    return res.json({
      success: true,
      data: {
        tokenAuthString: token,
        endorsementLink,
        mailtoLink,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getEndorsementByToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    const record = await ExternalLiveEndorsementsModel.getEndorsementByAuthToken(token);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Endorsement token not found' });
    }

    return res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const submitEndorsement = async (req, res, next) => {
  try {
    const { token } = req.params;
    const {
      endorserName,
      endorserEmail,
      endorserTitleRole,
      endorsementBodyText,
      signatureVectorStream,
    } = req.body;

    if (!token || !endorserName || !endorserEmail || !endorserTitleRole || !endorsementBodyText || !signatureVectorStream) {
      return res.status(400).json({
        success: false,
        error: 'Missing required endorsement submission fields',
      });
    }

    const record = await ExternalLiveEndorsementsModel.getEndorsementByAuthToken(token);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Endorsement request not found' });
    }

    await ExternalLiveEndorsementsModel.updateEndorsementByToken(token, {
      endorserName,
      endorserEmail,
      endorserTitleRole,
      endorsementBodyText,
      signatureVectorStream,
      submittedAt: new Date(),
    });

    return res.json({ success: true, message: 'Endorsement saved successfully' });
  } catch (error) {
    next(error);
  }
};

const getEndorsementsByPortfolioSlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ success: false, error: 'Portfolio slug is required' });
    }

    const endorsements = await ExternalLiveEndorsementsModel.getEndorsementsByPortfolioSlug(slug);
    return res.json({ success: true, data: endorsements });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestEndorsement,
  getEndorsementByToken,
  submitEndorsement,
  getEndorsementsByPortfolioSlug,
};
