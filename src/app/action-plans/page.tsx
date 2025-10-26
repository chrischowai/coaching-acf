'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { StatCard } from '@/components/action-plans/StatCard';
import { ActionPlanCard } from '@/components/action-plans/ActionPlanCard';
import {
  getAllActionPlans,
  getActionPlanStats,
  completeActionPlan,
  startActionPlan,
  ActionPlanExtended,
} from '@/lib/supabase/action-plans';
import {
  ArrowLeft,
  ListTodo,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  Plus,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed';
type SortOption = 'due_date' | 'priority' | 'created_at';

export default function ActionPlansPage() {
  const router = useRouter();
  const [actionPlans, setActionPlans] = useState<ActionPlanExtended[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<ActionPlanExtended[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    completionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('due_date');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [actionPlans, statusFilter, sortBy]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [plansData, statsData] = await Promise.all([
        getAllActionPlans(),
        getActionPlanStats(),
      ]);
      setActionPlans(plansData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load action plans:', error);
      toast.error('Failed to load action plans');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...actionPlans];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((plan) => plan.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'priority':
          const priorityMap = { high: 3, medium: 2, low: 1 };
          return priorityMap[b.priority] - priorityMap[a.priority];
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    setFilteredPlans(filtered);
  };

  const handleComplete = async (id: string) => {
    try {
      const notes = prompt('Add notes about completing this action (optional):');
      await completeActionPlan(id, notes || undefined);
      toast.success('Action plan completed!');
      await loadData();
    } catch (error) {
      console.error('Failed to complete action plan:', error);
      toast.error('Failed to complete action plan');
    }
  };

  const handleStart = async (id: string) => {
    try {
      await startActionPlan(id);
      toast.success('Action plan started!');
      await loadData();
    } catch (error) {
      console.error('Failed to start action plan:', error);
      toast.error('Failed to start action plan');
    }
  };

  const handleView = (id: string) => {
    router.push(`/action-plans/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b border-indigo-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="hover:bg-indigo-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-slate-900">Action Plans</h1>
              <p className="text-sm text-slate-500">Track and manage your coaching action items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Statistics Section */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard
              title="Total Actions"
              value={stats.total}
              icon={Target}
              iconColor="text-indigo-600"
              iconBgColor="bg-indigo-50"
            />
            <StatCard
              title="Pending"
              value={stats.pending}
              icon={Clock}
              iconColor="text-slate-600"
              iconBgColor="bg-slate-50"
            />
            <StatCard
              title="In Progress"
              value={stats.inProgress}
              icon={TrendingUp}
              iconColor="text-amber-600"
              iconBgColor="bg-amber-50"
            />
            <StatCard
              title="Completed"
              value={stats.completed}
              icon={CheckCircle}
              iconColor="text-green-600"
              iconBgColor="bg-green-50"
            />
            <StatCard
              title="Completion Rate"
              value={`${stats.completionRate}%`}
              icon={ListTodo}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-50"
            />
          </div>
        )}

        {/* Filters and Sort Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Status Filter Tabs */}
              <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-sm border border-slate-300 rounded px-3 py-1.5 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="due_date">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="created_at">Created Date</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Loading action plans...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredPlans.length === 0 && (
          <Card className="border-2 border-dashed border-slate-300">
            <CardContent className="py-20 text-center">
              <Target className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                {statusFilter === 'all' 
                  ? 'No action plans yet'
                  : `No ${statusFilter.replace('_', ' ')} action plans`
                }
              </h3>
              <p className="text-slate-500 mb-6">
                {statusFilter === 'all'
                  ? 'Complete a coaching session to generate action plans'
                  : 'Try changing your filter to see other action plans'
                }
              </p>
              {statusFilter === 'all' && (
                <Button
                  onClick={() => router.push('/')}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Start New Coaching Session
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Plans Grid */}
        {!isLoading && filteredPlans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <ActionPlanCard
                key={plan.id}
                actionPlan={plan}
                onView={handleView}
                onComplete={handleComplete}
                onStart={handleStart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
