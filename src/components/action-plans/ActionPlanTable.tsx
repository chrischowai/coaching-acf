'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getActionPlansBySession, updateActionPlan } from '@/lib/supabase/action-plans';
import { ActionPlanExtended } from '@/lib/supabase/action-plans';
import { ChevronDown, ChevronUp, FileText, Save, Calendar, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { isPast, isWithinInterval, addDays } from 'date-fns';

interface ActionPlanTableProps {
  sessionId: string;
}

export function ActionPlanTable({ sessionId }: ActionPlanTableProps) {
  const [items, setItems] = useState<ActionPlanExtended[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editedItems, setEditedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadActionPlans();
  }, [sessionId]);

  const loadActionPlans = async () => {
    try {
      setIsLoading(true);
      const plans = await getActionPlansBySession(sessionId);
      setItems(plans);
    } catch (error) {
      console.error('Error loading action plans:', error);
      toast.error('Failed to load action plans');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const updateField = (itemId: string, field: keyof ActionPlanExtended, value: any) => {
    setItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, [field]: value } : item))
    );
    setEditedItems(prev => new Set([...prev, itemId]));
  };

  const handleSave = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    try {
      setIsSaving(true);
      await updateActionPlan(itemId, {
        title: item.title,
        description: item.description,
        status: item.status,
        priority: item.priority,
        timeline_end: item.timeline_end,
        notes: item.notes,
      });

      toast.success('Action item saved successfully!');
      setEditedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    } catch (error) {
      console.error('Error saving action item:', error);
      toast.error('Failed to save action item');
    } finally {
      setIsSaving(false);
    }
  };

  const isOverdue = (item: ActionPlanExtended) => {
    return item.timeline_end && isPast(new Date(item.timeline_end)) && item.status !== 'completed';
  };

  const isDueSoon = (item: ActionPlanExtended) => {
    return item.timeline_end && isWithinInterval(new Date(item.timeline_end), {
      start: new Date(),
      end: addDays(new Date(), 3),
    }) && item.status !== 'completed';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-slate-500">
          <p>Loading action items...</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-slate-500">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p>No action items found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isExpanded = expandedItems.has(item.id);
        const hasChanges = editedItems.has(item.id);
        const overdue = isOverdue(item);
        const dueSoon = isDueSoon(item);

        return (
          <Card
            key={item.id}
            className={`border-2 shadow-md hover:shadow-lg transition-all ${
              overdue ? 'border-red-200 bg-red-50' : dueSoon ? 'border-amber-200 bg-amber-50' : 'border-orange-200'
            }`}
          >
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-full font-bold shadow-md">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      value={item.title}
                      onChange={(e) => updateField(item.id, 'title', e.target.value)}
                      className="font-bold text-lg border-0 bg-transparent px-0 focus-visible:ring-0 mb-2"
                      placeholder="Action title"
                    />
                    <Textarea
                      value={item.description || ''}
                      onChange={(e) => updateField(item.id, 'description', e.target.value)}
                      className="text-sm min-h-[60px] resize-none"
                      placeholder="Description..."
                      rows={2}
                    />
                    {overdue && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        Overdue
                      </div>
                    )}
                    {dueSoon && !overdue && (
                      <div className="text-xs text-amber-600 mt-2">⏰ Due Soon</div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(item.id)}
                  className="flex-shrink-0"
                >
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Status</Label>
                    <select
                      value={item.status}
                      onChange={(e) => updateField(item.id, 'status', e.target.value as any)}
                      className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-slate-700">Priority</Label>
                    <select
                      value={item.priority}
                      onChange={(e) => updateField(item.id, 'priority', e.target.value as any)}
                      className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 bg-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due Date
                    </Label>
                    <Input
                      type="date"
                      value={item.timeline_end || ''}
                      onChange={(e) => updateField(item.id, 'timeline_end', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <Label htmlFor={`notes-${item.id}`} className="text-sm font-semibold text-slate-700 mb-2 block">
                    Notes & Reflections
                  </Label>
                  <Textarea
                    id={`notes-${item.id}`}
                    value={item.notes || ''}
                    onChange={(e) => updateField(item.id, 'notes', e.target.value)}
                    placeholder="Add notes..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {hasChanges && (
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => handleSave(item.id)}
                      disabled={isSaving}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
