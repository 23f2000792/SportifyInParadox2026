import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY || 'AIzaSyBoPk1B3zeN5dQAaS3YcePlvdIdQYM7jAk',
    }),
  ],
  model: googleAI.model('gemini-1.0-pro'),
});
