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
    const { feedback, currentProductInfo } = await req.json();

    if (!feedback || !currentProductInfo) {
      throw new Error('Feedback and current product info are required');
    }

    // Use OpenAI to process the feedback and update the product information
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
            content: `You are an expert assistant that updates product and audience information based on user feedback. 

You will receive:
1. Current product information in JSON format
2. User feedback about what should be changed or updated

Your task is to update the product information based on the feedback while keeping unchanged fields intact. Return the updated information in the same JSON format:

{
  "website": "website URL",
  "productName": "Name of the main product/service",
  "coreProblem": "What core problem does this product solve?",
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
  "differentiators": "What makes this product different or better than alternatives?",
  "successStories": "Notable success stories, metrics, or case studies to reference",
  "idealCustomer": "Who is the ideal customer? (title, company type, industry, etc.)",
  "customerChallenges": "What are their top challenges, goals, or pain points?",
  "productSolution": "How does this product directly address those challenges or goals?",
  "objections": "What likely objections or hesitations might they have?"
}

IMPORTANT: 
- Only update fields that the user's feedback specifically mentions or relates to
- Keep all other fields exactly as they were
- If the user provides additional information, incorporate it appropriately
- If the user wants to remove or change something, make those changes
- Maintain the same structure and format`
          },
          {
            role: 'user',
            content: `Current product information:\n${JSON.stringify(currentProductInfo, null, 2)}\n\nUser feedback:\n${feedback}\n\nPlease update the product information based on this feedback and return the updated JSON.`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to process feedback with OpenAI');
    }

    const data = await response.json();
    const updatedInfoText = data.choices[0].message.content;
    
    try {
      const updatedInfo = JSON.parse(updatedInfoText);
      return new Response(JSON.stringify(updatedInfo), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('Invalid response format from AI processing');
    }

  } catch (error) {
    console.error('Error in process-feedback function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});