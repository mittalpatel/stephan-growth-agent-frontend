import { describe, expect, it } from 'vitest';

import { SUPPORTED_LANGUAGE_CODES } from '@/lib/constants/agentLanguages';
import { agentUpdateSchema } from '@/lib/schemas/agent';

/**
 * `agentUpdateSchema`'s language rules mirror `AgentWriteSerializer`'s
 * (`validate_enabled_languages`, `validate_default_language`, and the
 * cross-field `validate()`). Nothing else fails if the mirror drifts: the form
 * would simply post a body the API then rejects, with the error landing as a
 * toast instead of on the field. These assert the two stay in step.
 */
const valid = {
  name: 'Support agent',
  human_inbox_email: 'inbox@example.com',
  status: 'active',
  enabled_languages: ['en', 'fr'],
  default_language: 'en',
} as const;

describe('agentUpdateSchema languages', () => {
  it('accepts a default language inside the enabled set', () => {
    expect(agentUpdateSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an empty enabled_languages, mirroring ENABLED_LANGUAGES_EMPTY', () => {
    const result = agentUpdateSchema.safeParse({ ...valid, enabled_languages: [] });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.path[0] === 'enabled_languages')).toBe(true);
  });

  it('reports a default outside the enabled set on the default_language path', () => {
    // The path matters: the backend's cross-field error targets
    // `default_language`, so binding anywhere else would put the client and
    // server messages on two different inputs for the same mistake.
    const result = agentUpdateSchema.safeParse({
      ...valid,
      enabled_languages: ['en'],
      default_language: 'fr',
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.path[0] === 'default_language')).toBe(true);
  });

  it('rejects a language code outside the allowlist', () => {
    expect(agentUpdateSchema.safeParse({ ...valid, enabled_languages: ['en', 'xx'] }).success).toBe(
      false
    );
  });

  it('rejects a locale variant, since the backend allows ISO 639-1 only', () => {
    expect(
      agentUpdateSchema.safeParse({
        ...valid,
        enabled_languages: ['pt-BR'],
        default_language: 'pt-BR',
      }).success
    ).toBe(false);
  });
});

describe('SUPPORTED_LANGUAGE_CODES', () => {
  it('mirrors the backend list length and contains no duplicates', () => {
    // 45 curated ISO 639-1 codes as of backend 2026-09-18. A mismatch here
    // means one side added a language without the other.
    expect(SUPPORTED_LANGUAGE_CODES).toHaveLength(45);
    expect(new Set(SUPPORTED_LANGUAGE_CODES).size).toBe(SUPPORTED_LANGUAGE_CODES.length);
  });

  it('starts with the platform default so English is never accidentally dropped', () => {
    expect(SUPPORTED_LANGUAGE_CODES[0]).toBe('en');
  });
});
