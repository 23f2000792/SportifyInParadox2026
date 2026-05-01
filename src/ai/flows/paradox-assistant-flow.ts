
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

OFFICIAL RULEBOOKS:
- Kampus Run: https://docs.google.com/document/d/e/2PACX-1vSWGI8y2yB9v-df3JQBYlg0r_nGNeNoy0eouE_WfEvxZsrrtbrWXengxOLMv1MX_l96IN5sWIHYIBz0/pub
- Badminton: https://docs.google.com/document/d/e/2PACX-1vS-40N_0KX58mXv3x6ojSxjRpcMIWt58iuC6oz7uL-g7gqRetWm172DjMp-JrmVM5yUcOG6Sgxx3yYF/pub
- Football: https://docs.google.com/document/d/e/2PACX-1vTKj_9bJ4bqYT_q2gD9wyDh24EGUH9s-35t6NaUbr2HjauNprUfFFi2WQgWIAqgXi83dseiCQa16Z9o/pub
- Volleyball: https://docs.google.com/document/d/e/2PACX-1vQk0Pn79Qd75Qwu2Owaj_HwHWqtGZwwe73w99sQB8bskU4taBvmKBBAI8ZTww_ckf0cgeoJR5VML05g/pub

Use the following context if provided:
{{{context}}}

Guidelines:
- Be professional yet enthusiastic.
- If asked about rules, refer the user to the specific official rulebook link provided above.
- If you don't know something about a specific match score, refer them to the "Live Feed" tab in the event page.
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
