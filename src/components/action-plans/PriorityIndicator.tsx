import { AlertCircle, AlertTriangle, MinusCircle } from 'lucide-react';

export type ActionPlanPriority = 'low' | 'medium' | 'high';

interface PriorityIndicatorProps {
  priority: ActionPlanPriority;
  showLabel?: boolean;
  className?: string;
}

export function PriorityIndicator({ 
  priority, 
  showLabel = true, 
  className = '' 
}: PriorityIndicatorProps) {
  const priorityConfig = {
    low: {
      label: 'Low Priority',
      icon: MinusCircle,
      color: 'text-slate-500',
      bgColor: 'bg-slate-100',
    },
    medium: {
      label: 'Medium Priority',
      icon: AlertCircle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    high: {
      label: 'High Priority',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  };

  // Fallback to medium if priority is invalid
  const safePriority = priorityConfig[priority] ? priority : 'medium';
  const config = priorityConfig[safePriority];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className={`p-1 rounded ${config.bgColor}`}>
        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
      </div>
      {showLabel && (
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}
