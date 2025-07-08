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
    const { url } = await req.json();

    if (!url) {
      throw new Error('URL is required');
    }

    // Fetch the website content
    const websiteResponse = await fetch(url);
    if (!websiteResponse.ok) {
      throw new Error('Failed to fetch website');
    }

    const html = await websiteResponse.text();
    
    // Extract text content from HTML (simple approach)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 4000); // Limit to avoid token limits

    // Use OpenAI to analyze the content
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
            content: `You are an expert sales strategist analyzing a company's website to extract key product and audience information. Based on the website content provided, extract ONLY the information that is explicitly available in the content. Do not make inferences or assumptions.

Return the information in JSON format:

{
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

IMPORTANT: If specific information is not explicitly found in the website content, return "No information found" for that field. Do not make inferences or assumptions.`
          },
          {
            role: 'user',
            content: `Analyze this website content and extract product/audience information:\n\n${textContent}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze with OpenAI');
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    try {
      const extractedInfo = JSON.parse(analysisText);
      return new Response(JSON.stringify(extractedInfo), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('Invalid response format from AI analysis');
    }

  } catch (error) {
    console.error('Error in analyze-website function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});