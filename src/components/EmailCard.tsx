import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailCardProps {
  email: {
    day: string;
    step: string;
    type: string;
    content: string;
  };
  index: number;
}

export function EmailCard({ email, index }: EmailCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(email.content);
    toast({
      title: "Copied to clipboard",
      description: "Email content has been copied to your clipboard.",
    });
  };

  const getTypeColor = (type: string) => {
    if (type.toLowerCase().includes('introduction')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (type.toLowerCase().includes('follow')) return 'bg-green-100 text-green-800 border-green-200';
    if (type.toLowerCase().includes('case')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (type.toLowerCase().includes('value')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (type.toLowerCase().includes('social')) return 'bg-pink-100 text-pink-800 border-pink-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getDayColor = (day: string) => {
    const dayNum = parseInt(day.replace('Day ', ''));
    if (dayNum <= 3) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (dayNum <= 7) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (dayNum <= 12) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  // Extract subject line if it exists in content
  const getSubjectLine = (content: string) => {
    const subjectMatch = content.match(/Subject:\s*(.+?)(?:\n|$)/i);
    return subjectMatch ? subjectMatch[1].trim() : null;
  };

  const getEmailBody = (content: string) => {
    const subjectMatch = content.match(/Subject:\s*(.+?)(?:\n|$)/i);
    if (subjectMatch) {
      return content.replace(/Subject:\s*(.+?)(?:\n|$)/i, '').trim();
    }
    return content;
  };

  const subjectLine = getSubjectLine(email.content);
  const emailBody = getEmailBody(email.content);
  const previewLength = 150;
  const shouldShowExpander = emailBody.length > previewLength;

  return (
    <Card className="w-full transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${getDayColor(email.day)} font-medium`}>
              {email.day}
            </Badge>
            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 font-medium">
              {email.step}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mt-2">
          <Badge variant="outline" className={`${getTypeColor(email.type)} text-sm`}>
            {email.type}
          </Badge>
        </div>

        {subjectLine && (
          <div className="mt-3 p-3 bg-slate-50 rounded-md border">
            <div className="text-xs text-slate-600 font-medium mb-1">SUBJECT:</div>
            <div className="text-sm font-medium text-slate-800">{subjectLine}</div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="text-sm text-slate-700 leading-relaxed">
          <div className="whitespace-pre-wrap">
            {shouldShowExpander && !isExpanded 
              ? `${emailBody.substring(0, previewLength)}...`
              : emailBody
            }
          </div>
          
          {shouldShowExpander && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 h-8 text-xs text-slate-600 hover:text-slate-800 p-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show More
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}