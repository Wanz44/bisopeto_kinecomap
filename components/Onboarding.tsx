
import React, { useState, useEffect } from 'react';
import { 
    ChevronRight, ArrowLeft, LogIn, User as UserIcon, Lock, 
    Eye, EyeOff, AlertCircle, Loader2, Mail, Globe, Search, X,
    CheckCircle2, Truck, Briefcase, Sparkles, MapPin, GraduationCap, ArrowRight, Send,
    RefreshCw, Inbox, ShieldCheck
} from 'lucide-react';
import { UserType, User, Language } from '../types';
import { UserAPI } from '../services/api';
import { LegalDocs } from './LegalDocs';

interface OnboardingProps {
    onComplete: (user: Partial<User>) => void;
    onBackToLanding: () => void;
    appLogo?: string;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
    initialShowLogin?: boolean;
    onNotifyAdmin?: (title: string, message: string) => void;
    currentLanguage: Language;
    onLanguageChange: (lang: Language) => void;
}

const ALL_COUNTRIES = [
    { name: "Afghanistan", code: "AF", prefix: "+93", flag: "🇦🇫" },
    { name: "Afrique du Sud", code: "ZA", prefix: "+27", flag: "🇿🇦" },
    { name: "Albanie", code: "AL", prefix: "+355", flag: "🇦🇱" },
    { name: "Algérie", code: "DZ", prefix: "+213", flag: "🇩🇿" },
    { name: "Allemagne", code: "DE", prefix: "+49", flag: "🇩🇪" },
    { name: "Andorre", code: "AD", prefix: "+376", flag: "🇦🇩" },
    { name: "Angola", code: "AO", prefix: "+244", flag: "🇦🇴" },
    { name: "Anguilla", code: "AI", prefix: "+1264", flag: "🇦🇮" },
    { name: "Antigua-et-Barbuda", code: "AG", prefix: "+1268", flag: "🇦🇬" },
    { name: "Arabie Saoudite", code: "SA", prefix: "+966", flag: "🇸🇦" },
    { name: "Argentine", code: "AR", prefix: "+54", flag: "🇦🇷" },
    { name: "Arménie", code: "AM", prefix: "+374", flag: "🇦🇲" },
    { name: "Aruba", code: "AW", prefix: "+297", flag: "🇦🇼" },
    { name: "Australie", code: "AU", prefix: "+61", flag: "🇦🇺" },
    { name: "Autriche", code: "AT", prefix: "+43", flag: "🇦🇹" },
    { name: "Azerbaïdjan", code: "AZ", prefix: "+994", flag: "🇦🇿" },
    { name: "Bahamas", code: "BS", prefix: "+1242", flag: "🇧🇸" },
    { name: "Bahreïn", code: "BH", prefix: "+973", flag: "🇧🇭" },
    { name: "Bangladesh", code: "BD", prefix: "+880", flag: "🇧🇩" },
    { name: "Barbade", code: "BB", prefix: "+1246", flag: "🇧🇧" },
    { name: "Belgique", code: "BE", prefix: "+32", flag: "🇧🇪" },
    { name: "Belize", code: "BZ", prefix: "+501", flag: "🇧🇿" },
    { name: "Bénin", code: "BJ", prefix: "+229", flag: "🇧🇯" },
    { name: "Bermudes", code: "BM", prefix: "+1441", flag: "🇧🇲" },
    { name: "Bhoutan", code: "BT", prefix: "+975", flag: "🇧🇹" },
    { name: "Biélorussie", code: "BY", prefix: "+375", flag: "🇧🇾" },
    { name: "Birmanie", code: "MM", prefix: "+95", flag: "🇲🇲" },
    { name: "Bolivie", code: "BO", prefix: "+591", flag: "🇧🇴" },
    { name: "Bosnie-Herzégovine", code: "BA", prefix: "+387", flag: "🇧🇦" },
    { name: "Botswana", code: "BW", prefix: "+267", flag: "🇧🇼" },
    { name: "Brésil", code: "BR", prefix: "+55", flag: "🇧🇷" },
    { name: "Brunei", code: "BN", prefix: "+673", flag: "🇧🇳" },
    { name: "Bulgarie", code: "BG", prefix: "+359", flag: "🇧🇬" },
    { name: "Burkina Faso", code: "BF", prefix: "+226", flag: "🇧🇫" },
    { name: "Burundi", code: "BI", prefix: "+257", flag: "🇧🇮" },
    { name: "Cambodge", code: "KH", prefix: "+855", flag: "🇰🇭" },
    { name: "Cameroun", code: "CM", prefix: "+237", flag: "🇨🇲" },
    { name: "Canada", code: "CA", prefix: "+1", flag: "🇨🇦" },
    { name: "Cap-Vert", code: "CV", prefix: "+238", flag: "🇨🇻" },
    { name: "Chili", code: "CL", prefix: "+56", flag: "🇨🇱" },
    { name: "Chine", code: "CN", prefix: "+86", flag: "🇨🇳" },
    { name: "Chypre", code: "CY", prefix: "+357", flag: "🇨🇾" },
    { name: "Colombie", code: "CO", prefix: "+57", flag: "🇨🇴" },
    { name: "Comores", code: "KM", prefix: "+269", flag: "🇰🇲" },
    { name: "Congo-Brazzaville", code: "CG", prefix: "+242", flag: "🇨🇬" },
    { name: "Congo-Kinshasa (RDC)", code: "RDC", prefix: "+243", flag: "🇨🇩" },
    { name: "Corée du Nord", code: "KP", prefix: "+850", flag: "🇰🇵" },
    { name: "Corée du Sud", code: "KR", prefix: "+82", flag: "🇰🇷" },
    { name: "Costa Rica", code: "CR", prefix: "+506", flag: "🇨🇷" },
    { name: "Côte d’Ivoire", code: "CI", prefix: "+225", flag: "🇨🇮" },
    { name: "Croatie", code: "HR", prefix: "+385", flag: "🇭🇷" },
    { name: "Cuba", code: "CU", prefix: "+53", flag: "🇨🇺" },
    { name: "Danemark", code: "DK", prefix: "+45", flag: "🇩🇰" },
    { name: "Djibouti", code: "DJ", prefix: "+253", flag: "🇩🇯" },
    { name: "Dominique", code: "DM", prefix: "+1767", flag: "🇩🇲" },
    { name: "Égypte", code: "EG", prefix: "+20", flag: "🇪🇬" },
    { name: "Émirats Arabes Unis", code: "AE", prefix: "+971", flag: "🇦🇪" },
    { name: "Équateur", code: "EC", prefix: "+593", flag: "🇪🇨" },
    { name: "Érythrée", code: "ER", prefix: "+291", flag: "🇪🇷" },
    { name: "Espagne", code: "ES", prefix: "+34", flag: "🇪🇸" },
    { name: "Estonie", code: "EE", prefix: "+372", flag: "🇪🇪" },
    { name: "Eswatini", code: "SZ", prefix: "+268", flag: "🇸🇿" },
    { name: "États-Unis", code: "US", prefix: "+1", flag: "🇺🇸" },
    { name: "Éthiopie", code: "ET", prefix: "+251", flag: "🇪🇹" },
    { name: "Fidji", code: "FJ", prefix: "+679", flag: "🇫🇯" },
    { name: "Finlande", code: "FI", prefix: "+358", flag: "🇫🇮" },
    { name: "France", code: "FR", prefix: "+33", flag: "🇫🇷" },
    { name: "Gabon", code: "GA", prefix: "+241", flag: "🇬🇦" },
    { name: "Gambie", code: "GM", prefix: "+220", flag: "🇬🇲" },
    { name: "Géorgie", code: "GE", prefix: "+995", flag: "🇬🇪" },
    { name: "Ghana", code: "GH", prefix: "+233", flag: "🇬🇭" },
    { name: "Gibraltar", code: "GI", prefix: "+350", flag: "🇬🇮" },
    { name: "Grèce", code: "GR", prefix: "+30", flag: "🇬🇷" },
    { name: "Grenade", code: "GD", prefix: "+1473", flag: "🇬🇩" },
    { name: "Groenland", code: "GL", prefix: "+299", flag: "🇬🇱" },
    { name: "Guadeloupe", code: "GP", prefix: "+590", flag: "🇬🇵" },
    { name: "Guam", code: "GU", prefix: "+1671", flag: "🇬🇺" },
    { name: "Guatemala", code: "GT", prefix: "+502", flag: "🇬🇹" },
    { name: "Guinée", code: "GN", prefix: "+224", flag: "🇬🇳" },
    { name: "Guinée équatoriale", code: "GQ", prefix: "+240", flag: "🇬🇶" },
    { name: "Guinée-Bissau", code: "GW", prefix: "+245", flag: "🇬🇼" },
    { name: "Haïti", code: "HT", prefix: "+509", flag: "🇭🇹" },
    { name: "Honduras", code: "HN", prefix: "+504", flag: "🇭🇳" },
    { name: "Hong Kong", code: "HK", prefix: "+852", flag: "🇭🇰" },
    { name: "Hongrie", code: "HU", prefix: "+36", flag: "🇭🇺" },
    { name: "Île Cook", code: "CK", prefix: "+682", flag: "🇨🇰" },
    { name: "Île Maurice", code: "MU", prefix: "+230", flag: "🇲🇺" },
    { name: "Inde", code: "IN", prefix: "+91", flag: "🇮🇳" },
    { name: "Indonésie", code: "ID", prefix: "+62", flag: "🇮🇩" },
    { name: "Irak", code: "IQ", prefix: "+964", flag: "🇮🇶" },
    { name: "Iran", code: "IR", prefix: "+98", flag: "🇮🇷" },
    { name: "Irlande", code: "IE", prefix: "+353", flag: "🇮🇪" },
    { name: "Islande", code: "IS", prefix: "+354", flag: "🇮🇸" },
    { name: "Israël", code: "IL", prefix: "+972", flag: "🇮🇱" },
    { name: "Italie", code: "IT", prefix: "+39", flag: "🇮🇹" },
    { name: "Jamaïque", code: "JM", prefix: "+1876", flag: "🇯🇲" },
    { name: "Japon", code: "JP", prefix: "+81", flag: "🇯🇵" },
    { name: "Jordanie", code: "JO", prefix: "+962", flag: "🇯🇴" },
    { name: "Kazakhstan", code: "KZ", prefix: "+7", flag: "🇰🇿" },
    { name: "Kenya", code: "KE", prefix: "+254", flag: "🇰🇪" },
    { name: "Kirghizistan", code: "KG", prefix: "+996", flag: "🇰🇬" },
    { name: "Kiribati", code: "KI", prefix: "+686", flag: "🇰🇮" },
    { name: "Koweït", code: "KW", prefix: "+965", flag: "🇰🇼" },
    { name: "Laos", code: "LA", prefix: "+856", flag: "🇱🇦" },
    { name: "Lesotho", code: "LS", prefix: "+266", flag: "🇱🇸" },
    { name: "Lettonie", code: "LV", prefix: "+371", flag: "🇱🇻" },
    { name: "Liban", code: "LB", prefix: "+961", flag: "🇱🇧" },
    { name: "Liberia", code: "LR", prefix: "+231", flag: "🇱🇷" },
    { name: "Libye", code: "LY", prefix: "+218", flag: "🇱🇾" },
    { name: "Liechtenstein", code: "LI", prefix: "+423", flag: "🇱🇮" },
    { name: "Lituanie", code: "LT", prefix: "+370", flag: "🇱🇹" },
    { name: "Luxembourg", code: "LU", prefix: "+352", flag: "🇱🇺" },
    { name: "Macao", code: "MO", prefix: "+853", flag: "🇲🇴" },
    { name: "Madagascar", code: "MG", prefix: "+261", flag: "🇲🇬" },
    { name: "Malaisie", code: "MY", prefix: "+60", flag: "🇲🇾" },
    { name: "Malawi", code: "MW", prefix: "+265", flag: "🇲🇼" },
    { name: "Maldives", code: "MV", prefix: "+960", flag: "🇲🇻" },
    { name: "Mali", code: "ML", prefix: "+223", flag: "🇲🇱" },
    { name: "Malte", code: "MT", prefix: "+356", flag: "🇲🇹" },
    { name: "Maroc", code: "MA", prefix: "+212", flag: "🇲🇦" },
    { name: "Martinique", code: "MQ", prefix: "+596", flag: "🇲🇶" },
    { name: "Mauritanie", code: "MR", prefix: "+222", flag: "🇲🇷" },
    { name: "Mayotte", code: "YT", prefix: "+262", flag: "🇾🇹" },
    { name: "Mexique", code: "MX", prefix: "+52", flag: "🇲🇽" },
    { name: "Moldavie", code: "MD", prefix: "+373", flag: "🇲🇩" },
    { name: "Monaco", code: "MC", prefix: "+377", flag: "🇲🇨" },
    { name: "Mongolie", code: "MN", prefix: "+976", flag: "🇲🇳" },
    { name: "Monténégro", code: "ME", prefix: "+382", flag: "🇲🇪" },
    { name: "Montserrat", code: "MS", prefix: "+1664", flag: "🇲🇸" },
    { name: "Mozambique", code: "MZ", prefix: "+258", flag: "🇲🇿" },
    { name: "Namibie", code: "NA", prefix: "+264", flag: "🇳🇦" },
    { name: "Nauru", code: "NR", prefix: "+674", flag: "🇳🇷" },
    { name: "Népal", code: "NP", prefix: "+977", flag: "🇳🇵" },
    { name: "Nicaragua", code: "NI", prefix: "+505", flag: "🇳🇮" },
    { name: "Niger", code: "NE", prefix: "+227", flag: "🇳🇪" },
    { name: "Nigeria", code: "NG", prefix: "+234", flag: "🇳🇬" },
    { name: "Niue", code: "NU", prefix: "+683", flag: "🇳🇺" },
    { name: "Norvège", code: "NO", prefix: "+47", flag: "🇳🇴" },
    { name: "Nouvelle-Calédonie", code: "NC", prefix: "+687", flag: "🇳🇨" },
    { name: "Nouvelle-Zélande", code: "NZ", prefix: "+64", flag: "🇳🇿" },
    { name: "Oman", code: "OM", prefix: "+968", flag: "🇴🇲" },
    { name: "Ouganda", code: "UG", prefix: "+256", flag: "🇺🇬" },
    { name: "Ouzbékistan", code: "UZ", prefix: "+998", flag: "🇺🇿" },
    { name: "Pakistan", code: "PK", prefix: "+92", flag: "🇵🇰" },
    { name: "Palestine", code: "PS", prefix: "+970", flag: "🇵🇸" },
    { name: "Panama", code: "PA", prefix: "+507", flag: "🇵🇦" },
    { name: "Papouasie-Nouvelle-Guinée", code: "PG", prefix: "+675", flag: "🇵🇬" },
    { name: "Paraguay", code: "PY", prefix: "+595", flag: "🇵🇾" },
    { name: "Pays-Bas", code: "NL", prefix: "+31", flag: "🇳🇱" },
    { name: "Pérou", code: "PE", prefix: "+51", flag: "🇵🇪" },
    { name: "Philippines", code: "PH", prefix: "+63", flag: "🇵🇭" },
    { name: "Pologne", code: "PL", prefix: "+48", flag: "🇵🇱" },
    { name: "Polynésie française", code: "PF", prefix: "+689", flag: "🇵🇫" },
    { name: "Porto Rico", code: "PR", prefix: "+1787", flag: "🇵🇷" },
    { name: "Portugal", code: "PT", prefix: "+351", flag: "🇵🇹" },
    { name: "Qatar", code: "QA", prefix: "+974", flag: "🇶🇦" },
    { name: "République centrafricaine", code: "CF", prefix: "+236", flag: "🇨🇫" },
    { name: "République dominicaine", code: "DO", prefix: "+1809", flag: "🇩🇴" },
    { name: "République tchèque", code: "CZ", prefix: "+420", flag: "🇨🇿" },
    { name: "Réunion", code: "RE", prefix: "+262", flag: "🇷🇪" },
    { name: "Roumanie", code: "RO", prefix: "+40", flag: "🇷🇴" },
    { name: "Royaume-Uni", code: "GB", prefix: "+44", flag: "🇬🇧" },
    { name: "Russie", code: "RU", prefix: "+7", flag: "🇷🇺" },
    { name: "Rwanda", code: "RW", prefix: "+250", flag: "🇷🇼" },
    { name: "Saint-Kitts-et-Nevis", code: "KN", prefix: "+1869", flag: "🇰🇳" },
    { name: "Saint-Marin", code: "SM", prefix: "+378", flag: "🇸🇲" },
    { name: "Saint-Vincent-et-les Grenadines", code: "VC", prefix: "+1784", flag: "🇻🇨" },
    { name: "Sainte-Lucie", code: "LC", prefix: "+1758", flag: "🇱🇨" },
    { name: "Salvador", code: "SV", prefix: "+503", flag: "🇸🇻" },
    { name: "Samoa", code: "WS", prefix: "+685", flag: "🇼🇸" },
    { name: "Sénégal", code: "SN", prefix: "+221", flag: "🇸🇳" },
    { name: "Serbie", code: "RS", prefix: "+381", flag: "🇷🇸" },
    { name: "Seychelles", code: "SC", prefix: "+248", flag: "🇸🇨" },
    { name: "Sierra Leone", code: "SL", prefix: "+232", flag: "🇸🇱" },
    { name: "Singapour", code: "SG", prefix: "+65", flag: "🇸🇬" },
    { name: "Slovaquie", code: "SK", prefix: "+421", flag: "🇸🇰" },
    { name: "Slovénie", code: "SI", prefix: "+386", flag: "🇸🇮" },
    { name: "Somalie", code: "SO", prefix: "+252", flag: "🇸🇴" },
    { name: "Soudan", code: "SD", prefix: "+249", flag: "🇸🇩" },
    { name: "Soudan du Sud", code: "SS", prefix: "+211", flag: "🇸🇸" },
    { name: "Sri Lanka", code: "LK", prefix: "+94", flag: "🇱🇰" },
    { name: "Suède", code: "SE", prefix: "+46", flag: "🇸🇪" },
    { name: "Suisse", code: "CH", prefix: "+41", flag: "🇨🇭" },
    { name: "Suriname", code: "SR", prefix: "+597", flag: "🇸🇷" },
    { name: "Syrie", code: "SY", prefix: "+963", flag: "🇸🇾" },
    { name: "Tadjikistan", code: "TJ", prefix: "+992", flag: "🇹🇯" },
    { name: "Taïwan", code: "TW", prefix: "+886", flag: "🇹🇼" },
    { name: "Tanzanie", code: "TZ", prefix: "+255", flag: "🇹🇿" },
    { name: "Tchad", code: "TD", prefix: "+235", flag: "🇹🇩" },
    { name: "Thaïlande", code: "TH", prefix: "+66", flag: "🇹🇭" },
    { name: "Togo", code: "TG", prefix: "+228", flag: "🇹🇬" },
    { name: "Tonga", code: "TO", prefix: "+676", flag: "🇹🇴" },
    { name: "Trinité-et-Tobago", code: "TT", prefix: "+1868", flag: "🇹🇹" },
    { name: "Tunisie", code: "TN", prefix: "+216", flag: "🇹🇳" },
    { name: "Turkménistan", code: "TM", prefix: "+993", flag: "🇹🇲" },
    { name: "Turquie", code: "TR", prefix: "+90", flag: "🇹🇷" },
    { name: "Tuvalu", code: "TV", prefix: "+688", flag: "🇹🇻" },
    { name: "Ukraine", code: "UA", prefix: "+380", flag: "🇺🇦" },
    { name: "Uruguay", code: "UY", prefix: "+598", flag: "🇺🇾" },
    { name: "Vanuatu", code: "VU", prefix: "+678", flag: "🇻🇺" },
    { name: "Venezuela", code: "VE", prefix: "+58", flag: "🇻🇪" },
    { name: "Vietnam", code: "VN", prefix: "+84", flag: "🇻🇳" },
    { name: "Yémen", code: "YE", prefix: "+967", flag: "🇾🇪" },
    { name: "Zambie", code: "ZM", prefix: "+260", flag: "🇿🇲" },
    { name: "Zimbabwe", code: "ZW", prefix: "+263", flag: "🇿🇼" }
].sort((a,b) => a.name.localeCompare(b.name));

const KINSHASA_COMMUNES = [
    "Barumbu", "Bumbu", "Bandalungwa", "Gombe", "Kalamu", "Kasa-Vubu", 
    "Kinshasa", "Kintambo", "Lingwala", "Lemba", "Limete", "Makala", 
    "Maluku", "Masina", "Matete", "Mont Ngafula", "Mbinza", "Ngaba", 
    "Ngaliema", "N’djili", "Nsele", "Selembao", "Kimbanseke", "Kisenso"
].sort();

const ONBOARDING_SLIDES = [
    {
        title: "Bienvenue sur Kin Eco Map",
        desc: "L'application qui transforme Kinshasa. Agir localement, impacter durablement.",
        icon: Sparkles,
        color: "text-primary-light",
        bg: "bg-green-50",
    },
    {
        title: "Signalez les déchets en un clic",
        desc: "Prenez une photo, notre IA identifie l'urgence et localise le tas pour une collecte rapide.",
        icon: MapPin,
        color: "text-secondary",
        bg: "bg-blue-50",
    },
    {
        title: "Suivez les collectes en temps réel",
        desc: "Visualisez les camions sur la carte et recevez une notification à leur approche.",
        icon: Truck,
        color: "text-action",
        bg: "bg-yellow-50",
    },
    {
        title: "Rejoignez l'académie écolo",
        desc: "Apprenez le tri et le recyclage, gagnez des points Eco et devenez un citoyen modèle.",
        icon: GraduationCap,
        color: "text-purple-500",
        bg: "bg-purple-50",
    },
    {
        title: "Commencez maintenant",
        desc: "Créez votre compte en quelques secondes et participez à l'assainissement de votre ville.",
        icon: CheckCircle2,
        color: "text-primary",
        bg: "bg-green-100",
    }
];

export const Onboarding: React.FC<OnboardingProps> = ({ 
    onComplete, onBackToLanding, appLogo = './logobisopeto.png', onToast, 
    initialShowLogin = false, onNotifyAdmin, currentLanguage, onLanguageChange 
}) => {
    const [mode, setMode] = useState<'slides' | 'auth'>(initialShowLogin ? 'auth' : 'slides');
    const [activeSlide, setActiveSlide] = useState(0);
    const [showLogin, setShowLogin] = useState(initialShowLogin);
    const [registrationFinished, setRegistrationFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [countryModalOpen, setCountryModalOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');

    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [regStep, setRegStep] = useState(1);
    const [registerPassword, setRegisterPassword] = useState('');
    const [formData, setFormData] = useState<Partial<User>>({
        firstName: '', lastName: '', phone: '', email: '',
        type: UserType.CITIZEN, status: 'pending', address: '', neighborhood: '', subscription: 'standard', commune: 'Gombe', country: 'RDC'
    });

    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'terms' | 'privacy' | null }>({ isOpen: false, type: null });

    const handleNextSlide = () => {
        if (activeSlide < ONBOARDING_SLIDES.length - 1) {
            setActiveSlide(activeSlide + 1);
        } else {
            setMode('auth');
        }
    };

    const handleLoginSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        if (!loginIdentifier || !loginPassword) {
            setError("Champs obligatoires manquants.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const user = await UserAPI.login(loginIdentifier, loginPassword);
            if (user) {
                if(onToast) onToast(`Mbote ${user.firstName} !`, "success");
                onComplete({ ...user });
            } else {
                setError("Identifiants incorrects ou compte inexistant.");
            }
        } catch (err) {
            setError("Erreur de connexion réseau.");
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = () => {
        setError(null);
        if (regStep === 1) {
            if (!formData.firstName || !formData.lastName || !formData.phone) {
                setError("Veuillez remplir votre identité complète."); 
                return;
            }
            if (formData.phone.length < 9) {
                setError("Le numéro de téléphone est invalide.");
                return;
            }
        }
        if (regStep === 2) {
            if (!formData.email || !registerPassword) {
                setError("Email ou mot de passe manquant."); 
                return;
            }
            if (registerPassword.length < 6) {
                setError("Le mot de passe doit faire au moins 6 caractères.");
                return;
            }
        }
        setRegStep(prev => prev + 1);
    };

    const handleRegisterSubmit = async () => {
        if (!formData.commune) { setError("Veuillez sélectionner votre commune."); return; }
        if (!formData.neighborhood || formData.neighborhood.trim() === '') { setError("Veuillez renseigner votre quartier."); return; }
        if (!formData.address) { setError("L'adresse précise est requise."); return; }
        if (!agreedToTerms) { setError("Vous devez accepter les conditions d'utilisation."); return; }
        
        setIsLoading(true);
        setError(null);
        try {
            await UserAPI.register({ 
                ...formData, 
                status: 'pending'
            } as User, registerPassword);
            
            if (onNotifyAdmin) {
                onNotifyAdmin(
                    "Nouvelle Inscription 👤", 
                    `${formData.firstName} ${formData.lastName} (${formData.type}) en attente. Zone: ${formData.commune}.`
                );
            }
            
            setRegistrationFinished(true);
            if (onToast) onToast(`Compte créé ! Vérifiez vos e-mails.`, "success");
        } catch (err: any) {
            setError(err.message || "Erreur lors de l'inscription. L'email est peut-être déjà utilisé.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendEmail = async () => {
        setIsResending(true);
        // Simulation d'appel API pour renvoyer l'email
        await new Promise(r => setTimeout(r, 1500));
        setIsResending(false);
        if (onToast) onToast("E-mail de confirmation renvoyé !", "info");
    };

    const filteredCountries = ALL_COUNTRIES.filter(c => 
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
        c.prefix.includes(countrySearch) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
    );

    if (mode === 'slides') {
        const slide = ONBOARDING_SLIDES[activeSlide];
        return (
            <div className={`min-h-screen ${slide.bg} dark:bg-gray-950 flex flex-col items-center justify-center p-8 transition-colors duration-700 relative`}>
                
                {/* Language Switcher - Floated Top Right */}
                <div className="absolute top-8 right-8 z-50 flex bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl p-1 rounded-2xl border border-white/20">
                    {[
                        { code: 'fr', label: 'FR' },
                        { code: 'ln', label: 'LN' },
                        { code: 'en', label: 'EN' }
                    ].map(lang => (
                        <button 
                            key={lang.code}
                            onClick={() => onLanguageChange(lang.code as Language)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${currentLanguage === lang.code ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>

                <div className="w-full max-w-lg text-center animate-fade-in">
                    <div className={`w-24 h-24 md:w-28 md:h-28 ${slide.bg.replace('50', '100')} dark:bg-gray-800 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-black/5`}>
                        <slide.icon className={`w-12 h-12 md:w-16 md:h-16 ${slide.color}`} />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter leading-tight uppercase">{slide.title}</h2>
                    <p className="text-base md:text-xl text-gray-500 dark:text-gray-400 font-medium mb-12 leading-relaxed px-2">{slide.desc}</p>
                    <div className="flex justify-center gap-2 mb-12">
                        {ONBOARDING_SLIDES.map((_, i) => (
                            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${activeSlide === i ? 'w-8 bg-primary' : 'w-2 bg-gray-300'}`}></div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-4">
                        <button onClick={handleNextSlide} className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-2xl flex items-center justify-center gap-3">
                            {activeSlide === ONBOARDING_SLIDES.length - 1 ? "C'est parti !" : "Suivant"}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (registrationFinished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F7FA] dark:bg-[#050505] p-6 text-center animate-fade-in">
                <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-[3.5rem] p-10 shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col items-center relative overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[80px] rounded-full"></div>
                    
                    <div className="w-28 h-28 bg-blue-50 dark:bg-blue-900/20 rounded-[2.5rem] flex items-center justify-center mb-8 text-blue-600 relative overflow-hidden group shadow-inner">
                        <Inbox className="w-12 h-12 animate-float" />
                        <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-[#111827] animate-pulse"></div>
                    </div>
                    
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tighter">Confirmez votre inscription</h2>
                    <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-10 px-4">
                        Mbote {formData.firstName}! Un lien de confirmation unique a été envoyé à :<br/>
                        <span className="font-black text-primary dark:text-primary-light text-lg block mt-2">{formData.email}</span>
                        <span className="text-[11px] font-bold uppercase tracking-widest block mt-4 opacity-70">Veuillez cliquer sur le lien pour activer votre accès citoyen.</span>
                    </p>
                    
                    <div className="w-full space-y-4 relative z-10">
                        <button onClick={() => setShowLogin(true)} className="w-full bg-primary text-white py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 active:scale-95 transition-all group">
                            C'est fait, je me connecte <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                        </button>
                        <button 
                            onClick={handleResendEmail} 
                            disabled={isResending}
                            className="w-full py-4 text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:text-primary transition-colors disabled:opacity-50"
                        >
                            {isResending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Renvoyer l'e-mail de confirmation
                        </button>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 w-full flex items-start gap-4 text-left">
                        <ShieldCheck className="text-blue-500 w-10 h-10 shrink-0" />
                        <div className="space-y-1">
                             <p className="text-[11px] text-gray-900 dark:text-white font-black uppercase tracking-widest">Sécurité Biso Peto</p>
                             <p className="text-[10px] text-gray-400 font-bold leading-tight">Si vous ne voyez pas l'e-mail, vérifiez votre dossier **Spams** ou **Courriers indésirables**.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex flex-col items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-xl bg-white dark:bg-[#111827] rounded-[3rem] shadow-2xl p-8 md:p-12 space-y-8 animate-scale-up border border-gray-100 dark:border-gray-800 flex flex-col max-h-[95vh] overflow-y-auto no-scrollbar">
                <div className="text-center shrink-0">
                    <div className="flex justify-center mb-6">
                        <img src={appLogo} alt="Logo" className="w-20 h-20 md:w-24 md:h-24 object-contain" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mb-2 uppercase">
                        {showLogin ? 'Connexion' : 'Nous Rejoindre'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em]">
                        {showLogin ? 'Gérez votre compte eco' : `Étape ${regStep} sur 3`}
                    </p>
                </div>

                {error && (
                    <div className="shrink-0 bg-red-50 dark:bg-red-900/20 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                        <AlertCircle className="w-5 h-5" /> {error}
                    </div>
                )}

                <div className="flex-1 space-y-8">
                    {showLogin ? (
                        <div className="space-y-8">
                            <form onSubmit={handleLoginSubmit} className="space-y-5 animate-fade-in">
                                <div className="space-y-1.5">
                                    <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl flex items-center border-2 border-transparent focus-within:border-primary transition-all pr-3 shadow-sm">
                                        <div className="pl-4 text-gray-400"><Mail className="w-5 h-5" /></div>
                                        <input required type="text" placeholder="Email ou Téléphone" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} className="bg-transparent w-full p-4 text-sm text-gray-900 dark:text-white font-bold outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl flex items-center border-2 border-transparent focus-within:border-primary transition-all pr-3 shadow-sm">
                                        <div className="pl-4 text-gray-400"><Lock className="w-5 h-5" /></div>
                                        <input required type={showPassword ? "text" : "password"} placeholder="Mot de passe" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="bg-transparent w-full p-4 text-sm text-gray-900 dark:text-white font-bold outline-none" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 p-2">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                    </div>
                                </div>
                                <button type="submit" className="hidden" />
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {regStep === 1 && (
                                <div className="space-y-5 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input placeholder="Prénom" className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-sm font-bold dark:text-white outline-none shadow-inner" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                                        <input placeholder="Nom" className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-sm font-bold dark:text-white outline-none shadow-inner" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                                    </div>
                                    <div className="flex gap-3 items-end">
                                        <div className="w-24 shrink-0 space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pays</label>
                                            <button 
                                                onClick={() => setCountryModalOpen(true)}
                                                className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border-2 border-transparent hover:border-primary-light transition-all text-sm font-bold dark:text-white flex items-center justify-center gap-2 shadow-inner group"
                                            >
                                                <span>{ALL_COUNTRIES.find(c => c.code === formData.country)?.flag || "🇨🇩"}</span>
                                                <span className="text-gray-400 group-hover:text-primary-light transition-colors">
                                                    {ALL_COUNTRIES.find(c => c.code === formData.country)?.prefix || "+243"}
                                                </span>
                                            </button>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Numéro de téléphone</label>
                                            <input type="tel" placeholder="ex: 812345678" className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-sm font-bold dark:text-white outline-none shadow-inner" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {regStep === 2 && (
                                <div className="space-y-5 animate-fade-in">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Informations de connexion</label>
                                        <input type="email" placeholder="Adresse e-mail" className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-sm font-bold dark:text-white outline-none shadow-inner" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mot de passe (Min 6 car.)</label>
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl flex items-center border-2 border-transparent focus-within:border-primary-light transition-all pr-3 shadow-inner">
                                            <input type={showPassword ? "text" : "password"} placeholder="Choisir un mot de passe" className="bg-transparent w-full p-5 text-sm dark:text-white font-bold outline-none" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 p-2">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {regStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex gap-4">
                                        <button onClick={() => setFormData({...formData, type: UserType.CITIZEN})} className={`flex-1 p-5 rounded-3xl border-2 font-black text-xs transition-all uppercase flex flex-col items-center gap-2 ${formData.type === UserType.CITIZEN ? 'border-primary-light bg-green-50 text-primary-light shadow-md' : 'border-gray-100 bg-gray-50 text-gray-400 grayscale'}`}>
                                            <UserIcon size={24} /> Particulier
                                        </button>
                                        <button onClick={() => setFormData({...formData, type: UserType.BUSINESS})} className={`flex-1 p-5 rounded-3xl border-2 font-black text-xs transition-all uppercase flex flex-col items-center gap-2 ${formData.type === UserType.BUSINESS ? 'border-secondary bg-blue-50 text-secondary shadow-md' : 'border-gray-100 bg-gray-50 text-gray-400 grayscale'}`}>
                                            <Briefcase size={24} /> Entreprise
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Commune</label>
                                            <div className="relative">
                                                <Globe size={14} className="absolute left-4 top-4 text-gray-400" />
                                                <select className="w-full p-4 pl-10 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-black text-xs uppercase appearance-none dark:text-white shadow-inner" value={formData.commune} onChange={e => setFormData({...formData, commune: e.target.value})}>
                                                    {KINSHASA_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Quartier</label>
                                            <input placeholder="ex: Quartier GB" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-black text-xs uppercase dark:text-white shadow-inner" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                                        </div>
                                    </div>
                                    <textarea rows={2} placeholder="Adresse précise (N°, Rue, Référence...)" className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-sm font-bold dark:text-white outline-none resize-none shadow-inner" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" className="w-5 h-5 accent-primary rounded-lg" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
                                        <span className="text-[11px] text-gray-500 font-bold group-hover:text-primary transition-colors">J'accepte les conditions d'utilisation et la politique de confidentialité.</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="shrink-0 space-y-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex gap-4">
                        {regStep > 1 && !showLogin && (
                            <button onClick={() => setRegStep(prev => prev - 1)} className="p-5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl active:scale-95 transition-all">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                        )}
                        <button 
                            onClick={showLogin ? handleLoginSubmit : (regStep === 3 ? handleRegisterSubmit : nextStep)} 
                            disabled={isLoading} 
                            className="flex-1 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm bg-primary shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (showLogin ? 'Se connecter' : (regStep === 3 ? 'Finaliser l\'inscription' : 'Continuer'))}
                            {!isLoading && <ChevronRight className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="relative py-2 flex items-center">
                        <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
                        <span className="flex-shrink mx-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ou</span>
                        <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
                    </div>

                    <button 
                        onClick={async () => {
                            try {
                                if (onToast) onToast("Redirection vers Google...", "info");
                                const loggedInUser = await UserAPI.loginWithGoogle();
                                if (loggedInUser) {
                                    if (onToast) onToast(`Mbote ${loggedInUser.firstName} !`, "success");
                                    onComplete(loggedInUser);
                                }
                            } catch (err: any) {
                                setError(err.message || "Erreur Google Login");
                            }
                        }}
                        className="w-full bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 py-4 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-all active:scale-[0.98]"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">Commencer avec Google</span>
                    </button>

                    <div className="flex flex-col items-center gap-5">
                        <button onClick={() => { setShowLogin(!showLogin); setError(null); setRegStep(1); }} className="text-sm font-black text-secondary hover:underline">
                            {showLogin ? "Nouveau ici ? Créer un compte" : "Déjà membre ? Se connecter"}
                        </button>
                        <button onClick={onBackToLanding} className="text-xs font-black text-gray-400 flex items-center gap-2 uppercase tracking-widest hover:text-gray-600 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Retour au site
                        </button>
                    </div>
                </div>
            </div>

            <LegalDocs 
                isOpen={legalModal.isOpen} 
                type={legalModal.type} 
                onClose={() => setLegalModal({ isOpen: false, type: null })} 
            />

            {/* Country Selector Modal */}
            {countryModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setCountryModalOpen(false)}></div>
                    <div className="bg-white dark:bg-[#111827] w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-scale-up border border-gray-100 dark:border-white/5 flex flex-col max-h-[80vh]">
                        <div className="p-8 border-b border-gray-50 dark:border-white/5 shrink-0">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black uppercase tracking-tighter dark:text-white">Sélectionner un pays</h3>
                                <button onClick={() => setCountryModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input 
                                    autoFocus
                                    placeholder="Rechercher un pays ou un indicatif..." 
                                    className="w-full p-4 pl-12 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-bold text-sm dark:text-white shadow-inner"
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                />
                                {countrySearch && (
                                    <button onClick={() => setCountrySearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                            <div className="grid grid-cols-1 gap-1">
                                {filteredCountries.map((c) => (
                                    <button 
                                        key={c.code}
                                        onClick={() => {
                                            setFormData({...formData, country: c.code});
                                            setCountryModalOpen(false);
                                            setCountrySearch('');
                                        }}
                                        className={`flex items-center justify-between p-4 rounded-2xl transition-all group hover:scale-[1.02] ${formData.country === c.code ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{c.flag}</span>
                                            <span className="font-bold text-sm">{c.name}</span>
                                        </div>
                                        <span className="font-black text-xs opacity-50 group-hover:opacity-100 transition-opacity">{c.prefix}</span>
                                    </button>
                                ))}
                                {filteredCountries.length === 0 && (
                                    <div className="py-12 text-center space-y-3">
                                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                                            <Globe size={32} className="text-gray-300" />
                                        </div>
                                        <p className="text-gray-400 font-bold text-sm">Aucun pays trouvé</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-8 border-t border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-gray-800/20 shrink-0">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-center">
                                {ALL_COUNTRIES.length} pays disponibles
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
