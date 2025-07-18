import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface PitchStrategy {
  coldCallStarters: string[];
  talkTracks: string[];
  talkingPoints: string[];
}

const PitchBuilder = () => {
  const { user } = useAuth();
  const [productInfo, setProductInfo] = useState({
    productName: '',
    coreProblem: '',
    keyFeatures: [''],
    differentiators: '',
    successStories: '',
    idealCustomer: '',
    customerChallenges: '',
    productSolution: '',
    objections: ''
  });
  const [systemPrompt, setSystemPrompt] = useState('');
  const [pitchStrategy, setPitchStrategy] = useState<PitchStrategy | null>(null);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    setProductInfo({ ...productInfo, [field]: e.target.value });
  };

  const handleKeyFeaturesChange = (index: number, value: string) => {
    const updatedKeyFeatures = [...productInfo.keyFeatures];
    updatedKeyFeatures[index] = value;
    setProductInfo({ ...productInfo, keyFeatures: updatedKeyFeatures });
  };

  const addKeyFeature = () => {
    setProductInfo({
      ...productInfo,
      keyFeatures: [...productInfo.keyFeatures, ''],
    });
  };

  const removeKeyFeature = (index: number) => {
    const updatedKeyFeatures = [...productInfo.keyFeatures];
    updatedKeyFeatures.splice(index, 1);
    setProductInfo({ ...productInfo, keyFeatures: updatedKeyFeatures });
  };

  const generatePitchStrategy = async () => {
    if (!productInfo.productName || !productInfo.coreProblem) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least the product name and core problem before generating a pitch strategy.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingStrategy(true);
    
    try {
      console.log('Starting pitch strategy generation...');
      console.log('Product info:', productInfo);
      console.log('System prompt:', systemPrompt);
      
      // Use Supabase functions invoke instead of direct HTTP call
      const { data, error } = await supabase.functions.invoke('generate-pitch-strategy', {
        body: {
          productInfo,
          systemPrompt: systemPrompt.trim() || undefined
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to generate pitch strategy');
      }

      if (!data) {
        throw new Error('No data received from pitch strategy generation');
      }

      console.log('Generated strategy:', data);
      
      // Validate the response structure
      if (!data.coldCallStarters || !data.talkTracks || !data.talkingPoints) {
        throw new Error('Invalid strategy format received');
      }

      setPitchStrategy(data);
      
      toast({
        title: "Success!",
        description: "Pitch strategy generated successfully.",
      });
      
    } catch (error) {
      console.error('Error generating pitch strategy:', error);
      
      let errorMessage = 'Failed to generate pitch strategy. Please try again.';
      
      if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try with a shorter product description.';
      } else if (error.message?.includes('Invalid strategy format')) {
        errorMessage = 'Received invalid response format. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Pitch Strategy Builder</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>Enter details about your product to generate a pitch strategy.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="productName">Product Name</Label>
            <Input
              id="productName"
              placeholder="Enter product name"
              value={productInfo.productName}
              onChange={(e) => handleInputChange(e, 'productName')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="coreProblem">Core Problem</Label>
            <Textarea
              id="coreProblem"
              placeholder="Describe the core problem your product solves"
              value={productInfo.coreProblem}
              onChange={(e) => handleInputChange(e, 'coreProblem')}
            />
          </div>
          <div className="grid gap-2">
            <Label>Key Features</Label>
            {productInfo.keyFeatures.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder={`Feature ${index + 1}`}
                  value={feature}
                  onChange={(e) => handleKeyFeaturesChange(index, e.target.value)}
                />
                {productInfo.keyFeatures.length > 1 && (
                  <Button type="button" variant="outline" size="icon" onClick={() => removeKeyFeature(index)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-trash"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addKeyFeature}>Add Feature</Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="differentiators">Differentiators</Label>
            <Textarea
              id="differentiators"
              placeholder="What makes your product different?"
              value={productInfo.differentiators}
              onChange={(e) => handleInputChange(e, 'differentiators')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="successStories">Success Stories</Label>
            <Textarea
              id="successStories"
              placeholder="Share any success stories"
              value={productInfo.successStories}
              onChange={(e) => handleInputChange(e, 'successStories')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="idealCustomer">Ideal Customer</Label>
            <Textarea
              id="idealCustomer"
              placeholder="Describe your ideal customer"
              value={productInfo.idealCustomer}
              onChange={(e) => handleInputChange(e, 'idealCustomer')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customerChallenges">Customer Challenges</Label>
            <Textarea
              id="customerChallenges"
              placeholder="What challenges does your customer face?"
              value={productInfo.customerChallenges}
              onChange={(e) => handleInputChange(e, 'customerChallenges')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="productSolution">Product Solution</Label>
            <Textarea
              id="productSolution"
              placeholder="How does your product solve these challenges?"
              value={productInfo.productSolution}
              onChange={(e) => handleInputChange(e, 'productSolution')}
            />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="objections">Likely Objections</Label>
            <Textarea
              id="objections"
              placeholder="What objections might customers have?"
              value={productInfo.objections}
              onChange={(e) => handleInputChange(e, 'objections')}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Custom System Prompt (Optional)</CardTitle>
          <CardDescription>
            Customize the AI's behavior with a system prompt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                placeholder="Enter your custom system prompt here"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={generatePitchStrategy} disabled={isGeneratingStrategy}>
        {isGeneratingStrategy ? "Generating..." : "Generate Pitch Strategy"}
      </Button>

      {pitchStrategy && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Generated Pitch Strategy</h2>
          <Accordion type="single" collapsible>
            <AccordionItem value="coldCallStarters">
              <AccordionTrigger>Cold Call Starters</AccordionTrigger>
              <AccordionContent>
                <ul>
                  {pitchStrategy.coldCallStarters.map((starter, index) => (
                    <li key={index} className="mb-1">{starter}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="talkTracks">
              <AccordionTrigger>Talk Tracks</AccordionTrigger>
              <AccordionContent>
                <ul>
                  {pitchStrategy.talkTracks.map((track, index) => (
                    <li key={index} className="mb-1">{track}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="talkingPoints">
              <AccordionTrigger>Talking Points</AccordionTrigger>
              <AccordionContent>
                <ul>
                  {pitchStrategy.talkingPoints.map((point, index) => (
                    <li key={index} className="mb-1">{point}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default PitchBuilder;
