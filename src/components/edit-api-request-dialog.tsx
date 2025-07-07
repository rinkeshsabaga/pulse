
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { WorkflowStepData, RequestBody } from '@/lib/types';
import { Plus, Trash2, ArrowRightLeft, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { resolveVariables } from '@/lib/utils';
import { JsonTreeView } from '@/components/json-tree-view';

type EditApiRequestDialogProps = {
  step: WorkflowStepData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
  dataContext?: Record<string, any>;
};

export function EditApiRequestDialog({ step, open, onOpenChange, onSave, dataContext = {} }: EditApiRequestDialogProps) {
  const [method, setMethod] = useState(step.data?.method || 'GET');
  const [apiUrl, setApiUrl] = useState(step.data?.apiUrl || '');
  const [auth, setAuth] = useState(step.data?.auth || { type: 'none' });
  const [headers, setHeaders] = useState(step.data?.headers || []);
  const [body, setBody] = useState<RequestBody>(step.data?.body || { type: 'none', content: '' });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  
  useEffect(() => {
    if (open) {
      setMethod(step.data?.method || 'GET');
      setApiUrl(step.data?.apiUrl || '');
      setAuth(step.data?.auth || { type: 'none' });
      setHeaders(step.data?.headers?.map(h => ({...h, id: h.id || uuidv4()})) || []);
      setBody(step.data?.body || { type: 'none', content: '' });
      setTestResult(null);
    }
  }, [open, step.data]);

  const handleSave = () => {
    const updatedStep: WorkflowStepData = {
      ...step,
      data: {
        ...step.data,
        method,
        apiUrl,
        auth,
        headers,
        body,
      },
    };
    onSave(updatedStep);
    onOpenChange(false);
  };
  
  const handleTestAction = async () => {
    setIsTesting(true);
    setTestResult(null);

    // This is a MOCK API call. In a real app, this would use fetch.
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    try {
      const resolvedUrl = resolveVariables(apiUrl, dataContext);
      const resolvedHeaders = headers.map(h => ({ ...h, value: resolveVariables(h.value, dataContext) }));
      
      let resolvedBody: any = body.content;
      if (body.type === 'json' && typeof body.content === 'string') {
          resolvedBody = resolveVariables(body.content, dataContext);
          try {
              resolvedBody = JSON.parse(resolvedBody);
          } catch (e) {
             throw new Error("Failed to parse JSON body after resolving variables.");
          }
      } else if (body.type === 'form-urlencoded' && Array.isArray(body.content)) {
          resolvedBody = body.content.map(p => ({...p, value: resolveVariables(p.value, dataContext)}));
      }
      
      const mockResponse = {
        status: 200,
        statusText: "OK (Mocked)",
        data: {
            message: "This is a mocked response from your test.",
            request: {
                method,
                url: resolvedUrl,
                headers: resolvedHeaders,
                body: resolvedBody
            }
        }
      };
      setTestResult(mockResponse);

    } catch(e: any) {
        setTestResult({
            status: 'ERROR',
            message: e.message || 'An error occurred during testing.'
        });
    } finally {
        setIsTesting(false);
    }
  };


  const handleAddHeader = () => {
    setHeaders([...headers, { id: uuidv4(), key: '', value: '' }]);
  };

  const handleRemoveHeader = (id: string) => {
    setHeaders(headers.filter((h) => h.id !== id));
  };
  
  const handleHeaderChange = (id: string, field: 'key' | 'value', value: string) => {
    setHeaders(headers.map(h => h.id === id ? {...h, [field]: value} : h));
  };

  const handleBodyTypeChange = (type: 'none' | 'json' | 'form-urlencoded') => {
    if (type === 'form-urlencoded') {
      setBody({ type, content: [] });
    } else {
      setBody({ type, content: '' });
    }
  };

  const handleAddFormPair = () => {
    const currentContent = Array.isArray(body.content) ? body.content : [];
    setBody({ ...body, content: [...currentContent, { id: uuidv4(), key: '', value: '' }] });
  };

  const handleRemoveFormPair = (id: string) => {
    if (Array.isArray(body.content)) {
      setBody({ ...body, content: body.content.filter((p) => p.id !== id) });
    }
  };
  
  const handleFormPairChange = (id: string, field: 'key' | 'value', value: string) => {
    if (Array.isArray(body.content)) {
      setBody({ ...body, content: body.content.map(p => p.id === id ? {...p, [field]: value} : p) });
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <ArrowRightLeft className="text-primary" />
            Edit Action: {step.title}
          </DialogTitle>
          <DialogDescription>
            Configure the API request. Use `{{variable.path}}` to use data from previous steps.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 py-4 flex-1 min-h-0">
            <div className="space-y-6 flex flex-col overflow-y-auto pr-2">
                <div className="flex items-end gap-2">
                    <div className="w-32">
                        <Label htmlFor="method">Method</Label>
                        <Select value={method} onValueChange={(v) => setMethod(v as any)}>
                            <SelectTrigger id="method">
                                <SelectValue placeholder="Method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="PATCH">PATCH</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1">
                        <Label htmlFor="api-url">URL</Label>
                        <Input id="api-url" value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="https://api.example.com/resource" />
                    </div>
                </div>

                <Tabs defaultValue="auth" className="flex-1 flex flex-col">
                    <TabsList>
                        <TabsTrigger value="auth">Authorization</TabsTrigger>
                        <TabsTrigger value="headers">Headers</TabsTrigger>
                        <TabsTrigger value="body">Body</TabsTrigger>
                    </TabsList>
                    <TabsContent value="auth" className="pt-4">
                        <p className="text-sm text-muted-foreground mb-4">Choose the authentication method for your request.</p>
                        <Select value={auth.type} onValueChange={(type) => setAuth({ type: type as any })}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="bearer">Bearer Token</SelectItem>
                                <SelectItem value="basic">Basic Auth</SelectItem>
                                <SelectItem value="apiKey">API Key</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        {auth.type === 'bearer' && (
                            <div className="mt-4 space-y-2">
                                <Label htmlFor="bearer-token">Token</Label>
                                <Input id="bearer-token" value={auth.token || ''} onChange={e => setAuth({...auth, token: e.target.value})} placeholder="your-bearer-token"/>
                            </div>
                        )}
                        {auth.type === 'basic' && (
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="basic-user">Username</Label>
                                    <Input id="basic-user" value={auth.username || ''} onChange={e => setAuth({...auth, username: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="basic-pass">Password</Label>
                                    <Input id="basic-pass" type="password" value={auth.password || ''} onChange={e => setAuth({...auth, password: e.target.value})} />
                                </div>
                            </div>
                        )}
                        {auth.type === 'apiKey' && (
                            <div className="mt-4 space-y-4">
                                <div className="space-y-2">
                                <Label htmlFor="api-key-value">API Key</Label>
                                <Input id="api-key-value" type="password" value={auth.apiKey || ''} onChange={e => setAuth({...auth, apiKey: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="api-key-header">Header Name</Label>
                                    <Input id="api-key-header" value={auth.apiKeyHeaderName || 'X-API-Key'} onChange={e => setAuth({...auth, apiKeyHeaderName: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Add to</Label>
                                    <Select value={auth.apiKeyLocation || 'header'} onValueChange={(loc) => setAuth({...auth, apiKeyLocation: loc as any})}>
                                        <SelectTrigger className="w-48">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="header">Header</SelectItem>
                                            <SelectItem value="query">Query Params</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent value="headers" className="pt-4">
                        <p className="text-sm text-muted-foreground mb-4">Add custom headers to your request.</p>
                        <div className="space-y-2">
                            {headers.map((header) => (
                            <div key={header.id} className="flex items-center gap-2">
                                <Input placeholder="Key" value={header.key} onChange={e => handleHeaderChange(header.id, 'key', e.target.value)} />
                                <Input placeholder="Value" value={header.value} onChange={e => handleHeaderChange(header.id, 'value', e.target.value)} />
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveHeader(header.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" className="mt-4" onClick={handleAddHeader}>
                            <Plus className="mr-2 h-4 w-4" /> Add Header
                        </Button>
                    </TabsContent>
                    <TabsContent value="body" className="pt-4 flex-1 flex flex-col">
                        <RadioGroup
                            value={body.type}
                            onValueChange={(v) => handleBodyTypeChange(v as any)}
                            className="flex items-center gap-6 mb-4"
                            disabled={method === 'GET' || method === 'DELETE'}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="none" id="body-none" />
                                <Label htmlFor="body-none">None</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="json" id="body-json" />
                                <Label htmlFor="body-json">JSON</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="form-urlencoded" id="body-form" />
                                <Label htmlFor="body-form">x-www-form-urlencoded</Label>
                            </div>
                        </RadioGroup>
                        
                        {body.type === 'json' && (
                            <div className="flex-1 flex flex-col">
                                <p className="text-sm text-muted-foreground mb-2">Define the request body. Use JSON for POST, PUT, and PATCH requests.</p>
                                <Textarea 
                                    placeholder='{ "key": "value" }'
                                    rows={10}
                                    value={typeof body.content === 'string' ? body.content : ''}
                                    onChange={e => setBody({ ...body, content: e.target.value })}
                                    className="font-code text-sm flex-1"
                                    disabled={method === 'GET' || method === 'DELETE'}
                                />
                            </div>
                        )}

                        {body.type === 'form-urlencoded' && Array.isArray(body.content) && (
                            <div>
                                <p className="text-sm text-muted-foreground mb-4">Add form data key-value pairs.</p>
                                <div className="space-y-2">
                                    {body.content.map((pair) => (
                                        <div key={pair.id} className="flex items-center gap-2">
                                            <Input placeholder="Key" value={pair.key} onChange={e => handleFormPairChange(pair.id, 'key', e.target.value)} disabled={method === 'GET' || method === 'DELETE'} />
                                            <Input placeholder="Value" value={pair.value} onChange={e => handleFormPairChange(pair.id, 'value', e.target.value)} disabled={method === 'GET' || method === 'DELETE'} />
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveFormPair(pair.id)} disabled={method === 'GET' || method === 'DELETE'}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="outline" size="sm" className="mt-4" onClick={handleAddFormPair} disabled={method === 'GET' || method === 'DELETE'}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Pair
                                </Button>
                            </div>
                        )}
                        
                        {(method === 'GET' || method === 'DELETE') && body.type !== 'none' && (
                            <p className="text-xs text-muted-foreground mt-2">Body is not applicable for GET or DELETE requests. The selected body will be ignored.</p>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
             <div className="space-y-4 flex flex-col">
                <Label>Test Response</Label>
                <div className="border rounded-md flex-1 bg-muted/30 p-4 overflow-y-auto">
                    {isTesting && (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span>Running test...</span>
                        </div>
                    )}
                    {!isTesting && testResult ? (
                        <JsonTreeView data={testResult} />
                    ) : !isTesting && (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground text-center">
                            <p>Click "Test Action" to see a mock response based on your configuration.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleTestAction} disabled={isTesting}>
            {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Test Action
          </Button>
          <div className="flex-grow" />
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
