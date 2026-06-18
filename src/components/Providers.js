'use client';

import { SessionProvider } from 'next-auth/react';
import { ConfigProvider } from './ConfigProvider';
import StyledJsxRegistry from './StyledJsxRegistry';

export default function Providers({ children }) {
  return (
    <StyledJsxRegistry>
      <SessionProvider>
        <ConfigProvider>
          {children}
        </ConfigProvider>
      </SessionProvider>
    </StyledJsxRegistry>
  );
}
