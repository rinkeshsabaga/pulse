
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRightLeft, Plus, Trash2, Loader2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import type { WorkflowStepData, ApiRequestAuth, RequestBody, FormUrlEncodedPair } from '@/lib/types';
import { resolveVariables } from '@/lib/utils';

type EditApiRequestDialogProps = {
  step: WorkflowStepData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
  dataContext?: Record<string, any>;
};

export function EditApiRequestDialog({ open, onOpenChange, onSave, step, dataContext }: EditApiRequestDialogProps) {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [url, setUrl] = useState('https://api.example.com/data');
  const [headers, setHeaders] = useState<{ id: string; key: string; value: string }[]>([]);
  const [body, setBody] = useState<RequestBody>({ type: 'none', content: '' });
  const [auth, setAuth] = useState<ApiRequestAuth>({ type: 'none' });

  const [testResponse, setTestResponse] = useState<Record<string, any> | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && step.data) {
      const data = step.data;
      setMethod(data?.method || 'GET');
      setUrl(data?.apiUrl || 'https://api.example.com/data');
      setHeaders(data?.headers || []);
      setBody(data?.body || { type: 'none', content: '' });
      setAuth(data?.auth || { type: 'none' });
      setTestResponse(null); // Reset test response on open
    }
  }, [open, step.data]);

  const handleHeaderChange = (id: string, field: 'key' | 'value', value: string) => {
    setHeaders(headers.map(h => (h.id === id ? { ...h, [field]: value } : h)));
  };

  const addHeader = () => {
    setHeaders([...headers, { id: uuidv4(), key: '', value: '' }]);
  };

  const removeHeader = (id: string) => {
    setHeaders(headers.filter(h => h.id !== id));
  };

  const handleFormPairChange = (id: string, field: 'key' | 'value', value: string) => {
    if (body.type === 'form-urlencoded' && Array.isArray(body.content)) {
      const newContent = body.content.map(p => (p.id === id ? { ...p, [field]: value } : p));
      setBody({ ...body, content: newContent });
    }
  };

  const addFormPair = () => {
    if (body.type === 'form-urlencoded') {
      const currentContent = Array.isArray(body.content) ? body.content : [];
      const newContent = [...currentContent, { id: uuidv4(), key: '', value: '' }];
      setBody({ ...body, content: newContent });
    }
  };

  const removeFormPair = (id: string) => {
    if (body.type === 'form-urlencoded' && Array.isArray(body.content)) {
      const newContent = body.content.filter(p => p.id !== id);
      setBody({ ...body, content: newContent });
    }
  };

  const handleContinue = () => {
    const updatedStep: WorkflowStepData = {
      ...step,
      description: `${method} to ${url.substring(0, 30)}${url.length > 30 ? '...' : ''}`,
      data: {
        ...step.data,
        method,
        apiUrl: url,
        headers,
        body,
        auth,
      },
    };
    onSave(updatedStep);
    onOpenChange(false);
  };

  const handleTestAction = async () => {
    setIsTesting(true);
    setTestResponse(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const resolvedUrl = resolveVariables(url, dataContext || {});
      const resolvedHeaders = headers.map(h => ({
        ...h,
        value: resolveVariables(h.value, dataContext || {}),
      }));

      let resolvedBody: any = body.content;
      if (body.type === 'json' && typeof body.content === 'string') {
        resolvedBody = resolveVariables(body.content, dataContext || {});
      } else if (body.type === 'form-urlencoded' && Array.isArray(body.content)) {
        resolvedBody = body.content.map(p => ({
          ...p,
          value: resolveVariables(p.value, dataContext || {}),
        }));
      }

      // This is a mock response for demonstration
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json',
          'x-request-id': `req_${uuidv4()}`,
        },
        request: {
          method,
          url: resolvedUrl,
          headers: resolvedHeaders,
          body: resolvedBody,
        },
        body: {
          message: 'This is a successful mock response!',
          data: {
            id: 123,
            name: 'Test Item',
            resolvedFromContext: `Value for 'trigger.body.user.name' might be ${resolveVariables('{{trigger.body.user.name}}', dataContext || {})}`,
          },
        },
      };

      setTestResponse(mockResponse);
      toast({ title: 'Test Successful', description: 'Mock response received.' });
    } catch (error: any) {
      setTestResponse({ error: true, message: error.message });
      toast({ variant: 'destructive', title: 'Test Failed', description: error.message });
    } finally {
      setIsTesting(false);
    }
  };

  const renderBodyInputs = () => {
    switch (body.type) {
      case 'json':
        return (
          <div className="space-y-2">
            <Textarea
              value={body.content as string}
              onChange={e => setBody({ ...body, content: e.target.value })}
              placeholder={'{\n  "key": "value",\n  "nested": {\n    "id": "{{trigger.body.user.id}}"\n  }\n}'}
              rows={10}
              className="font-code text-sm"
            />
          </div>
        );
      case 'form-urlencoded':
        const formContent = Array.isArray(body.content) ? body.content : [];
        return (
          <div className="space-y-2">
            {formContent.map(pair => (
              <div key={pair.id} className="flex gap-2 items-center">
                <Input placeholder="Key" value={pair.key} onChange={e => handleFormPairChange(pair.id, 'key', e.target.value)} />
                <Input placeholder="Value" value={pair.value} onChange={e => handleFormPairChange(pair.id, 'value', e.target.value)} />
                <Button variant="ghost" size="icon" onClick={() => removeFormPair(pair.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFormPair}>
              <Plus className="mr-2 h-4 w-4" /> Add field
            </Button>
          </div>
        );
      default:
        return <p className="text-sm text-muted-foreground p-4 text-center">No body for this request method or type.</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <ArrowRightLeft className="text-primary" />
            Edit Action: API Request
          </DialogTitle>
          <DialogDescription>
            Configure an HTTP request to an external service. Use `{"{{variable}}"}` syntax to use data from previous steps.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 flex-1 min-h-0">
          {/* Left Column: Configuration */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <Select value={method} onValueChange={v => setMethod(v as any)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="https://api.example.com/users" value={url} onChange={e => setUrl(e.target.value)} />
            </div>

            <Tabs defaultValue="headers" className="flex-1 flex flex-col">
              <TabsList>
                <TabsTrigger value="auth">Authentication</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="body">Body</TabsTrigger>
              </TabsList>
              <ScrollArea className="flex-1">
                <div className="p-1">
                  <TabsContent value="auth" className="mt-4 space-y-4">
                    <Label>Authentication Method</Label>
                    <Select value={auth.type} onValueChange={v => setAuth({ type: v as any })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="apiKey">API Key</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                      </SelectContent>
                    </Select>
                    {auth.type === 'bearer' && (
                      <div className="space-y-2">
                        <Label htmlFor="bearer-token">Bearer Token</Label>
                        <Input id="bearer-token" type="password" placeholder="{{credential.my_api_key}}" value={auth.token || ''} onChange={e => setAuth({ ...auth, token: e.target.value })} />
                      </div>
                    )}
                    {auth.type === 'apiKey' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="api-key">API Key</Label>
                          <Input id="api-key" type="password" placeholder="Enter your API key or use a variable" value={auth.apiKey || ''} onChange={e => setAuth({ ...auth, apiKey: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="api-key-header">Header Name</Label>
                          <Input id="api-key-header" placeholder="X-API-KEY" value={auth.apiKeyHeaderName || ''} onChange={e => setAuth({ ...auth, apiKeyHeaderName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Add to</Label>
                          <Select value={auth.apiKeyLocation || 'header'} onValueChange={v => setAuth({ ...auth, apiKeyLocation: v as any })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="header">Request Header</SelectItem>
                              <SelectItem value="query">Query Params</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    {auth.type === 'basic' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" placeholder="Username or variable" value={auth.username || ''} onChange={e => setAuth({ ...auth, username: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input type="password" id="password" placeholder="Password or variable" value={auth.password || ''} onChange={e => setAuth({ ...auth, password: e.target.value })} />
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="headers" className="mt-4 space-y-2">
                    {headers.map(header => (
                      <div key={header.id} className="flex gap-2 items-center">
                        <Input placeholder="Key" value={header.key} onChange={e => handleHeaderChange(header.id, 'key', e.target.value)} />
                        <Input placeholder="Value" value={header.value} onChange={e => handleHeaderChange(header.id, 'value', e.target.value)} />
                        <Button variant="ghost" size="icon" onClick={() => removeHeader(header.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addHeader}>
                      <Plus className="mr-2 h-4 w-4" /> Add header
                    </Button>
                  </TabsContent>
                  <TabsContent value="body" className="mt-4">
                    <Select value={body.type} onValueChange={v => setBody({ type: v as any, content: v === 'form-urlencoded' ? [] : '' })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="form-urlencoded">Form URL-Encoded</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="pt-4">{renderBodyInputs()}</div>
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </div>

          {/* Right Column: Testing */}
          <div className="flex flex-col gap-4">
            <Button onClick={handleTestAction} disabled={isTesting} className="w-full">
              {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Test Action
            </Button>
            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <Label>Test Response</Label>
              <ScrollArea className="border rounded-md flex-1 bg-muted/30">
                <div className="p-4">
                  {testResponse ? (
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(testResponse, null, 2)}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-10 text-center">
                      <p>Click "Test Action" to see a mock response here.</p>
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
          <Button type="button" onClick={handleContinue}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
