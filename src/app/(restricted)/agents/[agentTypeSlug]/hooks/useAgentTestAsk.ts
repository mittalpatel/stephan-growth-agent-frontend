'use client';

import { useState } from 'react';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { getAxiosError } from '@/lib/helper';
import { agentTestAskEndpoint } from '@/services/agents';
import type { AgentTestAskResult } from '@/types/agent';
import type { ApiResponse } from '@/types/api';

/** Ask-a-question box against `POST /agents/{id}/draft/test/`. */
export function useAgentTestAsk(agentId: string) {
  const [result, setResult] = useState<AgentTestAskResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync, isPending } = useAuthMutation<
    ApiResponse<AgentTestAskResult>,
    { question: string }
  >();

  const ask = async (question: string) => {
    setErrorMessage(null);
    try {
      const response = await mutateAsync({
        url: agentTestAskEndpoint(agentId),
        body: { question },
      });
      setResult(response.data);
    } catch (error) {
      setResult(null);
      setErrorMessage(getAxiosError(error));
    }
  };

  return { ask, result, isPending, errorMessage };
}
