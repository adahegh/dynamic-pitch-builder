
import { Download, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface PitchStrategy {
  talkTracks: string[];
  talkingPoints: string[];
}

interface PitchDisplayProps {
  strategy: PitchStrategy;
  onDownload: () => void;
}

export function PitchDisplay({ strategy, onDownload }: PitchDisplayProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-blue-800">Your Pitch Strategy</h3>
          <Button onClick={onDownload} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-lg mb-3 text-blue-700">Sample Talk Tracks</h4>
            {strategy.talkTracks.map((track, index) => (
              <Card key={index} className="p-4 mb-3 bg-white">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    Talk Track {index + 1}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(track, `Talk Track ${index + 1}`)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-gray-700 leading-relaxed">{track}</p>
              </Card>
            ))}
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-3 text-purple-700">Key Talking Points</h4>
            <Card className="p-4 bg-white">
              <div className="flex justify-between items-start mb-3">
                <Badge variant="outline" className="text-purple-600 border-purple-300">
                  Talking Points
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(strategy.talkingPoints.join('\n• '), 'Talking Points')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <ul className="space-y-2">
                {strategy.talkingPoints.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
}
