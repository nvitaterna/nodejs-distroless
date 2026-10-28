import { z } from 'zod';

export const scheduleSchema = z.record(
  z.string(),
  z.object({
    start: z.string(),
    end: z.string(),
    lts: z.string().optional(),
  }),
);

export type ScheduleItem = z.infer<typeof scheduleSchema.valueType> & {
  version: number;
};

export type Schedule = z.infer<typeof scheduleSchema>;
