

'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import * as icons from 'lucide-react';
import type { IconName } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export type StepDefinition = {
  type: 'trigger' | 'action';
  icon: IconName;
  title: string;
  description: string;
};

const actionSteps: StepDefinition[] = [
    { type: 'action' as const, icon: 'AppWindow' as const, title: 'App Action', description: 'Perform an action in an app' },
    { type: 'action' as const, icon: 'GitBranch' as const, title: 'Condition', description: 'Branch workflow on conditions' },
    { type: 'action' as const, icon: 'Clock' as const, title: 'Wait', description: 'Delay workflow execution' },
    { type: 'action' as const, icon: 'Code' as const, title: 'Custom Code', description: 'Write and run custom code' },
    { type: 'action' as const, icon: 'FlaskConical' as const, title: 'Custom AI Function', description: 'Generate code with AI' },
    { type: 'action' as const, icon: 'ArrowRightLeft' as const, title: 'API Request', description: 'Make an HTTP request' },
    { type: 'action' as const, icon: 'Mail' as const, title: 'Send Email', description: 'Send an email' },
    { type: 'action' as const, icon: 'Database' as const, title: 'Database Query', description: 'Interact with a database' },
    { type: 'action' as const, icon: 'StopCircle' as const, title: 'End Automation', description: 'Stops the workflow execution' },
];

const triggerSteps: StepDefinition[] = [
    { type: 'trigger' as const, icon: 'AppWindow' as const, title: 'App Event', description: 'Trigger from an app' },
    { type: 'trigger' as const, icon: 'Webhook' as const, title: 'Webhook', description: 'Trigger via HTTP POST' },
    { type: 'trigger' as const, icon: 'Clock' as const, title: 'Cron Job', description: 'Run on a schedule' },
    { type: 'trigger' as const, icon: 'ShoppingCart' as const, title: 'Shopify', description: 'Trigger on a Shopify event' },
];

const iconMap: Record<IconName, React.ElementType> = {
  Webhook: icons.Webhook,
  Mail: icons.Mail,
  FlaskConical: icons.FlaskConical,
  Database: icons.Database,
  ArrowRightLeft: icons.ArrowRightLeft,
  GitBranch: icons.GitBranch,
  Clock: icons.Clock,
  ShoppingCart: icons.ShoppingCart,
  StopCircle: icons.StopCircle,
  Code: icons.Code,
  AppWindow: icons.AppWindow,
};


type AddStepDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStepSelect: (step: StepDefinition) => void;
  stepType: 'trigger' | 'action';
};

export function AddStepDialog({ open, onOpenChange, onStepSelect, stepType }: AddStepDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const availableSteps = useMemo(() => {
    return stepType === 'trigger' ? triggerSteps : actionSteps;
  }, [stepType]);

  const filteredSteps = useMemo(() => {
    if (!searchTerm) return availableSteps;
    return availableSteps.filter(step => 
      step.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      step.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availableSteps]);

  const handleSelect = (step: StepDefinition) => {
    onStepSelect(step);
    onOpenChange(false);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if(!isOpen) {
        setSearchTerm('');
    }
    onOpenChange(isOpen);
  }
  
  const dialogTitle = stepType === 'trigger' ? 'Add a new trigger' : 'Add a new action';
  const dialogDescription = stepType === 'trigger'
    ? 'Choose a trigger to start your workflow.'
    : 'Choose an action to add to your workflow.';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input 
            placeholder="Search for a step..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <ScrollArea className="h-96">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
              {filteredSteps.map((step) => {
                const Icon = iconMap[step.icon];
                return (
                  <Card 
                    key={step.title} 
                    className="p-4 flex items-start gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleSelect(step)}
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
