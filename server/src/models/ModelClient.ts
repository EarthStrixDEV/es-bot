import type { Message, Plan, PlanStep, ToolDef } from '../domain/types.js';

export type StepContext = {
  request: string;
  step: PlanStep;
  /** Outputs of earlier steps, already labelled as external data. */
  previous: { title: string; output: unknown }[];
};

/** Model access (OpenRouter in production, a mock without a key). Phase 3 puts the Model Router in front. */
export interface ModelClient {
  readonly name: string;
  /** Break a request into tool steps, or return null when a plain reply is enough. */
  plan(request: string, tools: ToolDef[]): Promise<Plan | null>;
  /** Fill a step's arguments from earlier results right before it runs. */
  resolveArgs(ctx: StepContext): Promise<Record<string, unknown>>;
  /** Write content for a draft step (e.g. one message per shop). */
  draft(input: { instruction: string; items: unknown[]; voice?: string }): Promise<string[]>;
  reply(history: Message[]): Promise<string>;
}
