
import { useState, useRef, useEffect } from "react";
import { Send, Upload, Globe, FileText, Download, Edit, Check } from "lucide-react";
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

export interface PitchStrategy {
  talkTracks: string[];
  talkingPoints: string[];
}

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

type Step = 'input' | 'processing' | 'review' | 'edit' | 'generate' | 'complete';

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
  const [isLoading, setIsLoading] = useState(false);
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
    
    // Simulate processing delay
    setTimeout(() => {
      const mockProductInfo: ProductInfo = {
        website: userInput.trim() || 'uploaded-document.pdf',
        productName: "AI Sales Assistant",
        coreProblem: "Sales teams struggle to create personalized, effective pitch strategies quickly and consistently",
        keyFeatures: [
          "Automated pitch generation",
          "Customer insight analysis", 
          "Multi-channel outreach templates",
          "Performance tracking and optimization"
        ],
        differentiators: "Uses advanced AI to analyze customer data and generate personalized pitches in seconds, not hours",
        successStories: "Increased conversion rates by 45% for tech companies, reduced pitch prep time by 80%",
        idealCustomer: "Sales directors and managers at B2B companies with 50-500 employees",
        customerChallenges: "Time-consuming pitch preparation, inconsistent messaging across team, difficulty personalizing at scale",
        productSolution: "Automates pitch creation with AI-driven personalization based on prospect data and industry insights",
        objections: "Concerns about AI replacing human touch, integration complexity, ROI timeline"
      };

      setProductInfo(mockProductInfo);
      setEditingInfo(mockProductInfo);
      setStep('review');
      setIsLoading(false);
      setUserInput('');
      setUploadedFile(null);
      
      addMessage('bot', "Great! I've analyzed your product information. Here's what I found:");
    }, 2000);
  };

  const confirmInformation = () => {
    setProductInfo(editingInfo);
    setStep('generate');
    addMessage('user', "Information confirmed - ready to generate pitch strategy");
    generatePitchStrategy();
  };

  const generatePitchStrategy = () => {
    setIsLoading(true);
    addMessage('bot', "Perfect! Now I'll generate your personalized pitch strategy...");
    
    setTimeout(() => {
      const strategy: PitchStrategy = {
        talkTracks: [
          "Hi [Name], I noticed your team at [Company] is in the [Industry] space. I'm reaching out because many sales leaders like yourself are struggling with creating personalized pitches at scale. Our AI Sales Assistant has helped similar companies increase their conversion rates by 45% while cutting pitch prep time by 80%. Would you be open to a quick 15-minute conversation about how this could impact your team's performance?",
          "I was researching [Company] and saw you're focused on [specific goal/challenge]. This caught my attention because we've been working with other [Industry] companies who faced similar challenges around pitch personalization and team consistency. Our AI-powered solution has enabled teams like yours to generate highly personalized pitches in seconds rather than hours. I'd love to share a quick case study of how [Similar Company] achieved a 45% boost in conversions - do you have 10 minutes this week?"
        ],
        talkingPoints: [
          "45% average increase in conversion rates for B2B tech companies",
          "80% reduction in pitch preparation time through AI automation",
          "Ensures consistent messaging across entire sales team",
          "Integrates with existing CRM and sales tools seamlessly",
          "Provides real-time performance analytics and optimization suggestions",
          "Scales personalization efforts without sacrificing quality or human touch"
        ]
      };
      
      setPitchStrategy(strategy);
      setStep('complete');
      setIsLoading(false);
      addMessage('bot', "Your personalized pitch strategy is ready! Here are your custom talk tracks and key talking points:");
    }, 2000);
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

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Dynamic Pitch Builder
          </h1>
          <p className="text-gray-600">AI-powered personalized sales pitch generator</p>
        </div>
        
        <Card className="h-[600px] flex flex-col shadow-lg">
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
            
            {step === 'review' && productInfo && (
              <div className="bg-blue-50 p-4 rounded-lg border animate-fade-in">
                <h3 className="font-semibold mb-3 text-blue-800">Product & Audience Information:</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Product:</strong> {productInfo.productName}</div>
                  <div><strong>Core Problem:</strong> {productInfo.coreProblem}</div>
                  <div><strong>Key Features:</strong> {productInfo.keyFeatures.join(', ')}</div>
                  <div><strong>Differentiators:</strong> {productInfo.differentiators}</div>
                  <div><strong>Ideal Customer:</strong> {productInfo.idealCustomer}</div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={confirmInformation} className="bg-blue-600 hover:bg-blue-700">
                    <Check className="w-4 h-4 mr-2" />
                    Looks Good - Generate Pitch
                  </Button>
                  <Button variant="outline" onClick={() => setStep('edit')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Information
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
        </Card>
      </div>
    </div>
  );
}
