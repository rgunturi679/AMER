import React, { ChangeEvent, useEffect, useState } from 'react';
import { ColumnDefinition, DataTable, Manager, styled } from '@twilio/flex-ui';
import { MenuItem, TextField } from '@material-ui/core';
import { useSelector } from 'react-redux';

import { QueueStats } from '../../utils/StatsHelper';
import { getServerlessFunctionUrl } from '../../config';
import { reduxNamespace } from '../../../../utils/state';
import { AgentQueueStatsState } from '../../flex-hooks/reducers/AgentQueueStats';

const Wrapper = styled('div')`
  overflow: auto;
`;

const StyledDataTable = styled(DataTable)`
  & .tw-data-table-column:nth-child(1) {
    padding-left: 20px;
  }
`;

// Queue SIDs for each LOB — sourced from the original plugin
const KEYS_INVISALIGN = [
  'WQa9847559139e285b2b4ed53c4df3ca30',
  'WQ1d0435d76a8c93e2bc00329c756bd8a6'
];

const KEYS_ITERO = [
  'WQe73899d1c0fdb49188d2665d92268cf1',
  'WQa49512ff496d7eb066ff6e842a9f5c78',

];

const AgentQueueStatsView = () => {
  const manager = Manager.getInstance();
  const userRoles: string[] = manager.user.roles || [];

  const stats: QueueStats[] = useSelector(
    (state: any) => (state[reduxNamespace]?.agentQueueStats as AgentQueueStatsState)?.stats ?? [],
  );

  const [filterValue, setFilterValue] = useState('All');
  const [agentAssignedQueueSids, setAgentAssignedQueueSids] = useState<string[]>([]);

  const hasAgentRole = userRoles.includes('agent');
  const hasSupervisorRole = userRoles.includes('supervisor');
  const hasAdminRole = userRoles.includes('admin');
  const isAgent = hasAgentRole && !hasSupervisorRole && !hasAdminRole;

  useEffect(() => {
    if (!isAgent) return;

    const workerSid = (manager as any).workerClient?.sid;
    const workspaceSid = manager.serviceConfiguration?.taskrouter_workspace_sid;
    const functionUrl = getServerlessFunctionUrl();

    if (!workerSid || !workspaceSid || !functionUrl) return;

    fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ WorkerSid: workerSid, WorkspaceSid: workspaceSid }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setAgentAssignedQueueSids(data.queueSids || []))
      .catch((err) => console.error('[agent-queue-stats] Failed to fetch agent queues:', err));
  }, [isAgent]);

  console.log(`[agent-queue-stats] AgentQueueStatsView render: ${stats.length} queues in Redux, filter="${filterValue}"`);

  const filteredStats =
    filterValue === 'Invisalign'
      ? stats.filter((q) => KEYS_INVISALIGN.includes(q.queue.queue_sid))
      : filterValue === 'iTero'
        ? stats.filter((q) => KEYS_ITERO.includes(q.queue.queue_sid))
        : stats;

  return (
    <Wrapper>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <TextField
          select
          label="Select LOB"
          value={filterValue}
          onChange={(e: ChangeEvent<{ value: unknown }>) => setFilterValue(e.target.value as string)}
          style={{ width: '200px' }}
        >
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Invisalign">Invisalign</MenuItem>
          <MenuItem value="iTero">iTero</MenuItem>
        </TextField>
      </div>

      <StyledDataTable items={filteredStats} defaultSortColumn="name-column">
        <ColumnDefinition
          key="name-column"
          header="Queue"
          sortDirection="asc"
          sortingFn={(a: QueueStats, b: QueueStats) => (a.queue.queue_name > b.queue.queue_name ? 1 : -1)}
          content={(q: QueueStats) => <span>{q.queue.queue_name}</span>}
        />
        <ColumnDefinition
          key="waiting-now-column"
          header="CW"
          content={(q: QueueStats) => {
            const masked = isAgent && agentAssignedQueueSids.includes(q.queue.queue_sid);
            return <span>{masked ? '—' : q.tasks_now?.waiting_tasks}</span>;
          }}
        />
        <ColumnDefinition
          key="agents-available-column"
          header="AVL"
          content={(q: QueueStats) => {
            const masked = isAgent && agentAssignedQueueSids.includes(q.queue.queue_sid);
            return <span>{masked ? '—' : q.workers?.total_available_workers}</span>;
          }}
        />
        <ColumnDefinition
          key="abandoned-today-column"
          header="ABAN"
          content={(q: QueueStats) => <span>{q.tasks_today?.abandoned_tasks_count}</span>}
        />
        <ColumnDefinition
          key="sla-today-column"
          header="SLA"
          content={(q: QueueStats) => (
            <span>
              {typeof q.tasks_today?.sla_percentage === 'number' && q.tasks_today.sla_percentage >= 0
                ? `${Math.round(q.tasks_today.sla_percentage * 100)}%`
                : 'N/A'}
            </span>
          )}
        />
        <ColumnDefinition
          key="offered-today-column"
          header="Offered"
          content={(q: QueueStats) => <span>{q.tasks_today?.total_tasks_count}</span>}
        />
      </StyledDataTable>
    </Wrapper>
  );
};

export default AgentQueueStatsView;
