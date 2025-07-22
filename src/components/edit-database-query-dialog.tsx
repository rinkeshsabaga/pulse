
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
import { Database, Play, Loader2 } from 'lucide-react';
import type { WorkflowStepData, Credential } from '@/lib/types';
import { VariableExplorer } from './variable-explorer';
import { JsonTreeView } from './json-tree-view';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getCredentials } from '@/lib/db';
import { databaseQuery } from '@/ai/flows/database-query-flow';

type EditDatabaseQueryDialogProps = {
  step: WorkflowStepData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
  dataContext?: Record<string, any>;
};

export function EditDatabaseQueryDialog({ open, onOpenChange, onSave, step, dataContext = {} }: EditDatabaseQueryDialogProps) {
  const [credentialId, setCredentialId] = useState('');
  const [query, setQuery] = useState('');
  const [credentials, setCredentials] = useState<Credential[]>([]);
  
  const [isTesting, setIsTesting] = useState(false);
  const [testOutput, setTestOutput] = useState<Record<string, any> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCredentials = async () => {
      // In a real app, you would get org ID from the user's session
      const creds = await getCredentials();
      setCredentials(creds);
    };
    if (open) {
      fetchCredentials();
      const { databaseQueryData } = step.data || {};
      setCredentialId(databaseQueryData?.credentialId || '');
      setQuery(databaseQueryData?.query || 'SELECT * FROM users LIMIT 10;');
      setTestOutput(null);
    }
  }, [open, step.data]);

  const handleTestAction = async () => {
    if (!credentialId) {
        toast({
            variant: 'destructive',
            title: 'No Credential Selected',
            description: 'Please select a database connection credential.',
        });
        return;
    }

    setIsTesting(true);
    setTestOutput(null);

    try {
      const result = await databaseQuery({ credentialId, query, dataContext });
      setTestOutput({
        status: result.success ? 'Success' : 'Error',
        details: result.error || 'Query executed successfully (simulated).',
        output: result.rows,
      });
    } catch (error: any) {
      console.error('Failed to run test query:', error);
      setTestOutput({
        status: 'Error',
        details: 'Failed to simulate running the query.',
        error: error.message,
      });
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: 'Could not simulate running the query.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const updatedStep: WorkflowStepData = {
      ...step,
      description: `Runs query: ${query.substring(0, 30)}...`,
      data: {
        ...step.data,
        databaseQueryData: { credentialId, query },
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
            <Database className="text-primary" />
            Edit Action: Database Query
          </DialogTitle>
          <DialogDescription>
            Connect to a database and run a SQL query. Use the variable explorer for dynamic values.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 py-4 flex-1 min-h-0">
          {/* Left Column: Configuration */}
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="db-credential">Database Connection</Label>
              <Select value={credentialId} onValueChange={setCredentialId}>
                <SelectTrigger id="db-credential">
                  <SelectValue placeholder="Select a connection..." />
                </SelectTrigger>
                <SelectContent>
                  {credentials.map(cred => (
                    <SelectItem key={cred.id} value={cred.id}>
                      {cred.appName} ({cred.accountName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 flex-1 flex flex-col">
              <Label htmlFor="sql-query">SQL Query</Label>
              <div className="relative flex-1">
                <Textarea
                  id="sql-query"
                  placeholder="SELECT * FROM users WHERE id = {{trigger.body.userId}};"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
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
              <Label>Test Query</Label>
              <p className="text-sm text-muted-foreground">
                Click the button to simulate this query. No actual database connection will be made.
              </p>
              <Button onClick={handleTestAction} disabled={isTesting || !credentialId} className="w-full">
                {isTesting ? <Loader2 className="animate-spin" /> : <Play />}
                Test Query
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
                        <p>Click "Test Query" to see a mock response.</p>
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
