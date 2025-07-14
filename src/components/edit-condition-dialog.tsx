
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
import type { WorkflowStepData, Case, Rule } from '@/lib/types';
import { Plus, Trash2, GitBranch, GripVertical } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader } from './ui/card';
import { VariableExplorer } from './variable-explorer';
import { Separator } from './ui/separator';

type EditConditionDialogProps = {
  step: WorkflowStepData | null;
  allSteps: WorkflowStepData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
  dataContext?: any;
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

export function EditConditionDialog({ step, allSteps, open, onOpenChange, onSave, dataContext = {} }: EditConditionDialogProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [defaultNextStepId, setDefaultNextStepId] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    if (open && step) {
        const conditionData = step.data?.conditionData;
        if (conditionData && conditionData.cases && conditionData.cases.length > 0) {
            setCases(JSON.parse(JSON.stringify(conditionData.cases))); // Deep copy
            setDefaultNextStepId(conditionData.defaultNextStepId);
        } else {
            // Initialize with a default case if none exist
            setCases([{ id: uuidv4(), name: 'Case 1', rules: [{ id: uuidv4(), variable: '', operator: 'equals', value: '' }], logicalOperator: 'AND', nextStepId: undefined }]);
            setDefaultNextStepId(undefined);
        }
    }
  }, [open, step]);

  const handleSave = () => {
    if (!step) return;
    const updatedStep: WorkflowStepData = {
      ...step,
      description: `${cases.length} case(s) defined`,
      data: {
        ...step.data,
        conditionData: {
          cases: cases,
          defaultNextStepId: defaultNextStepId
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

  const availableNextSteps = allSteps.filter(s => s.id !== step.id && s.type === 'action');

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
                                        <div className="relative">
                                            <Input 
                                                id={`var-${rule.id}`}
                                                placeholder="{{trigger.body.name}}" 
                                                value={rule.variable} 
                                                onChange={e => handleRuleChange(caseItem.id, rule.id, 'variable', e.target.value)} 
                                                className="pr-10"
                                            />
                                            <div className="absolute top-1/2 -translate-y-1/2 right-1">
                                                <VariableExplorer dataContext={dataContext} />
                                            </div>
                                        </div>
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
                                        <div className="relative">
                                            <Input 
                                                id={`val-${rule.id}`}
                                                placeholder="Enter a value" 
                                                value={rule.value} 
                                                onChange={e => handleRuleChange(caseItem.id, rule.id, 'value', e.target.value)} 
                                                disabled={rule.operator === 'is_empty' || rule.operator === 'is_not_empty'}
                                                className="pr-10"
                                            />
                                            <div className="absolute top-1/2 -translate-y-1/2 right-1">
                                                <VariableExplorer dataContext={dataContext} />
                                            </div>
                                        </div>
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
                        <Separator />
                        <div className="space-y-1">
                            <Label htmlFor={`next-step-${caseItem.id}`} className="text-xs">If this case is true, go to:</Label>
                            <Select
                                value={caseItem.nextStepId}
                                onValueChange={(v) => handleCaseChange(caseItem.id, 'nextStepId', v)}
                            >
                                <SelectTrigger id={`next-step-${caseItem.id}`}>
                                    <SelectValue placeholder="Select next step..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableNextSteps.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                                    ))}
                                    <SelectItem value="">End Workflow</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            ))}
            <Button variant="outline" className="w-full border-dashed" onClick={handleAddCase}>
                <Plus className="mr-2 h-4 w-4" /> Add Case
            </Button>
            <Separator />
            <div className="p-4 border rounded-md">
                 <Label htmlFor="default-next-step">Default Case (if no cases match)</Label>
                 <p className="text-xs text-muted-foreground mb-2">Select the step to execute if none of the cases above are true.</p>
                 <Select
                    value={defaultNextStepId}
                    onValueChange={setDefaultNextStepId}
                >
                    <SelectTrigger id="default-next-step">
                        <SelectValue placeholder="Select next step..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableNextSteps.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                        ))}
                         <SelectItem value="">End Workflow</SelectItem>
                    </SelectContent>
                </Select>
            </div>
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
