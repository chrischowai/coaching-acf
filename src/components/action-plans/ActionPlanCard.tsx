import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { PriorityIndicator } from './PriorityIndicator';
import { ActionPlanExtended } from '@/lib/supabase/action-plans';
import { Calendar, Eye, CheckCircle, PlayCircle, AlertTriangle } from 'lucide-react';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';

interface ActionPlanCardProps {
  actionPlan: ActionPlanExtended;
  onView: (id: string) => void;
  onComplete?: (id: string) => void;
  onStart?: (id: string) => void;
}

export function ActionPlanCard({ 
  actionPlan, 
  onView, 
  onComplete, 
  onStart 
}: ActionPlanCardProps) {
  // Calculate if overdue or due soon
  const isOverdue = actionPlan.due_date && isPast(new Date(actionPlan.due_date)) && actionPlan.status !== 'completed';
  const isDueSoon = actionPlan.due_date && isWithinInterval(new Date(actionPlan.due_date), {
    start: new Date(),
    end: addDays(new Date(), 3),
  }) && actionPlan.status !== 'completed';

  return (
    <Card className={`
      hover:shadow-lg transition-all duration-200 border-l-4
      ${isOverdue ? 'border-l-red-500' : ''}
      ${isDueSoon && !isOverdue ? 'border-l-amber-500' : ''}
      ${!isOverdue && !isDueSoon ? 'border-l-indigo-500' : ''}
    `}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 mb-2 truncate">
              {actionPlan.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={actionPlan.status} />
              <PriorityIndicator 
                priority={actionPlan.priority} 
                showLabel={false} 
              />
            </div>
          </div>
        </div>

        {/* Description */}
        {actionPlan.description && (
          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
            {actionPlan.description}
          </p>
        )}

        {/* Due Date and Status Indicators */}
        <div className="space-y-2 mb-4">
          {actionPlan.due_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className={`
                ${isOverdue ? 'text-red-600 font-semibold' : ''}
                ${isDueSoon && !isOverdue ? 'text-amber-600 font-semibold' : ''}
                ${!isOverdue && !isDueSoon ? 'text-slate-600' : ''}
              `}>
                {isOverdue && '⚠️ Overdue: '}
                {isDueSoon && !isOverdue && '⏰ Due Soon: '}
                {format(new Date(actionPlan.due_date), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {actionPlan.completed_at && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Completed {format(new Date(actionPlan.completed_at), 'MMM d, yyyy')}</span>
            </div>
          )}

          {isOverdue && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Action Required</span>
            </div>
          )}
        </div>

        {/* Notes Preview */}
        {actionPlan.notes && (
          <div className="bg-slate-50 rounded p-2 mb-4">
            <p className="text-xs text-slate-600 line-clamp-2">
              <span className="font-semibold">Notes:</span> {actionPlan.notes}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(actionPlan.id)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>

          {actionPlan.status === 'pending' && onStart && (
            <Button
              size="sm"
              onClick={() => onStart(actionPlan.id)}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}

          {actionPlan.status === 'in_progress' && onComplete && (
            <Button
              size="sm"
              onClick={() => onComplete(actionPlan.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
