'use server';
/**
 * @fileOverview An AI agent that analyzes trip itinerary documents.
 *
 * - analyzeItineraryForGuide - A function that handles the itinerary analysis process.
 * - ItineraryAnalysisInput - The input type for the analyzeItineraryForGuide function.
 * - ItineraryAnalysisOutput - The return type for the analyzeItineraryForGuide function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ItineraryAnalysisInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A trip itinerary document (e.g., PDF, Image) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentFileName: z
    .string()
    .optional()
    .describe('The original file name of the document, including its extension.'),
});
export type ItineraryAnalysisInput = z.infer<typeof ItineraryAnalysisInputSchema>;

const ItineraryAnalysisOutputSchema = z.object({
  tripName: z.string().optional().describe('The name of the trip, if found.'),
  tripSummary: z.string().optional().describe('A brief overall summary of the trip itinerary, if found.'),
  itineraryDays: z
    .array(
      z.object({
        dayNumber: z.number().describe('The sequential day number of the trip.'),
        date: z
          .string()
          .optional()
          .describe('The date for this day of the itinerary in YYYY-MM-DD format, if found.'),
        location: z.string().optional().describe('The main location or city for this day, if found.'),
        activities: z.string().optional().describe('A summary of activities planned for this day, if found.'),
        sites: z.array(z.object({
          name: z.string().describe('The name of the site or activity.'),
          time: z.string().describe('The planned time for this site visit, e.g., "09:00 - 10:30".')
        })).optional().describe('Detailed list of sites and visit times for this day.')
      })
    )
    .describe('A structured list of daily itinerary details. Include even partial details.'),
});
export type ItineraryAnalysisOutput = z.infer<typeof ItineraryAnalysisOutputSchema>;

export async function analyzeItineraryForGuide(
  input: ItineraryAnalysisInput
): Promise<ItineraryAnalysisOutput> {
  return itineraryAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'itineraryAnalysisPrompt',
  input: {schema: ItineraryAnalysisInputSchema},
  output: {schema: ItineraryAnalysisOutputSchema},
  prompt: `אתה עוזר ניתוח מסמכים מומחה. תפקידך לנתח את מסמך הטיול שסופק ולחלץ את פרטי המסלול.

חלץ כמה שיותר מידע, גם אם הוא חלקי. אם לא מצאת שדה מסוים (כמו תאריך או שעה ספציפית), פשוט השאר אותו ריק או אל תכלול אותו ב-JSON, אך נסה לבנות את מבנה הימים בצורה הטובה ביותר לפי הטקסט.

התמקד בזיהוי ימים, מיקומים ואתרים. אם יש שעות - ציין אותן. אם אין - השאר ריק.

קובץ מצורף: {{media url=documentDataUri}}
{{#if documentFileName}}שם הקובץ: {{{documentFileName}}}{{/if}}
`,
});

const itineraryAnalysisFlow = ai.defineFlow(
  {
    name: 'itineraryAnalysisFlow',
    inputSchema: ItineraryAnalysisInputSchema,
    outputSchema: ItineraryAnalysisOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('Failed to extract itinerary details from the document.');
      }
      return output;
    } catch (error) {
      console.error('Genkit prompt error:', error);
      throw error;
    }
  }
);
