
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
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import type { WorkflowStepData, OfficeHoursDay } from '@/lib/types';
import cron from 'cron-parser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type EditCronJobDialogProps = {
  step: WorkflowStepData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
};

type ScheduleMode = 'interval' | 'daily' | 'weekly' | 'monthly' | 'cron';

const dayOptions: { id: OfficeHoursDay; label: string }[] = [
  { id: 'sun', label: 'Sunday' },
  { id: 'mon', label: 'Monday' },
  { id: 'tue', label: 'Tuesday' },
  { id: 'wed', label: 'Wednesday' },
  { id: 'thu', label: 'Thursday' },
  { id: 'fri', label: 'Friday' },
  { id: 'sat', label: 'Saturday' },
];

export function EditCronJobDialog({ step, open, onOpenChange, onSave }: EditCronJobDialogProps) {
  const [mode, setMode] = useState<ScheduleMode>('cron');
  const [intervalValue, setIntervalValue] = useState(10);
  const [intervalUnit, setIntervalUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');
  const [time, setTime] = useState('09:00');
  const [weeklyDays, setWeeklyDays] = useState<OfficeHoursDay[]>(['mon']);
  const [monthlyDates, setMonthlyDates] = useState<Date[] | undefined>([new Date()]);
  const [cronString, setCronString] = useState('* * * * *');
  const [isValidCron, setIsValidCron] = useState(true);
  const [cronValidationMessage, setCronValidationMessage] = useState('');

  useEffect(() => {
    if (open && step.data) {
      const data = step.data;
      setMode(data.scheduleMode || 'cron');
      setIntervalValue(data.scheduleIntervalValue || 10);
      setIntervalUnit(data.scheduleIntervalUnit || 'minutes');
      setTime(data.scheduleTime || '09:00');
      setWeeklyDays(data.scheduleWeeklyDays || ['mon']);
      setMonthlyDates(data.scheduleMonthlyDates?.map(d => {
          const date = new Date();
          date.setDate(d);
          return date;
      }) || [new Date()]);
      setCronString(data.cronString || '* * * * *');
    }
  }, [open, step.data]);

  useEffect(() => {
    try {
      cron.parseExpression(cronString);
      setIsValidCron(true);
      setCronValidationMessage('This is a valid cron expression.');
    } catch (e: any) {
      setIsValidCron(false);
      setCronValidationMessage(e.message || 'Invalid cron expression');
    }
  }, [cronString]);
  
  const handleWeeklyDayToggle = (day: OfficeHoursDay) => {
    setWeeklyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const generateDescription = (): string => {
    switch (mode) {
      case 'interval':
        return `Every ${intervalValue} ${intervalUnit}`;
      case 'daily':
        return `Every day at ${time}`;
      case 'weekly':
        const dayLabels = weeklyDays.length === 7 ? 'every day' : dayOptions
          .filter(d => weeklyDays.includes(d.id))
          .map(d => d.label.substring(0, 3))
          .join(', ');
        return `Weekly on ${dayLabels} at ${time}`;
      case 'monthly':
        const dates = monthlyDates?.map(d => d.getDate()).sort((a,b) => a-b).join(', ');
        return `On day(s) ${dates} of the month at ${time}`;
      case 'cron':
        return `Runs on schedule: ${cronString}`;
      default:
        return 'Custom schedule';
    }
  };


  const handleSave = () => {
    if (mode === 'cron' && !isValidCron) return;
    
    const updatedStep: WorkflowStepData = {
      ...step,
      description: generateDescription(),
      data: {
        ...step.data,
        scheduleMode: mode,
        scheduleIntervalValue: intervalValue,
        scheduleIntervalUnit: intervalUnit,
        scheduleTime: time,
        scheduleWeeklyDays: weeklyDays,
        scheduleMonthlyDates: monthlyDates?.map(d => d.getDate()),
        cronString: cronString,
      },
    };
    onSave(updatedStep);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Clock className="text-primary" />
            Edit Trigger: {step.title}
          </DialogTitle>
          <DialogDescription>
            Set a schedule for this workflow to run automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as ScheduleMode)} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="interval">Interval</TabsTrigger>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="cron">Cron</TabsTrigger>
            </TabsList>
            <TabsContent value="interval" className="pt-4 space-y-4">
              <Label>Run this workflow every...</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input id="interval-value" type="number" value={intervalValue} onChange={e => setIntervalValue(Number(e.target.value))} min={1}/>
                <Select value={intervalUnit} onValueChange={(v) => setIntervalUnit(v as any)}>
                    <SelectTrigger id="interval-unit">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="daily" className="pt-4 space-y-2">
              <Label htmlFor="daily-time">Time</Label>
              <Input id="daily-time" type="time" value={time} onChange={e => setTime(e.target.value)} />
            </TabsContent>
            <TabsContent value="weekly" className="pt-4 space-y-4">
                <div className="space-y-2">
                    <Label>Days of the Week</Label>
                     <div className="grid grid-cols-4 gap-2">
                        {dayOptions.map((day) => (
                            <div key={day.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`weekly_${day.id}`}
                                    checked={weeklyDays.includes(day.id)}
                                    onCheckedChange={() => handleWeeklyDayToggle(day.id)}
                                />
                                <Label htmlFor={`weekly_${day.id}`} className="text-sm font-normal cursor-pointer">{day.label}</Label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="weekly-time">Time</Label>
                    <Input id="weekly-time" type="time" value={time} onChange={e => setTime(e.target.value)} />
                </div>
            </TabsContent>
            <TabsContent value="monthly" className="pt-4 space-y-4">
                <div className="space-y-2">
                    <Label>Days of the Month</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !monthlyDates && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {monthlyDates && monthlyDates.length > 0 ? 
                                monthlyDates.map(d => format(d, 'd')).join(', ') 
                                : <span>Pick one or more dates</span>
                            }
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="multiple"
                                min={1}
                                selected={monthlyDates}
                                onSelect={setMonthlyDates}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="monthly-time">Time</Label>
                    <Input id="monthly-time" type="time" value={time} onChange={e => setTime(e.target.value)} />
                </div>
            </TabsContent>
            <TabsContent value="cron" className="pt-4 space-y-2">
              <Label htmlFor="cron-string">Cron Expression</Label>
                <Input 
                    id="cron-string" 
                    value={cronString} 
                    onChange={e => setCronString(e.target.value)}
                    className={!isValidCron ? 'border-destructive' : ''}
                />
                <p className={`text-sm ${isValidCron ? 'text-muted-foreground' : 'text-destructive'}`}>
                    {cronValidationMessage}
                </p>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={(mode === 'cron' && !isValidCron) || (mode === 'weekly' && weeklyDays.length === 0) || (mode === 'monthly' && (!monthlyDates || monthlyDates.length === 0))}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
