'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UsuariosRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/configuracion?tab=usuarios');
  }, [router]);

  return null;
}
