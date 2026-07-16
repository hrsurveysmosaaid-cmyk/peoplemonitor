const { executeQuery } = require('../config/database');
const { sendFollowUpEmail } = require('../config/mail');

/**
 * Run follow-up audit to find users who registered >= 7 days ago,
 * are verified, but have not published their core portfolio yet.
 */
const runFollowUpAudit = async () => {
  console.log('⏰ Running automated user follow-up email audit...');
  try {
    // 1. Fetch verified users who haven't received a follow-up email yet, registered at least 7 days ago
    const query = `
      SELECT id, full_name, email, record_created 
      FROM global_users 
      WHERE is_verified = 1 
        AND follow_up_email_sent = 0
        AND (
          record_created <= DATE_SUB(NOW(), INTERVAL 7 DAY)
          OR email = 'karam.mehrez944@gmail.com'
        )
    `;
    
    const candidates = await executeQuery(query);
    if (candidates.length === 0) {
      console.log('ℹ️ No follow-up email candidates found today.');
      return;
    }

    console.log(`🔍 Found ${candidates.length} potential candidates for follow-up emails.`);

    let sentCount = 0;
    for (const user of candidates) {
      // 2. Check if this user has any published core portfolios
      const checkPortfolioQuery = `
        SELECT id FROM core_portfolios 
        WHERE user_id = ? AND is_published_live = 1 
        LIMIT 1
      `;
      const portfolios = await executeQuery(checkPortfolioQuery, [user.id]);
      
      // If they have no published portfolios, send the email
      if (portfolios.length === 0) {
        try {
          await sendFollowUpEmail(user.email, user.full_name);
          
          // 3. Mark as sent to prevent duplicate reminders
          await executeQuery(
            'UPDATE global_users SET follow_up_email_sent = 1 WHERE id = ?',
            [user.id]
          );
          sentCount++;
        } catch (mailError) {
          console.error(`❌ Failed to send follow-up to user ${user.id} (${user.email}):`, mailError.message);
        }
      } else {
        // If they already have a published portfolio, mark follow_up_email_sent = 1 anyway
        // to bypass auditing them in the future.
        await executeQuery(
          'UPDATE global_users SET follow_up_email_sent = 1 WHERE id = ?',
          [user.id]
        );
      }
    }

    console.log(`✅ Follow-up audit finished. Sent emails to ${sentCount} user(s).`);
  } catch (error) {
    console.error('❌ Error executing follow-up email audit:', error.message);
  }
};

/**
 * Initialize follow-up scheduler. Runs the audit immediately on start,
 * and then schedules it once every 24 hours.
 */
const initializeFollowUpScheduler = () => {
  // Run audit 1 minute after start to let application boot up completely
  setTimeout(() => {
    runFollowUpAudit();
  }, 60000);

  // Repeat every 24 hours (86400000 ms)
  setInterval(() => {
    runFollowUpAudit();
  }, 86400000);

  console.log('🚀 Follow-up email scheduler initialized (Audit triggers every 24 hours)');
};

module.exports = {
  runFollowUpAudit,
  initializeFollowUpScheduler
};
