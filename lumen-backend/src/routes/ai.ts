import { Router } from 'express';
import { aiService } from '../services/ai.js';
import { ttsService } from '../services/tts.js';

export const aiRouter = Router();

/**
 * POST /api/ai/summarize
 * Mirror Synthesis: 3-point executive summary + cognitive connections
 * Body: { bookId?, snippetIds? } - if omitted, uses all user snippets
 */
aiRouter.post('/summarize', async (req, res) => {
  try {
    const userId = (req as { user?: { uid: string } }).user?.uid;
    if (!userId) return res.status(401).send();

    const { bookId, snippetIds } = req.body as {
      bookId?: string;
      snippetIds?: string[];
    };

    const summary = await aiService.summarize(userId, { bookId, snippetIds });
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Summarization failed' });
  }
});

/**
 * POST /api/ai/tts
 * Neural TTS: Convert summary or snippets to audio (PRD 3.4)
 * Body: { text?, source?, bookId?, snippetIds?, voice? }
 * - text: raw text to speak (optional)
 * - source: 'summary' | 'snippets' – use AI summary or snippet text
 * - voice: 'academic' | 'conversational' | 'calming'
 */
aiRouter.post('/tts', async (req, res) => {
  try {
    const userId = (req as { user?: { uid: string } }).user?.uid;
    if (!userId) return res.status(401).send();

    const { text, source, bookId, snippetIds, voice } = req.body as {
      text?: string;
      source?: 'summary' | 'snippets';
      bookId?: string;
      snippetIds?: string[];
      voice?: 'academic' | 'conversational' | 'calming';
    };

    const result = await ttsService.synthesize(userId, {
      text,
      source,
      bookId,
      snippetIds,
      voice,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'TTS synthesis failed' });
  }
});
