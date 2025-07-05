
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { WorkflowStepData } from '@/lib/types';
import { Code, FlaskConical } from 'lucide-react';

type EditCustomCodeDialogProps = {
  step: WorkflowStepData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
};

export function EditCustomCodeDialog({
  step,
  open,
  onOpenChange,
  onSave,
}: EditCustomCodeDialogProps) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('typescript');

  useEffect(() => {
    if (open && step?.content) {
      setCode(step.content.code);
      setLanguage(step.content.language);
    }
  }, [open, step]);

  const handleSave = () => {
    if (!step) return;

    const updatedStep: WorkflowStepData = {
      ...step,
      content: {
        ...step.content,
        code,
        language,
      },
      description: step.title === 'Custom Code' ? `Custom ${language} code snippet` : step.description,
    };
    onSave(updatedStep);
    onOpenChange(false);
  };

  if (!step) return null;

  const isAiFunction = step.title === 'Custom AI Function';
  const Icon = isAiFunction ? FlaskConical : Code;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl grid-rows-[auto_1fr_auto]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Icon className="text-primary" />
            Edit Action: {step.title}
          </DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language" className="w-48">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code-editor">Code</Label>
            <Textarea
              id="code-editor"
              placeholder="// Your custom code goes here"
              rows={15}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-code text-sm bg-muted/50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
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
