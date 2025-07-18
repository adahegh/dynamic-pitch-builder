
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced JSON extraction function
const extractJSONFromResponse = (text: string) => {
  console.log('Attempting to extract JSON from response...');
  
  // Try multiple extraction strategies
  const strategies = [
    // Strategy 1: Look for JSON between code blocks
    () => {
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      return jsonMatch ? jsonMatch[1] : null;
    },
    
    // Strategy 2: Look for standalone JSON object
    () => {
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      return jsonMatch ? jsonMatch[0] : null;
    },
    
    // Strategy 3: Clean and extract from markdown headers
    () => {
      let cleaned = text.trim();
      // Remove markdown headers and formatting
      cleaned = cleaned.replace(/^#+\s.*$/gm, '');
      cleaned = cleaned.replace(/^\*\*.*\*\*$/gm, '');
      cleaned = cleaned.replace(/^-\s/gm, '');
      cleaned = cleaned.replace(/```(?:json)?\s*/g, '');
      cleaned = cleaned.replace(/\s*```/g, '');
      
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      return jsonMatch ? jsonMatch[0] : null;
    },
    
    // Strategy 4: Extract from specific markers
    () => {
      const startMarkers = ['{', '{\n', '{ \n'];
      const endMarkers = ['}', '\n}', '\n }'];
      
      for (const startMarker of startMarkers) {
        const startIndex = text.indexOf(startMarker);
        if (startIndex !== -1) {
          for (const endMarker of endMarkers) {
            const endIndex = text.lastIndexOf(endMarker);
            if (endIndex > startIndex) {
              return text.substring(startIndex, endIndex + endMarker.length).trim();
            }
          }
        }
      }
      return null;
    }
  ];

  // Try each strategy
  for (let i = 0; i < strategies.length; i++) {
    try {
      const extracted = strategies[i]();
      if (extracted) {
        console.log(`Strategy ${i + 1} extracted:`, extracted.substring(0, 200) + '...');
        const parsed = JSON.parse(extracted);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (error) {
      console.log(`Strategy ${i + 1} failed:`, error.message);
    }
  }
  
  throw new Error('Could not extract valid JSON from response');
};

// Enhanced fallback strategy generator
const createComprehensiveFallback = (productInfo: any) => {
  console.log('Creating comprehensive fallback strategy');
  
  const productName = productInfo.productName || 'our product';
  const coreProblem = productInfo.coreProblem || 'key business challenges';
  const customerChallenges = productInfo.customerChallenges || 'operational challenges';
  const productSolution = productInfo.productSolution || 'address these pain points';
  const differentiators = productInfo.differentiators || 'our unique approach';
  const successStories = productInfo.successStories || 'proven track record with similar companies';
  const keyFeatures = productInfo.keyFeatures || [];
  const idealCustomer = productInfo.idealCustomer || 'companies looking to improve efficiency';
  const objections = productInfo.objections || 'comprehensive support and proven ROI';

  return {
    coldCallStarters: [
      `Hi [Name], I hope I'm catching you at a good time. I noticed your company might be facing challenges with ${customerChallenges}. Do you have 30 seconds for me to explain how we've helped similar companies?`,
      `Good morning [Name], I'm calling because we've been working with companies like yours to solve ${coreProblem}. Would you be open to a brief conversation about this?`
    ],
    talkTracks: [
      `Hi [Name], I understand that ${customerChallenges} are significant challenges for companies like yours. ${productName} is specifically designed to ${productSolution}. ${differentiators ? 'What sets us apart is ' + differentiators : 'We have a unique approach that'} has helped companies achieve measurable results. Would you be interested in learning more?`,
      `${productName} solves ${coreProblem} for companies like yours. ${successStories} after implementation. Given your role and company focus, I believe there could be a strong fit. Can we schedule a brief call to explore this further?`
    ],
    talkingPoints: [
      `${productName} directly addresses ${coreProblem}`,
      `Key features include: ${keyFeatures.length > 0 ? keyFeatures.join(', ') : 'comprehensive solutions tailored to your needs'}`,
      `What differentiates us: ${differentiators}`,
      `Success stories: ${successStories}`,
      `Ideal for: ${idealCustomer}`,
      `Addresses common objections: ${objections}`
    ]
  };
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
    
    // Enhanced system prompt with stronger JSON instructions
    const enhancedSystemPrompt = systemPrompt || `You are an expert sales strategist. Based on the provided product and customer information, generate a personalized pitch strategy with cold call starters, talk tracks and key talking points.

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. You MUST return ONLY a valid JSON object
2. NO markdown formatting, NO code blocks, NO explanations outside JSON
3. NO text before or after the JSON object
4. Start your response directly with { and end with }

Return EXACTLY this JSON structure:

{
  "coldCallStarters": ["Starter 1", "Starter 2"],
  "talkTracks": ["Talk track 1 text", "Talk track 2 text"],
  "talkingPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5", "Point 6"]
}

Guidelines for cold call starters:
- Provide 2 sample opening lines for cold calls
- Use proven frameworks like Pattern Interrupt or Upfront Contract
- Keep natural, brief, and engaging
- Goal: earn attention and create conversation space

Guidelines for talk tracks:
- Create 2 personalized opening pitch talk tracks
- Use actual product name, core problem, and differentiators
- Reference ideal customer profile and challenges
- Include specific metrics or success stories if available
- Make conversational and engaging
- Each should be 3-4 sentences long

Guidelines for talking points:
- Create 6 key talking points based on product information
- Include specific benefits, features, and differentiators
- Reference actual success metrics if provided
- Focus on solving customer's specific challenges
- Make concise and impactful

REMEMBER: Return ONLY the JSON object, nothing else.`;

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
            content: enhancedSystemPrompt
          },
          {
            role: 'user',
            content: `Generate a personalized pitch strategy based on this product information:

Product Name: ${productInfo.productName}
Core Problem: ${productInfo.coreProblem}
Key Features: ${productInfo.keyFeatures?.join(', ') || 'Not specified'}
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
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const strategyText = data.choices[0].message.content;
    
    console.log('Raw OpenAI response:', strategyText.substring(0, 500) + '...');
    
    try {
      // Try enhanced JSON extraction
      const strategy = extractJSONFromResponse(strategyText);
      
      // Validate the expected structure
      if (!strategy.coldCallStarters || !strategy.talkTracks || !strategy.talkingPoints) {
        console.error('Invalid strategy structure - missing required fields:', {
          hasColdCallStarters: !!strategy.coldCallStarters,
          hasTalkTracks: !!strategy.talkTracks,
          hasTalkingPoints: !!strategy.talkingPoints
        });
        throw new Error('Response missing required fields');
      }
      
      // Validate arrays are not empty
      if (!Array.isArray(strategy.coldCallStarters) || strategy.coldCallStarters.length === 0 ||
          !Array.isArray(strategy.talkTracks) || strategy.talkTracks.length === 0 ||
          !Array.isArray(strategy.talkingPoints) || strategy.talkingPoints.length === 0) {
        console.error('Invalid strategy structure - empty arrays');
        throw new Error('Strategy contains empty arrays');
      }
      
      console.log('Pitch strategy generated successfully with all components');
      
      return new Response(JSON.stringify(strategy), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError.message);
      console.error('Original response length:', strategyText.length);
      
      // Create comprehensive fallback strategy
      console.log('Creating comprehensive fallback strategy...');
      const fallbackStrategy = createComprehensiveFallback(productInfo);
      
      console.log('Comprehensive fallback strategy created successfully');
      return new Response(JSON.stringify(fallbackStrategy), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
    
    // Final fallback for any other errors
    try {
      const { productInfo } = await req.json();
      if (productInfo) {
        console.log('Creating emergency fallback strategy...');
        const emergencyFallback = createComprehensiveFallback(productInfo);
        return new Response(JSON.stringify(emergencyFallback), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (fallbackError) {
      console.error('Emergency fallback failed:', fallbackError);
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
