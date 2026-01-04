
export const NotificationService = {
    /**
     * Demande la permission d'envoyer des notifications push
     */
    requestPermission: async (): Promise<boolean> => {
        if (!('Notification' in window)) {
            console.warn("Ce navigateur ne supporte pas les notifications desktop");
            return false;
        }

        if (Notification.permission === 'granted') return true;

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    },

    /**
     * Envoie une notification système
     */
    sendPush: (title: string, body: string, icon: string = 'logobisopeto.png') => {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }

        // Notification visuelle
        // Fixed: Removed 'badge' and 'vibrate' from NotificationOptions as they are only supported in ServiceWorker notifications, not the standard Notification constructor.
        const notification = new Notification(title, {
            body: body,
            icon: icon
        });

        // Notification sonore (simulée par une note audio courte)
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // La5
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
};