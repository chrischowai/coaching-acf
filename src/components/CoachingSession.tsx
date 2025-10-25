'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, CheckCircle, Users, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface CoachingSessionProps {
  sessionType: 'coach_led' | 'self_coaching';
}

const stages = [
  {
    id: 1,
    name: 'Assess the situation',
    description: 'Understand the current context and challenges',
    questions: [
      'What is the current situation?',
      'What challenges are you facing?',
      'What have you tried so far?',
    ],
  },
  {
    id: 2,
    name: 'Creative brainstorming',
    description: 'Explore possibilities and generate ideas',
    questions: [
      'What are all the possible solutions?',
      'What if there were no constraints?',
      'What creative approaches could work?',
    ],
  },
  {
    id: 3,
    name: 'Formulate the goal',
    description: 'Define clear, actionable objectives',
    questions: [
      'What do you want to achieve?',
      'What would success look like?',
      'How will you measure progress?',
    ],
  },
  {
    id: 4,
    name: 'Initiate the action plan',
    description: 'Create concrete steps to reach your goal',
    questions: [
      'What specific actions will you take?',
      'When will you start?',
      'What resources do you need?',
    ],
  },
  {
    id: 5,
    name: 'Nourish accountability',
    description: 'Set up support and tracking mechanisms',
    questions: [
      'How will you track your progress?',
      'Who will support you?',
      'What might get in your way?',
    ],
  },
];

export default function CoachingSession({ sessionType }: CoachingSessionProps) {
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState(1);
  const [responses, setResponses] = useState<Record<number, Record<number, string>>>({});

  const progress = (currentStage / stages.length) * 100;
  const stage = stages[currentStage - 1];

  const handleResponseChange = (questionIndex: number, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [currentStage]: {
        ...(prev[currentStage] || {}),
        [questionIndex]: value,
      },
    }));
  };

  const handleNext = () => {
    const currentResponses = responses[currentStage] || {};
    const answeredQuestions = Object.keys(currentResponses).filter(
      (key) => currentResponses[parseInt(key)]?.trim()
    ).length;

    if (answeredQuestions < stage.questions.length) {
      toast.error('Please answer all questions before proceeding');
      return;
    }

    if (currentStage < stages.length) {
      setCurrentStage(currentStage + 1);
      toast.success(`Moving to Stage ${currentStage + 1}`);
    } else {
      toast.success('Session completed!');
      router.push('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  const handleFinish = () => {
    toast.success('Coaching session completed!');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Exit Session
          </Button>
          <div className="flex items-center gap-2">
            {sessionType === 'coach_led' ? (
              <>
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Coach-Led Session</span>
              </>
            ) : (
              <>
                <User className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Self-Coaching Session</span>
              </>
            )}
          </div>
        </div>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-2xl">
                Stage {currentStage} of {stages.length}
              </CardTitle>
              <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
        </Card>

        <Tabs value={currentStage.toString()} className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            {stages.map((s) => (
              <TabsTrigger
                key={s.id}
                value={s.id.toString()}
                disabled={s.id !== currentStage}
                className="text-xs"
              >
                {s.id < currentStage ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  s.id
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl">{stage.name}</CardTitle>
            <CardDescription className="text-base">{stage.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {stage.questions.map((question, index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`q${index}`} className="text-base font-semibold">
                  {index + 1}. {question}
                </Label>
                <Textarea
                  id={`q${index}`}
                  placeholder="Type your answer here..."
                  value={responses[currentStage]?.[index] || ''}
                  onChange={(e) => handleResponseChange(index, e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            ))}

            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStage === 1}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              {currentStage < stages.length ? (
                <Button onClick={handleNext} className="flex-1">
                  Next Stage
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleFinish} className="flex-1">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Session
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
