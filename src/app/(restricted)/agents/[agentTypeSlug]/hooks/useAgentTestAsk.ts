'use client';

import { useCallback, useRef, useState } from 'react';

import { useAuthMutation } from '@/hooks/useAuthMutation';
import { getAxiosError } from '@/lib/helper';
import { agentTestAskEndpoint } from '@/services/agents';
import type { AgentTestAskResult } from '@/types/agent';
import type { ApiResponse } from '@/types/api';

/** `askedAt` is when the question was sent; `answeredAt` when the reply arrived.
 * The endpoint returns no timestamp of its own, so both are recorded here. */
type TurnBase = { id: number; question: string; askedAt: Date };

export type TestTurn =
  | (TurnBase & { status: 'pending' })
  | (TurnBase & { status: 'done'; result: AgentTestAskResult; answeredAt: Date })
  | (TurnBase & { status: 'error'; errorMessage: string });

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
    async (id: number, question: string, askedAt: Date) => {
      try {
        const response = await mutateAsync({
          url: agentTestAskEndpoint(agentId),
          body: { question },
        });
        const answeredAt = new Date();
        setTurns((all) =>
          all.map((turn) =>
            turn.id === id
              ? { id, question, askedAt, status: 'done', result: response.data, answeredAt }
              : turn
          )
        );
      } catch (error) {
        setTurns((all) =>
          all.map((turn) =>
            turn.id === id
              ? { id, question, askedAt, status: 'error', errorMessage: getAxiosError(error) }
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
      const askedAt = new Date();
      setTurns((all) => [...all, { id, question, askedAt, status: 'pending' }]);
      await run(id, question, askedAt);
    },
    [run]
  );

  const retry = useCallback(
    async (id: number) => {
      const turn = turns.find((candidate) => candidate.id === id);
      if (!turn) return;
      // A retry sends the question again, so it gets a fresh sent time.
      const askedAt = new Date();
      setTurns((all) =>
        all.map((candidate) =>
          candidate.id === id
            ? { id, question: turn.question, askedAt, status: 'pending' }
            : candidate
        )
      );
      await run(id, turn.question, askedAt);
    },
    [turns, run]
  );

  const clear = useCallback(() => setTurns([]), []);

  return { turns, ask, retry, clear, isPending };
}
