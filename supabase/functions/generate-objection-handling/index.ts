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
    const { productInfo, pitchStrategy } = await req.json();

    if (!productInfo || !pitchStrategy) {
      throw new Error('Product information and pitch strategy are required');
    }

    // Use GPT-4o to generate objection handling tactics
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
            content: `You are an expert sales strategist specializing in objection handling. Based on the provided product information, target audience, and pitch strategy, generate comprehensive objection handling tactics in a structured table format.

Return the response in this exact JSON format:

{
  "objectionHandling": [
    {
      "objection": "Likely objection text",
      "response": "Suggested response text", 
      "proofPoint": "Supporting proof point, metric, or value proposition"
    }
  ]
}

Guidelines:
- Generate 5-7 most likely objections based on the product, target audience, and industry
- Create specific, actionable responses for each objection
- Include concrete proof points like success stories, metrics, case studies, or compelling value propositions
- Make responses conversational and natural for sales conversations
- Address common concerns like pricing, implementation, ROI, competition, timing, etc.
- Use the actual product details, customer challenges, and differentiators in your responses
- Ensure proof points are specific and credible based on the provided information`
          },
          {
            role: 'user',
            content: `Generate objection handling tactics based on this information:

PRODUCT INFORMATION:
Product Name: ${productInfo.productName}
Core Problem: ${productInfo.coreProblem}
Key Features: ${productInfo.keyFeatures.join(', ')}
Differentiators: ${productInfo.differentiators}
Success Stories: ${productInfo.successStories}
Ideal Customer: ${productInfo.idealCustomer}
Customer Challenges: ${productInfo.customerChallenges}
Product Solution: ${productInfo.productSolution}
Known Objections: ${productInfo.objections}

PITCH STRATEGY:
Talk Tracks: ${pitchStrategy.talkTracks.join(' | ')}
Key Talking Points: ${pitchStrategy.talkingPoints.join(' | ')}

Create specific objection handling tactics that align with this product and strategy. Focus on the most likely objections this target audience would have about this specific product.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate objection handling with OpenAI');
    }

    const data = await response.json();
    const objectionText = data.choices[0].message.content;
    
    console.log('Raw OpenAI response:', objectionText);
    
    try {
      // Clean the response to extract JSON if it's wrapped in markdown or has extra text
      let cleanedResponse = objectionText.trim();
      
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
      
      const objectionHandling = JSON.parse(cleanedResponse);
      return new Response(JSON.stringify(objectionHandling), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Original response:', objectionText);
      throw new Error('Invalid response format from AI objection handling generation');
    }

  } catch (error) {
    console.error('Error in generate-objection-handling function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});