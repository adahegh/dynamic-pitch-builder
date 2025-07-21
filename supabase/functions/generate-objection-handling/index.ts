
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced JSON extraction function with multiple parsing strategies
function extractJsonFromResponse(response: string): any {
  console.log('Attempting to extract JSON from response...');
  
  // Strategy 1: Try direct JSON parsing
  try {
    const parsed = JSON.parse(response.trim());
    console.log('Strategy 1 (direct JSON) successful');
    return parsed;
  } catch (e) {
    console.log('Strategy 1 failed, trying strategy 2...');
  }

  // Strategy 2: Remove markdown code blocks
  let cleaned = response.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const parsed = JSON.parse(cleaned);
    console.log('Strategy 2 (remove markdown) successful');
    return parsed;
  } catch (e) {
    console.log('Strategy 2 failed, trying strategy 3...');
  }

  // Strategy 3: Find JSON object in the response
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('Strategy 3 (regex match) successful');
      return parsed;
    } catch (e) {
      console.log('Strategy 3 failed, trying strategy 4...');
    }
  }

  // Strategy 4: Extract objections from markdown format
  console.log('Attempting to parse markdown format...');
  return parseMarkdownToJson(response);
}

// Convert markdown objection format to JSON
function parseMarkdownToJson(markdownText: string): any {
  console.log('Parsing markdown to JSON...');
  
  const objections = [];
  
  // Look for numbered objection patterns
  const objectionPattern = /###?\s*\d+[\.\)]\s*\*?\*?(.+?)\*?\*?\s*\n([\s\S]*?)(?=###?\s*\d+|$)/g;
  let match;
  
  while ((match = objectionPattern.exec(markdownText)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    
    // Extract objection statement
    const objectionMatch = content.match(/"([^"]+)"/);
    const objection = objectionMatch ? objectionMatch[1] : title;
    
    // Extract response (look for response sections)
    const responseMatch = content.match(/(?:Response|Strategic Response|Feel-Felt-Found)[\s\S]*?"([^"]+)"/i);
    const response = responseMatch ? responseMatch[1] : 
      content.split('\n').find(line => line.includes('understand') || line.includes('appreciate'))?.replace(/[*"]/g, '').trim() || 
      "I understand your concern. Let me address that for you.";
    
    // Extract proof point (look for evidence, metrics, testimonials)
    const proofMatch = content.match(/(?:Evidence|ROI|Metrics|Testimonials?)[\s\S]*?[-•]\s*([^-•\n]+)/i);
    const proofPoint = proofMatch ? proofMatch[1].trim() : 
      "Our customers have seen significant value from this solution.";
    
    objections.push({
      objection,
      response,
      proofPoint
    });
  }
  
  console.log(`Extracted ${objections.length} objections from markdown`);
  return { objectionHandling: objections };
}

// Create fallback objection handling based on product info
function createFallbackObjections(productInfo: any): any {
  console.log('Creating fallback objection handling...');
  
  const fallbackObjections = [
    {
      objection: "The price seems too high for our budget.",
      response: `I understand price is a consideration. ${productInfo.productName} offers significant value through ${productInfo.keyFeatures?.slice(0, 2).join(' and ')}.`,
      proofPoint: productInfo.successStories || "Our customers typically see ROI within the first year of implementation."
    },
    {
      objection: "How do we know this will work for our specific needs?",
      response: `That's a great question. ${productInfo.productName} was designed specifically for ${productInfo.idealCustomer}.`,
      proofPoint: productInfo.differentiators || "Our solution has been proven across similar organizations."
    },
    {
      objection: "We're concerned about implementation complexity.",
      response: "Implementation concerns are completely valid. We provide comprehensive support throughout the process.",
      proofPoint: "Our implementation team ensures smooth deployment with minimal disruption to your operations."
    },
    {
      objection: "How does this compare to other solutions we're considering?",
      response: `${productInfo.productName} stands out because of ${productInfo.differentiators || 'our unique approach'}.`,
      proofPoint: productInfo.successStories || "Our differentiated approach has helped customers achieve better results than alternatives."
    },
    {
      objection: "We need to think about it and discuss internally.",
      response: "Absolutely, this is an important decision that deserves careful consideration.",
      proofPoint: "I can provide additional resources and references to help with your internal discussions."
    }
  ];

  // Add any known objections from product info
  if (productInfo.objections) {
    const knownObjections = productInfo.objections.split(',').map((obj: string) => obj.trim());
    knownObjections.forEach((obj: string, index: number) => {
      if (index < 2) { // Replace first 2 fallback objections with known ones
        fallbackObjections[index] = {
          objection: obj,
          response: `I understand your concern about ${obj.toLowerCase()}. Let me address that directly.`,
          proofPoint: productInfo.successStories || "We have proven results addressing this specific concern."
        };
      }
    });
  }

  return { objectionHandling: fallbackObjections };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productInfo, pitchStrategy, systemPrompt } = await req.json();

    if (!productInfo || !pitchStrategy) {
      throw new Error('Product information and pitch strategy are required');
    }

    console.log('Starting objection handling generation...');

    // Updated system prompt to ensure JSON output
    const updatedSystemPrompt = systemPrompt || `You are an expert sales strategist specializing in objection handling. Based on the provided product information, target audience, and pitch strategy, generate comprehensive objection handling tactics.

CRITICAL: You MUST return your response in this EXACT JSON format with no additional text, markdown, or formatting:

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
- Ensure proof points are specific and credible based on the provided information
- RETURN ONLY THE JSON OBJECT - NO OTHER TEXT OR FORMATTING`;

    // Use GPT-4o-mini to generate objection handling tactics
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: updatedSystemPrompt
          },
          {
            role: 'user',
            content: `Generate objection handling tactics based on this information:

PRODUCT INFORMATION:
Product Name: ${productInfo.productName}
Core Problem: ${productInfo.coreProblem}
Key Features: ${productInfo.keyFeatures?.join(', ') || 'Not specified'}
Differentiators: ${productInfo.differentiators || 'Not specified'}
Success Stories: ${productInfo.successStories || 'Not specified'}
Ideal Customer: ${productInfo.idealCustomer || 'Not specified'}
Customer Challenges: ${productInfo.customerChallenges || 'Not specified'}
Product Solution: ${productInfo.productSolution || 'Not specified'}
Known Objections: ${productInfo.objections || 'Not specified'}

PITCH STRATEGY:
Talk Tracks: ${pitchStrategy.talkTracks?.join(' | ') || 'Not specified'}
Key Talking Points: ${pitchStrategy.talkingPoints?.join(' | ') || 'Not specified'}

Create specific objection handling tactics that align with this product and strategy. Focus on the most likely objections this target audience would have about this specific product.

RETURN ONLY JSON - NO MARKDOWN OR ADDITIONAL TEXT.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      throw new Error('Failed to generate objection handling with OpenAI');
    }

    const data = await response.json();
    const objectionText = data.choices[0].message.content;
    
    console.log('Raw OpenAI response:', objectionText);
    
    try {
      // Use enhanced JSON extraction
      const objectionHandling = extractJsonFromResponse(objectionText);
      
      // Validate the response structure
      if (!objectionHandling.objectionHandling || !Array.isArray(objectionHandling.objectionHandling)) {
        console.log('Invalid structure, creating fallback...');
        throw new Error('Invalid objection handling structure');
      }

      console.log('Successfully extracted objection handling');
      return new Response(JSON.stringify(objectionHandling), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.log('Creating fallback objection handling...');
      
      // Create fallback based on product information
      const fallbackObjections = createFallbackObjections(productInfo);
      
      console.log('Returning fallback objection handling');
      return new Response(JSON.stringify(fallbackObjections), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in generate-objection-handling function:', error);
    
    // Even on complete failure, try to return a basic fallback
    try {
      const { productInfo } = await req.json().catch(() => ({}));
      if (productInfo) {
        const emergencyFallback = createFallbackObjections(productInfo);
        return new Response(JSON.stringify(emergencyFallback), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (fallbackError) {
      console.error('Fallback creation failed:', fallbackError);
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
