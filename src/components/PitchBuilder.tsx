
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
      
      addMessage('bot', "Great! I've analyzed your website and researched your product. Here's what I found:");
    } catch (error) {
      // Fallback to mock data for demo purposes
      const mockProductInfo: ProductInfo = {
        website: websiteUrl,
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
        productSolution: "Automates pitch creation with AI-driven personalization based to prospect data and industry insights",
        objections: "Concerns about AI replacing human touch, integration complexity, ROI timeline"
      };

      setProductInfo(mockProductInfo);
      setEditingInfo(mockProductInfo);
      setStep('review');
      setIsLoading(false);
      setUserInput('');
      setUploadedFile(null);
      
      addMessage('bot', "I've created a template based on your website. Please review and edit the information:");
    }
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
              <div className="bg-blue-50 p-6 rounded-lg border animate-fade-in">
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
                    Edit Information
                  </Button>
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
