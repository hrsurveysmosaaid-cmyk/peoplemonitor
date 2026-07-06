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
        p.is_published_live AS isPublishedLive
      FROM global_users u
      LEFT JOIN core_portfolios p ON p.user_id = u.id
      ORDER BY u.id DESC, p.id DESC
    `;

    const results = await executeQuery(query);
    const users = results.reduce((acc, row) => {
      const existing = acc.find((item) => item.id === row.id);
      if (existing) {
        if (row.portfolioSlug) {
          existing.portfolios.push({ slug: row.portfolioSlug, isPublishedLive: !!row.isPublishedLive });
        }
        return acc;
      }
      acc.push({
        id: row.id,
        fullName: row.fullName,
        email: row.email,
        isVerified: !!row.isVerified,
        createdAt: row.createdAt,
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

module.exports = {
  listUsers,
  createDeepPortalBridge,
};
