import { getPgPool } from '../db/db';
import { WorkflowRun } from '../../src/types';
import { requireOrganizationId } from './organizationContext';

function requirePool() {
  const pool = getPgPool();
  if (!pool) throw new Error('PostgreSQL is required for durable workflow runs');
  return pool;
}

function toWorkflowRun(row: any): WorkflowRun {
  return {
    run_id: row.run_id,
    workflow_id: row.workflow_id || '',
    name: row.name,
    status: row.status,
    current_step_id: row.current_step_id ?? undefined,
    current_step_name: row.current_step_name ?? undefined,
    current_agent_id: row.current_agent_id ?? undefined,
    total_steps: Number(row.total_steps || 0),
    completed_steps: Number(row.completed_steps || 0),
    tasks: Array.isArray(row.tasks) ? row.tasks : [],
    initiated_by: row.initiated_by,
    created_at: new Date(row.created_at).toISOString(),
    completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
    execution_time_ms: row.execution_time_ms ?? undefined,
    final_summary: row.final_summary ?? undefined,
    node_states: row.node_states || {},
    step_outputs: row.step_outputs || {},
    qa_verification: row.qa_verification || undefined,
  };
}

export async function createWorkflowRun(input: {
  organizationId: string;
  runId: string;
  workflowId?: string;
  name: string;
  initiatedBy: string;
  totalSteps: number;
  status?: WorkflowRun['status'];
}): Promise<WorkflowRun> {
  const organizationId = requireOrganizationId(input.organizationId);
  const { rows } = await requirePool().query(
    `INSERT INTO workflow_runs
      (run_id, organization_id, workflow_id, name, status, total_steps, initiated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.runId,
      organizationId,
      input.workflowId || null,
      input.name,
      input.status || 'queued',
      input.totalSteps,
      input.initiatedBy,
    ],
  );
  return toWorkflowRun(rows[0]);
}

export async function updateWorkflowRun(
  organizationId: string,
  runId: string,
  patch: Partial<Pick<WorkflowRun,
    'status' | 'current_step_id' | 'current_step_name' | 'current_agent_id' |
    'total_steps' | 'completed_steps' | 'tasks' | 'node_states' |
    'step_outputs' | 'qa_verification' | 'final_summary' | 'execution_time_ms' | 'completed_at'
  >>,
): Promise<WorkflowRun | null> {
  const orgId = requireOrganizationId(organizationId);
  const values: unknown[] = [orgId, runId];
  const sets: string[] = ['updated_at = CURRENT_TIMESTAMP'];
  const add = (column: string, value: unknown, cast = '') => {
    values.push(value);
    sets.push(`${column} = $${values.length}${cast}`);
  };

  if (patch.status !== undefined) add('status', patch.status);
  if (patch.current_step_id !== undefined) add('current_step_id', patch.current_step_id);
  if (patch.current_step_name !== undefined) add('current_step_name', patch.current_step_name);
  if (patch.current_agent_id !== undefined) add('current_agent_id', patch.current_agent_id);
  if (patch.total_steps !== undefined) add('total_steps', patch.total_steps);
  if (patch.completed_steps !== undefined) add('completed_steps', patch.completed_steps);
  if (patch.tasks !== undefined) add('tasks', JSON.stringify(patch.tasks), '::jsonb');
  if (patch.node_states !== undefined) add('node_states', JSON.stringify(patch.node_states), '::jsonb');
  if (patch.step_outputs !== undefined) add('step_outputs', JSON.stringify(patch.step_outputs), '::jsonb');
  if (patch.qa_verification !== undefined) add('qa_verification', JSON.stringify(patch.qa_verification), '::jsonb');
  if (patch.final_summary !== undefined) add('final_summary', patch.final_summary);
  if (patch.execution_time_ms !== undefined) add('execution_time_ms', patch.execution_time_ms);
  if (patch.completed_at !== undefined) add('completed_at', patch.completed_at);

  const { rows } = await requirePool().query(
    `UPDATE workflow_runs SET ${sets.join(', ')}
     WHERE organization_id = $1 AND run_id = $2
     RETURNING *`,
    values,
  );
  return rows[0] ? toWorkflowRun(rows[0]) : null;
}

export async function getWorkflowRun(organizationId: string, runId: string): Promise<WorkflowRun | null> {
  const orgId = requireOrganizationId(organizationId);
  const { rows } = await requirePool().query(
    'SELECT * FROM workflow_runs WHERE organization_id = $1 AND run_id = $2 LIMIT 1',
    [orgId, runId],
  );
  return rows[0] ? toWorkflowRun(rows[0]) : null;
}

export async function listWorkflowRuns(
  organizationId: string,
  filters: { workflowId?: string; status?: WorkflowRun['status']; limit?: number } = {},
): Promise<WorkflowRun[]> {
  const orgId = requireOrganizationId(organizationId);
  const values: unknown[] = [orgId];
  const clauses = ['organization_id = $1'];
  if (filters.workflowId) {
    values.push(filters.workflowId);
    clauses.push(`workflow_id = $${values.length}`);
  }
  if (filters.status) {
    values.push(filters.status);
    clauses.push(`status = $${values.length}`);
  }
  const limit = Math.min(Math.max(filters.limit || 20, 1), 100);
  values.push(limit);
  const { rows } = await requirePool().query(
    `SELECT * FROM workflow_runs
     WHERE ${clauses.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT $${values.length}`,
    values,
  );
  return rows.map(toWorkflowRun);
}

export async function abortWorkflowRun(organizationId: string, runId: string): Promise<WorkflowRun | null> {
  const orgId = requireOrganizationId(organizationId);
  const { rows } = await requirePool().query(
    `UPDATE workflow_runs
     SET status = 'failed',
         final_summary = COALESCE(final_summary, 'Aborted by user'),
         completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP),
         updated_at = CURRENT_TIMESTAMP
     WHERE organization_id = $1
       AND run_id = $2
       AND status IN ('queued','running','paused_approval')
     RETURNING *`,
    [orgId, runId],
  );
  return rows[0] ? toWorkflowRun(rows[0]) : null;
}
