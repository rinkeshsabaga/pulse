
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Clock, CalendarDays } from 'lucide-react';
import type { WorkflowStepData, WaitMode, OfficeHoursDay } from '@/lib/types';

type EditWaitDialogProps = {
  step: WorkflowStepData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (step: WorkflowStepData) => void;
};

const officeDays: { id: OfficeHoursDay; label: string }[] = [
  { id: 'sun', label: 'Sunday' },
  { id: 'mon', label: 'Monday' },
  { id: 'tue', label: 'Tuesday' },
  { id: 'wed', label: 'Wednesday' },
  { id: 'thu', label: 'Thursday' },
  { id: 'fri', label: 'Friday' },
  { id: 'sat', label: 'Saturday' },
];

export function EditWaitDialog({ step, open, onOpenChange, onSave }: EditWaitDialogProps) {
  const [mode, setMode] = useState<WaitMode>('duration');
  const [durationValue, setDurationValue] = useState(5);
  const [durationUnit, setDurationUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');
  const [dateTime, setDateTime] = useState<Date | undefined>(new Date());
  const [officeHoursDays, setOfficeHoursDays] = useState<OfficeHoursDay[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [officeHoursStartTime, setOfficeHoursStartTime] = useState('09:00');
  const [officeHoursEndTime, setOfficeHoursEndTime] = useState('17:00');
  const [officeHoursAction, setOfficeHoursAction] = useState<'wait' | 'proceed'>('wait');
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    if (open && step?.data) {
      const data = step.data;
      setMode(data.waitMode || 'duration');
      setDurationValue(data.waitDurationValue || 5);
      setDurationUnit(data.waitDurationUnit || 'minutes');
      setDateTime(data.waitDateTime ? new Date(data.waitDateTime) : new Date());
      setOfficeHoursDays(data.waitOfficeHoursDays || ['mon', 'tue', 'wed', 'thu', 'fri']);
      setOfficeHoursStartTime(data.waitOfficeHoursStartTime || '09:00');
      setOfficeHoursEndTime(data.waitOfficeHoursEndTime || '17:00');
      setOfficeHoursAction(data.waitOfficeHoursAction || 'wait');
      setTimestamp(data.waitTimestamp || '');
    }
  }, [open, step]);

  const handleDayToggle = (day: OfficeHoursDay) => {
    setOfficeHoursDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const generateDescription = () => {
      switch (mode) {
          case 'duration':
              return `For ${durationValue} ${durationUnit}`;
          case 'datetime':
              return `Until ${format(dateTime || new Date(), "PPPp")}`;
          case 'office_hours':
              return `Until next office hours`;
          case 'timestamp':
              return `Until ${timestamp || 'custom timestamp'}`;
          default:
              return 'Delay execution';
      }
  }

  const handleSave = () => {
    if (!step) return;

    const updatedStep: WorkflowStepData = {
      ...step,
      description: generateDescription(),
      data: {
        ...step.data,
        waitMode: mode,
        waitDurationValue: durationValue,
        waitDurationUnit: durationUnit,
        waitDateTime: dateTime?.toISOString(),
        waitOfficeHoursDays: officeHoursDays,
        waitOfficeHoursStartTime: officeHoursStartTime,
        waitOfficeHoursEndTime: officeHoursEndTime,
        waitOfficeHoursAction: officeHoursAction,
        waitTimestamp: timestamp,
      },
    };
    onSave(updatedStep);
    onOpenChange(false);
  };
  
  if (!step) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Clock className="text-primary" />
            Edit Action: {step.title}
          </DialogTitle>
          <DialogDescription>Configure the delay for this workflow step.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as WaitMode)}>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="duration" id="duration" />
                    <Label htmlFor="duration">Wait for a duration</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="datetime" id="datetime" />
                    <Label htmlFor="datetime">Wait until a specific date/time</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="office_hours" id="office_hours" />
                    <Label htmlFor="office_hours">Wait for office hours</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="timestamp" id="timestamp" />
                    <Label htmlFor="timestamp">Wait until a custom timestamp</Label>
                </div>
            </RadioGroup>

            {mode === 'duration' && (
                <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="duration-value">Duration</Label>
                        <Input id="duration-value" type="number" value={durationValue} onChange={e => setDurationValue(Number(e.target.value))} min={1}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="duration-unit">Unit</Label>
                        <Select value={durationUnit} onValueChange={(v) => setDurationUnit(v as any)}>
                            <SelectTrigger id="duration-unit">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="minutes">Minutes</SelectItem>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="days">Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {mode === 'datetime' && (
                <div className="pt-4 space-y-2">
                    <Label>Date and Time</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateTime && "text-muted-foreground"
                            )}
                        >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {dateTime ? format(dateTime, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={dateTime}
                                onSelect={setDateTime}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Input type="time" value={dateTime ? format(dateTime, 'HH:mm') : ''} onChange={e => {
                        const [hours, minutes] = e.target.value.split(':').map(Number);
                        const newDate = new Date(dateTime || Date.now());
                        newDate.setHours(hours, minutes);
                        setDateTime(newDate);
                    }} />
                </div>
            )}

            {mode === 'office_hours' && (
                <div className="pt-4 space-y-6">
                    <div className="space-y-3">
                        <Label>Office Days</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {officeDays.map((day) => (
                                <div key={day.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={day.id}
                                        checked={officeHoursDays.includes(day.id)}
                                        onCheckedChange={() => handleDayToggle(day.id)}
                                    />
                                    <Label htmlFor={day.id} className="text-sm font-normal">{day.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start-time">Start Time</Label>
                            <Input id="start-time" type="time" value={officeHoursStartTime} onChange={e => setOfficeHoursStartTime(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-time">End Time</Label>
                            <Input id="end-time" type="time" value={officeHoursEndTime} onChange={e => setOfficeHoursEndTime(e.target.value)} />
                        </div>
                    </div>
                     <div className="space-y-3">
                        <Label>If outside of office hours</Label>
                         <RadioGroup value={officeHoursAction} onValueChange={(v) => setOfficeHoursAction(v as any)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="wait" id="wait" />
                                <Label htmlFor="wait" className="font-normal">Wait until the start of the next office hours</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="proceed" id="proceed" />
                                <Label htmlFor="proceed" className="font-normal">Proceed to the next step immediately</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            )}

            {mode === 'timestamp' && (
                <div className="pt-4 space-y-2">
                    <Label htmlFor="timestamp-value">Custom Timestamp</Label>
                    <Input 
                        id="timestamp-value" 
                        value={timestamp} 
                        onChange={e => setTimestamp(e.target.value)}
                        placeholder="e.g., 2024-12-31T23:59:59Z or {{trigger.data.timestamp}}"
                    />
                    <p className="text-xs text-muted-foreground">
                        Provide a static ISO 8601 timestamp or a dynamic variable from a previous step.
                    </p>
                </div>
            )}

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
