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
    const { productInfo } = await req.json();

    if (!productInfo) {
      throw new Error('Product information is required');
    }

    // Use OpenAI to generate personalized pitch strategy
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
            content: `You are an expert sales strategist. Based on the provided product and customer information, generate a personalized pitch strategy with cold call starter, talk tracks and key talking points.

Return the response in this exact JSON format:

{ 
  "coldCallStarters": ["Starter 1", "Starter 2"],
  "talkTracks": ["Talk track 1 text", "Talk track 2 text"],
  "talkingPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5", "Point 6"]
}

Guielines for cold call starters:
- Provide 2 sample opening lines that a rep can use to kick off a cold call.
- Use proven frameworks like Pattern Interrupt, Upfront Contract, or Pain Probes.
- Keep it natural, brief, and engaging — don’t sound overly scripted.
- Goal: earn attention and create space for conversation.

Example formats:
- Pattern Interrupt: “Hi [Name] — did I catch you at a decent time?”
- Upfront Contract: “If I can take 30 seconds to explain why I’m calling, you can decide if it makes sense to continue — fair enough?”


Guidelines for talk tracks:
- Create 2 personalized opening pitch talk tracks
- Use the actual product name, core problem, and differentiators
- Reference the ideal customer profile and their challenges
- Include specific metrics or success stories if available
- Make them conversational and engaging
- Each should be 3-4 sentences long

Guidelines for talking points:
- Create 6 key talking points based on the product information
- Include specific benefits, features, and differentiators
- Reference actual success metrics if provided
- Focus on solving the customer's specific challenges
- Make them concise and impactful`
          },
          {
            role: 'user',
            content: `Generate a personalized pitch strategy based on this product information:

Product Name: ${productInfo.productName}
Core Problem: ${productInfo.coreProblem}
Key Features: ${productInfo.keyFeatures.join(', ')}
Differentiators: ${productInfo.differentiators}
Success Stories: ${productInfo.successStories}
Ideal Customer: ${productInfo.idealCustomer}
Customer Challenges: ${productInfo.customerChallenges}
Product Solution: ${productInfo.productSolution}
Likely Objections: ${productInfo.objections}

Create compelling talk tracks that reference these specific details and talking points that highlight the key benefits for this target audience.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate pitch strategy with OpenAI');
    }

    const data = await response.json();
    const strategyText = data.choices[0].message.content;
    
    console.log('Raw OpenAI response:', strategyText);
    
    try {
      // Clean the response to extract JSON if it's wrapped in markdown or has extra text
      let cleanedResponse = strategyText.trim();
      
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
      
      const strategy = JSON.parse(cleanedResponse);
      return new Response(JSON.stringify(strategy), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Original response:', strategyText);
      throw new Error('Invalid response format from AI strategy generation');
    }

  } catch (error) {
    console.error('Error in generate-pitch-strategy function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});