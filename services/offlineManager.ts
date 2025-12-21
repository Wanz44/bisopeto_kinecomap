
import { ReportsAPI } from './api';

// Gestionnaire de synchronisation hors ligne optimisé pour Biso Peto
// Stocke les requêtes non abouties dans le localStorage et réessaie quand la connexion revient.

export type TaskType = 'ADD_REPORT' | 'ADD_ITEM' | 'UPDATE_PROFILE' | 'VALIDATE_JOB';

interface SyncTask {
    id: string;
    type: TaskType;
    payload: any;
    timestamp: number;
    retryCount: number;
}

const STORAGE_KEY = 'kinecomap_sync_queue';

export const OfflineManager = {
    /**
     * Ajoute une tâche à la file d'attente
     */
    addToQueue: (type: TaskType, payload: any) => {
        const queue: SyncTask[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const task: SyncTask = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            payload,
            timestamp: Date.now(),
            retryCount: 0
        };
        queue.push(task);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        
        // Dispatch d'un événement personnalisé pour mettre à jour l'UI
        window.dispatchEvent(new CustomEvent('sync_queue_updated', { detail: { size: queue.length } }));
        return task;
    },

    /**
     * Récupère la taille de la file d'attente
     */
    getQueueSize: (): number => {
        try {
            const queue = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            return Array.isArray(queue) ? queue.length : 0;
        } catch {
            return 0;
        }
    },

    /**
     * Tente de traiter la file d'attente vers Supabase.
     */
    processQueue: async (onTaskSuccess?: (type: string) => void): Promise<void> => {
        const queue: SyncTask[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        if (queue.length === 0) return;

        console.log(`[OfflineManager] Synchronisation de ${queue.length} éléments vers le cloud...`);

        const remainingQueue: SyncTask[] = [];

        for (const task of queue) {
            try {
                switch (task.type) {
                    case 'ADD_REPORT':
                        await ReportsAPI.add(task.payload);
                        break;
                    case 'UPDATE_PROFILE':
                        // Logique spécifique pour profil si nécessaire
                        break;
                    // Ajouter d'autres cas ici
                }
                
                if (onTaskSuccess) onTaskSuccess(task.type);
                console.log(`[OfflineManager] Succès: ${task.type} synchronisé.`);
            } catch (error) {
                console.error(`[OfflineManager] Échec pour la tâche ${task.id}`, error);
                // On garde la tâche pour une prochaine tentative si moins de 5 essais
                if (task.retryCount < 5) {
                    remainingQueue.push({ ...task, retryCount: task.retryCount + 1 });
                }
            }
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingQueue));
        window.dispatchEvent(new CustomEvent('sync_queue_updated', { detail: { size: remainingQueue.length } }));
    },

    /**
     * Vide la file d'attente
     */
    clearQueue: () => {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('sync_queue_updated', { detail: { size: 0 } }));
    }
};
