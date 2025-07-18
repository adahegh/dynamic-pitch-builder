import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Copy } from 'lucide-react';
import { PitchStrategy as PitchStrategyType, ProductInfo, ObjectionHandling, EmailCadenceStep } from '@/components/PitchBuilder';
import { EmailCard } from '@/components/EmailCard';
import { useToast } from '@/hooks/use-toast';

interface PitchData {
  productInfo: ProductInfo;
  pitchStrategy: PitchStrategyType;
  objectionHandling: ObjectionHandling[];
  emailCadence: EmailCadenceStep[];
}

const PitchStrategy = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pitchData, setPitchData] = useState<PitchData | null>(null);

  useEffect(() => {
    // Get pitch data from navigation state or localStorage
    const data = location.state?.pitchData || JSON.parse(localStorage.getItem('completePitchStrategy') || 'null');
    
    if (!data) {
      // Redirect back to main page if no data
      navigate('/');
      return;
    }
    
    setPitchData(data);
  }, [location.state, navigate]);

  const downloadStrategy = () => {
    if (!pitchData) return;

    const content = generateDownloadContent(pitchData);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pitchData.productInfo.productName || 'Pitch'}_Strategy.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Strategy Downloaded",
      description: "Your complete pitch strategy has been downloaded as a text file.",
    });
  };

  const copyToClipboard = async () => {
    if (!pitchData) return;

    const content = generateDownloadContent(pitchData);
    await navigator.clipboard.writeText(content);
    
    toast({
      title: "Copied to Clipboard",
      description: "Complete pitch strategy has been copied to your clipboard.",
    });
  };

  const generateDownloadContent = (data: PitchData) => {
    const { productInfo, pitchStrategy, objectionHandling, emailCadence } = data;
    
    return `COMPLETE PITCH STRATEGY - ${productInfo.productName}
${'='.repeat(60)}

PRODUCT INFORMATION
-------------------
Product Name: ${productInfo.productName}
Core Problem: ${productInfo.coreProblem}
Key Features: ${productInfo.keyFeatures?.join(', ') || 'N/A'}
Differentiators: ${productInfo.differentiators}
Success Stories: ${productInfo.successStories}
Ideal Customer: ${productInfo.idealCustomer}
Customer Challenges: ${productInfo.customerChallenges}
Product Solution: ${productInfo.productSolution}
Likely Objections: ${productInfo.objections}

PITCH STRATEGY
--------------
Cold Call Starters:
${pitchStrategy.coldCallStarters?.map((starter, index) => `${index + 1}. ${starter}`).join('\n') || 'No cold call starters available'}

Talk Tracks:
${pitchStrategy.talkTracks?.map((track, index) => `Talk Track ${index + 1}:\n${track}\n`).join('\n') || 'No talk tracks available'}

Key Talking Points:
${pitchStrategy.talkingPoints?.map((point, index) => `${index + 1}. ${point}`).join('\n') || 'No talking points available'}

OBJECTION HANDLING
------------------
${objectionHandling?.map((obj, index) => `${index + 1}. ${obj.objection}\nResponse: ${obj.response}\n`).join('\n') || 'No objection handling available'}

EMAIL CADENCE (16-DAY SEQUENCE)
-------------------------------
${emailCadence?.map((email, index) => `${email.day} - ${email.step} (${email.type}):\n${email.content}\n${'─'.repeat(40)}\n`).join('\n') || 'No email cadence available'}

Generated on: ${new Date().toLocaleDateString()}`;
  };

  if (!pitchData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
          <p className="text-gray-600">Preparing your pitch strategy...</p>
        </div>
      </div>
    );
  }

  const { productInfo, pitchStrategy, objectionHandling, emailCadence } = pitchData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Builder
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Complete Pitch Strategy</h1>
              <p className="text-gray-600">{productInfo.productName}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyToClipboard}>
              <Copy className="w-4 h-4 mr-2" />
              Copy All
            </Button>
            <Button onClick={downloadStrategy} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Download Strategy
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-blue-700">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Core Problem</h4>
                  <p className="text-gray-600">{productInfo.coreProblem}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Key Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {productInfo.keyFeatures?.map((feature, index) => (
                      <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Differentiators</h4>
                  <p className="text-gray-600">{productInfo.differentiators}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Ideal Customer</h4>
                  <p className="text-gray-600">{productInfo.idealCustomer}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pitch Strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-purple-700">Pitch Strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cold Call Starters */}
              <div>
                <h4 className="font-semibold text-lg mb-4 text-green-700">Cold Call Starters</h4>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {pitchStrategy.coldCallStarters?.map((starter, index) => (
                        <div key={index} className="flex items-start">
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 mr-3 mt-0.5">
                            {index + 1}
                          </Badge>
                          <p className="text-gray-700">{starter}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Talk Tracks */}
              <div>
                <h4 className="font-semibold text-lg mb-4 text-blue-700">Talk Tracks</h4>
                <div className="space-y-4">
                  {pitchStrategy.talkTracks?.map((track, index) => (
                    <Card key={index} className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center mb-2">
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                            Talk Track {index + 1}
                          </Badge>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{track}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Talking Points */}
              <div>
                <h4 className="font-semibold text-lg mb-4 text-purple-700">Key Talking Points</h4>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {pitchStrategy.talkingPoints?.map((point, index) => (
                        <div key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <p className="text-gray-700">{point}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Objection Handling */}
          {objectionHandling && objectionHandling.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-green-700">Objection Handling</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {objectionHandling.map((obj, index) => (
                    <Card key={index} className="bg-green-50 border-green-200">
                      <CardContent className="pt-4">
                        <div className="mb-3">
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            Objection {index + 1}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <h5 className="font-semibold text-red-700">Objection:</h5>
                            <p className="text-gray-700">{obj.objection}</p>
                          </div>
                          <div>
                            <h5 className="font-semibold text-green-700">Response:</h5>
                            <p className="text-gray-700 whitespace-pre-wrap">{obj.response}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Cadence */}
          {emailCadence && emailCadence.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-orange-700">16-Day Email Cadence</CardTitle>
                <p className="text-orange-600">Strategic sequence of touchpoints to build relationships and drive engagement</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emailCadence.map((email, index) => (
                    <EmailCard key={index} email={email} index={index} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PitchStrategy;