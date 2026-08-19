import React, { useEffect, useState, ChangeEvent } from 'react';
import { ColumnDefinition, Manager } from '@twilio/flex-ui';
import { useSelector } from 'react-redux';
import { TextField, MenuItem } from '@material-ui/core';

import { QueueStats } from '../../utils/StatsHelper';
import { getServerlessFunctionUrl } from '../../config';
import { AgentQueueStatsWrapper, CustomDataTable } from './AgentQueueStats.Styles';
import { reduxNamespace } from '../../../../utils/state';
import logger from '../../../../utils/logger';

const AgentQueueStats = () => {
  const manager = Manager.getInstance();
  const stats = useSelector((state: any) => state[reduxNamespace]?.agentQueueStats?.stats || []);

  const [filterValue, setFilterValue] = useState('All');
  const [agentAssignedQueueSids, setAgentAssignedQueueSids] = useState<string[]>([]);

  const userRoles = manager.user.roles;
  const hasAgentRole = userRoles.indexOf('agent') >= 0;
  const hasSupervisorRole = userRoles.indexOf('supervisor') >= 0;
  const hasAdminRole = userRoles.indexOf('admin') >= 0;
  const isAgent = hasAgentRole && !hasSupervisorRole && !hasAdminRole;

  logger.debug('[AQS:5] Component render —', {
    statsCount: stats.length,
    userRoles,
    isAgent,
    filterValue,
    reduxStateKey: (manager.store.getState() as any)[reduxNamespace]?.agentQueueStats ? 'present' : 'MISSING',
  });

  useEffect(() => {
    logger.debug(`[AQS:5] useEffect — stats from Redux: ${stats.length} entries`);
    if (stats.length > 0) {
      logger.debug(`[AQS:5] useEffect — first queue: ${stats[0]?.queue?.queue_name} ${stats[0]?.queue?.queue_sid}`);
    }
  }, [stats]);

  useEffect(() => {
    const fetchQueues = async () => {
      const workerSid = manager.workerClient?.sid;
      const workspaceSid = manager.serviceConfiguration?.taskrouter_workspace_sid;
      const serverlessUrl = getServerlessFunctionUrl();

      logger.debug('[AQS:5] fetchAgentQueues —', { isAgent, workerSid, workspaceSid, serverlessUrl: serverlessUrl || '(empty)' });

      if (isAgent && workerSid && workspaceSid && serverlessUrl) {
        try {
          const response = await fetch(serverlessUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ WorkerSid: workerSid, WorkspaceSid: workspaceSid }),
          });

          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

          const data = await response.json();
          const queueSids = data.queueSids || [];
          logger.debug('[AQS:5] fetchAgentQueues — agent assigned queue SIDs:', { queueSids });
          setAgentAssignedQueueSids(queueSids);
        } catch (error) {
          logger.error('[AQS:5] fetchAgentQueues — ERROR', { error });
        }
      } else {
        logger.debug('[AQS:5] fetchAgentQueues — skipping (not agent, missing SIDs, or no serverlessUrl)');
      }
    };

    fetchQueues();
  }, [isAgent]);

  const handleFilterChange = (event: ChangeEvent<{ value: unknown }>) => {
    setFilterValue(event.target.value as string);
  };

  const keysInvisalign = [
    'WQ01480077ddceba12ff8b2a91a622719c',
    'WQc59c01182fa53804fc2f72f33f0050ee',
    'WQ27d28b3db82e3ed9e8626b23844de737',
    'WQ8296c5bda3994999a41f9f84e3d566f0',
    'WQ69885a1bdda6ed62b0e42927dee12885',
    'WQe135611bcada93feb155c9b0f81bf30d',
    'WQ5b5861c3157ec44dc31d0083e4febcd1',
    'WQ2e43c35acc39e4cd5f86259be0a6d352',
    'WQ13657d657132d889e1adada48d43f398',
    'WQfb2967f590672883712008b4f408c4b2',
    'WQdd584099a4c2f3349a0fd3373cbccc5b',
    'WQ0d81a82295b244f6b707d49d7afa042f',
    'WQ0bc2d79e05067090618be69ac34a8da0',
    'WQe6cc2d4da1e076da50d4ec9d22ecad50',
    'WQbf02c2c85df5f606ee68cc3bf6d234f7',
    'WQa9847559139e285b2b4ed53c4df3ca30',
    'WQda7118b37adee89820e7e5f6522d6771',
    'WQcf7c7d2dec90a3f0713db4ff68218c6e',
    'WQ6026bb8025fb96239f905bf939396e27',
    'WQ1d0435d76a8c93e2bc00329c756bd8a6',
    'WQfe6680b06df7bdc42ee95e1411c5b10d',
    'WQ54fe3054c94363387dcc97e4bb9c23db',
  ];

  const keysItero = [
    'WQ03d68cf7a3d60d04703f55a6ca5d5e19',
    'WQ5458e070fa178c5a2dae35746731bd4b',
    'WQb14f247badc5b05b91dd630365774da9',
    'WQ9f878356a10749484c96bb62c45007d6',
    'WQfb2967f590672883712008b4f408c4b2',
    'WQdd584099a4c2f3349a0fd3373cbccc5b',
    'WQ0d81a82295b244f6b707d49d7afa042f',
    'WQ0bc2d79e05067090618be69ac34a8da0',
    'WQ614a0fa771584ffbef2dc0fdb19d9848',
    'WQ150c5477792b67bf05da1dcb1b482404',
    'WQba43aec44247c8a0fdee942f23fa8bd0',
    'WQ3a80e949bfa05319f58c7d69101c3cb2',
    'WQ1ec1cc905f27f49b34b15869e0710c97',
    'WQf61d97d48ff5696669bb6ca8fa8244d8',
    'WQ42f170f5d612dfe1761854b30b09b769',
  ];

  const keysTobeFiltered =
    filterValue === 'Invisalign' ? keysInvisalign : filterValue === 'iTero' ? keysItero : keysInvisalign.concat(keysItero);

  const filteredStats = stats.filter((queue: QueueStats) => keysTobeFiltered.includes(queue.queue.queue_sid));
  logger.debug(`[AQS:5] Filtered rows to display: ${filteredStats.length} (total in Redux: ${stats.length}, filter: ${filterValue})`);

  if (stats.length > 0 && filteredStats.length === 0) {
    const actualSids = stats.map((q: QueueStats) => q.queue.queue_sid);
    logger.warn('[AQS:5] stats in Redux but 0 match the LOB filter', { actualSids });
  }

  return (
    <AgentQueueStatsWrapper>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <TextField select label="Select LOB" value={filterValue} onChange={handleFilterChange} style={{ width: '200px' }}>
          <MenuItem value="All">All</MenuItem>
          <MenuItem value="Invisalign">Invisalign</MenuItem>
          <MenuItem value="iTero">iTero</MenuItem>
        </TextField>
      </div>
      <CustomDataTable items={filteredStats} defaultSortColumn="name-column">
        <ColumnDefinition
          key="name-column"
          header="Queue"
          sortDirection="asc"
          sortingFn={(a: QueueStats, b: QueueStats) => (a.queue.queue_name > b.queue.queue_name ? 1 : -1)}
          content={(queue: QueueStats) => <span>{queue?.queue?.queue_name}</span>}
        />
        <ColumnDefinition
          key="waiting-now-column"
          header="CW"
          content={(queue: QueueStats) => {
            const isMasked = isAgent && agentAssignedQueueSids.includes(queue.queue.queue_sid);
            return <span>{isMasked ? '—' : queue?.tasks_now?.waiting_tasks}</span>;
          }}
        />
        <ColumnDefinition
          key="agents-available-column"
          header="AVL"
          content={(queue: QueueStats) => {
            const isMasked = isAgent && agentAssignedQueueSids.includes(queue.queue.queue_sid);
            return <span>{isMasked ? '—' : queue?.workers?.total_available_workers}</span>;
          }}
        />
        <ColumnDefinition
          key="abandoned-today-column"
          header="ABAN"
          content={(queue: QueueStats) => <span>{queue?.tasks_today?.abandoned_tasks_count}</span>}
        />
        <ColumnDefinition
          key="sla-today-column"
          header="SLA"
          content={(queue: QueueStats) => {
            const sla = queue?.tasks_today?.sla_percentage;
            return <span>{typeof sla === 'number' && sla >= 0 ? `${Math.round(sla * 100)}%` : 'N/A'}</span>}
          }
        />
        <ColumnDefinition
          key="offered-today-column"
          header="Offered"
          content={(queue: QueueStats) => <span>{queue?.tasks_today?.total_tasks_count}</span>}
        />
      </CustomDataTable>
    </AgentQueueStatsWrapper>
  );
};

export default AgentQueueStats;
