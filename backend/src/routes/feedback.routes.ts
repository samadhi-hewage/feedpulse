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



router.post('/', limiter, submitFeedback);
router.get('/summary', requireAuth, getAISummary);
router.get('/', requireAuth, getAllFeedback);
router.get('/:id', requireAuth, getFeedbackById);
router.patch('/:id', requireAuth, updateFeedback);
router.delete('/:id', requireAuth, deleteFeedback);
router.post('/:id/reanalyze', requireAuth, reanalyze);

export default router;