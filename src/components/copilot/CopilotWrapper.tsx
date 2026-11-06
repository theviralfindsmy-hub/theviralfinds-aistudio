'use client';

import React from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import '@copilotkit/react-ui/styles.css';

interface CopilotWrapperProps {
  children: React.ReactNode;
}

export function CopilotWrapper({ children }: CopilotWrapperProps) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent="antigravity"
      showDevConsole={false}
    >
      {children}
    </CopilotKit>
  );
}
