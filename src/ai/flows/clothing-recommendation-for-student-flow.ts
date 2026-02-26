'use server';
/**
 * @fileOverview Provides a Genkit flow for generating daily clothing recommendations for students.
 *
 * - clothingRecommendationForStudent - A function that handles the clothing recommendation process.
 * - ClothingRecommendationInput - The input type for the clothingRecommendationForStudent function.
 * - ClothingRecommendationOutput - The return type for the clothingRecommendationForStudent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ClothingRecommendationInputSchema = z.object({
  currentWeather: z
    .string()
    .describe(
      'The current weather conditions and temperature for the location, e.g., "sunny, 25 degrees Celsius" or "rainy, 10 degrees Celsius".'
    ),
  location: z
    .string()
    .describe('The current geographic location of the student, e.g., "Jerusalem, Israel".'),
  guideGuidelines: z
    .string()
    .describe(
      'Specific clothing guidelines provided by the trip guide, e.g., "no shorts allowed in religious sites", "wear comfortable walking shoes", or "modest dress required".'
    ),
});
export type ClothingRecommendationInput = z.infer<
  typeof ClothingRecommendationInputSchema
>;

const ClothingRecommendationOutputSchema = z.object({
  recommendation: z
    .string()
    .describe(
      'A clear, concise, and polite clothing recommendation for the student based on weather and guide guidelines, in Hebrew.'
    ),
});
export type ClothingRecommendationOutput = z.infer<
  typeof ClothingRecommendationOutputSchema
>;

export async function clothingRecommendationForStudent(
  input: ClothingRecommendationInput
): Promise<ClothingRecommendationOutput> {
  return clothingRecommendationForStudentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'clothingRecommendationPrompt',
  input: { schema: ClothingRecommendationInputSchema },
  output: { schema: ClothingRecommendationOutputSchema },
  prompt: `אתה יועץ סגנון אישי לתלמידים בטיול. עליך לספק המלצת לבוש יומית ברורה ומנומסת.
קח בחשון את המידע הבא:

מיקום נוכחי: {{{location}}}
מזג אוויר נוכחי: {{{currentWeather}}}
הנחיות מהמלווה: {{{guideGuidelines}}}

בהתבסס על המידע לעיל, אנא ספק המלצת לבוש מפורטת לתלמיד להיום, בשפה העברית.
התמקד בלבוש מתאים לפעילויות היום, נוחות, וציות להנחיות המלווה ולמזג האוויר.
`,
});

const clothingRecommendationForStudentFlow = ai.defineFlow(
  {
    name: 'clothingRecommendationForStudentFlow',
    inputSchema: ClothingRecommendationInputSchema,
    outputSchema: ClothingRecommendationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
