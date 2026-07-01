'use client';

import { useMemo } from 'react';
import { useConfig } from '@/components/ConfigProvider';
import { parsePaymentMethods, getActivePosMethods, getAbonoMethods, getMixtoSplitMethods, getMethodLabel } from '@/lib/paymentMethods';

export function usePaymentMethods() {
  const { configs } = useConfig();

  const methods = useMemo(
    () => parsePaymentMethods(configs.metodos_pago),
    [configs.metodos_pago]
  );

  const posMethods = useMemo(() => getActivePosMethods(methods), [methods]);
  const abonoMethods = useMemo(() => getAbonoMethods(methods), [methods]);
  const mixtoMethods = useMemo(() => getMixtoSplitMethods(methods), [methods]);

  const labelFor = (id) => getMethodLabel(id, methods);

  return { methods, posMethods, abonoMethods, mixtoMethods, labelFor };
}
