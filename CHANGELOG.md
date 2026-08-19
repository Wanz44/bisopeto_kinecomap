# Changelog - BISO PETO GROUP & Kin Eco-Map

Toutes les modifications notables apportées à ce projet sont documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [1.1.0] - 2026-08-19

### Sécurité & Durcissement
- **Credentials** : Suppression stricte des clés et tokens codés en dur dans `vite.config.ts`.
- **Ignore Rules** : Enrichissement complet du `.gitignore` pour bloquer les fichiers d'environnement (`.env*`), certificats, clés privées et bundles de build.
- **Firebase & Firestore** : Consolidation de l'initialisation singleton du SDK Firebase Modular et liaison directe avec la base de données Firestore (`ai-studio-6828104d-b4f2-481d-965a-814294512339`).

### Qualité & Typage
- **TypeScript Strict** : Activation du mode strict (`strict: true`) avec vérification des types stricts, élimination des `any` implicites et typage défensif des tris et retours IA.
- **Linter** : Passage complet du linter sans avertissements ni erreurs.

### Performance & PWA
- **Service Worker** : Amélioration du cache tuiles cartographiques, intégration de la synchronisation en arrière-plan (`Background Sync`) et prise en charge des notifications push environnementales.
- **Optimisation des Builds** : Configuration du code-splitting Rollup par vendors (React, Recharts, Leaflet, Firebase).

### Fonctionnalités
- **Branding & Identité** : Déploiement du Favicon dynamique officiel Biso Peto Group et intégration des métadonnées Open Graph / Twitter Card.
- **Formulaire de Contact** : Intégration de Resend API pour l'acheminement automatique des demandes d'évaluation vers l'e-mail officiel avec double persistance Firestore.

---

## [1.0.0] - 2026-08-15

### Ajout initial
- Lancement de la plateforme Kin Eco-Map pour la gestion des déchets, cartographie interactive et reporting environnemental en RDC.
- Espaces Citoyen, Collecteur, Entreprise et Back-Office Administrateur.
