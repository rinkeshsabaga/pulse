'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Code2 } from 'lucide-react';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { JsonTreeView } from './json-tree-view';
import { cn } from '@/lib/utils';

type VariableExplorerProps = {
  dataContext: Record<string, any>;
  className?: string;
};

export function VariableExplorer({ dataContext, className }: VariableExplorerProps) {
  // Search functionality is a future enhancement
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Browse variables" className={cn("h-7 w-7", className)}>
          <Code2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Variables</h4>
          <p className="text-sm text-muted-foreground">
            Click any variable path to copy it to your clipboard.
          </p>
        </div>
        <div className="mt-4">
          <Input 
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled // Disabled for now
          />
          <ScrollArea className="h-72 mt-2">
            <JsonTreeView data={dataContext} />
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
