
'use server';
/**
 * @fileOverview Raffle Draw Text-to-Speech AI agent.
 *
 * - generateRaffleAnnouncement - A function that converts raffle winner text to speech.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';

const AnnouncementInputSchema = z.object({
  name: z.string(),
  address: z.string(),
  ticketId: z.string(),
  rankText: z.string(),
});

export async function generateRaffleAnnouncement(input: z.infer<typeof AnnouncementInputSchema>) {
  return raffleTTSFlow(input);
}

const raffleTTSFlow = ai.defineFlow(
  {
    name: 'raffleTTSFlow',
    inputSchema: AnnouncementInputSchema,
    outputSchema: z.object({
      media: z.string(),
    }),
  },
  async (input) => {
    const query = `আজকের খেলার বিজয়ী হয়ে ${input.rankText} স্থান অধিকার করেছেন ${input.name}, গ্রামঃ ${input.address}, টিকেট নম্বারঃ ${input.ticketId}`;

    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: query,
    });

    if (!media) {
      throw new Error('No media returned from Gemini TTS');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
