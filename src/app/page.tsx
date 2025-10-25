'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Users, ArrowRight, CheckCircle, History } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/sessions')}
              className="border-2 border-indigo-200 hover:bg-indigo-50"
            >
              <History className="mr-2 h-4 w-4" />
              View Session History
            </Button>
          </div>
          <Badge className="mb-4 bg-primary text-primary-foreground">
            Professional Coaching Platform
          </Badge>
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            ACF Coaching Flow
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A structured 5-stage coaching framework designed to transform insights into actionable outcomes
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Self-Coaching Mode */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary cursor-pointer group">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UserCircle className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Self-Coaching</CardTitle>
              <CardDescription className="text-base">
                Guide yourself through personal development with structured reflection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Personal goal setting & reflection</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Self-paced progress through 5 stages</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Actionable plans with timeline visualization</span>
                </div>
              </div>
              <Link href="/session/new?type=self_coaching">
                <Button className="w-full mt-6 group-hover:scale-105 transition-transform">
                  Start Self-Coaching Session
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Coach-Led Mode */}
          <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-secondary cursor-pointer group">
            <CardHeader>
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Coach-Led Session</CardTitle>
              <CardDescription className="text-base">
                Facilitate powerful coaching conversations with clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Guided question framework for coaches</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Client progress tracking & insights</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Professional session documentation</span>
                </div>
              </div>
              <Link href="/session/new?type=coach_led">
                <Button className="w-full mt-6 group-hover:scale-105 transition-transform bg-secondary hover:bg-secondary/90">
                  Start Coach-Led Session
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 5-Stage Process Overview */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">The 5-Stage ACF Process</h2>
          <div className="grid sm:grid-cols-5 gap-4">
            {[
              { num: 1, name: 'Check In', desc: 'Establish presence & connection', color: 'bg-blue-500' },
              { num: 2, name: 'Starting Point', desc: 'Define current reality', color: 'bg-indigo-500' },
              { num: 3, name: 'Connect', desc: 'Explore possibilities', color: 'bg-purple-500' },
              { num: 4, name: 'Finish', desc: 'Set SMART goals', color: 'bg-green-500' },
              { num: 5, name: 'Check Out', desc: 'Capture learnings', color: 'bg-emerald-500' },
            ].map((stage) => (
              <div key={stage.num} className="text-center">
                <div className={`w-12 h-12 ${stage.color} rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2`}>
                  {stage.num}
                </div>
                <h3 className="font-semibold mb-1">{stage.name}</h3>
                <p className="text-xs text-muted-foreground">{stage.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
