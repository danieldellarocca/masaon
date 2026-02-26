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
      "A trip itinerary document (e.g., PDF, Word) as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  documentFileName: z
    .string()
    .optional()
    .describe('The original file name of the document, including its extension.'),
});
export type ItineraryAnalysisInput = z.infer<typeof ItineraryAnalysisInputSchema>;

const ItineraryAnalysisOutputSchema = z.object({
  tripName: z.string().describe('The name of the trip.'),
  tripSummary: z.string().describe('A brief overall summary of the trip itinerary.'),
  itineraryDays: z
    .array(
      z.object({
        dayNumber: z.number().describe('The sequential day number of the trip.'),
        date: z
          .string()
          .describe('The date for this day of the itinerary in YYYY-MM-DD format.'),
        location: z.string().describe('The main location or city for this day.'),
        activities: z.string().describe('A summary of activities planned for this day.'),
      })
    )
    .describe('A structured list of daily itinerary details.'),
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
  // Using gemini-1.5-flash for its multimodal capabilities
  model: 'googleai/gemini-1.5-flash',
  prompt: `אתה עוזר ניתוח מסמכים מומחה. תפקידך לנתח את מסמך הטיול שסופק ולחלץ את פרטי המסלול המרכזיים.

אנא ספק את המידע בפורמט JSON המחמיר הבא, תוך הקפדה על כל השדות והפורמטים:
{{json schema=ItineraryAnalysisOutputSchema}}

השתמש במסמך המצורף כמקור העיקרי למידע. אם שם הקובץ זמין, השתמש בו כהקשר נוסף:
קובץ מצורף: {{media url=documentDataUri}}
{{#if documentFileName}}שם הקובץ: {{{documentFileName}}}{{/if}}

חשוב: ודא שהתשובה היא JSON תקין לחלוטין וללא טקסט נוסף או הסברים מחוץ לבלוק ה-JSON. תאריך: YYYY-MM-DD.`,
});

const itineraryAnalysisFlow = ai.defineFlow(
  {
    name: 'itineraryAnalysisFlow',
    inputSchema: ItineraryAnalysisInputSchema,
    outputSchema: ItineraryAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to extract itinerary details from the document.');
    }
    return output;
  }
);
