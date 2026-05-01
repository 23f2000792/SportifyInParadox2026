
'use server';
/**
 * @fileOverview A GenAI flow to act as a tournament concierge.
 *
 * - paradoxAssistant - Answers questions about tournament rules and sports.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ParadoxAssistantInputSchema = z.object({
  query: z.string().describe('The user question about Paradox 2026 sports.'),
  context: z.string().optional().describe('Contextual information about current matches or rules.'),
});

const ParadoxAssistantOutputSchema = z.object({
  answer: z.string().describe('A helpful, concise, and energetic answer.'),
});

export async function paradoxAssistant(input: z.infer<typeof ParadoxAssistantInputSchema>) {
  return paradoxAssistantFlow(input);
}

const paradoxAssistantPrompt = ai.definePrompt({
  name: 'paradoxAssistantPrompt',
  input: { schema: ParadoxAssistantInputSchema },
  output: { schema: ParadoxAssistantOutputSchema },
  prompt: `You are the official Sportify AI Assistant for Paradox 2026. 
Your goal is to provide accurate, high-energy, and helpful information to students and athletes.

Use the following context if provided:
{{{context}}}

Guidelines:
- Be professional yet enthusiastic.
- If you don't know something about a specific match score, refer them to the "Live Feed" tab.
- Always encourage sportsmanship and house pride.
- Keep answers under 60 words.

User Query: {{{query}}}`,
});

const paradoxAssistantFlow = ai.defineFlow(
  {
    name: 'paradoxAssistantFlow',
    inputSchema: ParadoxAssistantInputSchema,
    outputSchema: ParadoxAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await paradoxAssistantPrompt(input);
    return output!;
  }
);
