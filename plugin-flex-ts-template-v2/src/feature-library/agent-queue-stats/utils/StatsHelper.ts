import * as Flex from '@twilio/flex-ui';
import { SyncMap } from 'twilio-sync';

import QueuesHelper, { AgentQueue } from './QueuesHelper';
import { LiveQueryAddedEvent, LiveQueryUpdatedEvent } from './LiveQueryHelper';
import { updateStats } from '../flex-hooks/states/AgentQueueStatsSlice';

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

interface QueueTasksNowMap {
  [key: string]: QueueTasksNow;
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

interface QueueTasksHistoricalMap {
  [key: string]: QueueTasksHistorical;
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

export default class StatsHelper {
  mapCache: MapCache;
  manager: Flex.Manager;
  queuesHelper: QueuesHelper;

  constructor(manager: Flex.Manager) {
    this.mapCache = {};
    this.manager = manager;

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
    const stats: QueueStats = { queue };

    // no need to do anything if the map is open already
    if (this.mapCache[queue.queue_sid]) return null;

    this.mapCache[queue.queue_sid] = await this.manager.insightsClient.map({
      id: `${queue.queue_sid}.realtime_statistics.v1`,
      mode: 'open_existing',
    });

    const queueStatsMap = this.mapCache[queue.queue_sid];

    // set up listeners
    queueStatsMap.on('itemAdded', (args: any) => {
      this.onStatsUpdated(queue.queue_sid, args.item);
    });
    queueStatsMap.on('itemUpdated', (args: any) => {
      this.onStatsUpdated(queue.queue_sid, args.item);
    });

    // get initial data
    const mapItems = await queueStatsMap.getItems();
    let updatedStats = stats;
    mapItems.items.forEach((item) => {
      updatedStats = this.updateStatsItem(item, updatedStats);
    });

    return updatedStats;
  }

  async onQueuesLoaded(items: { [key: string]: AgentQueue }) {
    const allStats: Array<QueueStats> = [];

    for (const queueSid in items) {
      const stats = await this.fetchQueueStats(items[queueSid]);
      if (!stats) continue;
      allStats.push(stats);
    }

    this.manager.store.dispatch(updateStats(allStats));
  }

  async onQueueAdded(event: LiveQueryAddedEvent<AgentQueue>) {
    const stats = await this.fetchQueueStats(event.value);
    if (!stats) return;
    this.manager.store.dispatch(updateStats([stats]));
  }

  onQueueUpdated(event: LiveQueryUpdatedEvent<AgentQueue>) {
    const state = this.manager.store.getState() as any;
    const statsArray: QueueStats[] = state.agentQueueStats?.stats || [];
    const stats = statsArray.find((queueStats) => queueStats.queue.queue_sid === event.key);
    if (!stats) return;

    const updatedStats = { ...stats, queue: event.value };
    this.manager.store.dispatch(updateStats([updatedStats]));
  }

  onStatsUpdated(queueSid: string, item: any) {
    const state = this.manager.store.getState() as any;
    const statsArray: QueueStats[] = state.agentQueueStats?.stats || [];
    const stats = statsArray.find((queueStats) => queueStats.queue.queue_sid === queueSid);

    if (!stats) return;

    const updatedStats = this.updateStatsItem(item, { ...stats });
    this.manager.store.dispatch(updateStats([updatedStats]));
  }

  updateStatsItem(newItem: any, stats: QueueStats): QueueStats {
    switch (newItem.key) {
      case 'tasks_now':
        stats.tasks_now = (newItem.data as QueueTasksNowMap)['queue'];
        break;
      case 'tasks_thirty_minutes':
        stats.tasks_thirty_minutes = (newItem.data as QueueTasksHistoricalMap)['queue'];
        break;
      case 'tasks_today':
        stats.tasks_today = (newItem.data as QueueTasksHistoricalMap)['queue'];
        break;
      case 'worker_activities_statistics':
        stats.workers = newItem.data as QueueWorkerActivities;
        break;
      default:
    }

    return stats;
  }
}
