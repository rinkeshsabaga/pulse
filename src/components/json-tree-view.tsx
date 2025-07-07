
'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type JsonTreeViewProps = {
  data: any;
  level?: number;
};

const JsonValue = ({ value }: { value: any }) => {
  const type = typeof value;
  switch (type) {
    case 'string':
      return <span className="text-green-600 dark:text-green-400">"{value}"</span>;
    case 'number':
      return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
    case 'boolean':
      return <span className="text-purple-600 dark:text-purple-400">{String(value)}</span>;
    case 'object':
      if (value === null) {
        return <span className="text-gray-500">null</span>;
      }
      return null; // Handled by JsonTreeView
    default:
      return <span className="text-gray-500">{String(value)}</span>;
  }
};


export const JsonTreeView: React.FC<JsonTreeViewProps> = ({ data, level = 0 }) => {
  if (typeof data !== 'object' || data === null) {
    return <JsonValue value={data} />;
  }

  const isArray = Array.isArray(data);
  const entries = Object.entries(data);

  return (
    <div className={cn('font-mono text-sm', level > 0 && 'pl-4')}>
      {entries.map(([key, value]) => (
        <div key={key}>
          {typeof value === 'object' && value !== null ? (
            <details className="group" open={level < 2}>
              <summary className="flex items-center cursor-pointer list-none">
                <ChevronRight className="h-4 w-4 mr-1 transition-transform group-open:rotate-90" />
                <span className="text-foreground font-semibold">{key}:</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  {Array.isArray(value) ? `Array(${value.length})` : `Object`}
                </span>
              </summary>
              <div className="pl-4 border-l border-muted-foreground/20 ml-[7px]">
                 <JsonTreeView data={value} level={level + 1} />
              </div>
            </details>
          ) : (
            <div className="flex items-start pl-[23px] relative">
               <span className="text-foreground font-semibold">{key}:</span>
              <span className="ml-2">
                <JsonValue value={value} />
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
