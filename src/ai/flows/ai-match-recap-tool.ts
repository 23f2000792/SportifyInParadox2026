
'use server';
/**
 * @fileOverview A GenAI tool to automatically generate concise match recaps.
 *
 * - generateMatchRecap - Generates a text summary of the match.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
