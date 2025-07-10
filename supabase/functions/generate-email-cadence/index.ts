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
    const { productInfo, pitchStrategy, objectionHandling } = await req.json();

    if (!productInfo || !pitchStrategy) {
      throw new Error('Product information and pitch strategy are required');
    }

    // Use GPT-4o to generate email cadence
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
            content: `You are an expert sales development representative specializing in email cadences. Based on the provided product information, pitch strategy, and objection handling tactics, generate a comprehensive 16-day email cadence with specific, ready-to-use email copy.

Return the response in this exact JSON format:

{
  "emailCadence": [
    {
      "day": "Day 1",
      "step": "Step 1",
      "type": "Email #1 with POV",
      "content": "**Subject:** {{first_name}} at {{company}}\\n**Body:** Hi {{first_name}}, with the growing pressure to [specific pain point], I wanted to reach out..."
    }
  ]
}

Guidelines for email cadence:
- Create a 16-day sequence with 13 steps following the structure: emails, LinkedIn connects/messages, and calls
- Use the actual product name, benefits, and differentiators in email content
- Reference the ideal customer profile and their specific challenges
- Include compelling subject lines and personalized email bodies
- Make emails conversational, value-focused, and specific to the target audience
- Include proper placeholders like {{first_name}}, {{company}}, {{my.first_name}}
- Reference industry-specific pain points and solutions
- Use success stories and proof points where appropriate
- Each email should build on the previous touchpoints
- Include specific call-to-action and next steps
- Make LinkedIn messages short and contextual
- Provide call guidance and voicemail scripts

Day structure to follow:
- Day 1: Email #1 + LinkedIn Connect + Call #1
- Day 4: Email #2
- Day 5: LinkedIn Message + Call #2  
- Day 8: Email #3 + Call #3
- Day 12: Email #4 + LinkedIn Follow-up + Call #4
- Day 16: Email #5 + Call #5`
          },
          {
            role: 'user',
            content: `Generate a personalized email cadence based on this information:

PRODUCT INFORMATION:
Product Name: ${productInfo.productName}
Core Problem: ${productInfo.coreProblem}
Key Features: ${productInfo.keyFeatures.join(', ')}
Differentiators: ${productInfo.differentiators}
Success Stories: ${productInfo.successStories}
Ideal Customer: ${productInfo.idealCustomer}
Customer Challenges: ${productInfo.customerChallenges}
Product Solution: ${productInfo.productSolution}

PITCH STRATEGY:
Talk Tracks: ${pitchStrategy.talkTracks.join(' | ')}
Key Talking Points: ${pitchStrategy.talkingPoints.join(' | ')}

${objectionHandling ? `OBJECTION HANDLING:
${objectionHandling.map(obj => `Objection: ${obj.objection} | Response: ${obj.response} | Proof: ${obj.proofPoint}`).join(' | ')}` : ''}

Create specific email cadence that aligns with this product and target audience. Focus on their pain points and how this specific product solves their challenges. Use the success stories and differentiators in the email content.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate email cadence with OpenAI');
    }

    const data = await response.json();
    const cadenceText = data.choices[0].message.content;
    
    console.log('Raw OpenAI response:', cadenceText);
    
    try {
      // Clean the response to extract JSON if it's wrapped in markdown or has extra text
      let cleanedResponse = cadenceText.trim();
      
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
      
      const emailCadence = JSON.parse(cleanedResponse);
      return new Response(JSON.stringify(emailCadence), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Original response:', cadenceText);
      throw new Error('Invalid response format from AI email cadence generation');
    }

  } catch (error) {
    console.error('Error in generate-email-cadence function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});