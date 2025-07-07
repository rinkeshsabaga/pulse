'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type JsonValueProps = {
  value: any;
  path: string;
};

const JsonValue: React.FC<JsonValueProps> = ({ value, path }) => {
  const { toast } = useToast();
  const type = typeof value;
  
  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`{{${path}}}`);
    toast({
      title: 'Variable path copied!',
      description: `{{${path}}}`,
    });
  };

  let displayClass = '';
  let displayValue = String(value);

  switch (type) {
    case 'string':
      displayClass = 'text-green-600 dark:text-green-400';
      displayValue = `"${value}"`;
      break;
    case 'number':
      displayClass = 'text-blue-600 dark:text-blue-400';
      break;
    case 'boolean':
      displayClass = 'text-purple-600 dark:text-purple-400';
      break;
    case 'object':
      if (value === null) {
        displayClass = 'text-gray-500';
        displayValue = 'null';
      }
      break;
    default:
      displayClass = 'text-gray-500';
  }

  return (
    <span className={cn(displayClass, "cursor-pointer hover:underline")} onClick={copyToClipboard}>
      {displayValue}
    </span>
  );
};

type JsonTreeViewProps = {
  data: any;
  level?: number;
  path?: string;
};

export const JsonTreeView: React.FC<JsonTreeViewProps> = ({ data, level = 0, path = '' }) => {
  const { toast } = useToast();

  if (typeof data !== 'object' || data === null) {
    return <JsonValue value={data} path={path} />;
  }
  
  const entries = Object.entries(data);

  const copyToClipboard = (keyPath: string) => {
    navigator.clipboard.writeText(`{{${keyPath}}}`);
    toast({
      title: 'Object path copied!',
      description: `{{${keyPath}}}`,
    });
  };

  return (
    <div className={cn('font-mono text-xs', level > 0 && 'pl-4')}>
      {entries.map(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;
        return (
          <div key={key}>
            {typeof value === 'object' && value !== null ? (
              <details className="group" open={level < 1}>
                <summary className="flex items-center cursor-pointer list-none -ml-5 pl-1 rounded hover:bg-muted">
                  <ChevronRight className="h-4 w-4 mr-1 transition-transform group-open:rotate-90" />
                  <span className="text-foreground font-semibold" onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(currentPath); }}>{key}:</span>
                  <span className="text-muted-foreground ml-2">
                    {Array.isArray(value) ? `Array(${value.length})` : `Object`}
                  </span>
                </summary>
                <div className="pl-4 border-l border-muted-foreground/20 ml-[calc(-1rem+7px)]">
                  <JsonTreeView data={value} level={level + 1} path={currentPath} />
                </div>
              </details>
            ) : (
              <div className="flex items-start pl-[1px]">
                <span className="text-foreground font-semibold cursor-pointer hover:underline" onClick={(e) => {e.stopPropagation(); copyToClipboard(currentPath)}}>{key}:</span>
                <span className="ml-2">
                  <JsonValue value={value} path={currentPath} />
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  );
};
