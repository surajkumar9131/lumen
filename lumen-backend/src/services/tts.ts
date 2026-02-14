/**
 * Neural Text-to-Speech (PRD 3.4)
 * Converts summaries or snippets to high-quality audio.
 * Supports 3 narrator voices: Academic, Conversational, Calming.
 */

import { storage } from '../lib/firebase.js';
import { snippetsService } from './snippets.js';
import { aiService } from './ai.js';

const VOICE_MAP: Record<string, { name: string; languageCode: string }> = {
  academic: { name: 'en-US-Neural2-D', languageCode: 'en-US' },
  conversational: { name: 'en-US-Neural2-J', languageCode: 'en-US' },
  calming: { name: 'en-US-Neural2-F', languageCode: 'en-US' },
};

export const ttsService = {
  async synthesize(
    userId: string,
    params: {
      text?: string;
      source?: 'summary' | 'snippets';
      bookId?: string;
      snippetIds?: string[];
      voice?: 'academic' | 'conversational' | 'calming';
    }
  ): Promise<{ audioUrl: string; durationSeconds?: number }> {
    let text = params.text;

    if (!text) {
      if (params.source === 'summary') {
        const summary = await aiService.summarize(userId, {
          bookId: params.bookId,
          snippetIds: params.snippetIds,
        });
        text = [
          ...summary.executiveSummary,
          ...summary.cognitiveConnections.map(
            (c) => `${c.snippet} relates to ${c.relatedBook}: ${c.relatedQuote}`
          ),
        ]
          .filter(Boolean)
          .join('. ');
      } else if (params.source === 'snippets' && params.snippetIds?.length) {
        const snippets = await snippetsService.getMany(userId, params.snippetIds);
        text = snippets.map((s) => s.text).join('. ');
      } else {
        const snippets = await snippetsService.listByUser(userId, {
          bookId: params.bookId,
        });
        text = snippets.map((s) => s.text).join('. ');
      }
    }

    if (!text?.trim()) {
      throw new Error('No text available to synthesize');
    }

    const voiceKey = params.voice ?? 'conversational';
    const voice = VOICE_MAP[voiceKey] ?? VOICE_MAP.conversational;

    const { TextToSpeechClient } = await import('@google-cloud/text-to-speech');
    const client = new TextToSpeechClient();

    const [response] = await client.synthesizeSpeech({
      input: { text: text.slice(0, 5000) },
      voice: { languageCode: voice.languageCode, name: voice.name },
      audioConfig: {
        audioEncoding: 'MP3',
        sampleRateHertz: 24000,
      },
    });

    const audioContent = response.audioContent;
    if (!audioContent || !(audioContent instanceof Uint8Array)) {
      throw new Error('TTS synthesis failed');
    }

    const bucket = storage.bucket();
    const fileName = `audio/${userId}/${Date.now()}.mp3`;
    const file = bucket.file(fileName);
    await file.save(Buffer.from(audioContent), {
      metadata: { contentType: 'audio/mpeg' },
    });

    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000,
    });

    return { audioUrl: signedUrl };
  },
};
