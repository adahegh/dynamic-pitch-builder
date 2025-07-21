import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface ProductInfo {
  productName: string;
  coreProblem: string;
  keyFeatures: string[];
  differentiators: string;
  successStories: string;
  idealCustomer: string;
  customerChallenges: string;
  productSolution: string;
  objections: string;
}

export interface PitchStrategy {
  talkTracks: string[];
  talkingPoints: string[];
  coldCallStarters?: string[];
}

export interface Objection {
  objection: string;
  response: string;
  proofPoint: string;
}

export type ObjectionHandling = Objection;
export type EmailCadenceStep = any; // Add proper interface if needed

const PitchBuilder: React.FC = () => {
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [pitchStrategy, setPitchStrategy] = useState<PitchStrategy | null>(null);
  const [objectionHandling, setObjectionHandling] = useState<Objection[] | null>(null);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [isGeneratingObjections, setIsGeneratingObjections] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load data from local storage on component mount
    const storedProductInfo = localStorage.getItem('productInfo');
    const storedPitchStrategy = localStorage.getItem('pitchStrategy');
    const storedObjectionHandling = localStorage.getItem('objectionHandling');

    if (storedProductInfo) {
      setProductInfo(JSON.parse(storedProductInfo));
    }
    if (storedPitchStrategy) {
      setPitchStrategy(JSON.parse(storedPitchStrategy));
    }
    if (storedObjectionHandling) {
      setObjectionHandling(JSON.parse(storedObjectionHandling));
    }
  }, []);

  useEffect(() => {
    // Save data to local storage whenever it changes
    if (productInfo) {
      localStorage.setItem('productInfo', JSON.stringify(productInfo));
    }
    if (pitchStrategy) {
      localStorage.setItem('pitchStrategy', JSON.stringify(pitchStrategy));
    }
    if (objectionHandling) {
      localStorage.setItem('objectionHandling', JSON.stringify(objectionHandling));
    }
  }, [productInfo, pitchStrategy, objectionHandling]);

  const handleProductInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, key: keyof ProductInfo) => {
    setProductInfo(prev => ({
      ...prev,
      [key]: e.target.value,
    } as ProductInfo));
  };

  const handleKeyFeaturesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const features = e.target.value.split(',').map(item => item.trim());
    setProductInfo(prev => ({
      ...prev,
      keyFeatures: features,
    } as ProductInfo));
  };

  const handlePitchStrategyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, key: keyof PitchStrategy) => {
    setPitchStrategy(prev => ({
      ...prev,
      [key]: e.target.value,
    } as PitchStrategy));
  };

  const handleTalkTracksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tracks = e.target.value.split('|').map(item => item.trim());
    setPitchStrategy(prev => ({
      ...prev,
      talkTracks: tracks,
    } as PitchStrategy));
  };

  const handleTalkingPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const points = e.target.value.split('|').map(item => item.trim());
    setPitchStrategy(prev => ({
      ...prev,
      talkingPoints: points,
    } as PitchStrategy));
  };

  const generatePitch = async () => {
    if (!productInfo) {
      toast({
        title: "Error",
        description: "Please fill out the product information first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPitch(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-pitch-strategy', {
        body: { productInfo }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Generated pitch strategy:', data);
      setPitchStrategy(data);
      toast({
        title: "Success",
        description: "Pitch strategy generated successfully!",
      });
    } catch (error: any) {
      console.error('Error generating pitch strategy:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const generateObjectionHandling = async (retryCount = 0) => {
    if (!productInfo || !pitchStrategy) {
      toast({
        title: "Error", 
        description: "Please generate a pitch strategy first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingObjections(true);
    try {
      console.log('Generating objection handling tactics...');
      
      const { data, error } = await supabase.functions.invoke('generate-objection-handling', {
        body: {
          productInfo,
          pitchStrategy
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to generate objection handling');
      }

      if (!data || !data.objectionHandling) {
        throw new Error('Invalid response format from objection handling service');
      }

      console.log('Generated objection handling:', data);
      setObjectionHandling(data.objectionHandling);
      toast({
        title: "Success",
        description: "Objection handling tactics generated successfully!",
      });
      
    } catch (error) {
      console.error('Error generating objection handling:', error);
      
      // Retry logic - try up to 2 times
      if (retryCount < 2) {
        console.log(`Retrying objection handling generation (attempt ${retryCount + 1})...`);
        toast({
          title: "Retrying",
          description: "Retrying objection handling generation...",
        });
        setTimeout(() => generateObjectionHandling(retryCount + 1), 1000);
        return;
      }
      
      // Provide specific error messages based on error type
      let errorMessage = "Failed to generate objection handling tactics";
      if (error.message.includes('Invalid response format')) {
        errorMessage = "The AI response format was invalid. Please try again.";
      } else if (error.message.includes('OpenAI')) {
        errorMessage = "There was an issue with the AI service. Please try again.";
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = "Network error occurred. Please check your connection and try again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingObjections(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6 text-center">Pitch Builder</h1>

      {/* Product Information Section */}
      <section className="mb-8">
        <h3 className="font-semibold text-xl mb-3">Product Information</h3>
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  type="text"
                  placeholder="Enter product name"
                  value={productInfo?.productName || ''}
                  onChange={(e) => handleProductInfoChange(e, 'productName')}
                />
              </div>
              <div>
                <Label htmlFor="coreProblem">Core Problem</Label>
                <Input
                  id="coreProblem"
                  type="text"
                  placeholder="Enter core problem"
                  value={productInfo?.coreProblem || ''}
                  onChange={(e) => handleProductInfoChange(e, 'coreProblem')}
                />
              </div>
              <div>
                <Label htmlFor="keyFeatures">Key Features (comma-separated)</Label>
                <Input
                  id="keyFeatures"
                  type="text"
                  placeholder="Enter key features"
                  value={productInfo?.keyFeatures?.join(', ') || ''}
                  onChange={handleKeyFeaturesChange}
                />
              </div>
              <div>
                <Label htmlFor="differentiators">Differentiators</Label>
                <Input
                  id="differentiators"
                  type="text"
                  placeholder="Enter differentiators"
                  value={productInfo?.differentiators || ''}
                  onChange={(e) => handleProductInfoChange(e, 'differentiators')}
                />
              </div>
              <div>
                <Label htmlFor="successStories">Success Stories</Label>
                <Textarea
                  id="successStories"
                  placeholder="Enter success stories"
                  value={productInfo?.successStories || ''}
                  onChange={(e) => handleProductInfoChange(e, 'successStories')}
                />
              </div>
              <div>
                <Label htmlFor="idealCustomer">Ideal Customer</Label>
                <Input
                  id="idealCustomer"
                  type="text"
                  placeholder="Enter ideal customer"
                  value={productInfo?.idealCustomer || ''}
                  onChange={(e) => handleProductInfoChange(e, 'idealCustomer')}
                />
              </div>
              <div>
                <Label htmlFor="customerChallenges">Customer Challenges</Label>
                <Textarea
                  id="customerChallenges"
                  placeholder="Enter customer challenges"
                  value={productInfo?.customerChallenges || ''}
                  onChange={(e) => handleProductInfoChange(e, 'customerChallenges')}
                />
              </div>
              <div>
                <Label htmlFor="productSolution">Product Solution</Label>
                <Textarea
                  id="productSolution"
                  placeholder="Enter product solution"
                  value={productInfo?.productSolution || ''}
                  onChange={(e) => handleProductInfoChange(e, 'productSolution')}
                />
              </div>
              <div>
                <Label htmlFor="objections">Known Objections</Label>
                <Textarea
                  id="objections"
                  placeholder="Enter known objections"
                  value={productInfo?.objections || ''}
                  onChange={(e) => handleProductInfoChange(e, 'objections')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Pitch Strategy Section */}
      <section className="mb-8">
        <h3 className="font-semibold text-xl mb-3">Pitch Strategy</h3>
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="talkTracks">Talk Tracks (pipe-separated)</Label>
                <Input
                  id="talkTracks"
                  type="text"
                  placeholder="Enter talk tracks"
                  value={pitchStrategy?.talkTracks?.join(' | ') || ''}
                  onChange={handleTalkTracksChange}
                />
              </div>
              <div>
                <Label htmlFor="talkingPoints">Key Talking Points (pipe-separated)</Label>
                <Input
                  id="talkingPoints"
                  type="text"
                  placeholder="Enter key talking points"
                  value={pitchStrategy?.talkingPoints?.join(' | ') || ''}
                  onChange={handleTalkingPointsChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Button
          disabled={isGeneratingPitch}
          onClick={generatePitch}
          className="mt-3"
        >
          {isGeneratingPitch ? "Generating..." : "Generate Pitch Strategy"}
        </Button>
      </section>

      <div className="mb-8">
        <Button
          variant="secondary"
          disabled={isGeneratingObjections}
          onClick={() => generateObjectionHandling()}
          className="mt-3"
        >
          {isGeneratingObjections ? "Generating..." : "Generate Objection Handling Tactics"}
        </Button>
      </div>

      {/* Objection Handling Section */}
      {objectionHandling && objectionHandling.length > 0 && (
        <section className="mb-8">
          <h3 className="font-semibold text-xl mb-3">Objection Handling Tactics</h3>
          {objectionHandling.map((objection, index) => (
            <Card key={index} className="mb-4 border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="mb-3">
                  <Badge variant="outline" className="mb-2">
                    Objection {index + 1}
                  </Badge>
                  <h5 className="font-semibold mb-2">"{objection.objection}"</h5>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Response:</span>
                    <p className="mt-1 leading-relaxed">{objection.response}</p>
                  </div>
                  
                  {objection.proofPoint && (
                    <div>
                      <span className="text-sm font-medium">Proof Point:</span>
                      <p className="mt-1 leading-relaxed italic">{objection.proofPoint}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

    </div>
  );
};

export default PitchBuilder;
