import * as Flex from '@twilio/flex-ui';
import { ClientManagerInstance, ClientManagerHelpers } from '@twilio/flex-ui';
import { LiveQuery } from 'twilio-sync/lib/livequery';

import logger from '../../../utils/logger';

export interface LiveQueryAddedEvent<T> {
  key: string;
  value: T;
}

export interface LiveQueryUpdatedEvent<T> {
  key: string;
  value: T;
}

export default abstract class LiveQueryHelper<T> {
  readonly indexName: string;
  queryExpression: string;
  protected manager = Flex.Manager.getInstance();
  #items?: { [key: string]: T };
  #liveQuery?: LiveQuery;
  #initializing?: Promise<LiveQuery>;

  protected get liveQuery() {
    if (this.#initializing === undefined) {
      this.#initializing = this.#initLiveQuery();
    }
    return this.#initializing;
  }

  protected onItemAdded?(event: LiveQueryAddedEvent<T>): void;
  protected onItemUpdated?(event: LiveQueryUpdatedEvent<T>): void;

  constructor(indexName: string, queryExpression: string) {
    this.indexName = indexName;
    this.queryExpression = queryExpression;
    logger.debug(`[AQS:2] LiveQueryHelper constructor — index: "${indexName}", query: "${queryExpression}"`);
  }

  protected async startLiveQuery(): Promise<{ [key: string]: T }> {
    logger.debug(`[AQS:2] startLiveQuery — awaiting liveQuery init for index: "${this.indexName}"`);
    await this.liveQuery;
    const items = this.#items || {};
    logger.debug(`[AQS:2] startLiveQuery — resolved, item count: ${Object.keys(items).length}`);
    return items;
  }

  protected async closeLiveQuery(): Promise<void> {
    if (this.#liveQuery) {
      this.#liveQuery.close();
      this.#liveQuery = undefined;
    }
    this.#initializing = undefined;
    this.#items = undefined;
  }

  #initLiveQuery = async (): Promise<LiveQuery> => {
    logger.debug(`[AQS:2] #initLiveQuery — calling insightsClient.liveQuery("${this.indexName}", "${this.queryExpression}")`);

    if (!ClientManagerInstance.InsightsClient || ClientManagerHelpers.isForcedDegraded(ClientManagerInstance.InsightsClient)) {
      logger.error('[AQS:2] #initLiveQuery — InsightsClient unavailable or degraded. Flex Insights must be enabled on this account.');
      throw new Error('InsightsClient unavailable');
    }

    try {
      this.#liveQuery = await this.manager.insightsClient.liveQuery(this.indexName, this.queryExpression);
      this.#items = this.#liveQuery.getItems() as unknown as { [key: string]: T };
      const count = Object.keys(this.#items).length;
      logger.debug(`[AQS:2] #initLiveQuery — SUCCESS, initial items: ${count}`, { keys: Object.keys(this.#items) });
      this.#liveQuery.on('itemUpdated', this.#onItemUpdated.bind(this));
      return this.#liveQuery;
    } catch (e) {
      logger.error(`[AQS:2] #initLiveQuery — ERROR for index "${this.indexName}"`, { error: e });
      if (this.#liveQuery) {
        this.#liveQuery.close();
        this.#liveQuery = undefined;
      }
      this.#initializing = undefined;
      this.#items = undefined;
      throw e;
    }
  };

  #onItemUpdated = (event: LiveQueryUpdatedEvent<T>): void => {
    const data = { ...this.#items };
    const existingItem = Object.keys(data).includes(event.key);
    this.#items = { ...data, [event.key]: event.value };
    logger.debug(`[AQS:2] #onItemUpdated — key: "${event.key}", isNew: ${!existingItem}`);
    if (existingItem) {
      this.onItemUpdated && this.onItemUpdated(event);
    } else {
      const addedEvent: LiveQueryAddedEvent<T> = { ...event };
      this.onItemAdded && this.onItemAdded(addedEvent);
    }
  };
}
