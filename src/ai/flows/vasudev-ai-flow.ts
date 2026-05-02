'use server';
/**
 * Vasudev.ai - The Definitive fail-safe concierge for Paradox 2026.
 * 
 * Features a Local Wisdom Engine fallback that provides technical rulebook answers
 * even if the AI API is restricted or unavailable.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const VasudevInputSchema = z.object({
  query: z.string().describe('The user question about Paradox 2026.'),
  context: z.string().optional().describe('Real-time data about matches or standings.'),
});

const VasudevOutputSchema = z.object({
  answer: z.string().describe('A knowledgeable, energetic, and clinical technical response.'),
});

// --- Local Wisdom Engine (Definitive Hardcoded Data) ---
const LOCAL_KNOWLEDGE = [
  {
    keywords: ['football', 'pcl', 'penalty', 'penalties', 'one step', 'spike', 'stud', 'time', 'duration'],
    answer: "Athlete! For the **Paradox Champions League (Football)**:\n- **Format**: 7-a-side (9 player squad).\n- **Penalties**: Strictly **ONE-STEP** only. No run-ups allowed.\n- **Equipment**: **NO football spikes/studs** (shoes with studs). Only flat soles or turf shoes.\n- **Match Time**: Group (10m halves), Semis (15m), Final (20m).\n- **Rulebook**: [Official Football Rules](https://docs.google.com/document/d/e/2PACX-1vTKj_9bJ4bqYT_q2gD9wyDh24EGUH9s-35t6NaUbr2HjauNprUfFFi2WQgWIAqgXi83dseiCQa16Z9o/pub)"
  },
  {
    keywords: ['badminton', 'pbl', 'shoe', 'footwear', 'marking', 'non-marking', 'ms', 'ws', 'md', 'xd'],
    answer: "Warrior! For the **Paradox Badminton League (PBL)**:\n- **Shoes**: **Non-marking shoes are strictly MANDATORY**. No athlete is allowed on court without them.\n- **Tie Structure**: MS, WS, MD, XD. \n- **Participation**: A player can play a maximum of 2 sub-matches in a tie.\n- **Scoring**: Rally scoring system applies.\n- **Rulebook**: [Official Badminton Rules](https://docs.google.com/document/d/e/2PACX-1vS-40N_0KX58mXv3x6ojSxjRpcMIWt58iuC6oz7uL-g7gqRetWm172DjMp-JrmVM5yUcOG6Sgxx3yYF/pub)"
  },
  {
    keywords: ['volleyball', 'set', 'point', 'scoring', 'margin', '15', '21'],
    answer: "Spiker! For **VolleyVibes (Volleyball)**:\n- **Format**: Best of 3 sets.\n- **Scoring**: Sets 1 & 2 to 15 points. Deciding set (if any) to 21 points.\n- **Win Margin**: A **2-point lead margin** is mandatory to win a set.\n- **Rulebook**: [Official Volleyball Rules](https://docs.google.com/document/d/e/2PACX-1vQk0Pn79Qd75Qwu2Owaj_HwHWqtGZwwe73w99sQB8bskU4taBvmKBBAI8ZTww_ckf0cgeoJR5VML05g/pub)"
  },
  {
    keywords: ['run', 'kampus', 'race', 'flag', 'reporting', 'time', 'km', '3km', '5km'],
    answer: "Runner! For **Kampus Run**:\n- **Categories**: 3KM Fun Run and 5KM Competitive Run.\n- **Reporting**: You must report **45-60 mins prior** to the flag-off time.\n- **Rules**: Must finish on foot. No independent route deviations allowed.\n- **Rulebook**: [Kampus Run Rules](https://docs.google.com/document/d/e/2PACX-1vSWGI8y2yB9v-df3JQBYlg0r_nGNeNoy0eouE_WfEvxZsrrtbrWXengxOLMv1MX_l96IN5sWIHYIBz0/pub)"
  },
  {
    keywords: ['contact', 'support', 'dispute', 'grievance', 'help', 'email', 'krish', 'aman'],
    answer: "Warrior, for any match disputes, technical grievances, or registration issues, reach out to the **Sportify Core Team (Krish and Aman)**.\n- **Email**: thesportify.society@study.iitm.ac.in\n- **Portals**: [Helpdesk](https://sportify.iitmbs.org/helpdesk) | [Grievance](https://sportify.iitmbs.org/grievance)"
  }
];

export async function vasudevAssistant(input: z.infer<typeof VasudevInputSchema>) {
  return vasudevFlow(input);
}

const vasudevPrompt = ai.definePrompt({
  name: 'vasudevPrompt',
  input: { schema: VasudevInputSchema },
  output: { schema: VasudevOutputSchema },
  system: `You are Vasudev.ai, the clinical expert guide for Paradox 2026. 
You speak as a wise friend to Athletes and Warriors. Use bullet points and professional formatting.

CORE KNOWLEDGE:
- FOOTBALL (PCL): 7-a-side, ONE-STEP penalties, NO studs/spikes.
- VOLLEYBALL: Best of 3, Sets (15/15/21), 2-pt margin required.
- BADMINTON (PBL): Non-marking shoes are MANDATORY. 
- KAMPUS RUN: 3KM/5KM, reporting 45-60m before.

Refer users to Krish and Aman only for complex administrative disputes.`,
  prompt: `User Query: {{{query}}}
Context: {{{context}}}`,
});

const vasudevFlow = ai.defineFlow(
  {
    name: 'vasudevFlow',
    inputSchema: VasudevInputSchema,
    outputSchema: VasudevOutputSchema,
  },
  async (input) => {
    try {
      // Primary Attempt: Use the Generative AI Model
      const { output } = await vasudevPrompt(input);
      if (output?.answer) return output;
      throw new Error('Fallback triggered');
    } catch (e) {
      // Fallback Layer: Local Wisdom Engine (Fail-safe knowledge)
      const q = input.query.toLowerCase();
      const match = LOCAL_KNOWLEDGE.find(k => k.keywords.some(key => q.includes(key)));
      
      if (match) {
        return { answer: match.answer };
      }

      return { 
        answer: "My friend, the divine signal is fluctuating, but I have the clinical path. Please ask specifically about **Football Rules**, **Badminton Shoes**, or **Kampus Run timings**. For registration disputes, contact **Krish and Aman** at thesportify.society@study.iitm.ac.in." 
      };
    }
  }
);
