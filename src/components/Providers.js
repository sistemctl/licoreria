'use client';

import { SessionProvider } from 'next-auth/react';
import { ConfigProvider } from './ConfigProvider';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ConfigProvider>
        {children}
      </ConfigProvider>
    </SessionProvider>
  );
}
