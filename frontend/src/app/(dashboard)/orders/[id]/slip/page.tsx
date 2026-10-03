'use client';

import { use } from 'react';
import StandalonePrintSlipPage from '@/app/print/slip/[id]/page';

export default function OrderReportSlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <StandalonePrintSlipPage params={params} />;
}
