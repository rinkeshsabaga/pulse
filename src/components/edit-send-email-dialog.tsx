
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Play, Loader2 } from 'lucide-react';
import type { WorkflowStepData } from '@/lib/types';
import { VariableExplorer } from './variable-explorer';
import { resolveVariables } from '@/lib/utils';
import { JsonTreeView } from './json-tree-view';
import { ScrollArea } from './ui/scroll-area';
import { sendEmail, SendEmailInput } from '@/ai/flows/send-email-flow';
import { useToast } from '@/hooks/use-toast';

type EditSendEmailDialogProps = {
  step: WorkflowStepData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
  dataContext?: Record<string, any>;
};

export function EditSendEmailDialog({ open, onOpenChange, onSave, step, dataContext = {} }: EditSendEmailDialogProps) {
  const [to, setTo] = useState('');
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const [isTesting, setIsTesting] = useState(false);
  const [testOutput, setTestOutput] = useState<Record<string, any> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && step.data?.emailData) {
      const { emailData } = step.data;
      setTo(emailData.to || '');
      setFrom(emailData.from || '');
      setSubject(emailData.subject || '');
      setBody(emailData.body || '');
      setTestOutput(null); // Reset test output when dialog opens
    }
  }, [open, step.data]);

  const handleTestAction = async () => {
    setIsTesting(true);
    setTestOutput(null);

    const emailData: SendEmailInput = {
      to: resolveVariables(to, dataContext),
      from: resolveVariables(from, dataContext),
      subject: resolveVariables(subject, dataContext),
      body: resolveVariables(body, dataContext),
    };

    try {
      const result = await sendEmail(emailData);
      setTestOutput({
        status: 'Success',
        details: 'Email sent successfully (simulated).',
        output: result,
      });
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      setTestOutput({
        status: 'Error',
        details: 'Failed to send test email.',
        error: error.message,
      });
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: 'Could not simulate sending the email.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const updatedStep: WorkflowStepData = {
      ...step,
      description: `To: ${to}, Subject: ${subject.substring(0,20)}...`,
      data: {
        ...step.data,
        emailData: { to, from, subject, body },
      },
    };
    onSave(updatedStep);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Mail className="text-primary" />
            Edit Action: Send Email
          </DialogTitle>
          <DialogDescription>
            Compose an email. Use the variable explorer to reference data from previous steps.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4 flex-1 min-h-0">
          {/* Left Column: Configuration */}
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email-to">To</Label>
              <div className="relative">
                <Input id="email-to" placeholder="recipient@example.com" value={to} onChange={e => setTo(e.target.value)} className="pr-10" />
                <div className="absolute top-1/2 -translate-y-1/2 right-1">
                  <VariableExplorer dataContext={dataContext} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-from">From</Label>
              <div className="relative">
                <Input id="email-from" placeholder="sender@example.com" value={from} onChange={e => setFrom(e.target.value)} className="pr-10" />
                <div className="absolute top-1/2 -translate-y-1/2 right-1">
                  <VariableExplorer dataContext={dataContext} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <div className="relative">
                <Input id="email-subject" placeholder="Your Subject Line" value={subject} onChange={e => setSubject(e.target.value)} className="pr-10" />
                <div className="absolute top-1/2 -translate-y-1/2 right-1">
                  <VariableExplorer dataContext={dataContext} />
                </div>
              </div>
            </div>
            <div className="space-y-2 flex-1 flex flex-col">
              <Label htmlFor="email-body">Body</Label>
              <div className="relative flex-1">
                <Textarea
                  id="email-body"
                  placeholder="<p>Hi {{trigger.body.name}},</p><p>Welcome to our service!</p>"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="font-code text-sm pr-10 h-full"
                />
                <div className="absolute top-1 right-1">
                  <VariableExplorer dataContext={dataContext} />
                </div>
              </div>
            </div>
          </div>
          {/* Right Column: Testing */}
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label>Test Action</Label>
              <p className="text-sm text-muted-foreground">
                Click the button to simulate sending this email. No email will actually be sent.
              </p>
              <Button onClick={handleTestAction} disabled={isTesting} className="w-full">
                {isTesting ? <Loader2 className="animate-spin" /> : <Play />}
                Test Action
              </Button>
            </div>
            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <Label>Test Output</Label>
              <ScrollArea className="border rounded-md flex-1 bg-muted/30">
                <div className="p-4">
                  {testOutput ? (
                    <JsonTreeView data={testOutput} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-10 text-center">
                      {isTesting ? (
                        <p>Running simulation...</p>
                      ) : (
                        <p>Click "Test Action" to see a mock response.</p>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
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
