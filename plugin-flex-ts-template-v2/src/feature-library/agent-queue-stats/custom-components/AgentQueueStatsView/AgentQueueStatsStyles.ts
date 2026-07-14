import { styled, DataTable } from '@twilio/flex-ui';

export const AgentQueueStatsWrapper = styled('div')`
  overflow: auto;
`;

export const CustomDataTable = styled(DataTable)`
  & .tw-data-table-column:nth-child(1) {
    padding-left: 20px;
  }
`;
