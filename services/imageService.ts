
/**
 * ImageService - Optimisation des médias pour le contexte de Kinshasa (4G instable).
 */
export const ImageService = {
    /**
     * Compresse et redimensionne une image avant upload
     * @param file Le fichier original
     * @param maxWidth Largeur max (ex: 1200px)
     * @param quality Qualité JPEG (0.1 à 1.0)
     */
    compressImage: (file: File, maxWidth = 1000, quality = 0.7): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error("Compression Failed"));
                        }
                    }, 'image/jpeg', quality);
                };
            };
            reader.onerror = (e) => reject(e);
        });
    },

    fileToBase64: (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (e) => reject(e);
        });
    }
};
