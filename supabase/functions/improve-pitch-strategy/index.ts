import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feedback, currentStrategy, productInfo } = await req.json();

    if (!feedback || !currentStrategy || !productInfo) {
      throw new Error('Feedback, current strategy, and product info are required');
    }

    // Use OpenAI to improve the pitch strategy based on feedback
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert sales strategist that improves pitch strategies based on user feedback.

You will receive:
1. Current pitch strategy with talk tracks and talking points
2. User feedback about what should be changed or improved
3. Original product information for context

Your task is to update the pitch strategy based on the feedback while keeping unchanged elements intact. Return the updated strategy in the same JSON format:

{
  "talkTracks": ["Talk track 1 text", "Talk track 2 text"],
  "talkingPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5", "Point 6"]
}

IMPORTANT: 
- Only update talk tracks and talking points that the user's feedback specifically mentions or relates to
- Keep all other elements exactly as they were
- If the user provides additional requirements, incorporate them appropriately
- If the user wants to remove or change something specific, make those changes
- Maintain the same structure and format
- Keep the talk tracks conversational and engaging (3-4 sentences each)
- Keep talking points concise and impactful`
          },
          {
            role: 'user',
            content: `Current pitch strategy:\n${JSON.stringify(currentStrategy, null, 2)}\n\nProduct information context:\n${JSON.stringify(productInfo, null, 2)}\n\nUser feedback:\n${feedback}\n\nPlease update the pitch strategy based on this feedback and return the improved JSON.`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to improve pitch strategy with OpenAI');
    }

    const data = await response.json();
    const improvedStrategyText = data.choices[0].message.content;
    
    console.log('Raw OpenAI response:', improvedStrategyText);
    
    try {
      // Clean the response to extract JSON if it's wrapped in markdown or has extra text
      let cleanedResponse = improvedStrategyText.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON object in the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      console.log('Cleaned response:', cleanedResponse);
      
      const improvedStrategy = JSON.parse(cleanedResponse);
      return new Response(JSON.stringify(improvedStrategy), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Original response:', improvedStrategyText);
      throw new Error('Invalid response format from AI improvement');
    }

  } catch (error) {
    console.error('Error in improve-pitch-strategy function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});