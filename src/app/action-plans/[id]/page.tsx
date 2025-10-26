'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/action-plans/StatusBadge';
import { PriorityIndicator } from '@/components/action-plans/PriorityIndicator';
import {
  ActionPlanExtended,
  updateActionPlan,
  deleteActionPlan,
} from '@/lib/supabase/action-plans';
import { getSession } from '@/lib/supabase/sessions';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Calendar,
  Save,
  Trash2,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Edit2,
  FileText,
} from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

export default function ActionPlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [actionPlan, setActionPlan] = useState<ActionPlanExtended | null>(null);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState<'none' | 'daily' | 'weekly'>('daily');

  useEffect(() => {
    if (id) {
      loadActionPlan();
    }
  }, [id]);

  useEffect(() => {
    if (actionPlan) {
      const changed =
        title !== actionPlan.title ||
        description !== (actionPlan.description || '') ||
        priority !== actionPlan.priority ||
        status !== actionPlan.status ||
        dueDate !== (actionPlan.due_date || '') ||
        notes !== (actionPlan.notes || '') ||
        reminderEnabled !== (actionPlan.reminder_enabled ?? true) ||
        reminderFrequency !== (actionPlan.reminder_frequency || 'daily');

      setHasChanges(changed);
    }
  }, [title, description, priority, status, dueDate, notes, reminderEnabled, reminderFrequency, actionPlan]);

  const loadActionPlan = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // Fetch action plan
      const { data: planData, error: planError } = await supabase
        .from('action_plans')
        .select('*')
        .eq('id', id)
        .single();

      if (planError || !planData) {
        toast.error('Action plan not found');
        router.push('/action-plans');
        return;
      }

      // Normalize priority from integer to string
      const normalizePriority = (priority: any): 'low' | 'medium' | 'high' => {
        if (typeof priority === 'string') {
          return priority as 'low' | 'medium' | 'high';
        }
        // Database stores as integer (1-5)
        const numPriority = Number(priority);
        if (numPriority >= 4) return 'high';
        if (numPriority >= 2) return 'medium';
        return 'low';
      };

      const plan: ActionPlanExtended = {
        ...planData,
        priority: normalizePriority(planData.priority),
      } as ActionPlanExtended;
      
      setActionPlan(plan);

      // Set editable fields
      setTitle(plan.title);
      setDescription(plan.description || '');
      setPriority(plan.priority);
      setStatus(plan.status);
      setDueDate(plan.due_date || '');
      setNotes(plan.notes || '');
      setReminderEnabled(plan.reminder_enabled ?? true);
      setReminderFrequency(plan.reminder_frequency || 'daily');

      // Fetch session info (optional - don't fail if not available)
      if (plan.session_id) {
        try {
          const { session } = await getSession(plan.session_id);
          setSessionInfo(session);
          console.log('Session info loaded successfully:', session.id);
        } catch (error: any) {
          console.warn('Could not load session info (non-critical):', {
            sessionId: plan.session_id,
            error: error.message || error
          });
          // Session info is optional, so we don't fail the page load
          // The UI will just not show the session context card
        }
      } else {
        console.warn('Action plan has no session_id');
      }
    } catch (error) {
      console.error('Failed to load action plan:', error);
      toast.error('Failed to load action plan');
      router.push('/action-plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!actionPlan) return;

    try {
      setIsSaving(true);
      await updateActionPlan(actionPlan.id, {
        title,
        description,
        priority,
        status,
        due_date: dueDate || undefined,
        notes,
        reminder_enabled: reminderEnabled,
        reminder_frequency: reminderFrequency,
      });

      toast.success('Action plan updated successfully!');
      setHasChanges(false);
      await loadActionPlan();
    } catch (error) {
      console.error('Failed to update action plan:', error);
      toast.error('Failed to update action plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!actionPlan) return;

    const confirmed = confirm(
      'Are you sure you want to delete this action plan? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      await deleteActionPlan(actionPlan.id);
      toast.success('Action plan deleted');
      router.push('/action-plans');
    } catch (error) {
      console.error('Failed to delete action plan:', error);
      toast.error('Failed to delete action plan');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading action plan...</p>
        </div>
      </div>
    );
  }

  if (!actionPlan) {
    return null;
  }

  const isOverdue = actionPlan.due_date && isPast(new Date(actionPlan.due_date)) && status !== 'completed';
  const daysRemaining = actionPlan.due_date ? differenceInDays(new Date(actionPlan.due_date), new Date()) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b border-indigo-200 bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/action-plans')}
                className="hover:bg-indigo-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <StatusBadge status={status} />
                <PriorityIndicator priority={priority} showLabel={false} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit2 className="h-5 w-5 text-indigo-600" />
                  Action Plan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Action plan title"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this action plan..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="mt-1 w-full border border-slate-300 rounded px-3 py-2 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="mt-1 w-full border border-slate-300 rounded px-3 py-2 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Reminder Settings */}
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Reminder Preferences</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="reminderEnabled"
                        checked={reminderEnabled}
                        onChange={(e) => setReminderEnabled(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <Label htmlFor="reminderEnabled" className="cursor-pointer">
                        Enable reminders for this action
                      </Label>
                    </div>

                    {reminderEnabled && (
                      <div>
                        <Label htmlFor="reminderFrequency">Reminder Frequency</Label>
                        <select
                          id="reminderFrequency"
                          value={reminderFrequency}
                          onChange={(e) => setReminderFrequency(e.target.value as any)}
                          className="mt-1 w-full md:w-auto border border-slate-300 rounded px-3 py-2 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="none">None</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Notes & Reflections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes, progress updates, or reflections about this action..."
                  rows={6}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Progress Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {status === 'completed' ? (
                  <div className="text-center py-4">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-green-700">Completed!</p>
                    {actionPlan.completed_at && (
                      <p className="text-xs text-slate-600 mt-1">
                        {format(new Date(actionPlan.completed_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                ) : isOverdue ? (
                  <div className="text-center py-4">
                    <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-red-700">Overdue</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {Math.abs(daysRemaining || 0)} days past due
                    </p>
                  </div>
                ) : daysRemaining !== null ? (
                  <div className="text-center py-4">
                    <Clock className="h-12 w-12 text-amber-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-amber-700">
                      {daysRemaining} days remaining
                    </p>
                    {dueDate && (
                      <p className="text-xs text-slate-600 mt-1">
                        Due {format(new Date(dueDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">No due date set</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Session Context */}
            {sessionInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Related Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-900 mb-1">
                      {sessionInfo.session_type === 'coach_led' ? 'Coach-Led Session' : 'Self-Coaching Session'}
                    </p>
                    <p className="text-xs">
                      Created: {format(new Date(sessionInfo.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/sessions/${actionPlan.session_id}`)}
                    className="w-full"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Session
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Created/Updated Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-xs text-slate-500 space-y-1">
                  <p>Created: {format(new Date(actionPlan.created_at), 'MMM d, yyyy h:mm a')}</p>
                  <p>Last updated: {format(new Date(actionPlan.updated_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
