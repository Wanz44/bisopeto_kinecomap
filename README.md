# BISO PETO GROUP - Kin Eco-Map 🌍

Plateforme technologique et environnementale pour la gestion des déchets, le recyclage, la santé environnementale et l'assainissement urbain en République Démocratique du Congo (Kinshasa).

---

## 🚀 Fonctionnalités Clés

- **🗺️ Cartographie Participative (SIG)** : Signalement géolocalisé des décharges et points noirs avec photos, niveau d'urgence et suivi d'état.
- **🏢 Solutions Entreprises & Partenaires** : Gestion de contrats de collecte réguliers, valorisation des déchets, tri sélectif et bilan carbone.
- **👥 4 Espaces Dédiés** :
  - **Citoyen** : Signalements, marketplace du recyclage, cours Academy et récompenses.
  - **Collecteur / Flotte** : Trajets optimisés, validation de pesées et géolocalisation.
  - **Entreprise** : Audit environnemental, demandes d'enlèvement et attestations écologiques.
  - **Back-Office Admin** : Supervision SIG, livre de caisse, campagnes publicitaires, audit logs et gestion des utilisateurs.
- **📱 PWA & Mode Hors-ligne** : Support complet Progressive Web App avec Service Worker, mise en cache tuiles cartographiques et Background Sync.

---

## 🛠️ Stack Technique

- **Frontend** : React 18, TypeScript (Mode Strict), Tailwind CSS, Lucide Icons, Recharts, Leaflet.
- **Backend & Données** : Firebase (Firestore, Authentication), Supabase, Resend API.
- **IA & Analyses** : Google Gemini API (`@google/genai`) pour la reconnaissance visuelle et les suggestions écologiques.
- **Build & Outils** : Vite 6+, PostCSS, ESLint, TypeScript 5+.

---

## 📦 Installation & Démarrage

### 1. Prérequis
- Node.js (v18+)
- npm ou yarn

### 2. Cloner et Installer
```bash
git clone https://github.com/bisopeto/kin-eco-map.git
cd kin-eco-map
npm install
```

### 3. Variables d'Environnement
Copiez le fichier `.env.example` en `.env` et configurez vos clés :
```bash
cp .env.example .env
```

Variables requises :
- `API_KEY` ou `VITE_GEMINI_API_KEY` : Clé API Google Gemini
- `RESEND_API_KEY` : Clé API pour l'envoi d'e-mails
- `SUPABASE_URL` / `SUPABASE_KEY` : Configuration Supabase (si activé)
- `CONTACT_EMAIL` : Adresse de réception (`contact@bisopeto.com`)

### 4. Lancer en Développement
```bash
npm run dev
```
L'application est accessible sur `http://localhost:3000`.

### 5. Compiler pour la Production
```bash
npm run build
npm run preview
```

---

## 🔒 Sécurité & Bonnes Pratiques

- **Zéro clé sensible dans le code source** : Toutes les variables d'accès sont injectées dynamiquement via l'environnement.
- **Règles Firestore ABAC** : Contrôle d'accès granulaire basé sur les rôles et identités vérifiées.
- **Mode Strict TypeScript** : Type-safety complet sur l'intégralité du projet.

---

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).

Copyright © 2026 **BISO PETO GROUP SARL**. Tous droits réservés.
