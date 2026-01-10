
import { Language } from '../types';

export const translations: Record<Language, any> = {
  fr: {
    welcome: "Bienvenue sur Kin Eco Map",
    tagline: "L'application qui transforme Kinshasa.",
    start: "Commencer",
    login: "Connexion",
    identity: "Identité",
    phone: "Téléphone",
    commune: "Commune",
    neighborhood: "Quartier",
    address: "Adresse précise",
    submit_report: "Signaler un tas",
    points_earned: "Points Eco gagnés",
    settings: "Paramètres",
    language: "Langue de l'application",
    save: "Sauvegarder",
    logout: "Déconnexion"
  },
  en: {
    welcome: "Welcome to Kin Eco Map",
    tagline: "The app transforming Kinshasa.",
    start: "Get Started",
    login: "Login",
    identity: "Identity",
    phone: "Phone",
    commune: "District",
    neighborhood: "Neighborhood",
    address: "Precise Address",
    submit_report: "Report Trash",
    points_earned: "Eco-Points earned",
    settings: "Settings",
    language: "App Language",
    save: "Save Changes",
    logout: "Logout"
  },
  ln: {
    welcome: "Mbote na Kin Eco Map",
    tagline: "App oyo ezo bongola Kinshasa.",
    start: "Banda sikoyo",
    login: "Kota na compte",
    identity: "Kombo na yo",
    phone: "Nimero ya telefone",
    commune: "Commune",
    neighborhood: "Quartier",
    address: "Ndako numero",
    submit_report: "Tindela biso mbindo",
    points_earned: "Eco-Points ozwi",
    settings: "Paramètres",
    language: "Lokota ya App",
    save: "Bomba",
    logout: "Bima"
  }
};

export const useTranslation = (lang: Language) => {
  return (key: string) => translations[lang][key] || key;
};
