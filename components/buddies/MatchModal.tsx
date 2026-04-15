'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface MatchModalProps {
  match: any;
  isOpen: boolean;
  onClose: () => void;
}

export function MatchModal({ match, isOpen, onClose }: MatchModalProps) {
  if (!match) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            Compatibility Details
            <Badge className="bg-green-600">{match.compatibilityScore}%</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          <div>
            <h4 className="text-sm font-semibold text-zinc-400 uppercase mb-2">Why you match</h4>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300">
              {match.compatibilityReasons?.map((reason: string, i: number) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-400 uppercase mb-2">Common Interests</h4>
            <div className="flex flex-wrap gap-2">
              {match.commonInterests?.map((interest: string, i: number) => (
                <Badge key={i} variant="secondary" className="bg-blue-900/30 text-blue-300 border-blue-900/50">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-400 uppercase mb-2">Potential Challenges</h4>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-sm">
              {match.potentialChallenges?.map((challenge: string, i: number) => (
                <li key={i}>{challenge}</li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
