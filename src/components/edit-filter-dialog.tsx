'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import type { WorkflowStepData, FilterData, FilterCondition } from '@/lib/types';
import { Plus, Trash2, Filter as FilterIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type EditFilterDialogProps = {
  step: WorkflowStepData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
};

const operatorOptions = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
];

export function EditFilterDialog({ step, open, onOpenChange, onSave }: EditFilterDialogProps) {
  const [filterData, setFilterData] = useState<FilterData>({ conditions: [], logicalOperator: 'AND' });
  
  useEffect(() => {
    if (open && step?.data?.filterData) {
      setFilterData(step.data.filterData);
    } else if (open) {
      // Default state if no data is present
      setFilterData({
        conditions: [{ id: uuidv4(), variable: '', operator: 'equals', value: '' }],
        logicalOperator: 'AND',
      });
    }
  }, [open, step?.data]);

  const handleSave = () => {
    if (!step) return;
    const updatedStep: WorkflowStepData = {
      ...step,
      description: `Runs if conditions are met`,
      data: {
        ...step.data,
        filterData,
      },
    };
    onSave(updatedStep);
    onOpenChange(false);
  };

  const handleAddCondition = () => {
    setFilterData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { id: uuidv4(), variable: '', operator: 'equals', value: '' }]
    }));
  };

  const handleRemoveCondition = (id: string) => {
    setFilterData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((c) => c.id !== id)
    }));
  };
  
  const handleConditionChange = (id: string, field: keyof Omit<FilterCondition, 'id'>, value: string) => {
    setFilterData(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => c.id === id ? {...c, [field]: value} : c)
    }));
  }

  if (!step) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <FilterIcon className="text-primary" />
            Edit Action: {step.title}
          </DialogTitle>
          <DialogDescription>
            Define conditions to control the workflow path. The workflow will only continue if these conditions are met.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <RadioGroup
                value={filterData.logicalOperator}
                onValueChange={(v) => setFilterData(prev => ({ ...prev, logicalOperator: v as 'AND' | 'OR' }))}
                className="flex items-center gap-4"
            >
                <Label>Conditions must match:</Label>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="AND" id="op-and" />
                    <Label htmlFor="op-and">All (AND)</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="OR" id="op-or" />
                    <Label htmlFor="op-or">Any (OR)</Label>
                </div>
            </RadioGroup>

            <div className="space-y-3">
                {filterData.conditions.map((condition) => (
                   <div key={condition.id} className="flex items-end gap-2 p-3 bg-muted/50 rounded-lg">
                       <div className="flex-1 space-y-2">
                           <Label htmlFor={`var-${condition.id}`}>Variable</Label>
                           <Input 
                               id={`var-${condition.id}`}
                               placeholder="{{trigger.body.name}}" 
                               value={condition.variable} 
                               onChange={e => handleConditionChange(condition.id, 'variable', e.target.value)} 
                           />
                       </div>
                       <div className="w-48 space-y-2">
                           <Label htmlFor={`op-${condition.id}`}>Operator</Label>
                           <Select 
                               value={condition.operator} 
                               onValueChange={(v) => handleConditionChange(condition.id, 'operator', v)}
                           >
                               <SelectTrigger id={`op-${condition.id}`}>
                                   <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                   {operatorOptions.map(opt => (
                                       <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                   ))}
                               </SelectContent>
                           </Select>
                       </div>
                        <div className="flex-1 space-y-2">
                           <Label htmlFor={`val-${condition.id}`}>Value</Label>
                           <Input 
                               id={`val-${condition.id}`}
                               placeholder="Enter a value" 
                               value={condition.value} 
                               onChange={e => handleConditionChange(condition.id, 'value', e.target.value)} 
                               disabled={condition.operator === 'is_empty' || condition.operator === 'is_not_empty'}
                           />
                       </div>
                       <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveCondition(condition.id)}
                            disabled={filterData.conditions.length <= 1}
                        >
                           <Trash2 className="h-4 w-4 text-destructive" />
                       </Button>
                   </div>
                ))}
            </div>

             <Button variant="outline" size="sm" onClick={handleAddCondition}>
                 <Plus className="mr-2 h-4 w-4" /> Add Condition
             </Button>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
