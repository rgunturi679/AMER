import { ITask, Manager } from '@twilio/flex-ui';

import { getOpenCti } from './SfdcHelper';
import { screenPopRecord } from './ScreenPop';
import logger from '../../../utils/logger';

const getVendorFields = (attrs: any) => {
  if (attrs.vendor === 'decagon') {
    return {
      AI_Conversation_Id__c: attrs.conversation_id,
      Call_Notes__c: attrs.call_notes,
      Summary__c: attrs.conversation_summary || attrs.summary,
      Escalation_Reason__c: attrs.escalation,
    };
  }
  if (attrs.vendor === 'sierra') {
    return {
      AI_Conversation_Id__c: attrs.sierra_conversation_id,
      Call_Notes__c: attrs.call_notes,
      Summary__c: attrs.summary,
      Escalation_Reason__c: attrs.escalation_reason,
      Main_Issues__c: attrs.main_issues,
      Resolution__c: attrs.resolution,
    };
  }
  return {};
};

export const createAICallCentreNote = (task: ITask) => {
  logger.log('[salesforce-integration] createAICallCentreNote called', { taskSid: task.taskSid });

  const opencti = getOpenCti();
  if (!opencti) {
    logger.error('[salesforce-integration] createAICallCentreNote: OpenCTI not available');
    return;
  }

  const attrs = task.attributes;
  const callSid = attrs.call_sid || attrs.conference?.participants?.customer;
  const { direction, from, vendor } = attrs;
  const to = attrs.to || attrs.outbound_to;
  const segmentLink = attrs.conversations?.segment_link;
  const durationSec = task.age;
  const hangUpBy = direction === 'outbound' ? 'agent' : 'customer';
  const userId = (Manager.getInstance().workerClient as any)?.attributes?.userId;
  const localHour = new Date().getHours();
  const utcHour = new Date().getUTCHours();
  const callName = `${direction === 'outbound' ? 'Outgoing' : 'Incoming'} call from ${from} to ${to}`;

  logger.log('[salesforce-integration] createAICallCentreNote: extracted fields', {
    callSid, direction, from, to, vendor, segmentLink, durationSec, hangUpBy, userId,
  });

  const vendorFields = getVendorFields(attrs);
  logger.log('[salesforce-integration] createAICallCentreNote: vendor fields', vendorFields);

  const callLog = {
    callSid,
    direction,
    from,
    to,
    segmentLink,
    callStartTime: task.dateCreated?.toISOString(),
    callEndTime: task.dateUpdated?.toISOString(),
    durationSec,
    hangUpBy,
    userId,
    vendor,
  };

  const record = {
    entityApiName: 'Call_Center_Note__c',
    Subject: callName,
    Description: attrs.call_notes ?? '',
    Call_Duration_Seconds__c: durationSec,
    Call_Direction_Inbound_Outbound__c: direction,
    Call_Data__c: JSON.stringify(callLog),
    Call_Recording__c: segmentLink || 'No recording available',
    Call_Hour_Of_Day_Local__c: localHour,
    Call_Hour_Of_Day_Agent__c: utcHour,
    Abandoned_Call__c: false,
    Call_Connected__c: 'Yes',
    Abandoned_Call_caller_or_callee__c: hangUpBy,
    Call_Object_Identifier__c: callSid,
    Ticket__c: attrs.caseId,
    Automated_Voicemail_Used__c: attrs.voicemail ?? false,
    Call_Name__c: callName,
    AI_Vendor__c: vendor,
    ...vendorFields,
  };

  logger.log('[salesforce-integration] createAICallCentreNote: calling saveLog', record);

  opencti.saveLog({
    value: record,
    callback: (result: any) => {
      logger.log('[salesforce-integration] createAICallCentreNote: saveLog callback', result);
      if (!result.success) {
        logger.error('[salesforce-integration] createAICallCentreNote: saveLog failed', result.errors);
        return;
      }
      const recordId = result.returnValue?.id;
      logger.log('[salesforce-integration] createAICallCentreNote: record created, popping', recordId);
      if (recordId) {
        screenPopRecord(recordId);
      } else {
        logger.warn('[salesforce-integration] createAICallCentreNote: no recordId in saveLog response', result.returnValue);
      }
    },
  });
};
