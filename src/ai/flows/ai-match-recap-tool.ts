
'use server';
/**
 * @fileOverview A GenAI tool to automatically generate concise recaps and professional audio commentary for completed games.
 *
 * - generateMatchRecap - Generates a text summary of the match.
 * - generateAudioCommentary - Generates a professional sports voiceover for the recap.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import wav from 'wav';

const GenerateMatchRecapInputSchema = z.object({
  sport: z.string().describe('The type of sport (e.g., Football, Volleyball).'),
  teamA_name: z.string().describe('The name of the first team.'),
  teamA_score: z.number().describe('The score of the first team.'),
  teamB_name: z.string().describe('The name of the second team.'),
  teamB_score: z.number().describe('The score of the second team.'),
  keyEvents: z.array(z.string()).optional().describe('Optional list of key events or highlights from the match.'),
});
export type GenerateMatchRecapInput = z.infer<typeof GenerateMatchRecapInputSchema>;

const GenerateMatchRecapOutputSchema = z.object({
  recap: z.string().describe('A concise and engaging summary of the match.'),
});
export type GenerateMatchRecapOutput = z.infer<typeof GenerateMatchRecapOutputSchema>;

export async function generateMatchRecap(input: GenerateMatchRecapInput): Promise<GenerateMatchRecapOutput> {
  return aiMatchRecapToolFlow(input);
}

const aiMatchRecapPrompt = ai.definePrompt({
  name: 'aiMatchRecapPrompt',
  input: {schema: GenerateMatchRecapInputSchema},
  output: {schema: GenerateMatchRecapOutputSchema},
  prompt: `You are an experienced sports commentator. Generate a concise (max 40 words), high-energy match summary. 
Focus on the outcome and key moments. Make it sound professional for a broadcast.

Sport: {{{sport}}}
Match Result: {{{teamA_name}}} ({{{teamA_score}}}) vs {{{teamB_name}}} ({{{teamB_score}}})

{{#if keyEvents}}
Highlights:
{{#each keyEvents}}- {{{this}}}
{{/each}}
{{/if}}
`,
});

const aiMatchRecapToolFlow = ai.defineFlow(
  {
    name: 'aiMatchRecapToolFlow',
    inputSchema: GenerateMatchRecapInputSchema,
    outputSchema: GenerateMatchRecapOutputSchema,
  },
  async input => {
    const {output} = await aiMatchRecapPrompt(input);
    return output!;
  }
);

/**
 * Audio Commentary Flow
 */
export async function generateAudioCommentary(recapText: string): Promise<{ audioData: string }> {
  return audioCommentaryFlow(recapText);
}

const audioCommentaryFlow = ai.defineFlow(
  {
    name: 'audioCommentaryFlow',
    inputSchema: z.string(),
    outputSchema: z.object({ audioData: z.string() }),
  },
  async (text) => {
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
      prompt: `Narrate this sports recap with high energy and professional broadcast tone: ${text}`,
    });

    if (!media || !media.url) {
      throw new Error('No audio media returned from Genkit');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavData = await toWav(audioBuffer);
    return {
      audioData: 'data:audio/wav;base64,' + wavData,
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

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
