
// Gestionnaire de synchronisation hors ligne
// Stocke les requêtes non abouties dans le localStorage et réessaie quand la connexion revient.

interface SyncTask {
    id: string;
    type: 'ADD_ITEM' | 'UPDATE_PROFILE' | 'VALIDATE_JOB';
    payload: any;
    timestamp: number;
}

const STORAGE_KEY = 'kinecomap_sync_queue';

export const OfflineManager = {
    /**
     * Ajoute une tâche à la file d'attente
     */
    addToQueue: (type: SyncTask['type'], payload: any) => {
        const queue: SyncTask[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const task: SyncTask = {
            id: Date.now().toString(),
            type,
            payload,
            timestamp: Date.now()
        };
        queue.push(task);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        return task;
    },

    /**
     * Récupère la taille de la file d'attente
     */
    getQueueSize: (): number => {
        const queue = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return queue.length;
    },

    /**
     * Tente de traiter la file d'attente (appelé quand on revient en ligne)
     * Simule le traitement vers le backend.
     */
    processQueue: async (onTaskProcessed?: (task: SyncTask) => void): Promise<void> => {
        const queue: SyncTask[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        
        if (queue.length === 0) return;

        console.log(`[OfflineManager] Traitement de ${queue.length} tâches en attente...`);

        // Copie de la queue pour traitement
        const remainingQueue: SyncTask[] = [];

        for (const task of queue) {
            try {
                // Simulation d'envoi vers API réelle
                // Dans une vraie app, ici on ferait un fetch() ou axios.post()
                await new Promise(resolve => setTimeout(resolve, 500)); // Délai réseau simulé
                
                // Si succès, on notifie l'UI
                if (onTaskProcessed) onTaskProcessed(task);
                console.log(`[OfflineManager] Tâche ${task.type} synchronisée.`);
            } catch (error) {
                console.error(`[OfflineManager] Échec tâche ${task.type}`, error);
                remainingQueue.push(task); // On garde la tâche si échec
            }
        }

        // Mise à jour du stockage avec ce qui reste (échecs éventuels)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingQueue));
    },

    /**
     * Vide la file d'attente manuellement
     */
    clearQueue: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
