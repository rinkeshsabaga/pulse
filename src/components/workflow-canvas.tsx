'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  MoreVertical,
  ArrowRight,
  ArrowDown,
  Plus,
  Workflow,
  GripVertical,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from './ui/separator';
import type { WorkflowStepData } from './dashboard-layout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function SortableWorkflowStep({
  step,
  isTrigger,
  onEdit,
  onDelete,
}: {
  step: WorkflowStepData;
  isTrigger: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id, disabled: isTrigger });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  const statusClasses = {
    success: 'border-success',
    warning: 'border-accent',
    error: 'border-destructive',
  };

  const Icon = step.icon;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={cn(
          'w-80 shrink-0 transition-shadow hover:shadow-lg relative group',
          step.status &&
            statusClasses[step.status as keyof typeof statusClasses]
        )}
      >
        {!isTrigger && (
          <div
            {...listeners}
            className="absolute -left-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/50 group-hover:text-muted-foreground cursor-grab"
          >
            <GripVertical className="h-5 w-5" />
          </div>
        )}
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-md font-semibold font-headline flex items-center gap-2">
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
            {!isTrigger ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
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
            ) : (
              <div className="h-8 w-8 shrink-0" /> // Placeholder to maintain layout
            )}
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
    </div>
  );
}

const FlowConnector = ({ direction = 'horizontal' }: { direction?: 'horizontal' | 'vertical' }) => {
    if (direction === 'vertical') {
        return (
            <div className="flex items-center justify-center w-full py-4 shrink-0">
                <ArrowDown className="h-5 w-5 text-muted-foreground" />
            </div>
        );
    }
    return (
        <div className="flex items-center justify-center h-full px-4 shrink-0">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
    );
};


export function WorkflowCanvas({
  steps,
  setSteps,
  onCreateNewWorkflow,
}: {
  steps: WorkflowStepData[];
  setSteps: (steps: WorkflowStepData[]) => void;
  onCreateNewWorkflow: () => void;
}) {
  const { toast } = useToast();
  const [layout, setLayout] = React.useState<'horizontal' | 'vertical'>('horizontal');
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);

      if (
        steps[oldIndex].type === 'trigger' ||
        (steps[newIndex] && steps[newIndex].type === 'trigger')
      ) {
        return;
      }

      setSteps(arrayMove(steps, oldIndex, newIndex));
    }
  }

  const handleDeleteStep = (stepIdToDelete: string) => {
    setSteps(steps.filter((step) => step.id !== stepIdToDelete));
    toast({
      title: 'Step Deleted',
      description: 'The step has been removed from your workflow.',
    });
  };

  const handleEditStep = (stepToEdit: WorkflowStepData) => {
    toast({
      title: 'Coming Soon!',
      description: `Editing for "${stepToEdit.title}" is not yet implemented.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline">
            {steps.length > 0 ? 'Onboarding Email Sequence' : 'Untitled Workflow'}
          </h1>
          <p className="text-muted-foreground">
            {steps.length > 0
              ? 'A sequence of automated actions.'
              : 'Start building your new workflow by adding steps.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {steps.length > 0 && (
            <>
              <Select defaultValue="1.3">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1.3">Version 1.3 (latest)</SelectItem>
                  <SelectItem value="1.2">Version 1.2</SelectItem>
                  <SelectItem value="1.1">Version 1.1</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Play className="mr-2 h-4 w-4" />
                Run Workflow
              </Button>
            </>
          )}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
            <Button
              variant={layout === 'horizontal' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setLayout('horizontal')}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Horizontal Layout</span>
            </Button>
            <Button
              variant={layout === 'vertical' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setLayout('vertical')}
            >
              <List className="h-4 w-4" />
              <span className="sr-only">Vertical Layout</span>
            </Button>
          </div>
          <Button variant="outline" onClick={onCreateNewWorkflow}>
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </div>

      <Separator />

      <div className={cn(
        "flex min-h-[400px]",
        layout === 'horizontal' ? 'items-start' : 'items-center justify-center'
      )}>
        {steps.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={steps.map((s) => s.id)}
              strategy={layout === 'horizontal' ? horizontalListSortingStrategy : verticalListSortingStrategy}
            >
              <div className={cn(
                "w-full pb-4",
                layout === 'horizontal' && 'overflow-x-auto -mx-6 px-6'
              )}>
                <div className={cn(
                  "gap-4",
                  layout === 'horizontal' ? "inline-flex items-start" : "flex flex-col items-center"
                )}>
                  {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                      <SortableWorkflowStep
                        step={step}
                        isTrigger={step.type === 'trigger'}
                        onEdit={() => handleEditStep(step)}
                        onDelete={() => handleDeleteStep(step.id)}
                      />
                      {index < steps.length - 1 && <FlowConnector direction={layout} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-lg border-dashed bg-muted/30 hover:border-primary/50 transition-colors">
              <CardContent className="p-10 text-center flex flex-col items-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <Workflow className="h-8 w-8 text-primary" />
                </div>
                <p className="text-foreground font-semibold">
                  Your workflow canvas is empty
                </p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                  Use the sidebar to add steps and build out your automation.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
