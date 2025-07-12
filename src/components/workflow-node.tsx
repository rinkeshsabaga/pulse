
'use client';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WorkflowStepData, IconName, Case } from '@/lib/types';
import { cn } from '@/lib/utils';
import * as icons from 'lucide-react';

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

const HANDLE_BASE_TOP = 45; // Starting top percentage
const HANDLE_SPACING = 25; // Spacing between handles in pixels

const WorkflowNode = memo(({ data }: NodeProps<{ step: WorkflowStepData; onEdit: () => void; onDelete: () => void; }>) => {
  const { step, onEdit, onDelete } = data;
  const isTrigger = step.type === 'trigger';
  const isEndNode = step.title === 'End Automation';
  const isConditional = step.title === 'Condition';
  
  const cases = step.data?.conditionData?.cases || [];

  const statusClasses = {
    success: 'border-success',
    warning: 'border-accent',
    error: 'border-destructive',
    default: 'border-border'
  };

  const Icon = iconMap[step.icon];

  const renderHandles = () => {
    if (!isConditional) {
      return (
         <Handle
          type="source"
          position={Position.Right}
          className="!bg-muted-foreground/80"
          style={{ visibility: isEndNode ? 'hidden' : 'visible' }}
        />
      );
    }
    
    const totalHandles = cases.length + 1; // cases + default
    const totalHeight = totalHandles * HANDLE_SPACING;
    const startTop = `calc(50% - ${totalHeight / 2}px)`;

    return (
      <>
        {cases.map((caseItem: Case, index: number) => (
           <React.Fragment key={caseItem.id}>
             <Handle
                type="source"
                position={Position.Right}
                id={caseItem.name}
                style={{ top: `calc(${startTop} + ${index * HANDLE_SPACING}px)` }}
                className="!bg-primary"
            />
            <div className="absolute right-[-70px] text-xs text-foreground font-semibold" style={{ top: `calc(${startTop} + ${index * HANDLE_SPACING}px)`, transform: 'translateY(-50%)' }}>
                {caseItem.name}
            </div>
           </React.Fragment>
        ))}
         <React.Fragment>
            <Handle
                type="source"
                position={Position.Right}
                id="default"
                style={{ top: `calc(${startTop} + ${cases.length * HANDLE_SPACING}px)` }}
                className="!bg-muted-foreground"
            />
             <div className="absolute right-[-70px] text-xs text-muted-foreground font-semibold" style={{ top: `calc(${startTop} + ${cases.length * HANDLE_SPACING}px)`, transform: 'translateY(-50%)' }}>
                Default
            </div>
         </React.Fragment>
      </>
    );
  }

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-muted-foreground/80"
        isConnectable={!isTrigger}
        style={{ visibility: isTrigger ? 'hidden' : 'visible' }}
      />
      <Card
        className={cn(
          'w-80 shrink-0 transition-shadow hover:shadow-lg relative group',
          statusClasses[step.status || 'default']
        )}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                {Icon && <Icon className="h-6 w-6 text-primary" />}
              </div>
              <div>
                <CardTitle className="text-md font-semibold font-headline flex items-left gap-2">
                  {step.title}
                  <Badge variant="outline" className="capitalize font-medium">
                    {step.type}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-sm">
                  {step.description}
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit} disabled={isEndNode}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        {(step.content || step.errorMessage) && (
          <CardContent>
            {step.content && (
              <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-md">
                <pre className="overflow-x-auto">
                  <code
                    className={`language-${step.content.language} font-code text-xs`}
                  >
                    {step.content.code}
                  </code>
                </pre>
                <div className="mt-2 flex gap-2">
                  {step.title.includes('AI') && (
                    <Badge variant="outline">AI Generated</Badge>
                  )}
                  <Badge variant="outline">{step.content.language}</Badge>
                </div>
              </div>
            )}
            {step.errorMessage && (
              <div className="text-sm text-destructive-foreground p-4 bg-destructive/80 rounded-md">
                <p className="font-semibold">{step.errorMessage.title}</p>
                <p className="opacity-80">{step.errorMessage.description}</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
      
      {renderHandles()}
    </>
  );
});

WorkflowNode.displayName = 'WorkflowNode';

export default WorkflowNode;
