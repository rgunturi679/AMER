import * as Flex from '@twilio/flex-ui';
import { SyncMap } from 'twilio-sync';

import { reduxNamespace } from '../../../utils/state';
import QueuesHelper, { AgentQueue } from './QueuesHelper';
import { LiveQueryAddedEvent, LiveQueryUpdatedEvent } from './LiveQueryHelper';
import { updateStats } from '../flex-hooks/reducers/AgentQueueStats';

export interface QueueStats {
  queue: AgentQueue;
  tasks_now?: QueueTasksNow;
  tasks_today?: QueueTasksHistorical;
  tasks_thirty_minutes?: QueueTasksHistorical;
  workers?: QueueWorkerActivities;
}

export interface QueueTasksNow {
  pending_tasks: number;
  reserved_tasks: number;
  assigned_tasks: number;
  wrapping_tasks: number;
  waiting_tasks: number;
  active_tasks: number;
  total_tasks: number;
  longest_task_waiting_sid: string;
  longest_task_waiting_from: string;
  timestamp_updated: number;
}

export interface QueueTasksHistorical {
  total_tasks_count: number;
  handled_tasks_count: number;
  handled_tasks_within_sl_threshold_count: number;
  handled_tasks_within_sl_threshold_percentage: number;
  abandoned_tasks_count: number;
  abandoned_tasks_percentage: number;
  short_abandoned_tasks_count: number;
  short_abandoned_tasks_percentage: number;
  flow_out_tasks_count: number;
  flow_out_tasks_percentage: number;
  sla_percentage: number;
  timestamp_updated: number;
}

export interface QueueWorkerActivities {
  activity_statistics: QueueWorkerActivityStats[];
  timestamp_updated: number;
  total_available_workers: number;
  total_eligible_workers: number;
}

export interface QueueWorkerActivityStats {
  sid: string;
  workers: number;
  friendly_name: string;
}

interface MapCache {
  [queueSid: string]: SyncMap;
}

export class StatsHelper {
  mapCache: MapCache;
  manager: Flex.Manager;
  queuesHelper: QueuesHelper;

  constructor(manager: Flex.Manager) {
    this.mapCache = {};
    this.manager = manager;
    console.log('[agent-queue-stats] StatsHelper: initializing, opening tr-queue LiveQuery');

    this.queuesHelper = new QueuesHelper(
      async (items: { [key: string]: AgentQueue }) => {
        this.onQueuesLoaded(items);
      },
      async (event: LiveQueryAddedEvent<AgentQueue>) => {
        this.onQueueAdded(event);
      },
      (event: LiveQueryUpdatedEvent<AgentQueue>) => {
        this.onQueueUpdated(event);
      },
    );
  }

  async fetchQueueStats(queue: AgentQueue): Promise<QueueStats | null> {
    if (this.mapCache[queue.queue_sid]) return null;

    console.log(`[agent-queue-stats] fetchQueueStats: opening SyncMap for "${queue.queue_name}" (${queue.queue_sid})`);
    try {
      this.mapCache[queue.queue_sid] = await this.manager.insightsClient.map({
        id: `${queue.queue_sid}.realtime_statistics.v1`,
        mode: 'open_existing',
      });
    } catch (err) {
      console.error(`[agent-queue-stats] fetchQueueStats: failed to open SyncMap for "${queue.queue_name}"`, err);
      return null;
    }

    const queueStatsMap = this.mapCache[queue.queue_sid];

    queueStatsMap.on('itemAdded', (args: any) => {
      this.onStatsUpdated(queue.queue_sid, args.item);
    });
    queueStatsMap.on('itemUpdated', (args: any) => {
      this.onStatsUpdated(queue.queue_sid, args.item);
    });

    let stats: QueueStats = { queue };
    const mapItems = await queueStatsMap.getItems();
    console.log(`[agent-queue-stats] fetchQueueStats: got ${mapItems.items.length} items for "${queue.queue_name}"`);
    mapItems.items.forEach((item) => {
      stats = this.updateStatsItem(item, stats);
    });

    return stats;
  }

  async onQueuesLoaded(items: { [key: string]: AgentQueue }) {
    const queueCount = Object.keys(items).length;
    console.log(`[agent-queue-stats] onQueuesLoaded: LiveQuery returned ${queueCount} queues`);

    const allStats: QueueStats[] = [];

    for (const queueSid in items) {
      const stats = await this.fetchQueueStats(items[queueSid]);
      if (stats) allStats.push(stats);
    }

    console.log(`[agent-queue-stats] onQueuesLoaded: dispatching ${allStats.length} queue stats to Redux`);
    this.manager.store.dispatch(updateStats(allStats));
  }

  async onQueueAdded(event: LiveQueryAddedEvent<AgentQueue>) {
    const stats = await this.fetchQueueStats(event.value);
    if (stats) this.manager.store.dispatch(updateStats([stats]));
  }

  onQueueUpdated(event: LiveQueryUpdatedEvent<AgentQueue>) {
    const state = this.manager.store.getState() as any;
    const featureState = state[reduxNamespace]?.agentQueueStats;
    const existing = featureState?.stats?.find((s: QueueStats) => s.queue.queue_sid === event.key);
    if (!existing) return;

    const updated: QueueStats = { ...existing, queue: event.value };
    this.manager.store.dispatch(updateStats([updated]));
  }

  onStatsUpdated(queueSid: string, item: any) {
    const state = this.manager.store.getState() as any;
    const featureState = state[reduxNamespace]?.agentQueueStats;
    const existing = featureState?.stats?.find((s: QueueStats) => s.queue.queue_sid === queueSid);
    if (!existing) return;

    const updated = this.updateStatsItem(item, { ...existing });
    this.manager.store.dispatch(updateStats([updated]));
  }

  updateStatsItem(newItem: any, stats: QueueStats): QueueStats {
    switch (newItem.key) {
      case 'tasks_now':
        stats.tasks_now = (newItem.data as { queue: QueueTasksNow })['queue'];
        break;
      case 'tasks_thirty_minutes':
        stats.tasks_thirty_minutes = (newItem.data as { queue: QueueTasksHistorical })['queue'];
        break;
      case 'tasks_today':
        stats.tasks_today = (newItem.data as { queue: QueueTasksHistorical })['queue'];
        break;
      case 'worker_activities_statistics':
        stats.workers = newItem.data as QueueWorkerActivities;
        break;
      default:
        break;
    }
    return stats;
  }

  closeMaps() {
    for (const queueSid in this.mapCache) {
      this.mapCache[queueSid].close();
    }
    this.mapCache = {};
  }
}
