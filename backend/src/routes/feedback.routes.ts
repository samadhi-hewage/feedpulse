import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  submitFeedback, getAllFeedback, getFeedbackById,
  updateFeedback, deleteFeedback, getAISummary, reanalyze,
} from '../controllers/feedback.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Install: npm install express-rate-limit
const limiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });

// ✅ Test route — NO auth, put it first
router.get('/test-ai', async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say hello' }] }]
        }),
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (err: any) {
    res.json({ error: err.message });
  }
});

router.post('/', limiter, submitFeedback);
router.get('/summary', requireAuth, getAISummary);
router.get('/', requireAuth, getAllFeedback);
router.get('/:id', requireAuth, getFeedbackById);
router.patch('/:id', requireAuth, updateFeedback);
router.delete('/:id', requireAuth, deleteFeedback);
router.post('/:id/reanalyze', requireAuth, reanalyze);

export default router;