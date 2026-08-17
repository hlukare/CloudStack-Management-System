const express = require('express');
const { seedData } = require('../seedDummyData');

const router = express.Router();

/**
 * POST /api/seed/demo
 * One-time (or occasional) endpoint to load demo user + dummy VMs into MongoDB.
 * Protected by SEED_SECRET — set this in Vercel env vars.
 *
 * Header: x-seed-secret: <SEED_SECRET>
 * Or body: { "secret": "<SEED_SECRET>" }
 */
router.post('/demo', async (req, res) => {
  const expected = process.env.SEED_SECRET;

  if (!expected) {
    return res.status(503).json({
      error: 'Seeding is disabled. Set SEED_SECRET in environment variables to enable.',
    });
  }

  const provided =
    req.headers['x-seed-secret'] ||
    req.body?.secret ||
    req.query?.secret;

  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'Invalid or missing seed secret' });
  }

  try {
    const summary = await seedData();
    return res.json({
      success: true,
      message: 'Demo data seeded successfully',
      login: {
        email: 'demo@cloudstack.com',
        password: 'demo123',
      },
      summary,
    });
  } catch (error) {
    console.error('Seed endpoint error:', error);
    return res.status(500).json({
      error: 'Failed to seed demo data',
      details: error.message,
    });
  }
});

module.exports = router;
