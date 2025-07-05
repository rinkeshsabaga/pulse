'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Code,
  Copy,
  Loader2,
  Sparkles,
  FlaskConical,
} from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  generateFunctionFromIntent,
  GenerateFunctionFromIntentInput,
} from '@/ai/flows/generate-function-from-intent';

const formSchema = z.object({
  intent: z.string().min(10, {
    message: 'Please describe your function in at least 10 characters.',
  }),
  language: z.enum(['typescript', 'python', 'javascript']),
});

type AIFunctionGeneratorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFunctionGenerated: (code: string, language: string, intent: string) => void;
};

export function AIFunctionGenerator({
  open,
  onOpenChange,
  onFunctionGenerated,
}: AIFunctionGeneratorProps) {
  const { toast } = useToast();
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      intent: '',
      language: 'typescript',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    setGeneratedCode('');
    try {
      const result = await generateFunctionFromIntent(
        values as GenerateFunctionFromIntentInput
      );
      setGeneratedCode(result.functionCode);
    } catch (error) {
      console.error('Failed to generate function:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate the function. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    toast({
      title: 'Copied to clipboard!',
      description: 'The function code has been copied.',
    });
  };
  
  const handleAddToWorkflow = () => {
    onFunctionGenerated(generatedCode, form.getValues('language'), form.getValues('intent'));
    onOpenChange(false);
  }

  const resetForm = () => {
    setGeneratedCode('');
    form.reset();
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] grid-rows-[auto_1fr_auto]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <FlaskConical className="text-primary" />
            Generate Function with AI
          </DialogTitle>
          <DialogDescription>
            Describe what the function should do, and we&apos;ll generate the
            code for you.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 overflow-y-auto">
          {generatedCode ? (
            <div className="space-y-4">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={handleCopyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <pre className="bg-muted rounded-md p-4 text-sm overflow-x-auto">
                  <code
                    className={`language-${form.getValues('language')} font-code`}
                  >
                    {generatedCode}
                  </code>
                </pre>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="intent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Function Intent</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 'Create a function that takes two numbers and returns their sum.'"
                          rows={5}
                          {...field}
                          disabled={isGenerating}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isGenerating}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="typescript">TypeScript</SelectItem>
                          <SelectItem value="javascript">JavaScript</SelectItem>
                          <SelectItem value="python">Python</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate Function
                </Button>
              </form>
            </Form>
          )}
        </div>
        <DialogFooter>
          {generatedCode && (
             <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={() => setGeneratedCode('')}>
                    Generate another
                </Button>
                <Button onClick={handleAddToWorkflow}>
                    <Code className="mr-2 h-4 w-4" /> Add to Workflow
                </Button>
             </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
