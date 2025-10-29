'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { getActionPlansBySession, updateActionPlan, deleteActionPlan } from '@/lib/supabase/action-plans';
import { ActionPlanExtended } from '@/lib/supabase/action-plans';
import { ChevronDown, ChevronUp, FileText, Save, Calendar, AlertTriangle, Trash2 } from 'lucide-react';
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
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

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
        due_date: item.due_date,
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

  const handleDelete = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete this action item?\n\n"${item.title}"\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingItemId(itemId);
      await deleteActionPlan(itemId);
      
      // Remove from local state
      setItems(prev => prev.filter(i => i.id !== itemId));
      
      // Clean up any edited state
      setEditedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      
      // Clean up expanded state
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });

      toast.success('Action item deleted successfully!');
    } catch (error) {
      console.error('Error deleting action item:', error);
      toast.error('Failed to delete action item');
    } finally {
      setDeletingItemId(null);
    }
  };

  const isOverdue = (item: ActionPlanExtended) => {
    return item.due_date && isPast(new Date(item.due_date)) && item.status !== 'completed';
  };

  const isDueSoon = (item: ActionPlanExtended) => {
    return item.due_date && isWithinInterval(new Date(item.due_date), {
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
              <div className="flex items-start gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-full font-bold shadow-md">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <Input
                      value={item.title}
                      onChange={(e) => updateField(item.id, 'title', e.target.value)}
                      className="font-bold text-lg border-0 bg-transparent px-0 focus-visible:ring-0"
                      placeholder="Action title"
                    />
                    <Textarea
                      value={item.description || ''}
                      onChange={(e) => updateField(item.id, 'description', e.target.value)}
                      className="text-sm min-h-[50px] resize-none"
                      placeholder="Description..."
                      rows={2}
                    />
                    {overdue && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        Overdue
                      </div>
                    )}
                    {dueSoon && !overdue && (
                      <div className="text-xs text-amber-600">⏰ Due Soon</div>
                    )}

                    {/* Inline Status, Priority, Due Date */}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div>
                        <Label className="text-xs font-semibold text-slate-600 mb-1 block">Status</Label>
                        <select
                          value={item.status}
                          onChange={(e) => updateField(item.id, 'status', e.target.value as any)}
                          className="w-full text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-slate-600 mb-1 block">Priority</Label>
                        <select
                          value={item.priority}
                          onChange={(e) => updateField(item.id, 'priority', e.target.value as any)}
                          className="w-full text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due Date
                        </Label>
                        <Input
                          type="date"
                          value={item.due_date || ''}
                          onChange={(e) => updateField(item.id, 'due_date', e.target.value)}
                          className="text-xs h-8"
                        />
                      </div>
                    </div>
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
                <div>
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

                <div className="flex justify-between items-center pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingItemId === item.id}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deletingItemId === item.id ? 'Deleting...' : 'Delete Action'}
                  </Button>
                  
                  {hasChanges && (
                    <Button
                      onClick={() => handleSave(item.id)}
                      disabled={isSaving}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
