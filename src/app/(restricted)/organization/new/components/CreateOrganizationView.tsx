'use client';

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useCreateOrganization } from '../hooks/useCreateOrganization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fieldLabelCls } from '@/components/common/form';
import { t } from '@/locales';

/**
 * Self-serve organization creation.
 *
 * Reachable with **zero** permissions — creating your first organization is how
 * a permission-less user gets one in the first place, so this page is listed in
 * `PermissionGuard`'s `GLOBAL_PATHS` alongside `/no-role`. The backend is the
 * real gate: `ALLOW_SELF_SERVE_ORG_CREATION`/`MULTI_TENANT_ENABLED` decide
 * whether the request actually succeeds, and a disabled deployment surfaces
 * that as a normal field error via `applyApiError` rather than the page
 * pretending the option doesn't exist.
 */
export default function CreateOrganizationView() {
  const [name, setName] = useState('');
  const { create, isSubmitting } = useCreateOrganization();

  const submit = async () => {
    await create(name.trim());
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="bg-muted flex size-12 items-center justify-center rounded-full">
          <Building2 className="text-muted-foreground size-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.organizations.create.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.organizations.create.description}</p>
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div>
          <Label className={fieldLabelCls} htmlFor="organization-name">
            {t.organizations.create.nameLabel}
          </Label>
          <Input
            id="organization-name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t.organizations.create.namePlaceholder}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || name.trim() === ''}>
          {t.organizations.create.submit}
        </Button>
      </form>
    </div>
  );
}
