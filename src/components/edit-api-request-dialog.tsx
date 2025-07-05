
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
import type { WorkflowStepData } from '@/lib/types';
import { Plus, Trash2, ArrowRightLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type EditApiRequestDialogProps = {
  step: WorkflowStepData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
};

export function EditApiRequestDialog({ step, open, onOpenChange, onSave }: EditApiRequestDialogProps) {
  const [method, setMethod] = useState(step.data?.method || 'GET');
  const [apiUrl, setApiUrl] = useState(step.data?.apiUrl || '');
  const [auth, setAuth] = useState(step.data?.auth || { type: 'none' });
  const [headers, setHeaders] = useState(step.data?.headers || []);
  const [body, setBody] = useState(step.data?.body || '');
  
  useEffect(() => {
    if (open) {
      setMethod(step.data?.method || 'GET');
      setApiUrl(step.data?.apiUrl || '');
      setAuth(step.data?.auth || { type: 'none' });
      setHeaders(step.data?.headers?.map(h => ({...h, id: h.id || uuidv4()})) || []);
      setBody(step.data?.body || '');
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

  const handleAddHeader = () => {
    setHeaders([...headers, { id: uuidv4(), key: '', value: '' }]);
  };

  const handleRemoveHeader = (id: string) => {
    setHeaders(headers.filter((h) => h.id !== id));
  };
  
  const handleHeaderChange = (id: string, field: 'key' | 'value', value: string) => {
    setHeaders(headers.map(h => h.id === id ? {...h, [field]: value} : h));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <ArrowRightLeft className="text-primary" />
            Edit Action: {step.title}
          </DialogTitle>
          <DialogDescription>{step.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
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

            <Tabs defaultValue="auth">
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
                <TabsContent value="body" className="pt-4">
                     <p className="text-sm text-muted-foreground mb-2">Define the request body. Use JSON for POST, PUT, and PATCH requests.</p>
                     <Textarea 
                        placeholder='{ "key": "value" }'
                        rows={10}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        className="font-code text-sm"
                        disabled={method === 'GET' || method === 'DELETE'}
                     />
                     {(method === 'GET' || method === 'DELETE') && (
                        <p className="text-xs text-muted-foreground mt-2">Body is not applicable for GET or DELETE requests.</p>
                     )}
                </TabsContent>
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
