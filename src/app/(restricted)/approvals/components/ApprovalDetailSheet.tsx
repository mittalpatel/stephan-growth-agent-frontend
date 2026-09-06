'use client';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { StatusBadge, type StatusTone } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/i18n';
import { t } from '@/locales';
import type { ApprovalRisk, ApprovalStatus } from '@/types/approval';

import { useApprovalActions } from '../hooks/useApprovalActions';
import { useApprovalDetail } from '../hooks/useApprovalDetail';
import { RejectApprovalDialog } from './RejectApprovalDialog';

const STATUS_TONE: Record<ApprovalStatus, StatusTone> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const RISK_TONE: Record<ApprovalRisk, StatusTone> = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
};

type Props = Readonly<{ approvalId: string | null; onOpenChange: (open: boolean) => void }>;

export function ApprovalDetailSheet({ approvalId, onOpenChange }: Props) {
  const { approval, isLoading } = useApprovalDetail(approvalId);
  const { approve, isApproving, reject, isRejecting } = useApprovalActions(approvalId ?? '');
  const { can } = usePermissions();
  const canManage = can('approval', 'manage');

  return (
    <Sheet open={Boolean(approvalId)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t.approvals.detail.title}</SheetTitle>
          {approval && <SheetDescription>{approval.title}</SheetDescription>}
        </SheetHeader>

        {isLoading || !approval ? (
          <div className="space-y-3 px-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 px-4 pb-6">
            <div className="flex items-center gap-2">
              <StatusBadge
                label={t.approvals.status[approval.status]}
                tone={STATUS_TONE[approval.status]}
              />
              <StatusBadge
                label={t.approvals.risk[approval.risk]}
                tone={RISK_TONE[approval.risk]}
              />
            </div>

            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {t.approvals.detail.aiAction}
              </p>
              <p className="mt-1 text-sm whitespace-pre-wrap">{approval.ai_action}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {t.approvals.detail.reason}
              </p>
              <p className="mt-1 text-sm">{approval.reason}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {t.approvals.detail.preview}
              </p>
              <p className="border-border mt-1 rounded-md border p-3 text-sm whitespace-pre-wrap">
                {approval.preview}
              </p>
            </div>

            {approval.rejection_reason && (
              <div>
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {t.approvals.detail.rejectionReason}
                </p>
                <p className="mt-1 text-sm">{approval.rejection_reason}</p>
              </div>
            )}

            <p className="text-muted-foreground text-xs">{formatDate(approval.created_at)}</p>

            {canManage && approval.status === 'pending' && (
              <div className="flex gap-2">
                <Button onClick={() => void approve()} disabled={isApproving}>
                  {t.approvals.actions.approve}
                </Button>
                <RejectApprovalDialog onReject={reject} isRejecting={isRejecting} />
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
