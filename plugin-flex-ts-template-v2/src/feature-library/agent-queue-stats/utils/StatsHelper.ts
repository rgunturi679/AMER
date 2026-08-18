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
    console.log('[AQS:3] StatsHelper constructor — initializing QueuesHelper');
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
    console.log(`[AQS:3] fetchQueueStats — queue: "${queue.queue_name}" (${queue.queue_sid})`);

    if (this.mapCache[queue.queue_sid]) {
      console.log(`[AQS:3] fetchQueueStats — map already open for "${queue.queue_name}", skipping`);
      return null;
    }

    const mapId = `${queue.queue_sid}.realtime_statistics.v1`;
    console.log(`[AQS:3] fetchQueueStats — opening Sync map: "${mapId}"`);

    try {
      this.mapCache[queue.queue_sid] = await this.manager.insightsClient.map({
        id: mapId,
        mode: 'open_existing',
      });
      console.log(`[AQS:3] fetchQueueStats — Sync map opened for "${queue.queue_name}"`);
    } catch (e) {
      console.error(`[AQS:3] fetchQueueStats — ERROR opening Sync map for "${queue.queue_name}" (${mapId}):`, e);
      return null;
    }

    const queueStatsMap = this.mapCache[queue.queue_sid];

    queueStatsMap.on('itemAdded', (args: any) => {
      console.log(`[AQS:3] Sync itemAdded — queue: "${queue.queue_name}", key: "${args.item?.key}"`);
      this.onStatsUpdated(queue.queue_sid, args.item);
    });
    queueStatsMap.on('itemUpdated', (args: any) => {
      console.log(`[AQS:3] Sync itemUpdated — queue: "${queue.queue_name}", key: "${args.item?.key}"`);
      this.onStatsUpdated(queue.queue_sid, args.item);
    });

    console.log(`[AQS:3] fetchQueueStats — calling getItems() for "${queue.queue_name}"`);
    const mapItems = await queueStatsMap.getItems();
    console.log(`[AQS:3] fetchQueueStats — getItems() returned ${mapItems.items.length} items for "${queue.queue_name}":`, mapItems.items.map((i: any) => i.key));

    let stats: QueueStats = { queue };
    mapItems.items.forEach((item) => {
      stats = this.updateStatsItem(item, stats);
    });

    console.log(`[AQS:3] fetchQueueStats — built stats for "${queue.queue_name}":`, JSON.stringify(stats));
    return stats;
  }

  async onQueuesLoaded(items: { [key: string]: AgentQueue }) {
    const queueCount = Object.keys(items).length;
    console.log(`[AQS:3] onQueuesLoaded — ${queueCount} queues discovered:`, Object.values(items).map((q) => q.queue_name));

    if (queueCount === 0) {
      console.warn('[AQS:3] onQueuesLoaded — WARNING: 0 queues returned from LiveQuery. Check tr-queue index permissions.');
    }

    const allStats: Array<QueueStats> = [];

    for (const queueSid in items) {
      const stats = await this.fetchQueueStats(items[queueSid]);
      if (!stats) continue;
      allStats.push(stats);
    }

    console.log(`[AQS:3] onQueuesLoaded — dispatching updateStats with ${allStats.length} entries`);
    this.manager.store.dispatch(updateStats(allStats));
  }

  async onQueueAdded(event: LiveQueryAddedEvent<AgentQueue>) {
    console.log(`[AQS:3] onQueueAdded — "${event.value.queue_name}" (${event.key})`);
    const stats = await this.fetchQueueStats(event.value);
    if (!stats) return;
    this.manager.store.dispatch(updateStats([stats]));
  }

  onQueueUpdated(event: LiveQueryUpdatedEvent<AgentQueue>) {
    console.log(`[AQS:3] onQueueUpdated — key: "${event.key}"`);
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

    if (!stats) {
      console.warn(`[AQS:3] onStatsUpdated — no stats entry found in Redux for queueSid: "${queueSid}"`);
      return;
    }

    const updatedStats = this.updateStatsItem(item, { ...stats });
    this.manager.store.dispatch(updateStats([updatedStats]));
  }

  updateStatsItem(newItem: any, stats: QueueStats): QueueStats {
    console.log(`[AQS:3] updateStatsItem — key: "${newItem.key}" for queue: "${stats.queue.queue_name}"`);
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
        console.warn(`[AQS:3] updateStatsItem — unhandled key: "${newItem.key}"`);
    }
    return stats;
  }
}
