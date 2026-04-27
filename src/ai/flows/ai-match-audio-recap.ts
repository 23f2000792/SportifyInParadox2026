
'use server';
/**
 * @fileOverview A GenAI flow to generate audio match recaps using Gemini TTS.
 *
 * - generateMatchAudio - Converts a text recap into professional audio.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/google-genai';

const AudioRecapInputSchema = z.object({
  text: z.string().describe('The text recap to convert to audio.'),
});

const AudioRecapOutputSchema = z.object({
  audioDataUri: z.string().describe('The generated audio as a data URI.'),
});

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

export async function generateMatchAudio(input: z.infer<typeof AudioRecapInputSchema>) {
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
    prompt: `You are a professional sports radio commentator. Read the following match recap with high energy and excitement: ${input.text}`,
  });

  if (!media || !media.url) {
    throw new Error('No audio returned from Genkit');
  }

  const audioBuffer = Buffer.from(
    media.url.substring(media.url.indexOf(',') + 1),
    'base64'
  );

  const wavBase64 = await toWav(audioBuffer);
  return {
    audioDataUri: `data:audio/wav;base64,${wavBase64}`,
  };
}
