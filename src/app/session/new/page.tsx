'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, User } from 'lucide-react';

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionType, setSessionType] = useState<'coach_led' | 'self_coaching' | null>(null);

  useEffect(() => {
    const type = searchParams.get('type') as 'coach_led' | 'self_coaching' | null;
    setSessionType(type);
  }, [searchParams]);

  const handleStartSession = () => {
    if (sessionType === 'coach_led') {
      router.push('/session/coach-led');
    } else if (sessionType === 'self_coaching') {
      router.push('/session/self-coaching');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">Create New Coaching Session</CardTitle>
            <CardDescription>
              {sessionType === 'coach_led' 
                ? 'You\'re starting a coach-led session where you\'ll guide someone through the ACF coaching process.'
                : 'You\'re starting a self-coaching session where you\'ll work through your own goals.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center p-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
              {sessionType === 'coach_led' ? (
                <Users className="h-24 w-24 text-blue-600" />
              ) : (
                <User className="h-24 w-24 text-purple-600" />
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Session Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Session Type</p>
                  <p className="font-medium capitalize">
                    {sessionType?.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Number of Stages</p>
                  <p className="font-medium">5 Stages</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">The 5 ACF Coaching Stages:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Assess the situation</li>
                <li>Creative brainstorming</li>
                <li>Formulate the goal</li>
                <li>Initiate the action plan</li>
                <li>Nourish accountability</li>
              </ol>
            </div>

            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleStartSession}
              >
                Start Session
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/')}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
