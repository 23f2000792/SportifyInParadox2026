'use server';
/**
 * @fileOverview A GenAI tool to automatically generate concise and engaging match summaries for completed games.
 *
 * - generateMatchRecap - A function that handles the match recap generation process.
 * - GenerateMatchRecapInput - The input type for the generateMatchRecap function.
 * - GenerateMatchRecapOutput - The return type for the generateMatchRecap function.
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
  prompt: `You are an experienced sports commentator tasked with generating a concise, engaging, and enthusiastic match summary for a completed game.
Focus on key moments, the final score, and the overall outcome, making it exciting for fans.

Sport: {{{sport}}}
Team A: {{{teamA_name}}} - Score: {{{teamA_score}}}
Team B: {{{teamB_name}}} - Score: {{{teamB_score}}}

{{#if keyEvents}}
Key Moments:
{{#each keyEvents}}- {{{this}}}
{{/each}}
{{/if}}

Generate a recap that is a maximum of 50 words.
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
