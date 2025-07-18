
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced JSON extraction function
const extractJSONFromResponse = (text: string) => {
  console.log('Attempting to extract JSON from improve response...');
  
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
    
    // Strategy 3: Clean and extract
    () => {
      let cleaned = text.trim();
      cleaned = cleaned.replace(/^#+\s.*$/gm, '');
      cleaned = cleaned.replace(/^\*\*.*\*\*$/gm, '');
      cleaned = cleaned.replace(/```(?:json)?\s*/g, '');
      cleaned = cleaned.replace(/\s*```/g, '');
      
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      return jsonMatch ? jsonMatch[0] : null;
    }
  ];

  // Try each strategy
  for (let i = 0; i < strategies.length; i++) {
    try {
      const extracted = strategies[i]();
      if (extracted) {
        console.log(`Improve strategy ${i + 1} extracted JSON`);
        const parsed = JSON.parse(extracted);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (error) {
      console.log(`Improve strategy ${i + 1} failed:`, error.message);
    }
  }
  
  throw new Error('Could not extract valid JSON from improve response');
};

serve(async (req) => {
  console.log('Improve pitch strategy function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feedback, currentStrategy, productInfo } = await req.json();

    if (!feedback || !currentStrategy || !productInfo) {
      throw new Error('Feedback, current strategy, and product info are required');
    }

    console.log('Improving strategy with feedback:', feedback.substring(0, 100) + '...');

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

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. You MUST return ONLY a valid JSON object
2. NO markdown formatting, NO code blocks, NO explanations outside JSON
3. NO text before or after the JSON object
4. Start your response directly with { and end with }

You will receive:
1. Current pitch strategy with cold call starters, talk tracks and talking points
2. User feedback about what should be changed or improved
3. Original product information for context

Your task is to update the pitch strategy based on the feedback while keeping unchanged elements intact. Return the updated strategy in this EXACT JSON format:

{
  "coldCallStarters": ["Starter 1", "Starter 2"],
  "talkTracks": ["Talk track 1 text", "Talk track 2 text"],
  "talkingPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5", "Point 6"]
}

IMPORTANT: 
- Include ALL THREE components: coldCallStarters, talkTracks, and talkingPoints
- Only update elements that the user's feedback specifically mentions or relates to
- Keep all other elements exactly as they were in the current strategy
- If the user provides additional requirements, incorporate them appropriately
- If the user wants to remove or change something specific, make those changes
- Maintain the same structure and format
- Keep the talk tracks conversational and engaging (3-4 sentences each)
- Keep talking points concise and impactful
- Ensure cold call starters remain natural and attention-grabbing

REMEMBER: Return ONLY the JSON object, nothing else.`
          },
          {
            role: 'user',
            content: `Current pitch strategy:\n${JSON.stringify(currentStrategy, null, 2)}\n\nProduct information context:\n${JSON.stringify(productInfo, null, 2)}\n\nUser feedback:\n${feedback}\n\nPlease update the pitch strategy based on this feedback and return the improved JSON with all three components (coldCallStarters, talkTracks, talkingPoints).`
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
    
    console.log('Raw OpenAI improve response received');
    
    try {
      // Use enhanced JSON extraction
      const improvedStrategy = extractJSONFromResponse(improvedStrategyText);
      
      // Ensure all required components are present
      const finalStrategy = {
        coldCallStarters: improvedStrategy.coldCallStarters || currentStrategy.coldCallStarters || [
          "Hi [Name], I hope I'm catching you at a good time. I noticed your company might be facing some challenges. Do you have 30 seconds for me to explain how we've helped similar companies?",
          "Good morning [Name], I'm calling because we've been working with companies like yours to solve common business challenges. Would you be open to a brief conversation about this?"
        ],
        talkTracks: improvedStrategy.talkTracks || currentStrategy.talkTracks || [
          "Hi [Name], I understand that many companies face significant challenges in today's market. Our solution is specifically designed to address these exact pain points and has helped companies achieve measurable results. Would you be interested in learning more?",
          "Our product solves critical business challenges for companies like yours. We have a proven track record of success after implementation. Given your role and company focus, I believe there could be a strong fit. Can we schedule a brief call to explore this further?"
        ],
        talkingPoints: improvedStrategy.talkingPoints || currentStrategy.talkingPoints || [
          "Addresses key business challenges with proven solutions",
          "Comprehensive features tailored to your specific needs",
          "Unique differentiators that set us apart from competitors",
          "Proven success stories and measurable results",
          "Ideal for companies looking to improve efficiency and results",
          "Addresses common concerns with comprehensive support"
        ]
      };
      
      console.log('Improved strategy generated successfully with all components');
      
      return new Response(JSON.stringify(finalStrategy), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI improve response:', parseError);
      
      // Fallback: return the current strategy with minimal improvements
      const fallbackStrategy = {
        coldCallStarters: currentStrategy.coldCallStarters || [
          "Hi [Name], I hope I'm catching you at a good time. I noticed your company might be facing some challenges. Do you have 30 seconds for me to explain how we've helped similar companies?",
          "Good morning [Name], I'm calling because we've been working with companies like yours to solve common business challenges. Would you be open to a brief conversation about this?"
        ],
        talkTracks: currentStrategy.talkTracks || [
          "Hi [Name], I understand that many companies face significant challenges. Our solution is designed to address these pain points and has helped companies achieve results. Would you be interested in learning more?",
          "Our product solves critical challenges for companies like yours. We have a proven track record after implementation. Can we schedule a brief call to explore this further?"
        ],
        talkingPoints: currentStrategy.talkingPoints || [
          "Addresses key business challenges",
          "Comprehensive solutions tailored to needs",
          "Unique differentiators",
          "Proven success stories",
          "Ideal for improving efficiency",
          "Comprehensive support"
        ]
      };
      
      console.log('Using fallback improved strategy');
      return new Response(JSON.stringify(fallbackStrategy), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in improve-pitch-strategy function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
