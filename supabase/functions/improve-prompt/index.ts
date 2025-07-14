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
    const { prompt, context, fieldType } = await req.json();

    if (!prompt) {
      throw new Error('Prompt text is required');
    }

    // Define system prompts based on field type
    const systemPrompts = {
      feedback: `You are an expert prompt engineer. Improve the user's feedback or request to be more specific, actionable, and effective. Make it clear, concise, and focused on desired outcomes. Keep the same intent but enhance clarity and specificity.`,
      
      systemPrompt: `You are an expert in AI prompt engineering. Improve the given system prompt to be more effective, specific, and comprehensive. Enhance clarity, add relevant examples, and optimize for better AI responses while maintaining the core purpose.`,
      
      general: `You are an expert communicator. Improve the given text to be more clear, specific, and effective. Enhance the language while maintaining the original intent and meaning.`,
      
      website: `You are a web expert. If this looks like a partial URL or website reference, complete it to a proper full URL format (including https://). If it's already complete, verify it's properly formatted.`,
      
      productInfo: `You are a product strategist. Improve this product information to be more comprehensive, specific, and compelling. Add relevant details that would help in sales and marketing while keeping it accurate and professional.`
    };

    const systemPrompt = systemPrompts[fieldType as keyof typeof systemPrompts] || systemPrompts.general;

    // Use OpenAI to improve the prompt
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: context ? `Context: ${context}\n\nImprove this text: ${prompt}` : `Improve this text: ${prompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to improve prompt with OpenAI');
    }

    const data = await response.json();
    const improvedPrompt = data.choices[0].message.content.trim();
    
    console.log('Original prompt:', prompt);
    console.log('Improved prompt:', improvedPrompt);
    
    return new Response(JSON.stringify({ improvedPrompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in improve-prompt function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});