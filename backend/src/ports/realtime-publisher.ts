export class RealtimePublisher {
  /** Phát sự kiện realtime dạng adapter demo; payload không được dùng để quyết định quyền. */
  static publishEvent(channel: string, event: string, payload: unknown): void {
    console.log(`[RealtimePublisher] Publish to ${channel} -> ${event}:`, JSON.stringify(payload));
  }
}
