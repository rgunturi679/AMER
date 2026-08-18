import React from 'react';
import { Actions, SideLink } from '@twilio/flex-ui';

interface OwnProps {
  activeView?: string;
  viewName: string;
}

const AgentQueueStatsSideLink = (props: OwnProps) => {
  function navigate() {
    Actions.invokeAction('NavigateToView', { viewName: props.viewName });
  }

  return (
    <SideLink
      showLabel={true}
      icon="Queues"
      iconActive="QueuesBold"
      isActive={props.activeView === props.viewName}
      onClick={navigate}
      key="agent-queue-stats-side-link"
    >
      All Queue Stats
    </SideLink>
  );
};

export default AgentQueueStatsSideLink;
