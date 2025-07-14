
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
import type { WorkflowStepData, ParallelBranch } from '@/lib/types';
import { Plus, Trash2, Split, GripVertical } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';

type EditParallelDialogProps = {
  step: WorkflowStepData | null;
  allSteps: WorkflowStepData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
};

const END_WORKFLOW_VALUE = 'END_WORKFLOW';

export function EditParallelDialog({ step, allSteps, open, onOpenChange, onSave }: EditParallelDialogProps) {
  const [branches, setBranches] = useState<ParallelBranch[]>([]);
  
  useEffect(() => {
    if (open && step) {
        const parallelData = step.data?.branches;
        if (parallelData && parallelData.length > 0) {
            setBranches(JSON.parse(JSON.stringify(parallelData))); // Deep copy
        } else {
            // Initialize with default branches if none exist
            setBranches([
                { id: uuidv4(), name: 'Branch 1', nextStepId: undefined },
                { id: uuidv4(), name: 'Branch 2', nextStepId: undefined }
            ]);
        }
    }
  }, [open, step]);

  const handleSave = () => {
    if (!step) return;
    const updatedStep: WorkflowStepData = {
      ...step,
      description: `${branches.length} parallel branch(es)`,
      data: {
        ...step.data,
        branches: branches,
      },
    };
    onSave(updatedStep);
    onOpenChange(false);
  };
  
  const handleAddBranch = () => {
    setBranches(prev => [
        ...prev, 
        { id: uuidv4(), name: `Branch ${prev.length + 1}`, nextStepId: undefined }
    ]);
  }

  const handleRemoveBranch = (branchId: string) => {
    setBranches(prev => prev.filter(b => b.id !== branchId));
  }
  
  const handleBranchChange = (branchId: string, field: keyof Omit<ParallelBranch, 'id'>, value: any) => {
      setBranches(prev => prev.map(b => b.id === branchId ? { ...b, [field]: value } : b));
  }

  if (!step) return null;

  const availableNextSteps = allSteps.filter(s => s.id !== step.id && s.type === 'action');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Split className="text-primary" />
            Edit Action: {step.title}
          </DialogTitle>
          <DialogDescription>
            Define multiple branches that will run at the same time. Each branch can start a separate sequence of actions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            {branches.map((branch, branchIndex) => (
                <Card key={branch.id} className="bg-muted/30">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex items-center gap-4">
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                            <div className="flex-1 space-y-1.5">
                                    <Label htmlFor={`branch-name-${branch.id}`}>Branch Name</Label>
                                    <Input 
                                        id={`branch-name-${branch.id}`}
                                        placeholder="Branch Name" 
                                        value={branch.name}
                                        onChange={(e) => handleBranchChange(branch.id, 'name', e.target.value)}
                                        className="font-semibold"
                                    />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveBranch(branch.id)} disabled={branches.length <= 1}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        </div>
                         <div className="space-y-1 pl-10">
                            <Label htmlFor={`next-step-${branch.id}`} className="text-xs">Starts with step:</Label>
                            <Select
                                value={branch.nextStepId || END_WORKFLOW_VALUE}
                                onValueChange={(v) => handleBranchChange(branch.id, 'nextStepId', v === END_WORKFLOW_VALUE ? undefined : v)}
                            >
                                <SelectTrigger id={`next-step-${branch.id}`}>
                                    <SelectValue placeholder="Select next step..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableNextSteps.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                                    ))}
                                    <SelectItem value={END_WORKFLOW_VALUE}>End this Branch</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            ))}
            <Button variant="outline" className="w-full border-dashed" onClick={handleAddBranch}>
                <Plus className="mr-2 h-4 w-4" /> Add Branch
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
