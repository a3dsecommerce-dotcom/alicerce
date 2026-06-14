import { supabase } from './supabase';
import { n8n } from './n8n';

interface SyncTask {
  id: string;
  type: 'SUPABASE_INSERT' | 'N8N_TRIGGER';
  tableOrWebhook: string;
  payload: any;
  timestamp: number;
}

/**
 * Motor de Sincronização Offline-First
 * Projetado para suportar o trabalho de campo (Encarregados/Supervisores) em áreas de sombra de 4G.
 */
export const OfflineSync = {
  getQueue: (): SyncTask[] => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('alicerce_sync_queue');
    return saved ? JSON.parse(saved) : [];
  },

  enqueue: (task: Omit<SyncTask, 'id' | 'timestamp'>) => {
    const queue = OfflineSync.getQueue();
    queue.push({
      ...task,
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    });
    localStorage.setItem('alicerce_sync_queue', JSON.stringify(queue));
    
    // Tenta sincronizar imediatamente (se voltou rápido)
    if (navigator.onLine) {
      OfflineSync.attemptSync();
    }
  },

  attemptSync: async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    
    const queue = OfflineSync.getQueue();
    if (queue.length === 0) return;

    let remainingQueue = [...queue];

    for (const task of queue) {
      try {
        if (task.type === 'SUPABASE_INSERT') {
          const { error } = await supabase.from(task.tableOrWebhook).insert(task.payload);
          if (error) throw error;
        } else if (task.type === 'N8N_TRIGGER') {
          await n8n.trigger(task.tableOrWebhook, task.payload);
        }
        
        // Remove da fila apenas se teve sucesso
        remainingQueue = remainingQueue.filter(t => t.id !== task.id);
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') console.error('[OfflineSync] Falha ao sincronizar pacote:', task, err);
        // Se o erro foi de rede, interrompe a fila para tentar depois
        if (!navigator.onLine || err?.message === 'Failed to fetch') {
          break;
        }
      }
    }

    localStorage.setItem('alicerce_sync_queue', JSON.stringify(remainingQueue));
  },

  /**
   * Wrapper inteligente para Insert no Supabase.
   * Tenta inserir. Se estiver offline ou a rede falhar, joga para a fila e avisa que salvou local.
   */
  insertSafe: async (tableName: string, payload: any) => {
    if (!navigator.onLine) {
      OfflineSync.enqueue({ type: 'SUPABASE_INSERT', tableOrWebhook: tableName, payload });
      return { offline: true, error: null };
    }

    try {
      const { data, error } = await supabase.from(tableName).insert(payload).select();
      if (error) throw error;
      return { data, error: null, offline: false };
    } catch (error: any) {
      if (error?.message === 'Failed to fetch' || !navigator.onLine) {
        OfflineSync.enqueue({ type: 'SUPABASE_INSERT', tableOrWebhook: tableName, payload });
        return { offline: true, error: null };
      }
      return { data: null, error, offline: false };
    }
  },

  /**
   * Wrapper inteligente para Webhooks n8n.
   */
  triggerSafe: async (webhook: string, payload: any) => {
    if (!navigator.onLine) {
      OfflineSync.enqueue({ type: 'N8N_TRIGGER', tableOrWebhook: webhook, payload });
      return { offline: true };
    }

    try {
      await n8n.trigger(webhook, payload);
      return { offline: false };
    } catch (error: any) {
      if (error?.message === 'Failed to fetch' || error?.name === 'TypeError') {
        OfflineSync.enqueue({ type: 'N8N_TRIGGER', tableOrWebhook: webhook, payload });
        return { offline: true };
      }
      return { offline: false, error };
    }
  }
};

// Escutador Global de Conexão
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (process.env.NODE_ENV === 'development') console.log('[OfflineSync] Conexão reestabelecida. Tentando sincronizar fila...');
    OfflineSync.attemptSync();
  });
  
  // Tenta sincronizar ao iniciar o app
  setTimeout(OfflineSync.attemptSync, 3000);
}
