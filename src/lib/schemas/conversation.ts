import { z } from 'zod';

/** Field name and length cap match `OperatorMessageSendSerializer.content`
 * exactly, so a backend field error binds inline with no mapping. */
export const operatorMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});

export type OperatorMessageFormValues = z.infer<typeof operatorMessageSchema>;
