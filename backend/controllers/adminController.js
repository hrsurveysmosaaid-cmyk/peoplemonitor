const { executeQuery } = require('../config/database');
const GlobalUsersModel = require('../models/GlobalUsers');

const listUsers = async (req, res, next) => {
  try {
    const query = `
      SELECT
        u.id,
        u.full_name AS fullName,
        u.email,
        u.is_verified AS isVerified,
        u.record_created AS createdAt,
        p.unique_slug_string AS portfolioSlug,
        p.is_published_live AS isPublishedLive,
        p.personal_data_json AS personalData,
        pt.name AS partnerName
      FROM global_users u
      LEFT JOIN core_portfolios p ON p.user_id = u.id
      LEFT JOIN partners pt ON pt.id = u.partner_id
      ORDER BY u.id DESC, p.id DESC
    `;

    const results = await executeQuery(query);
    const users = results.reduce((acc, row) => {
      const existing = acc.find((item) => item.id === row.id);
      
      let jobTitle = '—';
      if (row.personalData) {
        try {
          const parsed = typeof row.personalData === 'string' ? JSON.parse(row.personalData) : row.personalData;
          jobTitle = parsed.designation || parsed.jobTitle || parsed.profileTitle || parsed.title || '—';
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
  deleteUser,
};
