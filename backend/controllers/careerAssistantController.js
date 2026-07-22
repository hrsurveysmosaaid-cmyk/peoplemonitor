// backend/controllers/careerAssistantController.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── helpers ──────────────────────────────────────────────────────────────────

const getOpenAI = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not configured on this server.');
  return key;
};

/**
 * Read a PDF file as a base64 string (for GPT-4o vision/file API)
 * We convert the PDF to plain text extraction prompt instead — GPT reads the raw base64 blob.
 */
const pdfToBase64 = (filePath) => {
  const buf = fs.readFileSync(filePath);
  return buf.toString('base64');
};

const callOpenAI = async (messages, key) => {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(raw);
};

// ── Multer setup (temp files) ─────────────────────────────────────────────────

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are accepted'));
  },
});

// ── ATS Matcher ───────────────────────────────────────────────────────────────

const atsAnalyze = async (req, res) => {
  try {
    const apiKey = getOpenAI();
    const jobDescription = req.body?.jobDescription || '';
    const lang = req.body?.lang || 'en';

    let resumeText = '';
    if (req.file) {
      // Read the PDF bytes as base64 and tell GPT to extract content
      const b64 = pdfToBase64(req.file.path);
      fs.unlinkSync(req.file.path); // clean up temp file

      // First call: extract text from PDF
      const extractResult = await callOpenAI([
        {
          role: 'system',
          content: 'You are a PDF text extractor. Extract all text content from the provided base64-encoded PDF and return it as JSON: { "text": "..." }. Include all sections: name, contact, summary, experience, education, skills.',
        },
        {
          role: 'user',
          content: `Base64 PDF:\n${b64.substring(0, 12000)}`, // trim to avoid token overflow
        },
      ], apiKey);

      resumeText = extractResult?.text || 'Could not extract resume text.';
    } else if (req.body?.resumeText) {
      resumeText = req.body.resumeText;
    }

    if (!resumeText && !jobDescription) {
      return res.status(400).json({ success: false, error: 'No resume or job description provided.' });
    }

    const langInstruction = lang === 'ar' ? 'Respond in Arabic.' : 'Respond in English.';

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) resume analyst and career coach. Analyze the given resume against the job description and return a detailed JSON report. ${langInstruction}

Return this exact JSON structure:
{
  "score": <integer 0-100>,
  "summary": "<2-3 sentence AI analysis>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "missingKeywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>"],
  "recommendations": ["<specific action 1>", "<specific action 2>", "<specific action 3>"]
}`;

    const result = await callOpenAI([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `RESUME:\n${resumeText}\n\n---\n\nJOB DESCRIPTION:\n${jobDescription}`,
      },
    ], apiKey);

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[CareerAssistant/ATS]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ── LinkedIn Optimizer ────────────────────────────────────────────────────────

const linkedinAnalyze = async (req, res) => {
  try {
    const apiKey = getOpenAI();
    const profileUrl = req.body?.profileUrl || '';
    const lang = req.body?.lang || 'en';

    let profileText = '';
    if (req.file) {
      const b64 = pdfToBase64(req.file.path);
      fs.unlinkSync(req.file.path);

      const extractResult = await callOpenAI([
        {
          role: 'system',
          content: 'You are a PDF text extractor. Extract all text content from the provided base64-encoded LinkedIn profile PDF and return it as JSON: { "text": "..." }.',
        },
        {
          role: 'user',
          content: `Base64 PDF:\n${b64.substring(0, 12000)}`,
        },
      ], apiKey);

      profileText = extractResult?.text || '';
    }

    const langInstruction = lang === 'ar' ? 'Respond in Arabic.' : 'Respond in English.';

    const inputContext = profileText
      ? `LinkedIn Profile Content:\n${profileText}`
      : `LinkedIn Profile URL: ${profileUrl}\n(Analyze based on the URL structure and provide best-practice optimization advice.)`;

    const systemPrompt = `You are a LinkedIn profile optimization expert and career coach. Analyze the given LinkedIn profile and provide a detailed improvement report. ${langInstruction}

Return this exact JSON structure:
{
  "score": <integer 0-100 representing profile strength>,
  "summary": "<2-3 sentence overview of current profile quality>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>", "<area to improve 3>"],
  "recommendations": ["<specific action 1>", "<specific action 2>", "<specific action 3>"]
}`;

    const result = await callOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: inputContext },
    ], apiKey);

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[CareerAssistant/LinkedIn]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { atsAnalyze, linkedinAnalyze, upload };
