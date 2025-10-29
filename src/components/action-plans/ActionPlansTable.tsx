'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from './StatusBadge';
import { PriorityIndicator } from './PriorityIndicator';
import { ActionPlanExtended } from '@/lib/supabase/action-plans';
import {
  Eye,
  CheckCircle,
  PlayCircle,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format, isPast, isWithinInterval, addDays } from 'date-fns';
import toast from 'react-hot-toast';

interface ActionPlansTableProps {
  actionPlans: ActionPlanExtended[];
  onView: (id: string) => void;
  onComplete: (id: string) => void;
  onStart: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ActionPlanExtended>) => void;
  onDelete: (id: string) => void;
}

interface EditingState {
  [key: string]: {
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    due_date: string;
  };
}

export function ActionPlansTable({
  actionPlans,
  onView,
  onComplete,
  onStart,
  onUpdate,
  onDelete,
}: ActionPlansTableProps) {
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [editingData, setEditingData] = useState<EditingState>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Column filters
  const [filters, setFilters] = useState({
    theme: '',
    action: '',
    content: '',
    status: '',
    priority: '',
    dueDate: '',
  });


  const startEditing = (plan: ActionPlanExtended) => {
    setEditingRows(new Set([...editingRows, plan.id]));
    setEditingData({
      ...editingData,
      [plan.id]: {
        title: plan.title,
        description: plan.description || '',
        status: plan.status,
        priority: plan.priority,
        due_date: plan.due_date || '',
      },
    });
  };

  const cancelEditing = (id: string) => {
    const newEditingRows = new Set(editingRows);
    newEditingRows.delete(id);
    setEditingRows(newEditingRows);
    
    const newEditingData = { ...editingData };
    delete newEditingData[id];
    setEditingData(newEditingData);
  };

  const confirmEditing = (id: string) => {
    const updates = editingData[id];
    if (!updates) return;

    // Validate required fields
    if (!updates.title.trim()) {
      toast.error('Title is required');
      return;
    }

    onUpdate(id, updates);
    cancelEditing(id);
  };

  const updateEditField = <K extends keyof EditingState[string]>(
    id: string,
    field: K,
    value: EditingState[string][K]
  ) => {
    setEditingData({
      ...editingData,
      [id]: {
        ...editingData[id],
        [field]: value,
      },
    });
  };

  const handleDelete = (id: string) => {
    if (deletingId === id) {
      // Confirm delete
      onDelete(id);
      setDeletingId(null);
    } else {
      // First click - show confirmation
      setDeletingId(id);
      setTimeout(() => {
        setDeletingId(null);
      }, 3000); // Reset after 3 seconds
    }
  };

  const isOverdue = (plan: ActionPlanExtended) => {
    return plan.due_date && isPast(new Date(plan.due_date)) && plan.status !== 'completed';
  };

  const isDueSoon = (plan: ActionPlanExtended) => {
    return plan.due_date && isWithinInterval(new Date(plan.due_date), {
      start: new Date(),
      end: addDays(new Date(), 3),
    }) && plan.status !== 'completed';
  };

  // Apply filters to action plans
  const filteredPlans = useMemo(() => {
    return actionPlans.filter((plan) => {
      const theme = plan.coaching_theme || 'Professional Development';
      const action = plan.title || '';
      const content = plan.description || '';
      const status = plan.status || '';
      const priority = plan.priority || '';
      const dueDate = plan.due_date ? format(new Date(plan.due_date), 'MMM d, yyyy') : '';

      return (
        theme.toLowerCase().includes(filters.theme.toLowerCase()) &&
        action.toLowerCase().includes(filters.action.toLowerCase()) &&
        content.toLowerCase().includes(filters.content.toLowerCase()) &&
        status.toLowerCase().includes(filters.status.toLowerCase()) &&
        priority.toLowerCase().includes(filters.priority.toLowerCase()) &&
        dueDate.toLowerCase().includes(filters.dueDate.toLowerCase())
      );
    });
  }, [actionPlans, filters]);

  const updateFilter = (column: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [column]: value }));
  };

  const clearFilters = () => {
    setFilters({
      theme: '',
      action: '',
      content: '',
      status: '',
      priority: '',
      dueDate: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(f => f !== '');

  // Pagination calculations
  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPlans = filteredPlans.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToPrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Filter Controls */}
        {hasActiveFilters && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filters active</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearFilters}
              className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
            >
              Clear all filters
            </Button>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {/* Column Headers */}
              <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Coaching Theme
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Agreed Action
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                  Content
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  Priority
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  Due Date
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  Actions
                </th>
              </tr>
              
              {/* Filter Row */}
              <tr className="bg-white border-b border-slate-200">
                <th className="px-4 py-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Filter theme..."
                      value={filters.theme}
                      onChange={(e) => updateFilter('theme', e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>
                </th>
                <th className="px-4 py-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Filter action..."
                      value={filters.action}
                      onChange={(e) => updateFilter('action', e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>
                </th>
                <th className="px-4 py-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Filter content..."
                      value={filters.content}
                      onChange={(e) => updateFilter('content', e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>
                </th>
                <th className="px-4 py-2">
                  <select
                    value={filters.status}
                    onChange={(e) => updateFilter('status', e.target.value)}
                    className="w-full h-8 text-xs border border-slate-300 rounded px-2 bg-white"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </th>
                <th className="px-4 py-2">
                  <select
                    value={filters.priority}
                    onChange={(e) => updateFilter('priority', e.target.value)}
                    className="w-full h-8 text-xs border border-slate-300 rounded px-2 bg-white"
                  >
                    <option value="">All Priority</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </th>
                <th className="px-4 py-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Filter date..."
                      value={filters.dueDate}
                      onChange={(e) => updateFilter('dueDate', e.target.value)}
                      className="pl-7 h-8 text-xs"
                    />
                  </div>
                </th>
                <th className="px-4 py-2">
                  {/* No filter for Actions column */}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedPlans.map((plan, index) => {
                const isEditing = editingRows.has(plan.id);
                const isDeleting = deletingId === plan.id;
                const editData = editingData[plan.id];
                const overdue = isOverdue(plan);
                const dueSoon = isDueSoon(plan);

                return (
                  <tr
                    key={plan.id}
                    className={`
                      border-b border-slate-200 hover:bg-slate-50 transition-colors
                      ${overdue ? 'bg-red-50' : ''}
                      ${dueSoon && !overdue ? 'bg-amber-50' : ''}
                      ${isEditing ? 'bg-blue-50' : ''}
                    `}
                  >
                    {/* Coaching Theme Column */}
                    <td className="px-4 py-4 align-top min-w-[180px]">
                      <div>
                        <div className="font-medium text-slate-900">
                          {plan.coaching_theme || 'Professional Development'}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          #{plan.session_id.slice(0, 8)}
                        </div>
                      </div>
                    </td>

                    {/* Agreed Action Column */}
                    <td className="px-4 py-4 align-top min-w-[200px]">
                      {isEditing ? (
                        <Input
                          value={editData.title}
                          onChange={(e) => updateEditField(plan.id, 'title', e.target.value)}
                          className="font-semibold"
                          placeholder="Action title..."
                        />
                      ) : (
                        <div>
                          <div className="font-semibold text-slate-900">{plan.title}</div>
                          {overdue && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                              <AlertTriangle className="h-3 w-3" />
                              Overdue
                            </div>
                          )}
                          {dueSoon && !overdue && (
                            <div className="text-xs text-amber-600 mt-1">⏰ Due Soon</div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Content Column */}
                    <td className="px-4 py-4 align-top max-w-md">
                      {isEditing ? (
                        <Textarea
                          value={editData.description}
                          onChange={(e) => updateEditField(plan.id, 'description', e.target.value)}
                          placeholder="Description..."
                          rows={3}
                          className="text-sm resize-none"
                        />
                      ) : (
                        <div className="text-sm text-slate-600 line-clamp-3">
                          {plan.description || <span className="italic text-slate-400">No description</span>}
                        </div>
                      )}
                    </td>

                    {/* Status Column */}
                    <td className="px-4 py-4 align-top text-center">
                      {isEditing ? (
                        <select
                          value={editData.status}
                          onChange={(e) => updateEditField(plan.id, 'status', e.target.value as any)}
                          className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 bg-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      ) : (
                        <StatusBadge status={plan.status} />
                      )}
                    </td>

                    {/* Priority Column */}
                    <td className="px-4 py-4 align-top text-center">
                      {isEditing ? (
                        <select
                          value={editData.priority}
                          onChange={(e) => updateEditField(plan.id, 'priority', e.target.value as any)}
                          className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 bg-white"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      ) : (
                        <div className="flex justify-center">
                          <PriorityIndicator priority={plan.priority} showLabel={true} />
                        </div>
                      )}
                    </td>

                    {/* Due Date Column */}
                    <td className="px-4 py-4 align-top text-center">
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editData.due_date}
                          onChange={(e) => updateEditField(plan.id, 'due_date', e.target.value)}
                          className="text-sm"
                        />
                      ) : (
                        <div className="text-sm">
                          {plan.due_date ? (
                            <span className={overdue ? 'text-red-600 font-semibold' : dueSoon ? 'text-amber-600 font-semibold' : ''}>
                              {format(new Date(plan.due_date), 'MMM d, yyyy')}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No date</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => confirmEditing(plan.id)}
                              className="bg-green-600 hover:bg-green-700 text-xs"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Confirm?
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelEditing(plan.id)}
                              className="text-xs"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onView(plan.id)}
                                className="flex-1 text-xs"
                                title="View Details"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              
                              {plan.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => onStart(plan.id)}
                                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-xs"
                                  title="Start"
                                >
                                  <PlayCircle className="h-3 w-3 mr-1" />
                                  Start
                                </Button>
                              )}
                              
                              {plan.status === 'in_progress' && (
                                <Button
                                  size="sm"
                                  onClick={() => onComplete(plan.id)}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                                  title="Complete"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Done
                                </Button>
                              )}
                            </div>

                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditing(plan)}
                                className="flex-1 text-xs hover:bg-blue-50"
                                title="Edit"
                              >
                                <Edit2 className="h-3 w-3 mr-1" />
                                Amend
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(plan.id)}
                                className={`flex-1 text-xs ${
                                  isDeleting
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'hover:bg-red-50 hover:text-red-600'
                                }`}
                                title={isDeleting ? 'Click again to confirm' : 'Delete'}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                {isDeleting ? 'Confirm?' : 'Delete'}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-slate-50 px-4 py-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Results info */}
            <div className="text-sm text-slate-600">
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredPlans.length)} of {filteredPlans.length}
                {hasActiveFilters && <span className="text-blue-600 font-medium ml-2">(filtered)</span>}
              </span>
              <span className="text-slate-400 ml-2">• Total: {actionPlans.length} items</span>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {/* Previous button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  disabled={currentPage === 1}
                  className="h-9 w-9 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    const showPage = 
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1);
                    
                    if (!showPage) {
                      // Show ellipsis
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2 text-slate-400">...</span>;
                      }
                      return null;
                    }

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className={`h-9 w-9 p-0 ${
                          currentPage === page 
                            ? 'bg-indigo-600 hover:bg-indigo-700' 
                            : ''
                        }`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                {/* Next button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  disabled={currentPage === totalPages}
                  className="h-9 w-9 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
