'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { applyApiError } from '@/lib/apiError';
import { projectSchema, type ProjectFormValues } from '@/lib/schemas/project';
import { PROJECTS_ENDPOINT } from '@/services/projects';
import { t } from '@/locales';

type Options = Readonly<{
  /** Called after the project is created and the form has been reset. */
  onSuccess: () => void;
}>;

/**
 * Owns the "new project" mutation: the `useAuthMutation` POST, the request
 * body (the form values as-is), and `applyApiError` bound to the exact field
 * names `projectSchema` shares with the backend serializer. The dialog
 * component is a pure presenter that renders the form and calls `submit`.
 */
export function useCreateProjectForm({ onSuccess }: Options) {
  const { mutateAsync, isPending } = useAuthMutation();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: '', description: '', status: 'draft', category: 'standard' },
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({ url: PROJECTS_ENDPOINT, body: values });
      toast.success(t.projects.toast.created);
      form.reset();
      onSuccess();
    } catch (error) {
      applyApiError<ProjectFormValues>(error, {
        setError: form.setError,
        fields: ['name', 'description', 'status', 'category'],
      });
    }
  });

  return { form, isPending, submit };
}
