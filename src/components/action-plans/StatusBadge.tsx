import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, PlayCircle, XCircle } from 'lucide-react';

export type ActionPlanStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

interface StatusBadgeProps {
  status: ActionPlanStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
    },
    in_progress: {
      label: 'In Progress',
      icon: PlayCircle,
      className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    },
    completed: {
      label: 'Completed',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-700 hover:bg-green-100',
    },
    blocked: {
      label: 'Blocked',
      icon: XCircle,
      className: 'bg-red-100 text-red-700 hover:bg-red-100',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
