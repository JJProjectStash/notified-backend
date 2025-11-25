/**
 * Ping Controller
 * Very lightweight route suitable for uptime / ping services.
 * This route purposefully does NOT check DB or perform any heavy work.
 */

const getPing = (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      status: 'ok',
      uptime: process.uptime(),
      env: process.env.NODE_ENV || 'development',
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Extremely unlikely to hit here for a simple route - still safe fallback
    return res.status(500).json({ success: false, status: 'error', error: 'Ping failed' });
  }
};

module.exports = { getPing };
