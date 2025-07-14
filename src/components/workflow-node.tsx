
'use client';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
  Card,
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
import type { WorkflowStepData, IconName } from '@/lib/types';
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

type NodeData = {
  step: WorkflowStepData;
  onEdit: (stepId: string) => void;
  onDelete: (stepId: string) => void;
};

const WorkflowNode = memo(({ data, id }: NodeProps<NodeData>) => {
  const { step, onEdit, onDelete } = data;
  
  const isTrigger = step.type === 'trigger';
  const isEndNode = step.title === 'End Automation';
  const isConditionNode = step.title === 'Condition';

  const sourcePosition = Position.Bottom;
  const targetPosition = Position.Top;

  const statusClasses = {
    success: 'border-success',
    warning: 'border-accent',
    error: 'border-destructive',
    default: 'border-border'
  };

  const Icon = iconMap[step.icon];

  return (
    <>
      <Handle
        type="target"
        position={targetPosition}
        id="a"
        className={cn("!bg-primary", isTrigger && "invisible")}
        isConnectable={!isTrigger}
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
                <DropdownMenuItem onClick={() => onEdit(id)} disabled={isEndNode}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(id)}
                  className="text-destructive focus:text-destructive"
                  disabled={isTrigger && !onDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      </Card>
      <Handle
        type="source"
        position={sourcePosition}
        id="b"
        className={cn("!bg-primary", isEndNode && "invisible")}
        isConnectable={!isEndNode && !isConditionNode}
      />
       {isConditionNode && (
        <>
            <Handle
                type="source"
                position={Position.Right}
                id="c" // 'Yes' or 'True' branch
                style={{ top: '50%' }}
                className="!bg-green-500"
            />
             <Handle
                type="source"
                position={Position.Bottom}
                id="d" // 'No' or 'False' or 'Default' branch
                style={{ left: '50%' }}
                className="!bg-red-500"
            />
        </>
      )}
    </>
  );
});

WorkflowNode.displayName = 'WorkflowNode';

export default WorkflowNode;
