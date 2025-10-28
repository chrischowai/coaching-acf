'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FileText, Save, Calendar, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

interface ParsedActionItem {
  id?: string; // Database ID if created
  number: number;
  title: string;
  description: string;
  deadline?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  reminderEnabled?: boolean;
  reminderFrequency?: 'none' | 'daily' | 'weekly' | 'custom';
  notes?: string;
}

interface ActionPlanTableProps {
  actionsText: string;
  sessionId: string;
}

export function ActionPlanTable({ actionsText, sessionId }: ActionPlanTableProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [actionItems, setActionItems] = useState<ParsedActionItem[]>([]);
  const [editedItems, setEditedItems] = useState<Set<number>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize action items - always parse from text, then match with DB records
  useEffect(() => {
    async function initializeActionItems() {
      console.log('Initializing action items for session:', sessionId);
      try {
        // Always parse action items from the session summary text
        const parsedItems = parseActionItems(actionsText);
        console.log('Parsed items from text:', parsedItems.length);
        
        if (parsedItems.length === 0) {
          setIsInitialized(true);
          return;
        }
        
        // Try to get existing action plans from database
        const response = await fetch(`/api/action-plans/by-session/${sessionId}`);
        console.log('Fetch response status:', response.status);
        
        let existingPlans: any[] = [];
        if (response.ok) {
          existingPlans = await response.json() || [];
          console.log('Existing plans in DB:', existingPlans.length);
        }
        
        // Match parsed items with database records by title similarity
        const items = parsedItems.map((parsedItem, index) => {
          // Try to find matching DB record by similar title
          const dbMatch = existingPlans.find(plan => 
            plan.title?.toLowerCase().includes(parsedItem.title.toLowerCase().substring(0, 20)) ||
            parsedItem.title.toLowerCase().includes(plan.title?.toLowerCase().substring(0, 20))
          );
          
          if (dbMatch) {
            // Use database record data
            console.log('Matched parsed item with DB:', parsedItem.title);
            return {
              id: dbMatch.id,
              number: index + 1,
              title: dbMatch.title,
              description: dbMatch.description || parsedItem.description,
              status: dbMatch.status,
              priority: dbMatch.priority,
              dueDate: dbMatch.due_date || parsedItem.deadline || '',
              reminderEnabled: dbMatch.reminder_enabled ?? true,
              reminderFrequency: dbMatch.reminder_frequency || 'daily',
              notes: dbMatch.notes || '',
            };
          } else {
            // Use parsed data with defaults (will be created on first save)
            console.log('No DB match for:', parsedItem.title);
            return {
              number: index + 1,
              title: parsedItem.title,
              description: parsedItem.description,
              status: 'pending' as const,
              priority: 'medium' as const,
              dueDate: parsedItem.deadline || '',
              reminderEnabled: true,
              reminderFrequency: 'daily' as const,
              notes: '',
            };
          }
        });
        
        console.log('Final items to display:', items.length);
        setActionItems(items);
        
        // Create missing items in database
        const itemsWithoutId = items.filter(item => !item.id);
        if (itemsWithoutId.length > 0) {
          console.log('Creating missing items in DB:', itemsWithoutId.length);
          console.log('Items to create:', itemsWithoutId);
          
          try {
            const createResponse = await fetch('/api/action-plans/create-from-summary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                actionItems: itemsWithoutId,
              }),
            });
            
            console.log('Create response status:', createResponse.status);
            
            if (createResponse.ok) {
              const createdPlans = await createResponse.json();
              console.log('Created plans response:', createdPlans);
              
              if (Array.isArray(createdPlans) && createdPlans.length > 0) {
                // Update items with newly created IDs by matching titles
                const updatedItems = items.map((item, index) => {
                  if (!item.id) {
                    // Try to find by exact title match
                    let created = createdPlans.find((p: any) => 
                      p.title.toLowerCase().trim() === item.title.toLowerCase().trim()
                    );
                    
                    // If not found, try by index (order should match)
                    if (!created && createdPlans[index]) {
                      created = createdPlans.find((p: any) => !items.find(i => i.id === p.id));
                    }
                    
                    if (created) {
                      console.log(`Assigning ID ${created.id} to item: ${item.title}`);
                      return { ...item, id: created.id };
                    } else {
                      console.warn('Could not find created plan for item:', item.title);
                    }
                  }
                  return item;
                });
                console.log('Updated items with IDs:', updatedItems);
                setActionItems(updatedItems);
              } else {
                console.error('Created plans response is not an array or is empty:', createdPlans);
              }
            } else {
              const errorData = await createResponse.json();
              console.error('Failed to create items:', errorData);
            }
          } catch (createError) {
            console.error('Exception creating items:', createError);
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing action items:', error);
        // Fallback to parsed items
        const parsedItems = parseActionItems(actionsText).map((item, index) => ({
          ...item,
          number: index + 1,
          status: 'pending' as const,
          priority: 'medium' as const,
          dueDate: item.deadline || '',
          reminderEnabled: true,
          reminderFrequency: 'daily' as const,
          notes: '',
        }));
        setActionItems(parsedItems);
        setIsInitialized(true);
      }
    }
    
    if (!isInitialized) {
      initializeActionItems();
    }
  }, [actionsText, sessionId, isInitialized]);

  function parseActionItems(text: string): ParsedActionItem[] {
    console.log('Parsing action items from text:', text);
    const items: ParsedActionItem[] = [];
    
    if (!text || text.trim().length === 0) {
      console.log('No action text provided');
      return items;
    }
    
    // Split by lines and process each numbered item
    const lines = text.split('\n');
    let currentItem: Partial<ParsedActionItem> | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Match numbered items: "1. **Title:** or "1. **Title**" or "1. Title:"
      const numberMatch = line.match(/^(\d+)\.\s*(.+)/);
      
      if (numberMatch) {
        // Save previous item if exists
        if (currentItem && currentItem.number && currentItem.title) {
          items.push(currentItem as ParsedActionItem);
        }
        
        const number = parseInt(numberMatch[1]);
        let content = numberMatch[2];
        
        // Extract title (remove ** markers)
        let title = '';
        let description = '';
        let deadline = undefined;
        
        // Pattern 1: **Title:** Description
        const titleColonMatch = content.match(/\*\*([^*]+)\*\*:?\s*(.*)/);
        if (titleColonMatch) {
          title = titleColonMatch[1].trim();
          description = titleColonMatch[2].trim();
        } else {
          // Pattern 2: Title: Description (no bold)
          const plainTitleMatch = content.match(/^([^:]+):\s*(.*)/);
          if (plainTitleMatch) {
            title = plainTitleMatch[1].trim();
            description = plainTitleMatch[2].trim();
          } else {
            // Pattern 3: Just text (use first few words as title)
            const words = content.split(' ');
            title = words.slice(0, 5).join(' ');
            description = content;
          }
        }
        
        // Extract deadline
        const deadlineMatch = description.match(/\(Deadline:\s*([^)]+)\)|Deadline:\s*([^\n.]+)/i);
        if (deadlineMatch) {
          deadline = (deadlineMatch[1] || deadlineMatch[2]).trim();
          description = description.replace(/\(Deadline:[^)]+\)|Deadline:[^\n.]+/gi, '').trim();
        }
        
        currentItem = {
          number,
          title,
          description,
          deadline,
        };
      } else if (currentItem && line.length > 0) {
        // Continue description on next lines
        currentItem.description = (currentItem.description || '') + ' ' + line;
        
        // Check for deadline in continuation
        const deadlineMatch = line.match(/\(Deadline:\s*([^)]+)\)|Deadline:\s*([^\n.]+)/i);
        if (deadlineMatch && !currentItem.deadline) {
          currentItem.deadline = (deadlineMatch[1] || deadlineMatch[2]).trim();
          currentItem.description = currentItem.description.replace(/\(Deadline:[^)]+\)|Deadline:[^\n.]+/gi, '').trim();
        }
      }
    }
    
    // Don't forget the last item
    if (currentItem && currentItem.number && currentItem.title) {
      items.push(currentItem as ParsedActionItem);
    }
    
    console.log('Parsed items:', items);
    return items;
  }

  const toggleExpanded = (itemNumber: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemNumber)) {
      newExpanded.delete(itemNumber);
    } else {
      newExpanded.add(itemNumber);
    }
    setExpandedItems(newExpanded);
  };

  const updateField = <K extends keyof ParsedActionItem>(
    itemNumber: number,
    field: K,
    value: ParsedActionItem[K]
  ) => {
    setActionItems(prev =>
      prev.map(item =>
        item.number === itemNumber ? { ...item, [field]: value } : item
      )
    );
    
    // Mark as edited
    setEditedItems(prev => new Set([...prev, itemNumber]));
  };

  const handleSave = async (itemNumber: number) => {
    console.log('handleSave called for item:', itemNumber);
    const item = actionItems.find(i => i.number === itemNumber);
    console.log('Found item:', item);
    
    if (!item) {
      console.error('Item not found');
      return;
    }
    
    if (!item.id) {
      console.error('Item has no ID:', item);
      toast.error('Cannot save: Action item not created in database');
      return;
    }
    
    try {
      const payload = {
        title: item.title,
        description: item.description,
        status: item.status,
        priority: item.priority,
        due_date: item.dueDate || null,
        reminder_enabled: item.reminderEnabled,
        reminder_frequency: item.reminderFrequency,
        notes: item.notes,
      };
      
      console.log('Saving payload:', payload);
      console.log('To URL:', `/api/action-plans/${item.id}`);
      
      const response = await fetch(`/api/action-plans/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error('Failed to save action item');
      }
      
      const result = await response.json();
      console.log('Save successful:', result);
      
      toast.success('Action item saved successfully!');
      
      // Remove from edited set
      setEditedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemNumber);
        return newSet;
      });
    } catch (error) {
      console.error('Error saving action item:', error);
      toast.error('Failed to save action item');
    }
  };

  if (!isInitialized) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-slate-500">
          <p>Loading action items...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (actionItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-slate-500">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p>No action items found in the session summary</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {actionItems.map((item) => {
        const isExpanded = expandedItems.has(item.number);
        const hasChanges = editedItems.has(item.number);
        
        return (
          <Card key={item.number} className="border-2 border-orange-200 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-full text-lg font-bold shadow-md">
                      {item.number}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      value={item.title}
                      onChange={(e) => updateField(item.number, 'title', e.target.value)}
                      className="font-bold text-lg border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 mb-2"
                      placeholder="Action title"
                    />
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateField(item.number, 'description', e.target.value)}
                      className="text-sm leading-relaxed min-h-[60px] resize-none"
                      placeholder="Description..."
                      rows={2}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(item.number)}
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

            {isExpanded && (
              <CardContent className="pt-6 space-y-4">
                {/* Status, Priority, Due Date */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`status-${item.number}`} className="text-sm font-semibold text-slate-700">
                      Status
                    </Label>
                    <select
                      id={`status-${item.number}`}
                      value={item.status}
                      onChange={(e) => updateField(item.number, 'status', e.target.value as any)}
                      className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor={`priority-${item.number}`} className="text-sm font-semibold text-slate-700">
                      Priority
                    </Label>
                    <select
                      id={`priority-${item.number}`}
                      value={item.priority}
                      onChange={(e) => updateField(item.number, 'priority', e.target.value as any)}
                      className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor={`due-date-${item.number}`} className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due Date
                    </Label>
                    <Input
                      id={`due-date-${item.number}`}
                      type="date"
                      value={item.dueDate}
                      onChange={(e) => updateField(item.number, 'dueDate', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Reminder Settings */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="h-4 w-4 text-orange-600" />
                    <h4 className="text-sm font-semibold text-slate-700">Reminder Settings</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`reminder-enabled-${item.number}`}
                        checked={item.reminderEnabled}
                        onChange={(e) => updateField(item.number, 'reminderEnabled', e.target.checked)}
                        className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                      />
                      <Label htmlFor={`reminder-enabled-${item.number}`} className="cursor-pointer text-sm">
                        Enable reminders for this action
                      </Label>
                    </div>

                    {item.reminderEnabled && (
                      <div>
                        <Label htmlFor={`reminder-frequency-${item.number}`} className="text-sm font-semibold text-slate-700">
                          Reminder Frequency
                        </Label>
                        <select
                          id={`reminder-frequency-${item.number}`}
                          value={item.reminderFrequency}
                          onChange={(e) => updateField(item.number, 'reminderFrequency', e.target.value as any)}
                          className="mt-1 w-full md:w-auto border border-slate-300 rounded-md px-3 py-2 bg-white hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="none">None</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes & Reflections */}
                <div className="border-t border-slate-200 pt-4">
                  <Label htmlFor={`notes-${item.number}`} className="text-sm font-semibold text-slate-700 flex items-center gap-1 mb-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    Notes & Reflections
                  </Label>
                  <Textarea
                    id={`notes-${item.number}`}
                    value={item.notes || ''}
                    onChange={(e) => updateField(item.number, 'notes', e.target.value)}
                    placeholder="Add notes, progress updates, or reflections about this action..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Save Button */}
                {hasChanges && (
                  <div className="flex justify-end pt-2">
                    {item.id ? (
                      <Button
                        onClick={() => handleSave(item.number)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    ) : (
                      <div className="text-sm text-slate-500 italic">
                        Creating item in database...
                      </div>
                    )}
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
