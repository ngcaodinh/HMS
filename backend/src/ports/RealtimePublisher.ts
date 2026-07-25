// Mock Realtime Publisher for Sprint 1 (socket.io placeholder)
export class RealtimePublisher {
  static publishEvent(channel: string, event: string, payload: any) {
    console.log(`[RealtimePublisher] Publish to ${channel} -> ${event}:`, JSON.stringify(payload));
  }
}
