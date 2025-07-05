'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ArrowDown,
  Plus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from './ui/separator';
import type { WorkflowStepData } from './dashboard-layout';

const WorkflowStep = ({ icon: Icon, title, description, children, status }: {
  icon: React.ElementType,
  title: string,
  description: string,
  children?: React.ReactNode,
  status?: 'success' | 'warning' | 'error'
}) => {
  const statusClasses = {
    success: 'border-success',
    warning: 'border-accent',
    error: 'border-destructive',
  }
  return (
    <Card className={`w-full max-w-sm ${status ? statusClasses[status] : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className='flex items-center gap-3'>
                <div className='p-2 bg-accent/20 rounded-lg'>
                     <Icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                    <CardTitle className="text-base font-headline">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
            </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      {children && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  )
};

const FlowArrow = () => (
    <div className="flex flex-col items-center my-2">
        <div className="h-4 w-px bg-border" />
        <ArrowDown className="h-5 w-5 text-muted-foreground" />
    </div>
)

export function WorkflowCanvas({ steps, onCreateNewWorkflow }: { steps: WorkflowStepData[], onCreateNewWorkflow: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline">
            {steps.length > 0 ? 'Onboarding Email Sequence' : 'Untitled Workflow'}
          </h1>
          <p className="text-muted-foreground">
            {steps.length > 0 ? 'Automate sending welcome emails to new users.' : 'Start building your new workflow.'}
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
           <Button variant="outline" onClick={onCreateNewWorkflow}>
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </div>
      
      <Separator />

      <div className="flex flex-col items-center">
        {steps.length > 0 ? (
          steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <WorkflowStep 
                icon={step.icon}
                title={step.title}
                description={step.description}
                status={(step.status === 'default' ? undefined : step.status)}
              >
                {step.content && (
                  <div className='text-sm text-muted-foreground p-4 bg-muted/50 rounded-md'>
                    <pre className="overflow-x-auto">
                      <code className={`language-${step.content.language} font-code text-xs`}>
                        {step.content.code}
                      </code>
                    </pre>
                    <div className='mt-2 flex gap-2'>
                        {step.title.includes('AI') && <Badge variant='outline'>AI Generated</Badge>}
                        <Badge variant='outline'>{step.content.language}</Badge>
                    </div>
                  </div>
                )}
                {step.errorMessage && (
                   <div className='text-sm text-destructive-foreground p-4 bg-destructive/80 rounded-md'>
                    <p className='font-semibold'>{step.errorMessage.title}</p>
                    <p className='opacity-80'>{step.errorMessage.description}</p>
                  </div>
                )}
              </WorkflowStep>
              {index < steps.length - 1 && <FlowArrow />}
            </React.Fragment>
          ))
        ) : (
           <Card className="w-full max-w-sm border-dashed">
            <CardContent className="p-10 text-center">
              <p className="text-muted-foreground font-semibold">Your workflow is empty</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add a step from the sidebar to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
