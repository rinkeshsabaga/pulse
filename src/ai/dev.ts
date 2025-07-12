import { config } from 'dotenv';
config();

import '@/ai/flows/generate-function-from-intent.ts';
import '@/ai/flows/greet.ts';
import '@/ai/flows/wait-flow.ts';
import '@/ai/flows/condition-flow.ts';
import '@/ai/flows/send-email-flow.ts';
