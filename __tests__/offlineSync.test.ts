import { OfflineSync } from '@/lib/offlineSync';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('OfflineSync', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should return empty queue when nothing is enqueued', () => {
    const queue = OfflineSync.getQueue();
    expect(queue).toEqual([]);
  });

  it('should enqueue a task with a unique id and timestamp', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    OfflineSync.enqueue({
      type: 'SUPABASE_INSERT',
      tableOrWebhook: 'test_table',
      payload: { name: 'Test' },
    });

    const queue = OfflineSync.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('SUPABASE_INSERT');
    expect(queue[0].id).toBeDefined();
    expect(queue[0].timestamp).toBeGreaterThan(0);
  });

  it('should persist queue across calls', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    OfflineSync.enqueue({ type: 'N8N_TRIGGER', tableOrWebhook: 'webhook', payload: {} });
    OfflineSync.enqueue({ type: 'N8N_TRIGGER', tableOrWebhook: 'webhook2', payload: {} });

    const queue = OfflineSync.getQueue();
    expect(queue).toHaveLength(2);
  });
});
