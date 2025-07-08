
import { format } from 'date-fns';
import { Bot, User } from 'lucide-react';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.type === 'bot';
  
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}>
      <div className={`flex max-w-[80%] ${isBot ? 'flex-row' : 'flex-row-reverse'} gap-3`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isBot ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
        }`}>
          {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        
        <div className={`p-4 rounded-lg ${
          isBot 
            ? 'bg-gray-100 text-gray-800' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
        }`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
          <div className={`text-xs mt-2 ${
            isBot ? 'text-gray-500' : 'text-blue-100'
          }`}>
            {format(message.timestamp, 'HH:mm')}
          </div>
        </div>
      </div>
    </div>
  );
}
