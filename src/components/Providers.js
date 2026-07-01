'use client';

import { SessionProvider } from 'next-auth/react';
import { ConfigProvider } from './ConfigProvider';
import StyledJsxRegistry from './StyledJsxRegistry';
import { SidebarProvider } from './SidebarContext';

export default function Providers({ children }) {
  return (
    <StyledJsxRegistry>
      <SessionProvider>
        <ConfigProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </ConfigProvider>
      </SessionProvider>
    </StyledJsxRegistry>
  );
}
