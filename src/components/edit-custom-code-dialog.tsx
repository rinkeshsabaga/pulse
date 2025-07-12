
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
import { VariableExplorer } from './variable-explorer';
import { ScrollArea } from './ui/scroll-area';
import { JsonTreeView } from './json-tree-view';

type EditCustomCodeDialogProps = {
  step: WorkflowStepData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
  dataContext?: any;
};

export function EditCustomCodeDialog({
  step,
  open,
  onOpenChange,
  onSave,
  dataContext = {},
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
  
  const getContextAccessSyntax = () => {
      switch(language) {
          case 'python':
              return 'context.get("trigger", {}).get("body", {})';
          case 'javascript':
          case 'typescript':
          default:
              return 'context.trigger?.body';
      }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl grid-rows-[auto_1fr_auto] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Icon className="text-primary" />
            Edit Action: {step.title}
          </DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 py-4 flex-1 min-h-0">
          {/* Left Column: Editor */}
          <div className="flex flex-col gap-4">
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
            <div className="space-y-2 flex-1 flex flex-col">
              <Label htmlFor="code-editor">Code</Label>
              <Textarea
                id="code-editor"
                placeholder="// Your custom code goes here"
                rows={15}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-code text-sm bg-muted/50 h-full"
              />
            </div>
          </div>
          {/* Right Column: Context Explorer */}
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label>Available Data</Label>
              <p className="text-sm text-muted-foreground">
                Access data from previous steps via the `context` object. Click a path to copy it. Example: <code className="text-xs bg-muted p-1 rounded-sm">{getContextAccessSyntax()}</code>
              </p>
            </div>
            <ScrollArea className="border rounded-md flex-1 bg-muted/30">
               <div className="p-4">
                 {Object.keys(dataContext).length > 0 ? (
                    <JsonTreeView data={dataContext} />
                 ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-10 text-center">
                        <p>No data from previous steps is available.</p>
                    </div>
                 )}
               </div>
            </ScrollArea>
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
