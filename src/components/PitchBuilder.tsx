
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Upload, Globe, FileText, Download, Edit, Check, MessageSquare, ArrowLeft, ArrowRight, Settings, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatMessage } from "./ChatMessage";
import { FileUpload } from "./FileUpload";
import { PitchDisplay } from "./PitchDisplay";
import { EmailCard } from "./EmailCard";
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
  response: string;
  proofPoint: string;
}

export interface PitchStrategy {
  talkTracks: string[];
  talkingPoints: string[];
}

export interface EmailCadenceStep {
  day: string;
  step: string;
  type: string;
  content: string;
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

type Step = 'input' | 'processing' | 'review' | 'edit' | 'generate' | 'strategy' | 'edit-strategy' | 'objections' | 'edit-objections' | 'email-cadence' | 'edit-email-cadence' | 'complete';

interface SystemPrompts {
  pitchStrategy: string;
  objectionHandling: string;
  emailCadence: string;
}

const DEFAULT_SYSTEM_PROMPTS: SystemPrompts = {
  pitchStrategy: `You are an expert sales strategist. Based on the product information provided, create a comprehensive, actionable pitch strategy designed for sales reps to use in live prospect conversations.

Your deliverable should include:

---

### 📞 **Talk Tracks**

Provide **3-5 conversation starters and flow suggestions** that reps can use to open, guide, and advance a discovery or sales call.

* Include examples of open-ended discovery questions to uncover pain points.
* Suggest phrasing for framing the product's value in context of those challenges.
* Incorporate natural ways to introduce success stories, customer proof points, or competitive differentiators.

---

### 🎯 **Talking Points**

List **5-7 clear, high-impact product value propositions** tailored to:

* Address common customer pain points.
* Demonstrate measurable ROI, efficiency gains, or risk reduction.
* Align with the ideal customer profile (ICP) and buying triggers.
* Highlight how your solution is different from or better than alternatives.
* Where relevant, weave in customer success stories or notable results.

---

### 🔍 **Objection Handling Guidance**

List **3-5 anticipated objections** for this product or offer, and provide succinct, confident response suggestions for each, using frameworks like:

* Empathize → Reframe → Evidence → Confirm
* Or
* Feel → Felt → Found

---

### 📧 **Follow-Up CTA Suggestions**

Provide **2-3 strong call-to-action (CTA) ideas** reps can use to close a conversation, including:

* Options for scheduling a follow-up demo or executive briefing.
* Value-driven resources to send.
* Compelling next steps that create a sense of urgency or exclusivity.

---

### ✏️ **Personalization Levers (Optional)**

List **3-5 variables** a rep can personalize in their pitch based on research (e.g., recent company initiatives, job role priorities, competitor tech stack, etc.) to make the pitch feel tailored and relevant.

---

**Tone:**

* Conversational, consultative, confident — avoid jargon and buzzwords.
* Prioritize clarity, brevity, and actionable phrasing a sales rep can use immediately in conversation.

**Output Format:**
Use clean, clear section headers for each deliverable component. Bullet points or numbered lists preferred.`,

  objectionHandling: `You are a seasoned enterprise sales objection handling strategist. Based on the product information and common sales scenarios, create **specific, actionable objection handling tactics** that sales reps can confidently use in live conversations.

For each likely objection, provide:

---

### 1️⃣ **Objection Statement**

A clear, commonly heard customer concern or hesitation related to:

* Price/Budget
* Competitor comparison
* Implementation complexity
* ROI or value clarity
* Timing or priority conflicts
  *(Feel free to add additional objections if relevant to the product.)*

---

### 2️⃣ **Strategic Response**

A thoughtful, empathetic, and practical response designed to:

* Acknowledge the concern
* Reframe the conversation or assumption
* Provide relevant data, context, or success stories
* De-risk the decision or perception of risk
* Offer social proof or third-party validation
  Use objection-handling frameworks like:
* **Feel-Felt-Found**
* **Empathize → Reframe → Evidence → Confirm**
* Or other consultative techniques

---

### 3️⃣ **Proof Points / Evidence**

Provide **tangible supporting evidence** for each response. This could include:

* ROI metrics
* Case study examples
* Client logos
* Industry benchmarks
* Analyst validation or awards
* Competitive differentiators

---

### 4️⃣ **Next-Step CTA Suggestion**

Include a **natural, momentum-building next step** the sales rep can propose after addressing the objection, to move the conversation forward.
For example:

* "Would it be helpful if I shared a case study of a similar customer who saw [outcome]?"
* "Let's schedule a follow-up session with our solutions engineer to unpack implementation specifics."
* "If budget's a concern now, would you be open to scoping a phased rollout?"

---

**Tone:**

* Empathetic, consultative, and confidence-inspiring — avoid sounding defensive or overly scripted.
* Keep phrasing natural, realistic, and appropriate for enterprise sales conversations.

**Output Format:**
Use clear section headers for each objection tactic. Number or bullet them for easy reference.

---

**Optional Enhancement:**
If relevant, identify **2-3 proactive preemptive objection handling tactics** a rep can use early in the conversation to mitigate these objections before they surface.`,

  emailCadence: `You are an expert in modern B2B email sales sequencing. Based on the product information and target audience, create a **strategic, relationship-driven 16-day email cadence** that nurtures prospects effectively while moving them toward a meaningful next step.

For each email in the sequence, provide:

---

### 📅 **Day Number & Step Name**

Specify when the email is sent (e.g., **Day 1: Warm Introduction**) and its role in the overall sequence.

---

### ✉️ **Email Type**

Define the type of email (e.g., Introduction, Value-Add Insight, Case Study, Pain Point Exploration, Social Proof, Nurture Check-in, Final Follow-up).

---

### 📝 **Subject Line**

Suggest a **brief, curiosity-driving, and relevant subject line** for each email.

---

### 📩 **Email Body Content**

Write **brief, clear, and highly scannable email copy** that includes:

* A **personalized opening line** based on available prospect context (industry, job role, recent event, or relevant challenge).
* 1–2 concise sentences framing the value of the email.
* A **tangible value-add, insight, or social proof element** (e.g., stat, case study link, article, or unique perspective).
* A **clear and natural call-to-action (CTA)** to either book time, share feedback, or engage with content.
  Use varied CTAs throughout the cadence (not just "book a meeting") such as:
* "Would you be open to a quick brainstorm?"
* "I'd love to hear how you're approaching [challenge]."
* "Would it be helpful if I sent over a quick case study on [X]?"

---

### 🛠️ **Personalization Variables**

Indicate where a rep could optionally personalize based on:

* Prospect's job title/role
* Company size or industry
* Recent company news or initiatives
* Shared connections or mutual interests
* Relevant pain points for their segment

---

### 📈 **Sequence Guidelines:**

Ensure the cadence:

* Starts with a warm, value-led introduction
* Provides a new insight, resource, or point of value in every touch
* Incorporates social proof (client logos, case studies, stats) by Day 4–7
* Varies CTA types (book meeting, resource offer, question-based asks)
* Addresses different likely pain points or business objectives across the sequence
* Is human, authentic, brief (max 5 sentences per email), and never overly "salesy"

---

**Tone:**
Conversational, consultative, and value-driven — like a helpful peer reaching out, not a pitch-heavy salesperson.

**Output Format:**
Use clear section headers for each email:

* **Day X | Step Name**
* **Type:**
* **Subject Line:**
* **Email Body:**
* **Personalization Ideas (optional):**`
};

export function PitchBuilder() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pitch-builder');
  const [step, setStep] = useState<Step>('input');
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompts>(DEFAULT_SYSTEM_PROMPTS);
  const [editingPrompts, setEditingPrompts] = useState<SystemPrompts>(DEFAULT_SYSTEM_PROMPTS);
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
  const [emailCadence, setEmailCadence] = useState<EmailCadenceStep[] | null>(null);
  const [editingEmailCadence, setEditingEmailCadence] = useState<EmailCadenceStep[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [strategyFeedbackInput, setStrategyFeedbackInput] = useState('');
  const [objectionsFeedbackInput, setObjectionsFeedbackInput] = useState('');
  const [emailCadenceFeedbackInput, setEmailCadenceFeedbackInput] = useState('');
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const [promptStrengths, setPromptStrengths] = useState<{[key: string]: number}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Calculate initial prompt strengths when component mounts or text changes
  useEffect(() => {
    if (userInput.trim()) {
      updatePromptStrength(userInput, 'website', 'website');
    }
    if (feedbackInput.trim()) {
      updatePromptStrength(feedbackInput, 'feedback-review', 'feedback');
    }
    if (strategyFeedbackInput.trim()) {
      updatePromptStrength(strategyFeedbackInput, 'feedback-strategy', 'feedback');
    }
    if (objectionsFeedbackInput.trim()) {
      updatePromptStrength(objectionsFeedbackInput, 'feedback-objections', 'feedback');
    }
    if (emailCadenceFeedbackInput.trim()) {
      updatePromptStrength(emailCadenceFeedbackInput, 'feedback-email', 'feedback');
    }
  }, [userInput, feedbackInput, strategyFeedbackInput, objectionsFeedbackInput, emailCadenceFeedbackInput]);

  // Calculate system prompt strengths when they change
  useEffect(() => {
    updatePromptStrength(editingPrompts.pitchStrategy, 'system-pitch', 'systemPrompt');
    updatePromptStrength(editingPrompts.objectionHandling, 'system-objection', 'systemPrompt');
    updatePromptStrength(editingPrompts.emailCadence, 'system-email', 'systemPrompt');
  }, [editingPrompts]);

  const addMessage = (type: 'bot' | 'user', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const saveSystemPrompts = () => {
    setSystemPrompts(editingPrompts);
    // Update the default prompts to make the current prompts the new defaults
    Object.assign(DEFAULT_SYSTEM_PROMPTS, editingPrompts);
    toast.success("System prompts saved as new defaults!");
  };

  const resetSystemPrompts = () => {
    setEditingPrompts(DEFAULT_SYSTEM_PROMPTS);
    toast.success("System prompts reset to defaults!");
  };

  const improvePromptWithAI = async (currentText: string, fieldType: string, context?: string, setter?: (value: string) => void) => {
    if (!currentText.trim()) {
      toast.error("Please enter some text first.");
      return;
    }

    setIsImprovingPrompt(true);
    
    try {
      const response = await fetch('https://vjcecvadjbeiolcqsyof.supabase.co/functions/v1/improve-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY2VjdmFkamJlaW9sY3FzeW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDY2MjcsImV4cCI6MjA2NzU4MjYyN30.lpyOBQqgYxzaqnFRzaR1ZoZsuusTJDC9tcbKb4IR24I`,
        },
        body: JSON.stringify({ 
          prompt: currentText,
          fieldType,
          context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to improve prompt');
      }

      const data = await response.json();
      if (setter) {
        setter(data.improvedPrompt);
      }
      toast.success("Prompt improved with AI!");
    } catch (error) {
      console.error('Error improving prompt:', error);
      toast.error("Failed to improve prompt. Please try again.");
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  const evaluatePromptStrength = (text: string, fieldType: string): number => {
    if (!text.trim()) return 0;
    
    let score = 0;
    const length = text.trim().length;
    
    // Base score for length
    if (length > 10) score += 20;
    if (length > 50) score += 20;
    if (length > 100) score += 10;
    
    // Check for specific words that indicate good prompts
    const qualityWords = ['specific', 'detailed', 'improve', 'better', 'enhance', 'optimize', 'professional', 'clear', 'effective'];
    const questionWords = ['how', 'what', 'why', 'when', 'where', 'which'];
    const actionWords = ['make', 'create', 'generate', 'build', 'develop', 'design'];
    
    qualityWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score += 5;
    });
    
    questionWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score += 3;
    });
    
    actionWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score += 4;
    });
    
    // Field-specific scoring
    if (fieldType === 'feedback') {
      if (text.toLowerCase().includes('change')) score += 8;
      if (text.toLowerCase().includes('modify')) score += 8;
      if (text.toLowerCase().includes('add')) score += 6;
      if (text.toLowerCase().includes('remove')) score += 6;
    }
    
    if (fieldType === 'website') {
      if (text.includes('http')) score += 15;
      if (text.includes('.com') || text.includes('.org') || text.includes('.net')) score += 10;
    }
    
    if (fieldType === 'systemPrompt') {
      if (text.toLowerCase().includes('expert')) score += 8;
      if (text.toLowerCase().includes('instructions')) score += 6;
      if (text.toLowerCase().includes('example')) score += 6;
    }
    
    // Penalty for too short or generic text
    if (length < 20) score -= 10;
    if (text.toLowerCase() === text && length > 10) score += 5; // Mixed case suggests more thought
    
    return Math.min(Math.max(score, 0), 100);
  };

  const getStrengthColor = (strength: number): string => {
    if (strength >= 80) return 'text-green-600 bg-green-100';
    if (strength >= 60) return 'text-yellow-600 bg-yellow-100';
    if (strength >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getStrengthLabel = (strength: number): string => {
    if (strength >= 80) return 'Excellent';
    if (strength >= 60) return 'Good';
    if (strength >= 40) return 'Fair';
    if (strength >= 20) return 'Weak';
    return 'Poor';
  };

  const updatePromptStrength = (text: string, fieldKey: string, fieldType: string) => {
    const strength = evaluatePromptStrength(text, fieldType);
    setPromptStrengths(prev => ({ ...prev, [fieldKey]: strength }));
  };

  const PromptStrengthIndicator = ({ strength, fieldKey }: { strength: number; fieldKey: string }) => (
    <></>
  );

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

  const handleEmailCadenceFeedbackSubmit = async () => {
    if (!emailCadenceFeedbackInput.trim() || !emailCadence || !productInfo) {
      toast.error("Please enter your feedback.");
      return;
    }

    setIsLoading(true);
    const feedbackMessage = emailCadenceFeedbackInput;
    setEmailCadenceFeedbackInput('');
    
    addMessage('user', feedbackMessage);
    addMessage('bot', "Processing your feedback and improving the email cadence...");
    
    try {
      const response = await fetch('https://vjcecvadjbeiolcqsyof.supabase.co/functions/v1/generate-email-cadence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY2VjdmFkamJlaW9sY3FzeW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDY2MjcsImV4cCI6MjA2NzU4MjYyN30.lpyOBQqgYxzaqnFRzaR1ZoZsuusTJDC9tcbKb4IR24I`,
        },
        body: JSON.stringify({ 
          feedback: feedbackMessage,
          currentEmailCadence: emailCadence,
          productInfo,
          pitchStrategy,
          objectionHandling
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to improve email cadence');
      }

      const improvedEmailCadence = await response.json();
      setEmailCadence(improvedEmailCadence.emailCadence);
      setEditingEmailCadence(improvedEmailCadence.emailCadence);
      setIsLoading(false);
      
      addMessage('bot', "Perfect! I've improved the email cadence based on your feedback. You can see the changes reflected above.");
    } catch (error) {
      console.error('Error improving email cadence:', error);
      setIsLoading(false);
      addMessage('bot', "I had trouble processing your feedback. Please try again.");
    }
  };

  const generateEmailCadence = async () => {
    if (!pitchStrategy || !productInfo) return;
    
    setIsLoading(true);
    setStep('email-cadence');
    addMessage('user', "Generate email cadence - creating email sequence");
    addMessage('bot', "Perfect! Now I'll generate a comprehensive 16-day email cadence using GPT-4o...");
    
    try {
      const response = await fetch('https://vjcecvadjbeiolcqsyof.supabase.co/functions/v1/generate-email-cadence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqY2VjdmFkamJlaW9sY3FzeW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDY2MjcsImV4cCI6MjA2NzU4MjYyN30.lpyOBQqgYxzaqnFRzaR1ZoZsuusTJDC9tcbKb4IR24I`,
        },
        body: JSON.stringify({ 
          productInfo,
          pitchStrategy,
          objectionHandling
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate email cadence');
      }

      const data = await response.json();
      setEmailCadence(data.emailCadence);
      setEditingEmailCadence(data.emailCadence);
      setIsLoading(false);
      addMessage('bot', "Your email cadence is ready! Review the 16-day sequence with ready-to-use email copy above:");
    } catch (error) {
      console.error('Error generating email cadence:', error);
      setIsLoading(false);
      addMessage('bot', "I had trouble generating the email cadence. Please try again.");
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

  const downloadCompletePitch = () => {
    if (!productInfo || !pitchStrategy || !objectionHandling || !emailCadence) return;
    
    const content = `
COMPLETE PITCH STRATEGY FOR ${productInfo.productName.toUpperCase()}
Generated by Dynamic Pitch Builder

===============================================================================
PRODUCT INFORMATION & TARGET BUYER
===============================================================================

Product Name: ${productInfo.productName}

Core Problem:
${productInfo.coreProblem}

Key Features:
${productInfo.keyFeatures.map(feature => `• ${feature}`).join('\n')}

Differentiators:
${productInfo.differentiators}

Ideal Customer:
${productInfo.idealCustomer}

Customer Challenges:
${productInfo.customerChallenges}

Product Solution:
${productInfo.productSolution}

Success Stories:
${productInfo.successStories}

===============================================================================
PITCH STRATEGY
===============================================================================

SAMPLE TALK TRACKS:

Talk Track 1:
${pitchStrategy.talkTracks[0]}

Talk Track 2:
${pitchStrategy.talkTracks[1]}

KEY TALKING POINTS:
${pitchStrategy.talkingPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

===============================================================================
OBJECTION HANDLING TACTICS
===============================================================================

${objectionHandling.map((objection, index) => `
OBJECTION ${index + 1}: ${objection.objection}

RESPONSE:
${objection.response}

PROOF POINT:
${objection.proofPoint}
`).join('\n')}

===============================================================================
EMAIL CADENCE (16-DAY SEQUENCE)
===============================================================================

${emailCadence.map(step => `
${step.day} | ${step.step} | ${step.type}
${step.content}
`).join('\n')}

===============================================================================
Generated by Dynamic Pitch Builder
===============================================================================
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productInfo.productName.replace(/\s+/g, '_')}_Complete_Pitch_Strategy.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Complete pitch strategy downloaded successfully!");
  };

  const viewCompleteStrategy = () => {
    if (!productInfo || !pitchStrategy || !objectionHandling || !emailCadence) {
      toast.error("Complete strategy data is not available");
      return;
    }

    const pitchData = {
      productInfo,
      pitchStrategy, 
      objectionHandling,
      emailCadence
    };

    // Store in localStorage as backup
    localStorage.setItem('completePitchStrategy', JSON.stringify(pitchData));
    
    // Navigate to standalone page with data
    navigate('/pitch-strategy', { state: { pitchData } });
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
      case 'email-cadence':
        setStep('objections');
        break;
      case 'edit-email-cadence':
        setStep('email-cadence');
        break;
      case 'complete':
        setStep('email-cadence');
        break;
      default:
        break;
    }
  };

  const goNext = () => {
    switch (step) {
      case 'review':
        if (productInfo) {
          confirmInformation();
        }
        break;
      case 'strategy':
        if (pitchStrategy && productInfo) {
          generateObjectionHandling();
        }
        break;
      case 'objections':
        if (objectionHandling) {
          setStep('email-cadence');
          if (!emailCadence) {
            generateEmailCadence();
          }
        }
        break;
      case 'email-cadence':
        setStep('complete');
        break;
      default:
        break;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="w-full flex flex-col h-full px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pitch-builder">Pitch Builder</TabsTrigger>
            <TabsTrigger value="system-prompts" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              System Prompts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pitch-builder">
            <div className="text-center mb-4 relative">
          {/* Back button for steps that support going back */}
          {['review', 'edit', 'strategy', 'edit-strategy', 'objections', 'edit-objections', 'email-cadence', 'edit-email-cadence', 'complete'].includes(step) && (
            <div className="absolute left-0 top-0 flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={goBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              {['review', 'strategy', 'objections', 'email-cadence'].includes(step) && (
                <Button 
                  variant="outline" 
                  onClick={goNext}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Dynamic Pitch Builder
          </h1>
          <p className="text-gray-600">AI-powered personalized sales pitch generator</p>
        </div>
        
        <div className="flex-1 flex gap-6 overflow-hidden">
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
                </div>
                
                <div className="bg-white rounded-lg border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-700 border-b">Likely Objection</th>
                        <th className="text-left p-3 font-semibold text-gray-700 border-b">Suggested Response</th>
                        <th className="text-left p-3 font-semibold text-gray-700 border-b">Supporting Proof Point</th>
                      </tr>
                    </thead>
                    <tbody>
                      {objectionHandling.map((objection, index) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="p-3 text-sm text-gray-800 font-medium vertical-align-top">
                            {objection.objection}
                          </td>
                          <td className="p-3 text-sm text-gray-700 vertical-align-top">
                            {objection.response}
                          </td>
                          <td className="p-3 text-sm text-gray-700 vertical-align-top">
                            {objection.proofPoint}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button onClick={generateEmailCadence} className="bg-orange-600 hover:bg-orange-700">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Generate Email Cadence
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
                    Create Objection Handling Tactics
                  </Button>
                  <Button variant="outline" onClick={() => setStep('edit-strategy')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Directly
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Left side - Editable Pitch Strategy (when in edit-strategy step) */}
          {step === 'edit-strategy' && editingStrategy && (
            <div className="w-1/2 flex flex-col">
              <div className="bg-purple-50 p-6 rounded-lg border flex-1 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-purple-800 text-lg">Edit Pitch Strategy</h3>
                  <div className="flex gap-2">
                    <Button onClick={() => { setPitchStrategy(editingStrategy); setStep('strategy'); }} className="bg-purple-600 hover:bg-purple-700">
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setStep('strategy')}>
                      Cancel
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Talk Tracks Section */}
                  <div>
                    <h4 className="font-semibold text-lg mb-3 text-blue-700">Talk Tracks</h4>
                    {editingStrategy.talkTracks.map((track, index) => (
                      <Card key={index} className="p-4 mb-3 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            Talk Track {index + 1}
                          </Badge>
                        </div>
                        <Textarea
                          value={track}
                          onChange={(e) => {
                            const newTracks = [...editingStrategy.talkTracks];
                            newTracks[index] = e.target.value;
                            setEditingStrategy({...editingStrategy, talkTracks: newTracks});
                          }}
                          placeholder={`Enter talk track ${index + 1}`}
                          rows={4}
                          className="w-full border-none resize-none focus:ring-0 p-0 text-gray-700 leading-relaxed"
                        />
                      </Card>
                    ))}
                  </div>
                  
                  {/* Talking Points Section */}
                  <div>
                    <h4 className="font-semibold text-lg mb-3 text-purple-700">Key Talking Points</h4>
                    <Card className="p-4 bg-white">
                      <div className="mb-3">
                        <Badge variant="outline" className="text-purple-600 border-purple-300">
                          Talking Points
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {editingStrategy.talkingPoints.map((point, index) => (
                          <div key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            <Input
                              value={point}
                              onChange={(e) => {
                                const newPoints = [...editingStrategy.talkingPoints];
                                newPoints[index] = e.target.value;
                                setEditingStrategy({...editingStrategy, talkingPoints: newPoints});
                              }}
                              className="border-none focus:ring-0 p-0 text-gray-700"
                              placeholder={`Talking point ${index + 1}`}
                            />
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingStrategy({
                              ...editingStrategy,
                              talkingPoints: [...editingStrategy.talkingPoints, ""]
                            });
                          }}
                          className="mt-2 text-purple-600 border-purple-300 hover:bg-purple-50"
                        >
                          Add Talking Point
                        </Button>
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
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Left side - Email Cadence Display (when in email-cadence step) */}
          {step === 'email-cadence' && emailCadence && (
            <div className="w-1/2 flex flex-col">
              <div className="bg-orange-50 p-6 rounded-lg border flex-1 overflow-y-auto">
                <div className="mb-6">
                  <h3 className="font-semibold text-orange-800 text-xl mb-2">16-Day Email Cadence</h3>
                  <p className="text-orange-700 text-sm">A strategic sequence of touchpoints to build relationships and drive engagement</p>
                </div>
                
                <div className="space-y-4">
                  {emailCadence.map((emailStep, index) => (
                    <EmailCard 
                      key={index} 
                      email={emailStep} 
                      index={index}
                    />
                  ))}
                </div>

                <div className="flex gap-2 mt-6 pt-4 border-t border-orange-200">
                  <Button onClick={() => setStep('complete')} className="bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4 mr-2" />
                    Finalize Pitch
                  </Button>
                  <Button variant="outline" onClick={() => setStep('edit-email-cadence')}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Directly
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Right side - Chat Interface */}
          <Card className={`${(step === 'review' || step === 'strategy' || step === 'edit-strategy' || step === 'objections' || step === 'edit-objections' || step === 'email-cadence' || step === 'edit-email-cadence') ? 'w-1/2' : 'w-full'} flex flex-col shadow-lg`}>
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
                            className="h-10 text-base"
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

              {step === 'edit-email-cadence' && editingEmailCadence && (
                <div className="bg-orange-50 p-6 rounded-lg border animate-fade-in">
                  <h3 className="font-semibold mb-4 text-orange-800 text-lg">Edit Email Cadence</h3>
                  
                  <div className="space-y-4">
                    {editingEmailCadence.map((cadenceStep, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border">
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Day:</label>
                            <Input
                              value={cadenceStep.day}
                              onChange={(e) => {
                                const newCadence = [...editingEmailCadence];
                                newCadence[index] = { ...newCadence[index], day: e.target.value };
                                setEditingEmailCadence(newCadence);
                              }}
                              placeholder="Day 1"
                              className="h-10 text-base"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Step:</label>
                            <Input
                              value={cadenceStep.step}
                              onChange={(e) => {
                                const newCadence = [...editingEmailCadence];
                                newCadence[index] = { ...newCadence[index], step: e.target.value };
                                setEditingEmailCadence(newCadence);
                              }}
                              placeholder="Step 1"
                              className="h-10 text-base"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Type:</label>
                            <Input
                              value={cadenceStep.type}
                              onChange={(e) => {
                                const newCadence = [...editingEmailCadence];
                                newCadence[index] = { ...newCadence[index], type: e.target.value };
                                setEditingEmailCadence(newCadence);
                              }}
                              placeholder="Email #1 with POV"
                              className="h-10 text-base"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Content:</label>
                          <Textarea
                            value={cadenceStep.content}
                            onChange={(e) => {
                              const newCadence = [...editingEmailCadence];
                              newCadence[index] = { ...newCadence[index], content: e.target.value };
                              setEditingEmailCadence(newCadence);
                            }}
                            placeholder="Enter touchpoint content or notes"
                            rows={3}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button onClick={() => { setEmailCadence(editingEmailCadence); setStep('email-cadence'); }} className="bg-orange-600 hover:bg-orange-700">
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setStep('email-cadence')}>
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
                              className="h-10 text-base"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Suggested Response:</label>
                            <Textarea
                              value={objection.response}
                              onChange={(e) => {
                                const newObjections = [...editingObjections];
                                newObjections[index] = {...newObjections[index], response: e.target.value};
                                setEditingObjections(newObjections);
                              }}
                              placeholder="Enter the suggested response"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Supporting Proof Point:</label>
                            <Textarea
                              value={objection.proofPoint}
                              onChange={(e) => {
                                const newObjections = [...editingObjections];
                                newObjections[index] = {
                                  ...newObjections[index], 
                                  proofPoint: e.target.value
                                };
                                setEditingObjections(newObjections);
                              }}
                              placeholder="Enter supporting proof point, metric, or value proposition"
                              rows={2}
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

              {step === 'complete' && productInfo && pitchStrategy && objectionHandling && emailCadence && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-2xl text-gray-800">Complete Pitch Strategy</h3>
                    <div className="flex gap-2">
                      <Button onClick={viewCompleteStrategy} variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Full Page
                      </Button>
                      <Button onClick={downloadCompletePitch} className="bg-green-600 hover:bg-green-700">
                        <Download className="w-4 h-4 mr-2" />
                        Download Complete Strategy
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Product Information Section */}
                    <div className="bg-white p-6 rounded-lg border">
                      <h4 className="font-semibold text-lg text-blue-800 mb-4">Product Information & Target Buyer</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-medium text-gray-700 mb-1">Product Name:</h5>
                            <p className="text-gray-600">{productInfo.productName}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-700 mb-1">Core Problem:</h5>
                            <p className="text-gray-600">{productInfo.coreProblem}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-700 mb-1">Key Features:</h5>
                            <ul className="list-disc list-inside text-gray-600 space-y-1">
                              {productInfo.keyFeatures.map((feature, index) => (
                                <li key={index}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-700 mb-1">Differentiators:</h5>
                            <p className="text-gray-600">{productInfo.differentiators}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-medium text-gray-700 mb-1">Ideal Customer:</h5>
                            <p className="text-gray-600">{productInfo.idealCustomer}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-700 mb-1">Customer Challenges:</h5>
                            <p className="text-gray-600">{productInfo.customerChallenges}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-700 mb-1">Product Solution:</h5>
                            <p className="text-gray-600">{productInfo.productSolution}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-700 mb-1">Success Stories:</h5>
                            <p className="text-gray-600">{productInfo.successStories}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pitch Strategy Section */}
                    <div className="bg-white p-6 rounded-lg border">
                      <h4 className="font-semibold text-lg text-purple-800 mb-4">Pitch Strategy</h4>
                      <div className="space-y-6">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-3">Sample Talk Tracks:</h5>
                          <div className="space-y-4">
                            {pitchStrategy.talkTracks.map((track, index) => (
                              <div key={index} className="bg-purple-50 p-4 rounded-lg">
                                <h6 className="font-medium text-purple-700 mb-2">Talk Track {index + 1}:</h6>
                                <p className="text-gray-700 whitespace-pre-wrap">{track}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-3">Key Talking Points:</h5>
                          <ul className="list-disc list-inside space-y-2">
                            {pitchStrategy.talkingPoints.map((point, index) => (
                              <li key={index} className="text-gray-600">{point}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Objection Handling Section */}
                    <div className="bg-white p-6 rounded-lg border">
                      <h4 className="font-semibold text-lg text-green-800 mb-4">Objection Handling Tactics</h4>
                      <div className="space-y-4">
                        {objectionHandling.map((objection, index) => (
                          <div key={index} className="bg-green-50 p-4 rounded-lg">
                            <h5 className="font-medium text-green-700 mb-2">Objection: {objection.objection}</h5>
                            <p className="text-gray-700 mb-2"><strong>Response:</strong> {objection.response}</p>
                            <p className="text-gray-600"><strong>Proof Point:</strong> {objection.proofPoint}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Email Cadence Section */}
                    <div className="bg-white p-6 rounded-lg border">
                      <h4 className="font-semibold text-lg text-orange-800 mb-4">Email Cadence</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left p-3 font-semibold text-gray-700 border-b">Day</th>
                              <th className="text-left p-3 font-semibold text-gray-700 border-b">Step</th>
                              <th className="text-left p-3 font-semibold text-gray-700 border-b">Type</th>
                              <th className="text-left p-3 font-semibold text-gray-700 border-b">Content</th>
                            </tr>
                          </thead>
                          <tbody>
                            {emailCadence.map((step, index) => (
                              <tr key={index} className="border-b last:border-b-0">
                                <td className="p-3 text-sm text-gray-800 font-medium">{step.day}</td>
                                <td className="p-3 text-sm text-gray-800 font-medium">{step.step}</td>
                                <td className="p-3 text-sm text-gray-700">{step.type}</td>
                                <td className="p-3 text-sm text-gray-700 whitespace-pre-wrap">{step.content}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
            <div ref={messagesEndRef} />
            </div>
            
            {step === 'input' && (
              <div className="border-t p-4">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter website URL (e.g., https://example.com)"
                        value={userInput}
                        onChange={(e) => {
                          setUserInput(e.target.value);
                          updatePromptStrength(e.target.value, 'website', 'website');
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                        className="w-full h-12 text-base"
                      />
                    </div>
                    {userInput.trim() && (
                      <div className="flex justify-end">
                        <PromptStrengthIndicator strength={promptStrengths['website'] || 0} fieldKey="website" />
                      </div>
                    )}
                    
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
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tell me what changes you'd like to make to the information..."
                      value={feedbackInput}
                      onChange={(e) => {
                        setFeedbackInput(e.target.value);
                        updatePromptStrength(e.target.value, 'feedback-review', 'feedback');
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleFeedbackSubmit()}
                      className="flex-1 h-12 text-base"
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
                  {feedbackInput.trim() && (
                    <div className="flex justify-end">
                      <PromptStrengthIndicator strength={promptStrengths['feedback-review'] || 0} fieldKey="feedback-review" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 'strategy' && (
              <div className="border-t p-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tell me how to improve the pitch strategy..."
                      value={strategyFeedbackInput}
                      onChange={(e) => {
                        setStrategyFeedbackInput(e.target.value);
                        updatePromptStrength(e.target.value, 'feedback-strategy', 'feedback');
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleStrategyFeedbackSubmit()}
                      className="flex-1 h-12 text-base"
                    />
                    <Button
                      onClick={() => improvePromptWithAI(strategyFeedbackInput, 'feedback', 'Pitch strategy improvement', setStrategyFeedbackInput)}
                      disabled={!strategyFeedbackInput.trim() || isImprovingPrompt}
                      variant="outline"
                      size="icon"
                      title="Improve with AI"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={handleStrategyFeedbackSubmit} 
                      disabled={!strategyFeedbackInput.trim() || isLoading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Improve
                    </Button>
                  </div>
                  {strategyFeedbackInput.trim() && (
                    <div className="flex justify-end">
                      <PromptStrengthIndicator strength={promptStrengths['feedback-strategy'] || 0} fieldKey="feedback-strategy" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 'objections' && (
              <div className="border-t p-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tell me how to improve the objection handling tactics..."
                      value={objectionsFeedbackInput}
                      onChange={(e) => {
                        setObjectionsFeedbackInput(e.target.value);
                        updatePromptStrength(e.target.value, 'feedback-objections', 'feedback');
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleObjectionsFeedbackSubmit()}
                      className="flex-1 h-12 text-base"
                    />
                    <Button
                      onClick={() => improvePromptWithAI(objectionsFeedbackInput, 'feedback', 'Objection handling improvement', setObjectionsFeedbackInput)}
                      disabled={!objectionsFeedbackInput.trim() || isImprovingPrompt}
                      variant="outline"
                      size="icon"
                      title="Improve with AI"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={handleObjectionsFeedbackSubmit} 
                      disabled={!objectionsFeedbackInput.trim() || isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Improve
                    </Button>
                  </div>
                  {objectionsFeedbackInput.trim() && (
                    <div className="flex justify-end">
                      <PromptStrengthIndicator strength={promptStrengths['feedback-objections'] || 0} fieldKey="feedback-objections" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 'email-cadence' && (
              <div className="border-t p-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tell me how to improve the email cadence..."
                      value={emailCadenceFeedbackInput}
                      onChange={(e) => {
                        setEmailCadenceFeedbackInput(e.target.value);
                        updatePromptStrength(e.target.value, 'feedback-email', 'feedback');
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleEmailCadenceFeedbackSubmit()}
                      className="flex-1 h-12 text-base"
                    />
                    <Button 
                      onClick={handleEmailCadenceFeedbackSubmit} 
                      disabled={!emailCadenceFeedbackInput.trim() || isLoading}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Improve
                    </Button>
                  </div>
                  {emailCadenceFeedbackInput.trim() && (
                    <div className="flex justify-end">
                      <PromptStrengthIndicator strength={promptStrengths['feedback-email'] || 0} fieldKey="feedback-email" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="system-prompts" className="flex-1 flex flex-col">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">System Prompts Management</h2>
          <p className="text-gray-600 mt-2">Customize the AI prompts used for each step of the pitch building process</p>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto">
          {/* Pitch Strategy Prompt */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-purple-800">Pitch Strategy Prompt</h3>
              <Badge variant="outline" className="text-purple-700 border-purple-300">Strategy Generation</Badge>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt:</label>
                <div className="space-y-2">
                  <Textarea
                    value={editingPrompts.pitchStrategy}
                    onChange={(e) => {
                      setEditingPrompts({...editingPrompts, pitchStrategy: e.target.value});
                      updatePromptStrength(e.target.value, 'system-pitch', 'systemPrompt');
                    }}
                    placeholder="Enter the system prompt for pitch strategy generation..."
                    rows={12}
                    className="w-full min-h-[300px]"
                  />
                  <div className="flex justify-between items-center">
                    <Button
                      onClick={() => improvePromptWithAI(editingPrompts.pitchStrategy, 'systemPrompt', 'Pitch strategy system prompt', (improved) => setEditingPrompts({...editingPrompts, pitchStrategy: improved}))}
                      disabled={!editingPrompts.pitchStrategy.trim() || isImprovingPrompt}
                      variant="outline"
                      size="sm"
                      className="flex-1 mr-2"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Improve Prompt with AI
                    </Button>
                    {editingPrompts.pitchStrategy.trim() && (
                      <PromptStrengthIndicator strength={promptStrengths['system-pitch'] || 0} fieldKey="system-pitch" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Objection Handling Prompt */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-green-800">Objection Handling Prompt</h3>
              <Badge variant="outline" className="text-green-700 border-green-300">Objection Handling</Badge>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt:</label>
                <div className="space-y-2">
                  <Textarea
                    value={editingPrompts.objectionHandling}
                    onChange={(e) => {
                      setEditingPrompts({...editingPrompts, objectionHandling: e.target.value});
                      updatePromptStrength(e.target.value, 'system-objection', 'systemPrompt');
                    }}
                    placeholder="Enter the system prompt for objection handling generation..."
                    rows={12}
                    className="w-full min-h-[300px]"
                  />
                  <div className="flex justify-between items-center">
                    <Button
                      onClick={() => improvePromptWithAI(editingPrompts.objectionHandling, 'systemPrompt', 'Objection handling system prompt', (improved) => setEditingPrompts({...editingPrompts, objectionHandling: improved}))}
                      disabled={!editingPrompts.objectionHandling.trim() || isImprovingPrompt}
                      variant="outline"
                      size="sm"
                      className="flex-1 mr-2"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Improve Prompt with AI
                    </Button>
                    {editingPrompts.objectionHandling.trim() && (
                      <PromptStrengthIndicator strength={promptStrengths['system-objection'] || 0} fieldKey="system-objection" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Email Cadence Prompt */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-orange-800">Email Cadence Prompt</h3>
              <Badge variant="outline" className="text-orange-700 border-orange-300">Email Cadence</Badge>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt:</label>
                <div className="space-y-2">
                  <Textarea
                    value={editingPrompts.emailCadence}
                    onChange={(e) => {
                      setEditingPrompts({...editingPrompts, emailCadence: e.target.value});
                      updatePromptStrength(e.target.value, 'system-email', 'systemPrompt');
                    }}
                    placeholder="Enter the system prompt for email cadence generation..."
                    rows={12}
                    className="w-full min-h-[300px]"
                  />
                  <div className="flex justify-between items-center">
                    <Button
                      onClick={() => improvePromptWithAI(editingPrompts.emailCadence, 'systemPrompt', 'Email cadence system prompt', (improved) => setEditingPrompts({...editingPrompts, emailCadence: improved}))}
                      disabled={!editingPrompts.emailCadence.trim() || isImprovingPrompt}
                      variant="outline"
                      size="sm"
                      className="flex-1 mr-2"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Improve Prompt with AI
                    </Button>
                    {editingPrompts.emailCadence.trim() && (
                      <PromptStrengthIndicator strength={promptStrengths['system-email'] || 0} fieldKey="system-email" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-4 border-t">
            <Button 
              onClick={saveSystemPrompts}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button 
              onClick={resetSystemPrompts}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
