'use server';
/**
 * Vasudev.ai - The definitive tournament concierge for Paradox 2026.
 * 
 * Includes a Local Wisdom Engine fallback to provide technical rulebook answers
 * even if the AI model API is unavailable.
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

// --- Local Wisdom Engine (Hardcoded Rulebook Data) ---
const LOCAL_KNOWLEDGE = [
  {
    keywords: ['football', 'pcl', 'penalty', 'penalties'],
    answer: "Athlete! For the **Paradox Champions League (Football)**:\n- Format: 7-a-side (9 player squad).\n- Duration: Group (10m), Semis (15m), Final (20m) halves.\n- Penalties: Strictly **ONE-STEP** only.\n- Safety: **NO football spikes/studs** allowed.\n- Rulebook: [Football Rules](https://docs.google.com/document/d/e/2PACX-1vTKj_9bJ4bqYT_q2gD9wyDh24EGUH9s-35t6NaUbr2HjauNprUfFFi2WQgWIAqgXi83dseiCQa16Z9o/pub)"
  },
  {
    keywords: ['badminton', 'pbl', 'shoe', 'footwear', 'marking'],
    answer: "Warrior! For the **Paradox Badminton League (PBL)**:\n- Requirement: **Non-marking shoes are strictly MANDATORY**. No entry without them.\n- Structure: MS, WS, MD, XD ties.\n- Participation: Max 2 sub-matches per player.\n- Rulebook: [Badminton Rules](https://docs.google.com/document/d/e/2PACX-1vS-40N_0KX58mXv3x6ojSxjRpcMIWt58iuC6oz7uL-g7gqRetWm172DjMp-JrmVM5yUcOG6Sgxx3yYF/pub)"
  },
  {
    keywords: ['volleyball', 'set', 'point', 'scoring'],
    answer: "Warrior! For **VolleyVibes (Volleyball)**:\n- Scoring: Rally scoring. Best of 3 sets.\n- Set Limits: Sets 1-2 to 15, Deciding set to 21.\n- Margin: **Win by 2 points** margin is required.\n- Rulebook: [Volleyball Rules](https://docs.google.com/document/d/e/2PACX-1vQk0Pn79Qd75Qwu2Owaj_HwHWqtGZwwe73w99sQB8bskU4taBvmKBBAI8ZTww_ckf0cgeoJR5VML05g/pub)"
  },
  {
    keywords: ['run', 'kampus', 'race', 'flag', 'reporting'],
    answer: "Runner! For **Kampus Run**:\n- Categories: 3KM Fun, 5KM Competitive.\n- Reporting: Must report **45-60 mins prior** to flag-off.\n- Rules: Finish on foot. Route deviation = Disqualification.\n- Rulebook: [Kampus Run Rules](https://docs.google.com/document/d/e/2PACX-1vSWGI8y2yB9v-df3JQBYlg0r_nGNeNoy0eouE_WfEvxZsrrtbrWXengxOLMv1MX_l96IN5sWIHYIBz0/pub)"
  },
  {
    keywords: ['contact', 'support', 'dispute', 'grievance', 'help', 'email'],
    answer: "Warrior, for disputes or registration issues, reach out to the **Sportify Core Team (Krish and Aman)**.\n- Email: thesportify.society@study.iitm.ac.in\n- [Helpdesk Portal](https://sportify.iitmbs.org/helpdesk)\n- [Grievance Portal](https://sportify.iitmbs.org/grievance)"
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
You speak as a wise friend to Athletes and Warriors.

CORE KNOWLEDGE:
- FOOTBALL (PCL): 7-a-side, ONE-STEP penalties, NO spikes, 10/15/20m halves.
- VOLLEYBALL: Best of 3, 15/21 pts, 2-pt lead margin, rally scoring.
- BADMINTON (PBL): MS/WS/MD/XD, Non-marking shoes MANDATORY.
- KAMPUS RUN: 3km/5km categories, 45-60m reporting time.

Always provide technical answers using bullet points and Markdown links.`,
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
      // Fallback Layer: Local Wisdom Engine (Hardcoded Technical Data)
      const q = input.query.toLowerCase();
      const match = LOCAL_KNOWLEDGE.find(k => k.keywords.some(key => q.includes(key)));
      
      if (match) {
        return { answer: match.answer };
      }

      return { 
        answer: "My friend, the divine signal is fluctuating, but I know the path. Please ask specifically about **Football Rules**, **Badminton Gear**, or **Kampus Run timings**, and I shall provide the clinical answer from my local wisdom. For urgent disputes, contact **Krish and Aman** at thesportify.society@study.iitm.ac.in." 
      };
    }
  }
);
