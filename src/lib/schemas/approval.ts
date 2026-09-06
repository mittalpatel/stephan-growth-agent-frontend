import { z } from 'zod';

/** Field name matches `ApprovalRejectSerializer.rejection_reason` exactly. */
export const approvalRejectSchema = z.object({
  rejection_reason: z.string().trim().min(1),
});

export type ApprovalRejectFormValues = z.infer<typeof approvalRejectSchema>;
