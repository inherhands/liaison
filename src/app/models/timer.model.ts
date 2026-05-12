export interface TimerDevice {
  id: string;
  name: string;
  createdAt?: number;
}

export interface ActiveTimer {
  id: string;
  deviceId: string;
  deviceName: string;
  startedAt: number; // Unix ms
  notes?: string;
}

export interface TimerSession {
  id: string;
  deviceId: string;
  deviceName: string;
  startedAt: number;  // Unix ms
  endedAt: number;    // Unix ms
  durationMs: number;
  notes?: string;
}
