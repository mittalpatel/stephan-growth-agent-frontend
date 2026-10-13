'use client';

import { Globe } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isLanguage } from '@/config/language';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/locales';

/** Compact language picker for signed-out pages. Renders nothing with one language. */
export function LanguageSelect({ className }: Readonly<{ className?: string }>) {
  const { language, options, canSwitch, setLanguage } = useLanguage();
  if (!canSwitch) return null;

  return (
    <Select
      value={language}
      onValueChange={(value) => {
        if (isLanguage(value)) setLanguage(value);
      }}
    >
      <SelectTrigger size="sm" className={className} aria-label={t.common.languageLabel}>
        <Globe className="size-4" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
