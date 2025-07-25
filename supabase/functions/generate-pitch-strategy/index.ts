
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`Generate pitch strategy function called with method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate OpenAI API key
    if (!openAIApiKey) {
      console.error('OpenAI API key is missing');
      return new Response(JSON.stringify({ error: 'OpenAI API key is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting pitch strategy generation...');
    const { productInfo, systemPrompt } = await req.json();
    console.log('Request body parsed successfully');

    if (!productInfo) {
      console.error('Product information is missing from request');
      return new Response(JSON.stringify({ error: 'Product information is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Product info received:', Object.keys(productInfo));

    console.log('Calling OpenAI API for pitch strategy generation...');
    
    // Use OpenAI to generate personalized pitch strategy with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt || `You are an expert sales strategist. Based on the provided product and customer information, generate a personalized pitch strategy with cold call starters, talk tracks and key talking points.

CRITICAL: You MUST return ONLY a valid JSON object with no additional text, markdown formatting, explanations, or code blocks. Do not use markdown formatting, headers, or any other text outside the JSON structure.

Return exactly this JSON format:

{ 
  "coldCallStarters": ["Starter 1", "Starter 2"],
  "talkTracks": ["Talk track 1 text", "Talk track 2 text"],
  "talkingPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5", "Point 6"]
}

Guidelines for cold call starters:
- Use a proven cold call framework (e.g., Pattern Interrupt, Upfront Contract, or Pain Probe)
- Be natural, concise, and conversational — avoid sounding scripted
- Break the prospect’s routine, lower resistance, and invite brief dialogue
- Goal: Earn attention within seconds and create space for a quick, low-pressure conversation.

Example formats:
Pattern Interrupt
- “Hey [Name], you weren’t expecting this call, were you?”
- “Hi [Name], real quick — this is a cold call. Want to hang up now or give me 30 seconds to see if this is even relevant?”

Upfront Contract
- “If I take 27 seconds to share why I’m calling, can you let me know if it’s worth continuing?”
- “Would it be okay if I quickly share why I reached out, and then you decide if we keep going?”

Pain Probe
- “Are you still the one dealing with [common challenge] over there?”
- “Quick question — how are you currently handling [X] these days? I’ve been hearing a lot of [pain point] come up.”




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

    clearTimeout(timeoutId);
    console.log('OpenAI API response received');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${response.status} - ${errorText}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      
      // Remove any markdown headers or formatting
      cleanedResponse = cleanedResponse.replace(/^#+\s.*$/gm, '');
      cleanedResponse = cleanedResponse.replace(/^\*\*.*\*\*$/gm, '');
      cleanedResponse = cleanedResponse.replace(/^-\s/gm, '');
      
      // Try to find JSON object in the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      console.log('Cleaned response:', cleanedResponse);
      
      const strategy = JSON.parse(cleanedResponse);
      
      // Validate the expected structure
      if (!strategy.coldCallStarters || !strategy.talkTracks || !strategy.talkingPoints) {
        console.error('Invalid strategy structure:', strategy);
        throw new Error('Response missing required fields: coldCallStarters, talkTracks, or talkingPoints');
      }
      
      console.log('Pitch strategy generated successfully');
      
      return new Response(JSON.stringify(strategy), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Original response:', strategyText);
      
      // Fallback: try to create a valid response from the text
      try {
        const fallbackStrategy = {
          coldCallStarters: [
            "Hi [Name], I hope I'm catching you at a good time. I noticed your company might be facing challenges with " + (productInfo.customerChallenges || "operational efficiency") + ". Do you have 30 seconds for me to explain how we've helped similar companies?",
            "Good morning [Name], I'm calling because we've been working with companies like yours to solve " + (productInfo.coreProblem || "common business challenges") + ". Would you be open to a brief conversation about this?"
          ],
          talkTracks: [
            `Hi [Name], I understand that ${productInfo.customerChallenges || 'many companies in your industry'} face significant challenges. ${productInfo.productName} is specifically designed to ${productInfo.productSolution || 'address these exact pain points'}. ${productInfo.differentiators ? 'What sets us apart is ' + productInfo.differentiators : 'We have a unique approach that'} has helped companies achieve measurable results. Would you be interested in learning more?`,
            `${productInfo.productName} solves ${productInfo.coreProblem || 'critical business challenges'} for companies like yours. ${productInfo.successStories || 'Our clients have seen significant improvements'} after implementation. Given your role and company focus, I believe there could be a strong fit. Can we schedule a brief call to explore this further?`
          ],
          talkingPoints: [
            `${productInfo.productName} directly addresses ${productInfo.coreProblem || 'key business challenges'}`,
            `Key features include: ${productInfo.keyFeatures?.join(', ') || 'comprehensive solutions tailored to your needs'}`,
            `What differentiates us: ${productInfo.differentiators || 'our unique approach and proven results'}`,
            `Success stories: ${productInfo.successStories || 'proven track record with similar companies'}`,
            `Ideal for: ${productInfo.idealCustomer || 'companies looking to improve efficiency and results'}`,
            `Addresses common objections: ${productInfo.objections || 'comprehensive support and proven ROI'}`
          ]
        };
        
        console.log('Created fallback strategy');
        return new Response(JSON.stringify(fallbackStrategy), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (fallbackError) {
        console.error('Fallback strategy creation failed:', fallbackError);
        return new Response(JSON.stringify({ 
          error: 'Invalid response format from AI strategy generation',
          details: parseError.message,
          originalResponse: strategyText.substring(0, 500) + '...'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

  } catch (error) {
    console.error('Error in generate-pitch-strategy function:', error);
    
    // Handle timeout errors specifically
    if (error.name === 'AbortError') {
      return new Response(JSON.stringify({ 
        error: 'Request timeout - please try again with a shorter product description' 
      }), {
        status: 408,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred',
      type: error.name || 'UnknownError'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
