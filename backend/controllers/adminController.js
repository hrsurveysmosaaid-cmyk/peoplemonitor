const { executeQuery } = require('../config/database');
const GlobalUsersModel = require('../models/GlobalUsers');
const { sendFollowUpEmail } = require('../config/mail');

/**
 * Calculate CV completion percentage for a user's personalData JSON + portfolio data.
 * Sections: fullName, jobTitle, summary, skills, education, experience, photo, languages
 */
const calcCompletion = (personalData, hasExperience, hasSkills) => {
  if (!personalData) return 0;
  const p = typeof personalData === 'string' ? JSON.parse(personalData) : personalData;

  const checks = [
    // Personal info section
    !!(p.fullName || p.name),
    !!(p.designation || p.jobTitle || p.profileTitle || p.title),
    !!(p.about || p.summary || p.bio),
    !!(p.phone || p.email || p.location || p.city),
    // Education
    !!(p.education && Array.isArray(p.education) && p.education.length > 0),
    // Experience
    !!hasExperience,
    // Skills
    !!hasSkills,
    // Dynamic items (languages, certificates, etc.)
    !!(p.dynamicItems && Array.isArray(p.dynamicItems) && p.dynamicItems.length > 0),
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
};

const listUsers = async (req, res, next) => {
  try {
    const query = `
      SELECT
        u.id,
        u.full_name AS fullName,
        u.email,
        u.is_verified AS isVerified,
        u.record_created AS createdAt,
        p.id AS portfolioId,
        p.unique_slug_string AS portfolioSlug,
        p.is_published_live AS isPublishedLive,
        p.personal_data_json AS personalData,
        p.skills_classified_json AS skillsJson,
        pt.name AS partnerName
      FROM global_users u
      LEFT JOIN core_portfolios p ON p.user_id = u.id
      LEFT JOIN partners pt ON pt.id = u.partner_id
      ORDER BY u.id DESC, p.id DESC
    `;

    const results = await executeQuery(query);

    // For experience blocks, we need to know which portfolios have them
    const portfolioIds = [...new Set(results.filter(r => r.portfolioId).map(r => r.portfolioId))];
    let portfoliosWithExp = new Set();
    if (portfolioIds.length > 0) {
      const expQuery = `SELECT DISTINCT portfolio_id FROM portfolio_experience_blocks WHERE portfolio_id IN (${portfolioIds.map(() => '?').join(',')})`;
      const expRows = await executeQuery(expQuery, portfolioIds);
      portfoliosWithExp = new Set(expRows.map(r => r.portfolio_id));
    }

    const users = results.reduce((acc, row) => {
      const existing = acc.find((item) => item.id === row.id);

      let jobTitle = '—';
      let completion = 0;
      if (row.personalData) {
        try {
          const parsed = typeof row.personalData === 'string' ? JSON.parse(row.personalData) : row.personalData;
          jobTitle = parsed.designation || parsed.jobTitle || parsed.profileTitle || parsed.title || '—';

          // Check skills from skills_classified_json
          let hasSkills = false;
          if (row.skillsJson) {
            try {
              const sk = typeof row.skillsJson === 'string' ? JSON.parse(row.skillsJson) : row.skillsJson;
              hasSkills = Array.isArray(sk) ? sk.length > 0 : Object.keys(sk || {}).length > 0;
            } catch { hasSkills = false; }
          }

          const hasExperience = row.portfolioId ? portfoliosWithExp.has(row.portfolioId) : false;
          completion = calcCompletion(parsed, hasExperience, hasSkills);
        } catch (e) {
          // ignore parsing error
        }
      }

      if (existing) {
        if (row.portfolioSlug) {
          existing.portfolios.push({ slug: row.portfolioSlug, isPublishedLive: !!row.isPublishedLive });
        }
        if (existing.jobTitle === '—' && jobTitle !== '—') {
          existing.jobTitle = jobTitle;
        }
        // Use highest completion across portfolios
        if (completion > existing.completion) existing.completion = completion;
        return acc;
      }

      acc.push({
        id: row.id,
        fullName: row.fullName,
        email: row.email,
        isVerified: !!row.isVerified,
        createdAt: row.createdAt,
        partnerName: row.partnerName || null,
        jobTitle: jobTitle,
        completion: completion,
        portfolios: row.portfolioSlug ? [{ slug: row.portfolioSlug, isPublishedLive: !!row.isPublishedLive }] : [],
      });
      return acc;
    }, []);

    return res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const createDeepPortalBridge = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const user = await GlobalUsersModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const bridgeUrl = `/super-admin/user-workstation/${user.id}?bypass=true`;
    return res.json({ success: true, data: { bridgeUrl } });
  } catch (error) {
    next(error);
  }
};

/**
 * Send a manual CV-completion reminder email to a specific user
 * POST /api/admin/users/:userId/send-reminder
 */
const sendReminderEmail = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const user = await GlobalUsersModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await sendFollowUpEmail(user.email, user.full_name || 'المستخدم');

    console.log(`📧 [Admin] Manual reminder sent to ${user.email} (userId=${userId})`);
    return res.json({ success: true, message: `تم إرسال البريد إلى ${user.email}` });
  } catch (error) {
    console.error('❌ sendReminderEmail error:', error.message);
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const user = await GlobalUsersModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Manually cascade deletions to avoid any database-level missing ON DELETE CASCADE issues
    const portfolios = await executeQuery('SELECT id FROM core_portfolios WHERE user_id = ?', [userId]);
    for (const p of portfolios) {
      // Find and clean experience blocks for this portfolio
      const blocks = await executeQuery('SELECT id FROM portfolio_experience_blocks WHERE portfolio_id = ?', [p.id]);
      for (const b of blocks) {
        await executeQuery('DELETE FROM micro_success_stories WHERE experience_block_id = ?', [b.id]);
        await executeQuery('DELETE FROM external_live_endorsements WHERE experience_block_id = ?', [b.id]);
      }
      await executeQuery('DELETE FROM portfolio_experience_blocks WHERE portfolio_id = ?', [p.id]);
      await executeQuery('DELETE FROM external_live_endorsements WHERE portfolio_id = ?', [p.id]);
    }
    await executeQuery('DELETE FROM core_portfolios WHERE user_id = ?', [userId]);
    
    // Finally, delete the user
    await GlobalUsersModel.deleteUser(userId);

    return res.json({ success: true, message: 'User and all associated data deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  createDeepPortalBridge,
  sendReminderEmail,
  deleteUser,
};

