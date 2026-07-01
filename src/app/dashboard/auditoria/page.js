'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditoriaRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/configuracion?tab=auditoria');
  }, [router]);

  return null;
}
