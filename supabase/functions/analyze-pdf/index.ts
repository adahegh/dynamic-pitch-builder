import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('PDF analyze function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      headers: { 
        ...corsHeaders,
        'Access-Control-Max-Age': '86400',
      } 
    });
  }

  // Set a timeout for the entire function execution
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 45000); // 45 seconds

  try {
    console.log('Starting PDF analysis...');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    const requestBody = await req.json();
    console.log('Request body keys:', Object.keys(requestBody));
    
    const { pdfContent, fileName } = requestBody;

    if (!pdfContent) {
      console.error('No PDF content provided');
      throw new Error('PDF content is required');
    }

    if (typeof pdfContent !== 'string') {
      console.error('PDF content must be a base64 string');
      throw new Error('Invalid PDF content format');
    }

    console.log(`Processing PDF: ${fileName || 'unknown'}, size: ${pdfContent.length} chars`);
    
    // Validate file size (limit to ~5MB base64)
    if (pdfContent.length > 6750000) {
      console.error('PDF file too large:', pdfContent.length);
      throw new Error('PDF file is too large. Please use a file smaller than 5MB.');
    }

    // Multiple PDF parsing approaches with fallbacks
    console.log('Converting base64 to buffer...');
    let pdfBuffer: Uint8Array;
    try {
      pdfBuffer = Uint8Array.from(atob(pdfContent), c => c.charCodeAt(0));
    } catch (decodeError) {
      console.error('Base64 decode error:', decodeError);
      throw new Error('Invalid base64 PDF content');
    }
    
    console.log('Extracting text from PDF using multiple methods...');
    
    let text = '';
    let extractionMethod = 'none';
    
    // Method 1: Advanced PDF text extraction with multiple patterns
    try {
      const pdfString = new TextDecoder('latin1').decode(pdfBuffer);
      console.log('PDF converted to string, attempting pattern extraction...');
      
      // Pattern 1: Text in parentheses (most common)
      const parenthesesMatches = pdfString.match(/\(([^)]{2,})\)/g);
      if (parenthesesMatches && parenthesesMatches.length > 5) {
        const parenthesesText = parenthesesMatches
          .map(match => match.slice(1, -1))
          .filter(t => t.length > 1 && /[a-zA-Z]/.test(t))
          .join(' ');
        text += parenthesesText + ' ';
        extractionMethod = 'parentheses';
      }
      
      // Pattern 2: Text between Tj operators
      const tjMatches = pdfString.match(/\[(.*?)\]\s*TJ/g);
      if (tjMatches && tjMatches.length > 0) {
        const tjText = tjMatches
          .map(match => match.replace(/\[(.*?)\]\s*TJ/, '$1'))
          .filter(t => t.length > 1)
          .join(' ');
        text += tjText + ' ';
        extractionMethod += '+tj';
      }
      
      // Pattern 3: BT...ET blocks (text blocks)
      const btMatches = pdfString.match(/BT\s+(.*?)\s+ET/gs);
      if (btMatches && btMatches.length > 0) {
        const btText = btMatches
          .map(block => {
            // Extract text from within the BT...ET block
            const innerText = block.match(/\(([^)]+)\)/g);
            return innerText ? innerText.map(m => m.slice(1, -1)).join(' ') : '';
          })
          .filter(t => t.length > 1)
          .join(' ');
        text += btText + ' ';
        extractionMethod += '+bt';
      }
      
      // Pattern 4: Simple text patterns
      const simpleTextMatches = pdfString.match(/\s([A-Za-z]{3,}(?:\s[A-Za-z]{3,})*)\s/g);
      if (simpleTextMatches && text.length < 100) {
        const simpleText = simpleTextMatches
          .map(match => match.trim())
          .filter(t => t.length > 3 && !/^[0-9\.\-\s]+$/.test(t))
          .join(' ');
        text += simpleText + ' ';
        extractionMethod += '+simple';
      }
      
      console.log(`Extraction method used: ${extractionMethod}`);
      
    } catch (extractError) {
      console.error('PDF text extraction error:', extractError);
      // Don't throw here, try fallback method below
    }
    
    // Clean up extracted text
    if (text) {
      text = text
        .replace(/\\[nrtbf]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[^\x20-\x7E\u00A0-\u024F\u1E00-\u1EFF]/g, ' ') // Keep printable ASCII and extended Latin
        .trim();
    }
    
    console.log(`Extracted text length: ${text.length} characters`);
    
    if (!text || text.trim().length < 50) {
      console.error('Insufficient text extracted:', text?.length || 0, 'characters');
      throw new Error('Could not extract sufficient text from PDF. The PDF might be image-based, encrypted, or contain no readable text. Please try converting the PDF to a text-based format first.');
    }
    
    // Chunk text if too long (limit to ~50,000 characters for safe token usage)
    const maxTextLength = 50000;
    if (text.length > maxTextLength) {
      console.log(`Text too long (${text.length} chars), truncating to ${maxTextLength} chars`);
      // Take first part and last part to get overview and conclusion
      const firstPart = text.substring(0, maxTextLength * 0.7);
      const lastPart = text.substring(text.length - maxTextLength * 0.3);
      text = firstPart + "\n\n[... middle content truncated ...]\n\n" + lastPart;
      console.log(`Text after chunking: ${text.length} characters`);
    }
    
    // Call OpenAI API for analysis with timeout
    console.log('Calling OpenAI API for analysis...');
    
    const openAIController = new AbortController();
    const openAITimeoutId = setTimeout(() => openAIController.abort(), 30000); // 30 seconds for OpenAI
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      signal: openAIController.signal,
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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

    clearTimeout(openAITimeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received successfully');
    
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
      console.log('PDF analysis completed successfully');
      
      return new Response(JSON.stringify({
        ...extractedInfo,
        extractionMethod: extractionMethod,
        extractedTextLength: text.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Original response:', analysisText);
      throw new Error('Invalid response format from AI analysis');
    }

  } catch (error) {
    console.error('Error in analyze-pdf function:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Unknown error occurred';
    if (error.name === 'AbortError') {
      errorMessage = 'Request timed out. The PDF might be too large or complex to process.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    clearTimeout(timeoutId);
  }
});