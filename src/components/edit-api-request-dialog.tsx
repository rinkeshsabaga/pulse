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
import { ArrowRightLeft, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { WorkflowStepData, ApiRequestAuth, RequestBody, FormUrlEncodedPair } from '@/lib/types';
import { VariableExplorer } from './variable-explorer';

type EditApiRequestDialogProps = {
  step: WorkflowStepData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
  dataContext?: Record<string, any>;
};

export function EditApiRequestDialog({ open, onOpenChange, onSave, step, dataContext = {} }: EditApiRequestDialogProps) {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<{ id: string; key: string; value: string }[]>([]);
  const [body, setBody] = useState<RequestBody>({ type: 'none', content: '' });
  const [auth, setAuth] = useState<ApiRequestAuth>({ type: 'none' });

  useEffect(() => {
    if (open && step.data) {
      const data = step.data;
      setMethod(data.method || 'GET');
      setUrl(data.apiUrl || '');
      setHeaders(data.headers || []);
      setBody(data.body || { type: 'none', content: '' });
      setAuth(data.auth || { type: 'none' });
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

  const handleSave = () => {
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
  
  const handleBodyTypeChange = (value: string) => {
    const type = value as RequestBody['type'];
    if (type === 'form-urlencoded') {
        setBody({ type, content: [] });
    } else {
        setBody({ type, content: '' });
    }
  }

  const renderBodyInputs = () => {
    switch (body.type) {
      case 'json':
        return (
            <div className="relative">
                <Textarea
                    value={typeof body.content === 'string' ? body.content : JSON.stringify(body.content, null, 2)}
                    onChange={e => setBody({ ...body, content: e.target.value })}
                    placeholder={'{\n  "key": "value",\n  "nested": {\n    "id": "{{trigger.body.user.id}}"\n  }\n}'}
                    rows={10}
                    className="font-code text-sm pr-10"
                />
                 <div className="absolute top-1 right-1">
                    <VariableExplorer dataContext={dataContext} />
                </div>
            </div>
        );
      case 'form-urlencoded':
        const formContent = Array.isArray(body.content) ? body.content : [];
        return (
          <div className="space-y-2">
            {formContent.map(pair => (
              <div key={pair.id} className="flex gap-2 items-center">
                <Input placeholder="Key" value={pair.key} onChange={e => handleFormPairChange(pair.id, 'key', e.target.value)} />
                 <div className="relative flex-1">
                    <Input placeholder="Value" value={pair.value} onChange={e => handleFormPairChange(pair.id, 'value', e.target.value)} className="pr-10" />
                    <div className="absolute top-1/2 -translate-y-1/2 right-1">
                        <VariableExplorer dataContext={dataContext} />
                    </div>
                 </div>
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
        return <p className="text-sm text-muted-foreground p-4 text-center bg-muted/50 rounded-md">No body for this request.</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <ArrowRightLeft className="text-primary" />
            Edit Action: API Request
          </DialogTitle>
          <DialogDescription>
            Configure an HTTP request to an external service. Click the icon to browse available variables from previous steps.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 flex-1 min-h-0">
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
              <div className="relative flex-1">
                <Input placeholder="https://api.example.com/users" value={url} onChange={e => setUrl(e.target.value)} className="pr-10" />
                <div className="absolute top-1/2 -translate-y-1/2 right-1">
                    <VariableExplorer dataContext={dataContext} />
                </div>
              </div>
            </div>

            <Tabs defaultValue="body" className="flex-1 flex flex-col">
              <TabsList>
                <TabsTrigger value="auth">Auth</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="body">Body</TabsTrigger>
              </TabsList>
              
              <div className="mt-4 flex-1">
                  <TabsContent value="auth" className="space-y-4">
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
                          <Label htmlFor="api-key-val">API Key</Label>
                          <Input id="api-key-val" type="password" placeholder="Enter your API key or use a variable" value={auth.apiKey || ''} onChange={e => setAuth({ ...auth, apiKey: e.target.value })} />
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

                  <TabsContent value="headers" className="space-y-2">
                    {headers.map(header => (
                      <div key={header.id} className="flex gap-2 items-center">
                        <Input placeholder="Key" value={header.key} onChange={e => handleHeaderChange(header.id, 'key', e.target.value)} />
                        <div className="relative flex-1">
                          <Input placeholder="Value" value={header.value} onChange={e => handleHeaderChange(header.id, 'value', e.target.value)} className="pr-10" />
                          <div className="absolute top-1/2 -translate-y-1/2 right-1">
                            <VariableExplorer dataContext={dataContext} />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeHeader(header.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addHeader}>
                      <Plus className="mr-2 h-4 w-4" /> Add header
                    </Button>
                  </TabsContent>

                  <TabsContent value="body" className="space-y-4">
                     <Select value={body.type} onValueChange={handleBodyTypeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="json">JSON (application/json)</SelectItem>
                        <SelectItem value="form-urlencoded">Form URL-Encoded</SelectItem>
                      </SelectContent>
                    </Select>
                    <div>{renderBodyInputs()}</div>
                  </TabsContent>
              </div>
            </Tabs>
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
