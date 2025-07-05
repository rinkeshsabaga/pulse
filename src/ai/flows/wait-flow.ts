'use server';
/**
 * @fileOverview A flow to handle various wait/delay conditions in a workflow.
 *
 * - wait - A function that handles the delay logic based on the provided input.
 * - WaitInput - The input type for the wait function.
 * - WaitOutput - The return type for the wait function.
 */

import { ai } from '@/ai/genkit';
import { sleep } from 'genkit/utils';
import { z } from 'zod';
import {
  parse,
  isBefore,
  isAfter,
  addDays,
  differenceInMilliseconds,
  getDay,
  set,
} from 'date-fns';

const OfficeHoursDaySchema = z.enum(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
const WaitModeSchema = z.enum(['duration', 'datetime', 'office_hours', 'timestamp']);

export const WaitInputSchema = z.object({
  waitMode: WaitModeSchema.default('duration'),
  waitDurationValue: z.number().optional(),
  waitDurationUnit: z.enum(['minutes', 'hours', 'days']).optional(),
  waitDateTime: z.string().datetime({ message: "Invalid datetime string" }).optional(),
  waitOfficeHoursDays: z.array(OfficeHoursDaySchema).optional(),
  waitOfficeHoursStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format, expected HH:mm" }).optional(),
  waitOfficeHoursEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Invalid time format, expected HH:mm" }).optional(),
  waitOfficeHoursAction: z.enum(['wait', 'proceed']).optional(),
  waitTimestamp: z.string().optional(),
});
export type WaitInput = z.infer<typeof WaitInputSchema>;

export const WaitOutputSchema = z.object({
  waitedMilliseconds: z.number(),
});
export type WaitOutput = z.infer<typeof WaitOutputSchema>;

const dayMap: Record<z.infer<typeof OfficeHoursDaySchema>, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const waitFlow = ai.defineFlow(
  {
    name: 'waitFlow',
    inputSchema: WaitInputSchema,
    outputSchema: WaitOutputSchema,
  },
  async (input) => {
    let waitMs = 0;
    const now = new Date();

    switch (input.waitMode) {
      case 'duration': {
        const value = input.waitDurationValue || 0;
        const unit = input.waitDurationUnit || 'minutes';
        if (unit === 'minutes') waitMs = value * 60 * 1000;
        if (unit === 'hours') waitMs = value * 60 * 60 * 1000;
        if (unit === 'days') waitMs = value * 24 * 60 * 60 * 1000;
        break;
      }
      case 'datetime': {
        if (input.waitDateTime) {
          const targetTime = new Date(input.waitDateTime);
          waitMs = differenceInMilliseconds(targetTime, now);
        }
        break;
      }
      case 'timestamp': {
        if (input.waitTimestamp) {
          try {
            const targetTime = new Date(input.waitTimestamp);
            waitMs = differenceInMilliseconds(targetTime, now);
          } catch (e) {
            console.error("Invalid timestamp provided for wait flow:", input.waitTimestamp);
            waitMs = 0;
          }
        }
        break;
      }
      case 'office_hours': {
        if (
          !input.waitOfficeHoursDays ||
          !input.waitOfficeHoursStartTime ||
          !input.waitOfficeHoursEndTime ||
          !input.waitOfficeHoursAction
        ) {
          break; // Not configured, do nothing
        }

        if (input.waitOfficeHoursAction === 'proceed') {
          break;
        }

        const officeDays = input.waitOfficeHoursDays.map(d => dayMap[d]);
        
        let todayStartTime, todayEndTime;
        try {
            todayStartTime = parse(input.waitOfficeHoursStartTime, 'HH:mm', now);
            todayEndTime = parse(input.waitOfficeHoursEndTime, 'HH:mm', now);
        } catch(e) {
            console.error("Invalid start/end time for office hours");
            break;
        }


        const isOfficeDay = (date: Date) => officeDays.includes(getDay(date));
        const isInOfficeHours = (date: Date) => isAfter(date, todayStartTime) && isBefore(date, todayEndTime);

        if (isOfficeDay(now) && isInOfficeHours(now)) {
          // We are currently in office hours, so no wait.
          waitMs = 0;
          break;
        }

        // We are outside office hours, calculate time to next window.
        let nextAvailableTime = set(now, {}); // clone now

        if (isOfficeDay(now) && isBefore(now, todayStartTime)) {
          // It's an office day, but before start time. Wait until start time.
          nextAvailableTime = todayStartTime;
        } else {
          // It's after hours, or not an office day. Find next office day.
          let attempts = 0;
          let nextDay = addDays(now, 1);
          
          while (!isOfficeDay(nextDay) && attempts < 8) {
            nextDay = addDays(nextDay, 1);
            attempts++;
          }
          
          // Set time to the start of that day.
          const nextStartTimeStr = input.waitOfficeHoursStartTime;
          const [hours, minutes] = nextStartTimeStr.split(':').map(Number);
          nextAvailableTime = set(nextDay, { hours, minutes, seconds: 0, milliseconds: 0 });
        }

        waitMs = differenceInMilliseconds(nextAvailableTime, now);
        break;
      }
    }

    if (waitMs > 0) {
      await sleep(waitMs);
    }

    return { waitedMilliseconds: Math.max(0, waitMs) };
  }
);

export async function wait(input: WaitInput): Promise<WaitOutput> {
  return waitFlow(input);
}
