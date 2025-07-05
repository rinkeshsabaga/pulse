
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
import type { WorkflowStepData, ConditionData, Case, Rule } from '@/lib/types';
import { Plus, Trash2, GitBranch, GripVertical } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader } from './ui/card';

type EditConditionDialogProps = {
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

export function EditConditionDialog({ step, open, onOpenChange, onSave }: EditConditionDialogProps) {
  const [cases, setCases] = useState<Case[]>([]);
  
  useEffect(() => {
    if (open && step?.data?.conditionData) {
      setCases(step.data.conditionData.cases || []);
    } else if (open) {
      setCases([{ id: uuidv4(), name: 'Case 1', rules: [{ id: uuidv4(), variable: '', operator: 'equals', value: '' }], logicalOperator: 'AND' }]);
    }
  }, [open, step?.data]);

  const handleSave = () => {
    if (!step) return;
    const updatedStep: WorkflowStepData = {
      ...step,
      description: `${cases.length} case(s) defined`,
      data: {
        ...step.data,
        conditionData: {
          cases: cases
        },
      },
    };
    onSave(updatedStep);
    onOpenChange(false);
  };
  
  const handleAddCase = () => {
    setCases(prev => [
        ...prev, 
        { id: uuidv4(), name: `Case ${prev.length + 1}`, rules: [{ id: uuidv4(), variable: '', operator: 'equals', value: '' }], logicalOperator: 'AND' }
    ]);
  }

  const handleRemoveCase = (caseId: string) => {
    setCases(prev => prev.filter(c => c.id !== caseId));
  }
  
  const handleCaseChange = (caseId: string, field: keyof Omit<Case, 'id' | 'rules'>, value: any) => {
      setCases(prev => prev.map(c => c.id === caseId ? { ...c, [field]: value } : c));
  }

  const handleAddRule = (caseId: string) => {
      setCases(prev => prev.map(c => c.id === caseId ? { ...c, rules: [...c.rules, { id: uuidv4(), variable: '', operator: 'equals', value: '' }] } : c));
  }
  
  const handleRemoveRule = (caseId: string, ruleId: string) => {
      setCases(prev => prev.map(c => c.id === caseId ? { ...c, rules: c.rules.filter(r => r.id !== ruleId) } : c));
  }

  const handleRuleChange = (caseId: string, ruleId: string, field: keyof Omit<Rule, 'id'>, value: string) => {
      setCases(prev => prev.map(c => c.id === caseId ? { ...c, rules: c.rules.map(r => r.id === ruleId ? { ...r, [field]: value } : r) } : c));
  }

  if (!step) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <GitBranch className="text-primary" />
            Edit Action: {step.title}
          </DialogTitle>
          <DialogDescription>
            Define multiple cases to create different branches in your workflow. The first case that evaluates to true will be executed.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            {cases.map((caseItem, caseIndex) => (
                <Card key={caseItem.id} className="bg-muted/30">
                    <CardHeader className="flex flex-row items-center justify-between p-4">
                       <div className="flex items-center gap-2 flex-1">
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                            <Input 
                                placeholder="Case Name" 
                                value={caseItem.name}
                                onChange={(e) => handleCaseChange(caseItem.id, 'name', e.target.value)}
                                className="text-md font-semibold w-auto flex-1"
                            />
                       </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveCase(caseItem.id)} disabled={cases.length <= 1}>
                           <Trash2 className="h-4 w-4 text-destructive" />
                       </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                        <RadioGroup
                            value={caseItem.logicalOperator}
                            onValueChange={(v) => handleCaseChange(caseItem.id, 'logicalOperator', v as 'AND' | 'OR')}
                            className="flex items-center gap-4"
                        >
                            <Label className="text-xs">Rules must match:</Label>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="AND" id={`op-and-${caseItem.id}`} />
                                <Label htmlFor={`op-and-${caseItem.id}`} className="font-normal">All (AND)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="OR" id={`op-or-${caseItem.id}`} />
                                <Label htmlFor={`op-or-${caseItem.id}`} className="font-normal">Any (OR)</Label>
                            </div>
                        </RadioGroup>
                        <div className="space-y-2">
                            {caseItem.rules.map(rule => (
                                <div key={rule.id} className="flex items-end gap-2">
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor={`var-${rule.id}`} className="text-xs">Variable</Label>
                                        <Input 
                                            id={`var-${rule.id}`}
                                            placeholder="{{trigger.body.name}}" 
                                            value={rule.variable} 
                                            onChange={e => handleRuleChange(caseItem.id, rule.id, 'variable', e.target.value)} 
                                        />
                                    </div>
                                    <div className="w-48 space-y-1">
                                        <Label htmlFor={`op-${rule.id}`} className="text-xs">Operator</Label>
                                        <Select 
                                            value={rule.operator} 
                                            onValueChange={(v) => handleRuleChange(caseItem.id, rule.id, 'operator', v)}
                                        >
                                            <SelectTrigger id={`op-${rule.id}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {operatorOptions.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor={`val-${rule.id}`} className="text-xs">Value</Label>
                                        <Input 
                                            id={`val-${rule.id}`}
                                            placeholder="Enter a value" 
                                            value={rule.value} 
                                            onChange={e => handleRuleChange(caseItem.id, rule.id, 'value', e.target.value)} 
                                            disabled={rule.operator === 'is_empty' || rule.operator === 'is_not_empty'}
                                        />
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleRemoveRule(caseItem.id, rule.id)}
                                        disabled={caseItem.rules.length <= 1}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleAddRule(caseItem.id)}>
                            <Plus className="mr-2 h-4 w-4" /> Add Rule
                        </Button>
                    </CardContent>
                </Card>
            ))}
            <Button variant="outline" className="w-full border-dashed" onClick={handleAddCase}>
                <Plus className="mr-2 h-4 w-4" /> Add Case
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
