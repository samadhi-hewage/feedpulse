import { Request, Response } from 'express';
import Feedback from '../models/Feedback.model';
import { analyzeWithGemini } from '../services/gemini.service';

// POST /api/feedback
export async function submitFeedback(req: Request, res: Response) {
  try {
    const { title, description, category, submitterName, submitterEmail } = req.body;

    // Basic input sanitisation
    if (!title?.trim() || !description?.trim() || !category) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const feedback = await Feedback.create({
      title: title.trim(),
      description: description.trim(),
      category,
      submitterName: submitterName?.trim(),
      submitterEmail: submitterEmail?.trim(),
    });

    // Run AI analysis (non-blocking — don't await in response)
    analyzeWithGemini(feedback.title, feedback.description).then(async (analysis) => {
      if (analysis) {
        await Feedback.findByIdAndUpdate(feedback._id, {
          ai_category: analysis.category,
          ai_sentiment: analysis.sentiment,
          ai_priority: analysis.priority_score,
          ai_summary: analysis.summary,
          ai_tags: analysis.tags,
          ai_processed: true,
        });
      }
    });

    return res.status(201).json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/feedback
export async function getAllFeedback(req: Request, res: Response) {
  try {
    const { category, status, sort, search, page = '1', limit = '10' } = req.query;

    const filter: any = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ai_summary: { $regex: search, $options: 'i' } },
      ];
    }

    const sortMap: any = {
      date: { createdAt: -1 },
      priority: { ai_priority: -1 },
      sentiment: { ai_sentiment: 1 },
    };
    const sortOption = sortMap[sort as string] || { createdAt: -1 };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Feedback.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      Feedback.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: items,
      message: 'Feedback retrieved',
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/feedback/summary
export async function getAISummary(req: Request, res: Response) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentFeedback = await Feedback.find({
      createdAt: { $gte: sevenDaysAgo },
      ai_processed: true,
    }).select('title ai_summary ai_tags ai_sentiment');

    if (recentFeedback.length === 0) {
      return res.json({ success: true, data: { summary: 'No feedback in the last 7 days.' } });
    }

    const feedbackText = recentFeedback
      .map((f) => `- ${f.title}: ${f.ai_summary}`)
      .join('\n');

    const prompt = `Based on these product feedback summaries from the past 7 days, identify the top 3 themes. Return ONLY valid JSON: {"themes": ["theme 1", "theme 2", "theme 3"], "overview": "one sentence overview"}\n\n${feedbackText}`;

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  }
);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const clean = text.replace(/```json|```/g, '').trim();

    return res.json({ success: true, data: JSON.parse(clean) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// GET /api/feedback/:id
export async function getFeedbackById(req: Request, res: Response) {
  try {
    const item = await Feedback.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: item });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PATCH /api/feedback/:id
export async function updateFeedback(req: Request, res: Response) {
  try {
    const { status } = req.body;
    const updated = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: updated, message: 'Status updated' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/feedback/:id
export async function deleteFeedback(req: Request, res: Response) {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, message: 'Feedback deleted' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

// POST /api/feedback/:id/reanalyze (Nice to Have 2.6)
export async function reanalyze(req: Request, res: Response) {
  try {
    const item = await Feedback.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });

    const analysis = await analyzeWithGemini(item.title, item.description);
    if (!analysis) return res.status(500).json({ success: false, error: 'AI analysis failed' });

    const updated = await Feedback.findByIdAndUpdate(
      item._id,
      {
        ai_category: analysis.category,
        ai_sentiment: analysis.sentiment,
        ai_priority: analysis.priority_score,
        ai_summary: analysis.summary,
        ai_tags: analysis.tags,
        ai_processed: true,
      },
      { new: true }
    );
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}