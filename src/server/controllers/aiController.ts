import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import {
  askGemini,
  generateCaption,
  generateHashtags,
  rewriteMessage,
  summarizeContent,
  isGeminiConfigured,
} from '../services/geminiService';

export async function askAI(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { prompt, history = [] } = req.body;
    if (!prompt) {
      res.status(400).json({ success: false, message: 'Prompt is required.' });
      return;
    }

    const answer = await askGemini(prompt, history);
    res.json({
      success: true,
      data: {
        text: answer,
        isConfigured: isGeminiConfigured,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getCaptions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { topic = 'Dark Falcon', tone = 'electric' } = req.body;
  const captions = await generateCaption(topic, tone);
  res.json({ success: true, data: captions, isConfigured: isGeminiConfigured });
}

export async function getHashtags(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { topic = 'Dark Falcon' } = req.body;
  const hashtags = await generateHashtags(topic);
  res.json({ success: true, data: hashtags, isConfigured: isGeminiConfigured });
}

export async function rewrite(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { message, style = 'punchy' } = req.body;
  if (!message) {
    res.status(400).json({ success: false, message: 'Message to rewrite is required.' });
    return;
  }
  const rewritten = await rewriteMessage(message, style);
  res.json({ success: true, data: rewritten, isConfigured: isGeminiConfigured });
}

export async function summarize(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ success: false, message: 'Text to summarize is required.' });
    return;
  }
  const summary = await summarizeContent(text);
  res.json({ success: true, data: summary, isConfigured: isGeminiConfigured });
}
