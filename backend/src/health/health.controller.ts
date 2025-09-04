export type HealthPayload = {
  status: 'ok';
  uptime: number; // seconds
  timestamp: string; // ISO
};

export function getHealth(): HealthPayload {
  return {
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}

