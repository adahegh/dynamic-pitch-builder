
import { useState, useRef, useEffect } from "react";
import { Send, Upload, Globe, FileText, Download, Edit, Check, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatMessage } from "./ChatMessage";
import { FileUpload } from "./FileUpload";
import { PitchDisplay } from "./PitchDisplay";
import { toast } from "sonner";

export interface ProductInfo {
  website: string;
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

export interface ObjectionHandling {
  objection: string;
  strategy: string;
  talkTracks: string[];
}

export interface PitchStrategy {
  talkTracks: string[];
  talkingPoints: string[];
}

export interface ObjectionHandlingResponse {
  objectionHandling: ObjectionHandling[];
}

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

type Step = 'input' | 'processing' | 'review' | 'edit' | 'generate' | 'strategy' | 'edit-strategy' | 'objections' | 'edit-objections' | 'complete';

export function PitchBuilder() {
  const [step, setStep] = useState<Step>('input');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi! I'm your Dynamic Pitch Builder assistant. I'll help you craft a personalized pitch strategy for your product. Please enter your product's website URL or upload a PDF with product information to get started.",
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [editingInfo, setEditingInfo] = useState<ProductInfo | null>(null);
  const [pitchStrategy, setPitchStrategy] = useState<PitchStrategy | null>(null);
  const [editingStrategy, setEditingStrategy] = useState<PitchStrategy | null>(null);
  const [objectionHandling, setObjectionHandling] = useState<ObjectionHandling[] | null>(null);
  const [editingObjections, setEditingObjections] = useState<ObjectionHandling[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [strategyFeedbackInput, setStrategyFeedbackInput] = useState('');
  const [objectionsFeedbackInput, setObjectionsFeedbackInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: 'bot' | 'user', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handleSubmit = async () => {
    if (!userInput.trim() && !uploadedFile) {
      toast.error("Please enter a website URL or upload a PDF file.");
      return;
    }

    setIsLoading(true);
    
    let userMessage = "";
    if (userInput.trim() && uploadedFile) {
      userMessage = `Website URL: ${userInput} and uploaded file: ${uploadedFile.name}`;
    } else if (userInput.trim()) {
      if (!userInput.startsWith('http')) {
        toast.error("Please enter a valid website URL starting with http or https.");
        setIsLoading(false);
        return;
      }
      userMessage = `Website URL: ${userInput}`;
    } else {
      userMessage = `Uploaded file: ${uploadedFile!.name}`;
    }
    
    addMessage('user', userMessage);
    addMessage('bot', "Analyzing the website and researching product information...");
    
    try {
      // Research and extract product information from the website
      await extractProductInfo(userInput.trim() || '');
    } catch (error) {
      console.error('Error extracting product info:', error);
      setIsLoading(false);
      addMessage('bot', "I had trouble analyzing the website. Let me provide a template you can fill out:");
      
      const templateInfo: ProductInfo = {
        website: userInput.trim() || 'uploaded-document.pdf',
        productName: "",
        coreProblem: "",
        keyFeatures: [],
        differentiators: "",
        successStories: "",
        idealCustomer: "",
        customerChallenges: "",
        productSolution: "",
        objections: ""
      };

      setProductInfo(templateInfo);
      setEditingInfo(templateInfo);
      setStep('review');
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackInput.trim() || !productInfo) {
      toast.error("Please enter your feedback.");
      return;
    }

    setIsLoading(true);
    const feedbackMessage = feedbackInput;
    setFeedbackInput('');
    
    addMessage('user', feedbackMessage);
    addMessage('bot', "Processing your feedback and updating the information...");
    
    try {
      const response = await fetch('https://vjcecvadjbeiolcqsyof.supabase.co/functions/v1/process-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY2VjdmFkamJlaW9sY3FzeW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDY2MjcsImV4cCI6MjA2NzU4MjYyN30.lpyOBQqgYxzaqnFRzaR1ZoZsuusTJDC9tcbKb4IR24I`,
        },
        body: JSON.stringify({ 
          feedback: feedbackMessage, 
          currentProductInfo: productInfo 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process feedback');
      }

      const updatedInfo = await response.json();
      setProductInfo(updatedInfo);
      setEditingInfo(updatedInfo);
      setIsLoading(false);
      
      addMessage('bot', "Perfect! I've updated the information based on your feedback. You can see the changes reflected in the information panel above.");
    } catch (error) {
      console.error('Error processing feedback:', error);
      setIsLoading(false);
      addMessage('bot', "I had trouble processing your feedback. Please try again or use the direct edit option.");
    }
  };

  const extractProductInfo = async (websiteUrl: string) => {
    try {
      // Fetch website content for analysis using Supabase Edge Function
      const response = await fetch('https://vjcecvadjbeiolcqsyof.supabase.co/functions/v1/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY2VjdmFkamJlaW9sY3FzeW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDY2MjcsImV4cCI6MjA2NzU4MjYyN30.lpyOBQqgYxzaqnFRzaR1ZoZsuusTJDC9tcbKb4IR24I`,
        },
        body: JSON.stringify({ url: websiteUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze website');
      }

      const data = await response.json();
      
      const extractedInfo: ProductInfo = {
        website: websiteUrl,
        productName: data.productName || "",
        coreProblem: data.coreProblem || "",
        keyFeatures: data.keyFeatures || [],
        differentiators: data.differentiators || "",
        successStories: data.successStories || "",
        idealCustomer: data.idealCustomer || "",
        customerChallenges: data.customerChallenges || "",
        productSolution: data.productSolution || "",
        objections: data.objections || ""
      };

      setProductInfo(extractedInfo);
      setEditingInfo(extractedInfo);
      setStep('review');
      setIsLoading(false);
      setUserInput('');
      setUploadedFile(null);
      
      addMessage('bot', "Great! I've analyzed your website and researched your product. Here's what I found. You can review the information above and provide feedback below to make any changes:");
    } catch (error) {
      // If analysis fails, create empty template
      const emptyProductInfo: ProductInfo = {
        website: websiteUrl,
        productName: "No information found",
        coreProblem: "No information found",
        keyFeatures: [],
        differentiators: "No information found",
        successStories: "No information found",
        idealCustomer: "No information found",
        customerChallenges: "No information found",
        productSolution: "No information found",
        objections: "No information found"
      };

      setProductInfo(emptyProductInfo);
      setEditingInfo(emptyProductInfo);
      setStep('review');
      setIsLoading(false);
      setUserInput('');
      setUploadedFile(null);
      
      addMessage('bot', "I couldn't extract information from the website. Please fill in the template above or provide feedback below:");
    }
  };

  const confirmInformation = () => {
    setProductInfo(editingInfo);
    setStep('generate');
    addMessage('user', "Information confirmed - ready to generate pitch strategy");
    generatePitchStrategy();
  };

  const generatePitchStrategy = async () => {
    if (!productInfo) return;
    
    setIsLoading(true);
    addMessage('bot', "Perfect! Now I'll generate your personalized pitch strategy based on your product information...");
    
    try {
      const response = await fetch('https://vjcecvadjbeiolcqsyof.supabase.co/functions/v1/generate-pitch-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY2VjdmFkamJlaW9sY3FzeW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDY2MjcsImV4cCI6MjA2NzU4MjYyN30.lpyOBQqgYxzaqnFRzaR1ZoZsuusTJDC9tcbKb4IR24I`,
        },
        body: JSON.stringify({ productInfo }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate pitch strategy');
      }

      const strategy = await response.json();
      setPitchStrategy(strategy);
      setEditingStrategy(strategy);
      setStep('strategy');
      setIsLoading(false);
      addMessage('bot', "Your personalized pitch strategy is ready! Review it above and provide feedback below to make any improvements:");
    } catch (error) {
      console.error('Error generating pitch strategy:', error);
      setIsLoading(false);
      addMessage('bot', "I had trouble generating your pitch strategy. Please try again.");
    }
  };

  const handleStrategyFeedbackSubmit = async () => {
    if (!strategyFeedbackInput.trim() || !pitchStrategy || !productInfo) {
      toast.error("Please enter your feedback.");
      return;
    }

    setIsLoading(true);
    const feedbackMessage = strategyFeedbackInput;
    setStrategyFeedbackInput('');
    
    addMessage('user', feedbackMessage);
    addMessage('bot', "Processing your feedback and improving the pitch strategy...");
    
    try {
      const response = await fetch('https://vjcecvadjbeiolcqsyof.supabase.co/functions/v1/improve-pitch-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY2VjdmFkamJlaW9sY3FzeW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDY2MjcsImV4cCI6MjA2NzU4MjYyN30.lpyOBQqgYxzaqnFRzaR1ZoZsuusTJDC9tcbKb4IR24I`,
        },
        body: JSON.stringify({ 
          feedback: feedbackMessage, 
          currentStrategy: pitchStrategy,
          productInfo: productInfo
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to improve pitch strategy');
      }

      const improvedStrategy = await response.json();
      setPitchStrategy(improvedStrategy);
      setEditingStrategy(improvedStrategy);
      setIsLoading(false);
      
      addMessage('bot', "Perfect! I've improved the pitch strategy based on your feedback. You can see the changes reflected in the strategy panel above.");
    } catch (error) {
      console.error('Error improving pitch strategy:', error);
      setIsLoading(false);
      addMessage('bot', "I had trouble processing your feedback. Please try again.");
    }
  };

  const generateObjectionHandling = async () => {
    if (!pitchStrategy || !productInfo) return;
    
    setIsLoading(true);
    setStep('objections');
    addMessage('user', "Strategy confirmed - generating objection handling tactics");
    addMessage('bot', "Excellent! Now I'll generate comprehensive objection handling tactics using GPT-4o...");
    
    try {
      const response = await fetch('https://vjcecvadjbeiolcqsyof.supabase.co/functions/v1/generate-objection-handling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY2VjdmFkamJlaW9sY3FzeW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDY2MjcsImV4cCI6MjA2NzU4MjYyN30.lpyOBQqgYxzaqnFRzaR1ZoZsuusTJDC9tcbKb4IR24I`,
        },
        body: JSON.stringify({ 
          productInfo,
          pitchStrategy 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate objection handling');
      }

      const data = await response.json();
      setObjectionHandling(data.objectionHandling);
      setEditingObjections(data.objectionHandling);
      setIsLoading(false);
      addMessage('bot', "Your objection handling tactics are ready! Review them above and provide feedback below to make any improvements:");
    } catch (error) {
      console.error('Error generating objection handling:', error);
      setIsLoading(false);
      addMessage('bot', "I had trouble generating objection handling tactics. Please try again.");
    }
  };

  const handleObjectionsFeedbackSubmit = async () => {
    if (!objectionsFeedbackInput.trim() || !objectionHandling || !productInfo) {
      toast.error("Please enter your feedback.");
      return;
    }

    setIsLoading(true);
    const feedbackMessage = objectionsFeedbackInput;
    setObjectionsFeedbackInput('');
    
    addMessage('user', feedbackMessage);
    addMessage('bot', "Processing your feedback and improving the objection handling tactics...");
    
    try {
      const response = await fetch('https://vjcecvadjbeiolcqsyof.supabase.co/functions/v1/improve-objection-handling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY2VjdmFkamJlaW9sY3FzeW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDY2MjcsImV4cCI6MjA2NzU4MjYyN30.lpyOBQqgYxzaqnFRzaR1ZoZsuusTJDC9tcbKb4IR24I`,
        },
        body: JSON.stringify({ 
          feedback: feedbackMessage, 
          currentObjectionHandling: objectionHandling,
          productInfo: productInfo,
          pitchStrategy: pitchStrategy
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to improve objection handling');
      }

      const improvedObjections = await response.json();
      setObjectionHandling(improvedObjections.objectionHandling);
      setEditingObjections(improvedObjections.objectionHandling);
      setIsLoading(false);
      
      addMessage('bot', "Perfect! I've improved the objection handling tactics based on your feedback. You can see the changes reflected above.");
    } catch (error) {
      console.error('Error improving objection handling:', error);
      setIsLoading(false);
      addMessage('bot', "I had trouble processing your feedback. Please try again.");
    }
  };

  const downloadStrategy = () => {
    if (!pitchStrategy || !productInfo) return;
    
    const content = `
PITCH STRATEGY FOR ${productInfo.productName.toUpperCase()}

SAMPLE TALK TRACKS:

Talk Track 1:
${pitchStrategy.talkTracks[0]}

Talk Track 2:
${pitchStrategy.talkTracks[1]}

KEY TALKING POINTS:
${pitchStrategy.talkingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

Generated by Dynamic Pitch Builder
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productInfo.productName.replace(/\s+/g, '_')}_Pitch_Strategy.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Pitch strategy downloaded successfully!");
  };

  const goBack = () => {
    switch (step) {
      case 'review':
        setStep('input');
        break;
      case 'edit':
        setStep('review');
        break;
      case 'strategy':
        setStep('review');
        break;
      case 'edit-strategy':
        setStep('strategy');
        break;
      case 'objections':
        setStep('strategy');
        break;
      case 'edit-objections':
        setStep('objections');
        break;
      case 'complete':
        setStep('objections');
        break;
      default:
        break;
    }
  };

  return (
    <div className="h-screen flex flex-col p-4">
      <div className="max-w-6xl mx-auto w-full flex flex-col h-full">
        <div className="text-center mb-6 relative">
          {/* Back button for steps that support going back */}
          {['review', 'edit', 'strategy', 'edit-strategy', 'objections', 'edit-objections', 'complete'].includes(step) && (
            <Button 
              variant="ghost" 
              onClick={goBack}
              className="absolute left-0 top-0 flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Dynamic Pitch Builder
          </h1>
          <p className="text-gray-600">AI-powered personalized sales pitch generator</p>
        </div>
        
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Left side - Product Information (when in review step) or Pitch Strategy (when in strategy step) */}
          {step === 'review' && productInfo && (
            <div className="w-1/2 flex flex-col">
              <div className="bg-blue-50 p-6 rounded-lg border flex-1 overflow-y-auto">
                <h3 className="font-semibold mb-4 text-blue-800 text-lg">Extracted Product & Audience Information</h3>
                
                <div className="grid gap-6">
                  {/* Product Understanding Section */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-blue-700 mb-3">Product Understanding</h4>
                    <div className="space-y-3 text-sm">
                      <div><strong>Product Website:</strong> <span className="text-blue-600">{productInfo.website}</span></div>
                      <div><strong>Product Name:</strong> {productInfo.productName || "Not specified"}</div>
                      <div><strong>Core Problem:</strong> {productInfo.coreProblem || "Not specified"}</div>
                      <div><strong>Key Features:</strong> {productInfo.keyFeatures.length > 0 ? productInfo.keyFeatures.join(', ') : "Not specified"}</div>
                      <div><strong>Differentiators:</strong> {productInfo.differentiators || "Not specified"}</div>
                      <div><strong>Success Stories:</strong> {productInfo.successStories || "Not specified"}</div>
                    </div>
                  </div>

                  {/* Target Audience Section */}
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-purple-700 mb-3">Target Audience</h4>
                    <div className="space-y-3 text-sm">
                      <div><strong>Ideal Customer:</strong> {productInfo.idealCustomer || "Not specified"}</div>
                      <div><strong>Customer Challenges:</strong> {productInfo.customerChallenges || "Not specified"}</div>
                      <div><strong>Product Solution:</strong> {productInfo.productSolution || "Not specified"}</div>
                      <div><strong>Likely Objections:</strong> {productInfo.objections || "Not specified"}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button onClick={confirmInformation} className="bg-blue-600 hover:bg-blue-700">
                    <Check className="w-4 h-4 mr-2" />
                    Looks Good - Generate Pitch
                  </Button>
                  <Button variant="outline" onClick={() => setStep('edit')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Directly
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Left side - Objection Handling Display (when in objections step) */}
          {step === 'objections' && objectionHandling && (
            <div className="w-1/2 flex flex-col">
              <div className="bg-green-50 p-6 rounded-lg border flex-1 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-green-800 text-lg">Objection Handling Tactics</h3>
                  <Button onClick={() => setStep('complete')} className="bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4 mr-2" />
                    Complete
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {objectionHandling.map((objection, index) => (
                    <Card key={index} className="p-4 bg-white">
                      <div className="space-y-3">
                        <div>
                          <Badge variant="outline" className="text-green-600 border-green-300 mb-2">
                            Objection {index + 1}
                          </Badge>
                          <h4 className="font-semibold text-gray-800">{objection.objection}</h4>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-purple-700 mb-1">Handling Strategy:</h5>
                          <p className="text-gray-700 text-sm">{objection.strategy}</p>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-blue-700 mb-2">Example Talk Tracks:</h5>
                          <ul className="space-y-1">
                            {objection.talkTracks.map((track, trackIndex) => (
                              <li key={trackIndex} className="flex items-start text-sm">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                                <span className="text-gray-700">{track}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-2 mt-6">
                  <Button onClick={() => setStep('complete')} className="bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4 mr-2" />
                    Complete Strategy
                  </Button>
                  <Button variant="outline" onClick={() => setStep('edit-objections')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Directly
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Left side - Pitch Strategy Display (when in strategy step) */}
          {step === 'strategy' && pitchStrategy && (
            <div className="w-1/2 flex flex-col">
              <div className="bg-purple-50 p-6 rounded-lg border flex-1 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-purple-800 text-lg">Generated Pitch Strategy</h3>
                  <Button onClick={downloadStrategy} className="bg-purple-600 hover:bg-purple-700">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-lg mb-3 text-blue-700">Sample Talk Tracks</h4>
                    {pitchStrategy.talkTracks.map((track, index) => (
                      <Card key={index} className="p-4 mb-3 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            Talk Track {index + 1}
                          </Badge>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{track}</p>
                      </Card>
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg mb-3 text-purple-700">Key Talking Points</h4>
                    <Card className="p-4 bg-white">
                      <div className="mb-3">
                        <Badge variant="outline" className="text-purple-600 border-purple-300">
                          Talking Points
                        </Badge>
                      </div>
                      <ul className="space-y-2">
                        {pitchStrategy.talkingPoints.map((point, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <span className="text-gray-700">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button onClick={generateObjectionHandling} className="bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4 mr-2" />
                    Finalize Strategy
                  </Button>
                  <Button variant="outline" onClick={() => setStep('edit-strategy')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Directly
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Right side - Chat Interface */}
          <Card className={`${(step === 'review' || step === 'strategy' || step === 'edit-strategy' || step === 'objections' || step === 'edit-objections') ? 'w-1/2' : 'w-full'} flex flex-col shadow-lg`}>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-4 rounded-lg max-w-xs animate-pulse">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              {step === 'edit' && editingInfo && (
                <div className="bg-blue-50 p-6 rounded-lg border animate-fade-in">
                  <h3 className="font-semibold mb-4 text-blue-800 text-lg">Edit Product & Audience Information</h3>
                  
                  <div className="grid gap-6">
                    {/* Product Understanding Section */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold text-blue-700 mb-3">Product Understanding</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Product Name:</label>
                          <Input
                            value={editingInfo.productName}
                            onChange={(e) => setEditingInfo({...editingInfo, productName: e.target.value})}
                            placeholder="Enter product name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Core Problem:</label>
                          <Textarea
                            value={editingInfo.coreProblem}
                            onChange={(e) => setEditingInfo({...editingInfo, coreProblem: e.target.value})}
                            placeholder="What core problem does this product solve?"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Key Features (comma-separated):</label>
                          <Textarea
                            value={editingInfo.keyFeatures.join(', ')}
                            onChange={(e) => setEditingInfo({...editingInfo, keyFeatures: e.target.value.split(',').map(f => f.trim()).filter(f => f)})}
                            placeholder="Feature 1, Feature 2, Feature 3"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Differentiators:</label>
                          <Textarea
                            value={editingInfo.differentiators}
                            onChange={(e) => setEditingInfo({...editingInfo, differentiators: e.target.value})}
                            placeholder="What makes this product different or better than alternatives?"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Success Stories:</label>
                          <Textarea
                            value={editingInfo.successStories}
                            onChange={(e) => setEditingInfo({...editingInfo, successStories: e.target.value})}
                            placeholder="Notable success stories, metrics, or case studies"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Target Audience Section */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold text-purple-700 mb-3">Target Audience</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Ideal Customer:</label>
                          <Textarea
                            value={editingInfo.idealCustomer}
                            onChange={(e) => setEditingInfo({...editingInfo, idealCustomer: e.target.value})}
                            placeholder="Title, company type, industry, etc."
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Customer Challenges:</label>
                          <Textarea
                            value={editingInfo.customerChallenges}
                            onChange={(e) => setEditingInfo({...editingInfo, customerChallenges: e.target.value})}
                            placeholder="Top challenges, goals, or pain points"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Product Solution:</label>
                          <Textarea
                            value={editingInfo.productSolution}
                            onChange={(e) => setEditingInfo({...editingInfo, productSolution: e.target.value})}
                            placeholder="How does this product directly address those challenges?"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Likely Objections:</label>
                          <Textarea
                            value={editingInfo.objections}
                            onChange={(e) => setEditingInfo({...editingInfo, objections: e.target.value})}
                            placeholder="What objections or hesitations might they have?"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button onClick={() => { setProductInfo(editingInfo); setStep('review'); }} className="bg-blue-600 hover:bg-blue-700">
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setStep('review')}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              
              {step === 'edit-strategy' && editingStrategy && (
                <div className="bg-purple-50 p-6 rounded-lg border animate-fade-in">
                  <h3 className="font-semibold mb-4 text-purple-800 text-lg">Edit Pitch Strategy</h3>
                  
                  <div className="grid gap-6">
                    {/* Talk Tracks Section */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold text-blue-700 mb-3">Talk Tracks</h4>
                      <div className="space-y-3">
                        {editingStrategy.talkTracks.map((track, index) => (
                          <div key={index}>
                            <label className="block text-sm font-medium mb-1">Talk Track {index + 1}:</label>
                            <Textarea
                              value={track}
                              onChange={(e) => {
                                const newTracks = [...editingStrategy.talkTracks];
                                newTracks[index] = e.target.value;
                                setEditingStrategy({...editingStrategy, talkTracks: newTracks});
                              }}
                              placeholder={`Enter talk track ${index + 1}`}
                              rows={4}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Talking Points Section */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold text-purple-700 mb-3">Key Talking Points</h4>
                      <div className="space-y-3">
                        <label className="block text-sm font-medium mb-1">Talking Points (one per line):</label>
                        <Textarea
                          value={editingStrategy.talkingPoints.join('\n')}
                          onChange={(e) => setEditingStrategy({
                            ...editingStrategy, 
                            talkingPoints: e.target.value.split('\n').filter(point => point.trim())
                          })}
                          placeholder="Enter talking points, one per line"
                          rows={8}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button onClick={() => { setPitchStrategy(editingStrategy); setStep('strategy'); }} className="bg-purple-600 hover:bg-purple-700">
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setStep('strategy')}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {step === 'edit-objections' && editingObjections && (
                <div className="bg-green-50 p-6 rounded-lg border animate-fade-in">
                  <h3 className="font-semibold mb-4 text-green-800 text-lg">Edit Objection Handling Tactics</h3>
                  
                  <div className="grid gap-6">
                    {editingObjections.map((objection, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border">
                        <h4 className="font-semibold text-green-700 mb-3">Objection {index + 1}</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Objection:</label>
                            <Input
                              value={objection.objection}
                              onChange={(e) => {
                                const newObjections = [...editingObjections];
                                newObjections[index] = {...newObjections[index], objection: e.target.value};
                                setEditingObjections(newObjections);
                              }}
                              placeholder="Enter the objection"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Handling Strategy:</label>
                            <Textarea
                              value={objection.strategy}
                              onChange={(e) => {
                                const newObjections = [...editingObjections];
                                newObjections[index] = {...newObjections[index], strategy: e.target.value};
                                setEditingObjections(newObjections);
                              }}
                              placeholder="Acknowledge → Reframe → Next Step"
                              rows={2}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Talk Tracks (one per line):</label>
                            <Textarea
                              value={objection.talkTracks.join('\n')}
                              onChange={(e) => {
                                const newObjections = [...editingObjections];
                                newObjections[index] = {
                                  ...newObjections[index], 
                                  talkTracks: e.target.value.split('\n').filter(track => track.trim())
                                };
                                setEditingObjections(newObjections);
                              }}
                              placeholder="Enter talk tracks, one per line"
                              rows={4}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button onClick={() => { setObjectionHandling(editingObjections); setStep('objections'); }} className="bg-green-600 hover:bg-green-700">
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setStep('objections')}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {step === 'complete' && pitchStrategy && (
                <PitchDisplay strategy={pitchStrategy} onDownload={downloadStrategy} />
              )}
              
            <div ref={messagesEndRef} />
            </div>
            
            {step === 'input' && (
              <div className="border-t p-4">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Input
                      placeholder="Enter website URL (e.g., https://example.com)"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                      className="w-full"
                    />
                    
                    <div className="text-center text-gray-500">and/or</div>
                    
                    <FileUpload onFileUpload={handleFileUpload} />
                    
                    {uploadedFile && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <FileText className="w-4 h-4 inline mr-2" />
                        Selected: {uploadedFile.name}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!userInput.trim() && !uploadedFile}
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Analyze & Generate Pitch
                  </Button>
                </div>
              </div>
            )}

            {step === 'review' && (
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tell me what changes you'd like to make to the information..."
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleFeedbackSubmit()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleFeedbackSubmit} 
                    disabled={!feedbackInput.trim() || isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Update
                  </Button>
                </div>
              </div>
            )}

            {step === 'strategy' && (
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tell me how to improve the pitch strategy..."
                    value={strategyFeedbackInput}
                    onChange={(e) => setStrategyFeedbackInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleStrategyFeedbackSubmit()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleStrategyFeedbackSubmit} 
                    disabled={!strategyFeedbackInput.trim() || isLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Improve
                  </Button>
                </div>
              </div>
            )}

            {step === 'objections' && (
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tell me how to improve the objection handling tactics..."
                    value={objectionsFeedbackInput}
                    onChange={(e) => setObjectionsFeedbackInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleObjectionsFeedbackSubmit()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleObjectionsFeedbackSubmit} 
                    disabled={!objectionsFeedbackInput.trim() || isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Improve
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
