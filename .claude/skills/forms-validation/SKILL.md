---
name: forms-validation
description: Guides form implementation for this project. Use when building any form, adding validation, handling form submission, using React Hook Form, writing Zod schemas, handling file uploads, building multi-step forms, or asking "how do I validate this field", "how do I handle form errors", "how do I submit to the API", "how do I build a wizard form".
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Forms & Validation — Senior Frontend Guidelines

## Stack

- **React Hook Form** — form state, registration, submission
- **Zod** — schema definition + type inference
- **`@hookform/resolvers/zod`** — bridges Zod schemas into RHF

---

## 1. Standard Form Pattern

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define schema — single source of truth for types AND validation
const schema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['admin', 'manager', 'agent']),
});

type FormData = z.infer<typeof schema>; // ← infer type from schema, no duplication

// 2. Form component
export function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await usersService.create(data);
    reset();
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="name">Name</label>
        <input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Create User'}
      </button>
    </form>
  );
}
```

---

## 2. Zod Schema Patterns

```typescript
// Common field patterns
const schemas = {
  // Optional with default
  limit: z.number().int().positive().default(20),

  // Nullable vs optional
  bio: z.string().nullable(), // can be null
  nickname: z.string().optional(), // can be undefined

  // Dependent validation (refine)
  passwords: z
    .object({
      password: z.string().min(8),
      confirm: z.string(),
    })
    .refine((data) => data.password === data.confirm, {
      message: 'Passwords must match',
      path: ['confirm'],
    }),

  // Enum from const
  status: z.enum(['active', 'paused', 'archived']),

  // URL
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),

  // Phone (regex)
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]{7,15}$/, 'Invalid phone number')
    .optional(),

  // File upload
  avatar: z
    .instanceof(File)
    .refine((f) => f.size < 5 * 1024 * 1024, 'Max 5MB')
    .refine((f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type), 'JPEG/PNG/WebP only')
    .optional(),
};
```

---

## 3. shadcn Form Components

When using shadcn/ui `<Form>` wrapper (built on RHF):

```tsx
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input type="email" {...field} />
        </FormControl>
        <FormMessage /> {/* renders Zod error automatically */}
      </FormItem>
    )}
  />
</Form>;
```

---

## 4. Mutation + Form Integration (TanStack Query)

```tsx
export function EditCampaignForm({ campaign }: { campaign: Campaign }) {
  const { mutate, isPending, error } = useUpdateCampaign();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: campaign.name, status: campaign.status },
  });

  const onSubmit = (data: FormData) => {
    mutate(
      { id: campaign.id, data },
      {
        onSuccess: () => toast.success('Saved'),
        onError: (err) => {
          // Map backend field errors to form errors
          if (axios.isAxiosError(err) && err.response?.data) {
            Object.entries(err.response.data).forEach(([key, msg]) => {
              form.setError(key as keyof FormData, { message: msg as string });
            });
          }
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* fields */}
        <button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </form>
    </Form>
  );
}
```

---

## 5. Multi-Step Form

```tsx
// Use a Provider to share state across steps
export function MultiStepFormProvider({ children }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Partial<FinalFormData>>({});

  const nextStep = (data: Partial<FinalFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep((s) => s + 1);
  };

  return (
    <MultiStepContext.Provider value={{ step, formData, nextStep }}>
      {children}
    </MultiStepContext.Provider>
  );
}
// Each step is its own RHF form with its own sub-schema
// Final step submits merged formData
```

---

## 6. File Upload

```tsx
// Use Controller for non-input elements
<Controller
  control={form.control}
  name="avatar"
  render={({ field: { onChange, value } }) => (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      {value && (
        <img src={URL.createObjectURL(value)} alt="Preview" className="h-16 w-16 rounded" />
      )}
    </div>
  )}
/>
```

---

## 7. Anti-patterns

```typescript
// ❌ Uncontrolled useState for form fields
// ❌ Type duplication: defining FormData interface separately from Zod schema
// ❌ Trusting only client-side validation for security — server must also validate
// ❌ Forgetting `reset()` after successful submission
// ❌ Ignoring isSubmitting — always disable submit button during submission
// ❌ Using index as key in dynamic field arrays — use useFieldArray from RHF
```

---

## Reference files (load only when needed)

## Further reading

The canonical rules for this topic live in the repo:

- `docs/topics/06-forms.md` — the reference
- `docs/INDEX.md` — every other topic, with a "read this when" line each
- `AGENTS.md` — the always-loaded rules, which take precedence over this skill

The earlier version of this section pointed at an external `frontend-context/`
guideline folder. That folder is developer-local and gitignored (see `AGENTS.md`),
so those links resolved for nobody — which is exactly how a skill teaches a reader
that its paths are approximate. In-repo docs are canonical: ADR-0012.
