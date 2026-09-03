'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';

import { RHFSelectField, RHFSwitchField, RHFTextField } from '@/components/common/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { applyApiError } from '@/lib/apiError';
import { clearQueryCache } from '@/lib/queryClientRef';
import { t } from '@/locales';
import {
  IMPERSONATION_START_ROUTE,
  impersonationLookupKey,
  impersonationLookupUrl,
  type ImpersonationTarget,
} from '@/services/organizations';
import type { ApiResponse } from '@/types/api';

const copy = t.organizations.impersonation;

/**
 * Field names match `StartImpersonationSerializer` exactly, which is what lets
 * `applyApiError` bind a field-keyed 400 straight to the input — the backend
 * refuses staff targets and non-members with `field: "user_id"`, and that has to
 * land somewhere the person filling in the form will see it.
 *
 * The client-side minimums mirror the server's and do not replace them: every one
 * of these is re-checked in `ImpersonationService.start`.
 */
const schema = z.object({
  email: z.string().trim().email(),
  organization_id: z.string().min(1),
  reason: z.string().trim().min(10),
  minutes: z.coerce.number().int().min(1).max(60),
  write_enabled: z.boolean(),
});

type FormValues = z.input<typeof schema>;

export default function StartImpersonationForm() {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      organization_id: '',
      reason: '',
      minutes: 30,
      // Off by default, and the one field a hurried person is most likely to
      // leave alone. Most support work needs no writes at all.
      write_enabled: false,
    },
  });

  // useWatch rather than form.watch(): watch() returns a fresh function on every
  // render, which the React Compiler refuses to memoize around.
  const email = useWatch({ control: form.control, name: 'email' }) ?? '';
  const debouncedEmail = useDebounce(email, 400);
  const lookupEnabled = z.string().email().safeParse(debouncedEmail.trim()).success;

  // Resolves the email to an id and the organizations that user belongs to. Two
  // steps rather than one because an email is not a stable identifier: starting a
  // session by id means a later address change cannot silently retarget it.
  const lookup = useAuthQuery<ApiResponse<ImpersonationTarget>>(
    impersonationLookupKey(debouncedEmail.trim().toLowerCase()),
    impersonationLookupUrl(debouncedEmail.trim()),
    { enabled: lookupEnabled, retry: false }
  );

  const target = lookup.data?.data ?? null;
  // Memoized so the effect below does not re-run on every render — a new `[]`
  // each time is a new dependency each time.
  const organizations = useMemo(() => target?.organizations ?? [], [target]);
  const selectedOrganization = useWatch({ control: form.control, name: 'organization_id' });

  // Most users belong to exactly one organization, and making that person pick it
  // from a list of one is the kind of friction that gets worked around.
  useEffect(() => {
    if (organizations.length === 1 && !selectedOrganization) {
      form.setValue('organization_id', organizations[0].id);
    }
  }, [organizations, selectedOrganization, form]);

  const onSubmit = async (values: FormValues) => {
    if (!target) return;
    try {
      // Same-origin route, never the backend directly: the response carries a
      // token pair for someone else's account, and it must not pass through the
      // browser. See IMPERSONATION_START_ROUTE.
      await axios.post(IMPERSONATION_START_ROUTE, {
        user_id: target.id,
        organization_id: values.organization_id,
        reason: values.reason,
        minutes: Number(values.minutes),
        write_enabled: values.write_enabled,
      });
      toast.success(copy.started);
      // Everything cached belongs to the admin's own tenant; from the next paint
      // onward the app is answering as someone else.
      clearQueryCache();
      router.refresh();
    } catch (error) {
      // `user_id` is not a form field — it is derived from the email — so the
      // backend's refusals for it are remapped onto the input the person can
      // actually correct.
      applyApiError<FormValues>(error, {
        setError: form.setError,
        fields: ['reason', 'minutes', 'organization_id'],
        fallbackMessage: copy.startFailed,
      });
    }
  };

  const organizationOptions = organizations.map((org) => ({ value: org.id, label: org.name }));
  const canSubmit = Boolean(target) && organizations.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid max-w-xl gap-4">
            <RHFTextField<FormValues>
              name="email"
              type="email"
              label={copy.emailLabel}
              placeholder={copy.emailPlaceholder}
              required
            />
            {lookupEnabled && lookup.isError ? (
              <p className="text-destructive text-sm">{copy.lookupFailed}</p>
            ) : null}
            {target && organizations.length === 0 ? (
              <p className="text-destructive text-sm">{copy.noOrganizations}</p>
            ) : null}

            <RHFSelectField<FormValues>
              name="organization_id"
              label={copy.organizationLabel}
              options={organizationOptions}
              disabled={organizations.length === 0}
            />

            <RHFTextField<FormValues>
              name="reason"
              label={copy.reasonLabel}
              placeholder={copy.reasonPlaceholder}
              required
            />
            <p className="text-muted-foreground -mt-2 text-xs">{copy.reasonHelp}</p>

            <RHFTextField<FormValues> name="minutes" type="number" label={copy.minutesLabel} />
            <p className="text-muted-foreground -mt-2 text-xs">{copy.minutesHelp}</p>

            <RHFSwitchField<FormValues> name="write_enabled" label={copy.writeEnabledLabel} />
            <p className="text-muted-foreground -mt-2 text-xs">{copy.writeEnabledHelp}</p>

            <div>
              <Button type="submit" disabled={!canSubmit || form.formState.isSubmitting}>
                {form.formState.isSubmitting ? copy.submitting : copy.submit}
              </Button>
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
