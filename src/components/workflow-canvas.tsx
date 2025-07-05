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
  ArrowRight,
  Plus,
  Workflow
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from './ui/separator';
import type { WorkflowStepData } from './dashboard-layout';

const WorkflowStep = ({ icon: Icon, title, description, children, status, type }: {
  icon: React.ElementType,
  title: string,
  description: string,
  children?: React.ReactNode,
  status?: 'success' | 'warning' | 'error',
  type: 'trigger' | 'action'
}) => {
  const statusClasses = {
    success: 'border-success',
    warning: 'border-accent',
    error: 'border-destructive',
  }
  return (
    <Card className={`w-80 shrink-0 transition-shadow hover:shadow-lg ${status ? statusClasses[status] : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className='flex items-center gap-3'>
                <div className='p-3 bg-primary/10 rounded-lg'>
                     <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-md font-semibold font-headline flex items-center gap-2">
                        {title}
                        <Badge variant="outline" className="capitalize font-medium">{type}</Badge>
                    </CardTitle>
                    <CardDescription className="text-sm">{description}</CardDescription>
                </div>
            </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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

const FlowConnector = () => (
    <div className="flex items-center justify-center h-full px-4 shrink-0">
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
    </div>
);

export function WorkflowCanvas({ steps, onCreateNewWorkflow }: { steps: WorkflowStepData[], onCreateNewWorkflow: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline">
            {steps.length > 0 ? 'Onboarding Email Sequence' : 'Untitled Workflow'}
          </h1>
          <p className="text-muted-foreground">
            {steps.length > 0 ? 'A sequence of automated actions.' : 'Start building your new workflow by adding steps.'}
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

      <div className="flex min-h-[400px] items-center">
        {steps.length > 0 ? (
          <div className="overflow-x-auto w-full pb-4 -mx-6 px-6">
            <div className="inline-flex items-start gap-4">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <WorkflowStep 
                    icon={step.icon}
                    title={step.title}
                    description={step.description}
                    status={(step.status === 'default' ? undefined : step.status)}
                    type={step.type}
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
                  {index < steps.length - 1 && <FlowConnector />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
           <div className="flex-1 flex items-center justify-center">
             <Card className="w-full max-w-lg border-dashed bg-muted/30 hover:border-primary/50 transition-colors">
                <CardContent className="p-10 text-center flex flex-col items-center">
                    <div className="p-3 bg-primary/10 rounded-full mb-4">
                        <Workflow className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-foreground font-semibold">Your workflow canvas is empty</p>
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
