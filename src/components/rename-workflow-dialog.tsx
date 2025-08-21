
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateWorkflow } from '@/services/db';
import { Loader2 } from 'lucide-react';
import type { Workflow } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(3, {
    message: 'Workflow name must be at least 3 characters.',
  }),
});

type RenameWorkflowDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkflowRenamed: () => void;
  workflow: Workflow | null;
};

export function RenameWorkflowDialog({ open, onOpenChange, onWorkflowRenamed, workflow }: RenameWorkflowDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (workflow) {
      form.reset({ name: workflow.name });
    }
  }, [workflow, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!workflow) return;

    setIsSaving(true);
    try {
      // In a real app, you would get the org ID from the user's session
      await updateWorkflow(workflow.id, { name: values.name });
      toast({
        title: 'Workflow Renamed',
        description: `Successfully renamed to "${values.name}".`,
      });
      onOpenChange(false);
      onWorkflowRenamed();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to rename the workflow. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isSaving) {
      onOpenChange(isOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Workflow</DialogTitle>
          <DialogDescription>
            Enter a new name for your workflow.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
