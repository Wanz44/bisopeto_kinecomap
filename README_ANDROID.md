# Guide pour générer votre APK Android (Biso Peto)

Ce projet a été entièrement configuré avec **Capacitor** pour vous permettre de générer très facilement une application Android native et d'obtenir le fichier **APK** final.

Comme les serveurs de développement cloud ne disposent pas d'un compilateur Android (JDK/Java/Android SDK), vous devez finaliser la compilation (génération du fichier `.apk`) sur votre ordinateur. C'est le processus standard pour toutes les applications mobiles.

Voici les étapes simples à suivre :

---

## 📋 Prérequis sur votre ordinateur

1. **Node.js** : Assurez-vous d'avoir Node.js installé ([Télécharger ici](https://nodejs.org/))
2. **Android Studio** : Téléchargez et installez Android Studio ([Télécharger ici](https://developer.android.com/studio))
   - *Lors de l'installation, laissez les options par défaut pour installer le SDK Android de base et l'émulateur.*

---

## 🚀 Étapes de Génération de l'APK

### Étape 1 : Exporter le projet
1. Depuis l'interface de **Google AI Studio**, ouvrez le menu des paramètres (icône Engrenage ⚙️ ou menu de téléchargement).
2. Cliquez sur **Export** ou **Download as ZIP** pour télécharger le code source complet de votre application sur votre ordinateur.
3. Extrayez l'archive ZIP dans un dossier sur votre disque dur.

### Étape 2 : Installer les dépendances
Ouvrez le terminal de votre ordinateur dans le dossier extrait, puis exécutez la commande suivante pour restaurer tous les modules :
```bash
npm install
```

### Étape 3 : Compiler les fichiers web et synchroniser le projet Android
Exécutez la commande script pré-configurée pour synchroniser l'application :
```bash
npm run android:sync
```
*Cette commande va compiler l'application web React/TypeScript (dans le dossier `dist`) puis copier tous les fichiers générés vers le projet natif Android (`android/app/src/main/assets/public`).*

### Étape 4 : Ouvrir le projet dans Android Studio
Lancez la commande suivante pour ouvrir automatiquement le projet Android dans Android Studio :
```bash
npm run android:open
```
OU :
1. Ouvrez l'application **Android Studio** directement.
2. Cliquez sur **Open an existing project** (Ouvrir un projet existant).
3. Sélectionnez le dossier nommé **`android`** situé à la racine du projet extrait.

---

## 🛠️ Générer et Récupérer l'APK

Une fois le projet chargé dans Android Studio :

### Méthode 1 : Tester sur votre smartphone (Le plus rapide)
1. Activez le **débogage USB** sur votre téléphone Android (dans Paramètres > Options de développement).
2. Branchez votre téléphone à votre ordinateur avec un câble USB.
3. Dans Android Studio, sélectionnez votre téléphone dans la liste déroulante des appareils (en haut).
4. Cliquez sur le bouton **Run** (icône triangle vert ▶️). L'application s'installera et s'ouvrira directement sur votre téléphone.

### Méthode 2 : Générer le fichier de package APK (`.apk`)
1. Dans le menu du haut d'Android Studio, allez sur : `Build` ➔ `Build Bundle(s) / APK(s)` ➔ `Build APK(s)`.
2. Laissez Android Studio compiler l'application (en arrière-plan). Cela prend généralement 1 à 2 minutes.
3. Une fois terminé, une bulle de notification apparaîtra en bas à droite avec un bouton cliquable **`locate`**.
4. Cliquez sur **`locate`** pour ouvrir le dossier contenant votre fichier APK compilé (nommé généralement `app-debug.apk`).
5. Transférez ce fichier sur votre téléphone (par email, WhatsApp, câble ou Google Drive) et cliquez dessus pour l'installer !

---

## ⚙️ Configuration Technique Effectuée

Pour votre information, nous avons déjà configuré les éléments clés requis :
* **ID Unique de l'Application** : `com.bisopeto.app`
* **Nom de l'Application** : `Biso Peto`
* **Entrées et scripts NPM** définis dans `package.json`
* **Config Capacitor** active dans `capacitor.config.ts`
