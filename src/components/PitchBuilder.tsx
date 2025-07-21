import React, { useState, useEffect } from 'react';
import { Card, Input, Textarea, Button, Badge } from "@nextui-org/react";
import { toast } from 'react-hot-toast';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { systemPrompts } from '@/utils/constants';

interface ProductInfo {
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

interface PitchStrategy {
  talkTracks: string[];
  talkingPoints: string[];
}

interface Objection {
  objection: string;
  response: string;
  proofPoint: string;
}

const PitchBuilder: React.FC = () => {
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [pitchStrategy, setPitchStrategy] = useState<PitchStrategy | null>(null);
  const [objectionHandling, setObjectionHandling] = useState<Objection[] | null>(null);
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);
  const [isGeneratingObjections, setIsGeneratingObjections] = useState(false);
  const supabase = useSupabaseClient();
  const router = useRouter();

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
      toast.error("Please fill out the product information first");
      return;
    }

    setIsGeneratingPitch(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-pitch', {
        body: {
          productInfo,
          systemPrompt: systemPrompts.pitchStrategy
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Generated pitch strategy:', data);
      setPitchStrategy(data);
      toast.success("Pitch strategy generated successfully!");
    } catch (error: any) {
      console.error('Error generating pitch strategy:', error);
      toast.error(error.message);
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  const generateObjectionHandling = async (retryCount = 0) => {
    if (!productInfo || !pitchStrategy) {
      toast.error("Please generate a pitch strategy first");
      return;
    }

    setIsGeneratingObjections(true);
    try {
      console.log('Generating objection handling tactics...');
      
      const { data, error } = await supabase.functions.invoke('generate-objection-handling', {
        body: {
          productInfo,
          pitchStrategy,
          systemPrompt: systemPrompts.objectionHandling
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
      toast.success("Objection handling tactics generated successfully!");
      
    } catch (error) {
      console.error('Error generating objection handling:', error);
      
      // Retry logic - try up to 2 times
      if (retryCount < 2) {
        console.log(`Retrying objection handling generation (attempt ${retryCount + 1})...`);
        toast.info(`Retrying objection handling generation...`);
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
      
      toast.error(errorMessage);
    } finally {
      setIsGeneratingObjections(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-6 text-center text-purple-800">Pitch Builder</h1>

      {/* Product Information Section */}
      <section className="mb-8">
        <h3 className="font-semibold text-xl mb-3 text-purple-700">Product Information</h3>
        <Card className="p-4 mb-4 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                type="text"
                label="Product Name"
                placeholder="Enter product name"
                value={productInfo?.productName || ''}
                onChange={(e) => handleProductInfoChange(e, 'productName')}
              />
            </div>
            <div>
              <Input
                type="text"
                label="Core Problem"
                placeholder="Enter core problem"
                value={productInfo?.coreProblem || ''}
                onChange={(e) => handleProductInfoChange(e, 'coreProblem')}
              />
            </div>
            <div>
              <Input
                type="text"
                label="Key Features (comma-separated)"
                placeholder="Enter key features"
                value={productInfo?.keyFeatures?.join(', ') || ''}
                onChange={handleKeyFeaturesChange}
              />
            </div>
            <div>
              <Input
                type="text"
                label="Differentiators"
                placeholder="Enter differentiators"
                value={productInfo?.differentiators || ''}
                onChange={(e) => handleProductInfoChange(e, 'differentiators')}
              />
            </div>
            <div>
              <Textarea
                label="Success Stories"
                placeholder="Enter success stories"
                value={productInfo?.successStories || ''}
                onChange={(e) => handleProductInfoChange(e, 'successStories')}
              />
            </div>
            <div>
              <Input
                type="text"
                label="Ideal Customer"
                placeholder="Enter ideal customer"
                value={productInfo?.idealCustomer || ''}
                onChange={(e) => handleProductInfoChange(e, 'idealCustomer')}
              />
            </div>
            <div>
              <Textarea
                label="Customer Challenges"
                placeholder="Enter customer challenges"
                value={productInfo?.customerChallenges || ''}
                onChange={(e) => handleProductInfoChange(e, 'customerChallenges')}
              />
            </div>
            <div>
              <Textarea
                label="Product Solution"
                placeholder="Enter product solution"
                value={productInfo?.productSolution || ''}
                onChange={(e) => handleProductInfoChange(e, 'productSolution')}
              />
            </div>
            <div>
              <Textarea
                label="Known Objections"
                placeholder="Enter known objections"
                value={productInfo?.objections || ''}
                onChange={(e) => handleProductInfoChange(e, 'objections')}
              />
            </div>
          </div>
        </Card>
      </section>

      {/* Pitch Strategy Section */}
      <section className="mb-8">
        <h3 className="font-semibold text-xl mb-3 text-purple-700">Pitch Strategy</h3>
        <Card className="p-4 mb-4 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                type="text"
                label="Talk Tracks (pipe-separated)"
                placeholder="Enter talk tracks"
                value={pitchStrategy?.talkTracks?.join(' | ') || ''}
                onChange={handleTalkTracksChange}
              />
            </div>
            <div>
              <Input
                type="text"
                label="Key Talking Points (pipe-separated)"
                placeholder="Enter key talking points"
                value={pitchStrategy?.talkingPoints?.join(' | ') || ''}
                onChange={handleTalkingPointsChange}
              />
            </div>
          </div>
        </Card>
        <Button
          color="primary"
          isLoading={isGeneratingPitch}
          onClick={generatePitch}
          className="mt-3"
        >
          Generate Pitch Strategy
        </Button>
      </section>

      <div className="mb-8">
        <Button
          color="secondary"
          isLoading={isGeneratingObjections}
          onClick={generateObjectionHandling}
          className="mt-3"
        >
          Generate Objection Handling Tactics
        </Button>
      </div>

                  {/* Objection Handling Section */}
                  {objectionHandling && objectionHandling.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-lg mb-3 text-purple-700">Objection Handling Tactics</h4>
                      {objectionHandling.map((objection, index) => (
                        <Card key={index} className="p-4 mb-4 bg-white border-l-4 border-l-purple-500">
                          <div className="mb-3">
                            <Badge variant="outline" className="text-purple-600 border-purple-300 mb-2">
                              Objection {index + 1}
                            </Badge>
                            <h5 className="font-semibold text-gray-800 mb-2">"{objection.objection}"</h5>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <span className="text-sm font-medium text-gray-600">Response:</span>
                              <p className="text-gray-700 mt-1 leading-relaxed">{objection.response}</p>
                            </div>
                            
                            <div>
                              <span className="text-sm font-medium text-gray-600">Proof Point:</span>
                              <p className="text-gray-700 mt-1 leading-relaxed italic">{objection.proofPoint}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

    </div>
  );
};

export default PitchBuilder;
