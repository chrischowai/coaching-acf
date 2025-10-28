'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { PriorityIndicator } from './PriorityIndicator';
import { ActionPlanExtended } from '@/lib/supabase/action-plans';
import { Calendar, Bell, Save, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface ActionItemCardProps {
  actionItem: ActionPlanExtended;
  index: number;
  onUpdate: (id: string, updates: Partial<ActionPlanExtended>) => Promise<void>;
  isSaving?: boolean;
}

export function ActionItemCard({ actionItem, index, onUpdate, isSaving }: ActionItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localData, setLocalData] = useState({
    title: actionItem.title,
    description: actionItem.description || '',
    status: actionItem.status,
    priority: actionItem.priority,
    due_date: actionItem.due_date || '',
    reminder_frequency: actionItem.reminder_frequency || 'none',
    reminder_enabled: actionItem.reminder_enabled ?? true,
    notes: actionItem.notes || '',
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = (field: string, value: any) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await onUpdate(actionItem.id, localData);
    setHasChanges(false);
  };

  return (
    <Card className="border-2 border-indigo-200 shadow-md hover:shadow-lg transition-all">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-full text-lg font-bold shadow-md">
                {index + 1}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <Input
                value={localData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="font-semibold text-lg border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Action item title"
              />
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={localData.status} />
                <PriorityIndicator priority={localData.priority} showLabel={false} />
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Description */}
        <div>
          <Label htmlFor={`description-${actionItem.id}`} className="text-sm font-semibold text-slate-700">
            Description
          </Label>
          <Textarea
            id={`description-${actionItem.id}`}
            value={localData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Describe this action..."
            rows={2}
            className="mt-1"
          />
        </div>

        {/* Settings Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor={`status-${actionItem.id}`} className="text-sm font-semibold text-slate-700">
              Status
            </Label>
            <select
              id={`status-${actionItem.id}`}
              value={localData.status}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <Label htmlFor={`priority-${actionItem.id}`} className="text-sm font-semibold text-slate-700">
              Priority
            </Label>
            <select
              id={`priority-${actionItem.id}`}
              value={localData.priority}
              onChange={(e) => handleFieldChange('priority', e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <Label htmlFor={`due-date-${actionItem.id}`} className="text-sm font-semibold text-slate-700 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Due Date
            </Label>
            <Input
              id={`due-date-${actionItem.id}`}
              type="date"
              value={localData.due_date}
              onChange={(e) => handleFieldChange('due_date', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Reminder Settings */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-4 w-4 text-indigo-600" />
            <h4 className="text-sm font-semibold text-slate-700">Reminder Settings</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`reminder-enabled-${actionItem.id}`}
                checked={localData.reminder_enabled}
                onChange={(e) => handleFieldChange('reminder_enabled', e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <Label htmlFor={`reminder-enabled-${actionItem.id}`} className="cursor-pointer text-sm">
                Enable reminders for this action
              </Label>
            </div>

            {localData.reminder_enabled && (
              <div>
                <Label htmlFor={`reminder-frequency-${actionItem.id}`} className="text-sm font-semibold text-slate-700">
                  Reminder Frequency
                </Label>
                <select
                  id={`reminder-frequency-${actionItem.id}`}
                  value={localData.reminder_frequency}
                  onChange={(e) => handleFieldChange('reminder_frequency', e.target.value)}
                  className="mt-1 w-full md:w-auto border border-slate-300 rounded-md px-3 py-2 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">None</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Notes & Reflections - Expandable */}
        {isExpanded && (
          <div className="border-t border-slate-200 pt-4">
            <Label htmlFor={`notes-${actionItem.id}`} className="text-sm font-semibold text-slate-700 flex items-center gap-1 mb-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Notes & Reflections
            </Label>
            <Textarea
              id={`notes-${actionItem.id}`}
              value={localData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Add notes, progress updates, or reflections about this action..."
              rows={4}
              className="resize-none"
            />
          </div>
        )}

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
