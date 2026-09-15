'use client';

import { useCallback, useRef, useState } from 'react';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { getAxiosError } from '@/lib/helper';
import { agentTestAskEndpoint } from '@/services/agents';
import type { AgentTestAskResult } from '@/types/agent';
import type { ApiResponse } from '@/types/api';

export type TestTurn =
  | { id: number; question: string; status: 'pending' }
  | { id: number; question: string; status: 'done'; result: AgentTestAskResult }
  | { id: number; question: string; status: 'error'; errorMessage: string };

/**
 * A session of questions against `POST /agents/{id}/draft/test/`.
 *
 * The endpoint is single-turn: it takes one `question` and never sees earlier
 * ones. Turns are kept only so the operator can compare answers side by side;
 * they are local state, never sent back, and cleared on leaving the tab.
 */
export function useAgentTestAsk(agentId: string) {
  const [turns, setTurns] = useState<TestTurn[]>([]);
  const nextId = useRef(0);
  const { mutateAsync, isPending } = useAuthMutation<
    ApiResponse<AgentTestAskResult>,
    { question: string }
  >();

  const run = useCallback(
    async (id: number, question: string) => {
      try {
        const response = await mutateAsync({
          url: agentTestAskEndpoint(agentId),
          body: { question },
        });
        setTurns((all) =>
          all.map((turn) =>
            turn.id === id ? { id, question, status: 'done', result: response.data } : turn
          )
        );
      } catch (error) {
        setTurns((all) =>
          all.map((turn) =>
            turn.id === id
              ? { id, question, status: 'error', errorMessage: getAxiosError(error) }
              : turn
          )
        );
      }
    },
    [agentId, mutateAsync]
  );

  const ask = useCallback(
    async (question: string) => {
      const id = nextId.current++;
      setTurns((all) => [...all, { id, question, status: 'pending' }]);
      await run(id, question);
    },
    [run]
  );

  const retry = useCallback(
    async (id: number) => {
      const turn = turns.find((candidate) => candidate.id === id);
      if (!turn) return;
      setTurns((all) =>
        all.map((candidate) =>
          candidate.id === id ? { id, question: turn.question, status: 'pending' } : candidate
        )
      );
      await run(id, turn.question);
    },
    [turns, run]
  );

  const clear = useCallback(() => setTurns([]), []);

  return { turns, ask, retry, clear, isPending };
}
