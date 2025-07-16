import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Using pdfjs-serverless which is designed for edge functions
import { readPDF } from "https://deno.land/x/pdfjs_serverless@0.1.1/mod.ts";

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
    const { pdfContent, fileName } = await req.json();

    if (!pdfContent) {
      throw new Error('PDF content is required');
    }

    console.log(`Processing PDF: ${fileName || 'unknown'}, size: ${pdfContent.length} chars`);
    
    // Validate file size (limit to ~10MB base64)
    if (pdfContent.length > 13500000) {
      throw new Error('PDF file is too large. Please use a file smaller than 10MB.');
    }

    // Convert base64 to binary data
    const pdfData = Uint8Array.from(atob(pdfContent), c => c.charCodeAt(0));
    
    // Extract text from PDF using pdfjs-serverless
    console.log('Extracting text from PDF...');
    const extractedData = await readPDF(pdfData);
    const text = extractedData.text;
    
    if (!text || text.trim().length === 0) {
      throw new Error('Could not extract text from PDF. The PDF might be image-based or encrypted.');
    }
    
    console.log(`Extracted text length: ${text.length} characters`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are an expert sales strategist and market analyst. Analyze the provided document text to extract product information and make intelligent inferences about the target audience and likely objections.

Your analysis should combine:
1. Explicit information found in the document
2. Intelligent inferences based on the product/service type, industry, and market positioning
3. Sales expertise to identify target personas and common objections

Return the information in JSON format:

{
  "productName": "Name of the main product/service",
  "coreProblem": "What core problem does this product solve?",
  "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
  "differentiators": "What makes this product different or better than alternatives?",
  "successStories": "Notable success stories, metrics, or case studies to reference",
  "idealCustomer": "Who is the ideal customer? (title, company type, industry, etc.) - infer based on product type and positioning",
  "customerChallenges": "What are their top challenges, goals, or pain points? - infer from industry and product focus",
  "productSolution": "How does this product directly address those challenges or goals?",
  "objections": "What likely objections or hesitations might they have? - infer common sales objections for this type of product/industry"
}

IMPORTANT GUIDANCE:
- Extract explicit information where available
- For target audience fields (idealCustomer, customerChallenges), make informed inferences based on the product type, industry, and market positioning
- For objections, think like a sales professional - what concerns would prospects typically have about this type of solution?
- Base inferences on product category, pricing signals, complexity, industry standards, and competitive landscape
- If you cannot make reasonable inferences even with sales expertise, then use "Unable to determine"`
          },
          {
            role: 'user',
            content: `Please analyze this document and extract product/audience information for sales strategy purposes.

Document content:
${text}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`Failed to analyze with OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;
    
    console.log('Raw OpenAI response:', analysisText);
    
    try {
      // Clean the response to extract JSON if it's wrapped in markdown or has extra text
      let cleanedResponse = analysisText.trim();
      
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
      
      const extractedInfo = JSON.parse(cleanedResponse);
      return new Response(JSON.stringify(extractedInfo), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Original response:', analysisText);
      throw new Error('Invalid response format from AI analysis');
    }

  } catch (error) {
    console.error('Error in analyze-pdf function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});