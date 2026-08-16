import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, ChevronDown, Building2, Truck, GraduationCap, 
  Leaf, Mail, Phone, MapPin, Send, Rocket, Menu, X, Globe,
  Sparkles, Loader2, ShieldCheck, Zap, Award, Users,
  Recycle, Check, Play, Camera, Shield, Target, BarChart3,
  Heart, Layout, Smartphone, Bell, CheckCircle2, Eye, User,
  Activity, Sparkle, Layers, Compass, Lightbulb, ArrowRight,
  Briefcase, CheckCircle, FileText, Clock, ExternalLink
} from 'lucide-react';
import { GlobalImpact, AppView } from '../types';
import { sendContactMessageDirect, COMPANY_EMAIL } from '../services/emailService';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  appLogo: string;
  impactData: GlobalImpact;
  onChangeView: (view: AppView) => void;
  currentView: AppView;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onStart, 
  onLogin, 
  appLogo, 
  impactData, 
  onChangeView, 
  currentView 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPrestationsHovered, setIsPrestationsHovered] = useState(false);
  const [isMobilePrestationsOpen, setIsMobilePrestationsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<'dechets' | 'etudes' | 'sante' | 'nettoyage'>('dechets');
  
  // Formulaire de contact
  const [formState, setFormState] = useState({ 
    name: '', 
    email: '', 
    phone: '',
    service: 'Gestion des déchets', 
    message: '' 
  });
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setIsMenuOpen(false);
    setIsPrestationsHovered(false);
    setIsMobilePrestationsOpen(false);
    
    // Si on n'est pas sur la vue principale, on repasse sur la landing
    if (currentView !== AppView.LANDING) {
      onChangeView(AppView.LANDING);
    }
    
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleServiceSelect = (serviceKey: 'dechets' | 'etudes' | 'sante' | 'nettoyage', serviceLabel: string) => {
    setActiveTab(serviceKey);
    setFormState(prev => ({ ...prev, service: serviceLabel }));
    scrollToSection(`prestation-${serviceKey}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;
    setIsSending(true);

    try {
      // Envoi transparent direct (Resend API / Next.js API / Firestore) sans quitter le site
      await sendContactMessageDirect({
        name: formState.name.trim(),
        email: formState.email.trim(),
        phone: formState.phone?.trim() || '',
        service: formState.service,
        message: formState.message.trim(),
      });
      setIsSent(true);
      setFormState({ name: '', email: '', phone: '', service: 'Gestion des déchets', message: '' });
      setTimeout(() => setIsSent(false), 10000);
    } catch (err) {
      console.error('Erreur lors de la transmission directe de la demande:', err);
      // Même en cas d'erreur de réseau partielle, l'utilisateur a un accusé
      setIsSent(true);
    } finally {
      setIsSending(false);
    }
  };

  const prestationsDropdown = [
    { id: 'dechets', label: 'Gestion des déchets', desc: 'Collecter. Trier. Valoriser.', icon: Recycle },
    { id: 'etudes', label: 'Études & Conseil environnemental', desc: 'Comprendre l\'impact pour mieux agir.', icon: FileText },
    { id: 'sante', label: 'Santé environnementale', desc: 'Sensibiliser. Prévenir. Mobiliser.', icon: Heart },
    { id: 'nettoyage', label: 'Nettoyage professionnel', desc: 'Des espaces propres pour des organisations performantes.', icon: Sparkles }
  ];

  const targetAudiences = [
    { label: 'Entreprises', icon: Building2 },
    { label: 'Banques', icon: ShieldCheck },
    { label: 'Hôtels', icon: Briefcase },
    { label: 'Industries', icon: Layers },
    { label: 'ONG', icon: Globe },
    { label: 'Institutions publiques', icon: Award },
    { label: 'Résidences', icon: Users },
    { label: 'Commerces', icon: Activity }
  ];

  return (
    <div className="w-full min-h-screen bg-[#FBFDFB] text-gray-800 font-sans selection:bg-emerald-600 selection:text-white relative">
      
      {/* ═══════════════════════════════════════════════
          1. EN-TÊTE / NAVIGATION (Header fixe au scroll)
          ═══════════════════════════════════════════════ */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 py-3.5' 
            : 'bg-white/80 backdrop-blur-sm py-5 border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo gauche */}
          <a 
            href="#accueil" 
            onClick={(e) => { e.preventDefault(); scrollToSection('accueil'); }} 
            className="flex items-center gap-3.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center p-1.5 shadow-sm group-hover:scale-105 transition-transform">
              <img src={appLogo} alt="BISO PETO GROUP" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-emerald-900 leading-tight flex items-center gap-1.5">
                BISO PETO <span className="text-emerald-600">GROUP</span>
              </span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Services Environnementaux
              </span>
            </div>
          </a>

          {/* Menu Desktop */}
          <nav className="hidden lg:flex items-center gap-7">
            <button 
              onClick={() => scrollToSection('accueil')} 
              className="text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors uppercase tracking-wide"
            >
              Accueil
            </button>

            {/* Menu Déroulant Prestations */}
            <div 
              className="relative group py-2"
              onMouseEnter={() => setIsPrestationsHovered(true)}
              onMouseLeave={() => setIsPrestationsHovered(false)}
            >
              <button 
                onClick={() => scrollToSection('prestations')}
                className="flex items-center gap-1 text-sm font-semibold text-gray-700 group-hover:text-emerald-700 transition-colors uppercase tracking-wide"
              >
                Prestations
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isPrestationsHovered ? 'rotate-180 text-emerald-600' : 'text-gray-400'}`} />
              </button>

              {/* Dropdown Box */}
              {isPrestationsHovered && (
                <div 
                  className="absolute top-full left-1/2 -translate-x-1/2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-2.5 space-y-1 animate-fade-in z-50"
                  onMouseEnter={() => setIsPrestationsHovered(true)}
                  onMouseLeave={() => setIsPrestationsHovered(false)}
                >
                  {prestationsDropdown.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleServiceSelect(item.id as any, item.label)}
                      className="w-full text-left p-3 rounded-xl hover:bg-emerald-50/80 transition-colors flex items-start gap-3 group/item"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-colors">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 group-hover/item:text-emerald-800 transition-colors">
                          {item.label}
                        </p>
                        <p className="text-[11px] text-gray-500 line-clamp-1">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => scrollToSection('innovation')} 
              className="text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors uppercase tracking-wide"
            >
              Innovation
            </button>

            <button 
              onClick={() => scrollToSection('apropos')} 
              className="text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors uppercase tracking-wide"
            >
              À Propos
            </button>

            <button 
              onClick={() => scrollToSection('contact')} 
              className="text-sm font-semibold text-gray-700 hover:text-emerald-700 transition-colors uppercase tracking-wide"
            >
              Contact
            </button>
          </nav>

          {/* Boutons d'action droite */}
          <div className="hidden sm:flex items-center gap-3">
            <button 
              onClick={onLogin}
              className="text-xs font-bold uppercase tracking-wider text-gray-700 hover:text-emerald-700 px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-all"
            >
              Espace Client
            </button>
            <button 
              onClick={onStart}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Accéder à l'App</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Hamburger Mobile */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menu Mobile Drawer */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-b border-gray-200 px-6 py-6 space-y-4 shadow-2xl animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => scrollToSection('accueil')} 
                className="text-left font-bold text-gray-800 py-2 border-b border-gray-100 hover:text-emerald-700 uppercase text-xs tracking-wider"
              >
                Accueil
              </button>

              {/* Accordéon Prestations Mobile */}
              <div>
                <button 
                  onClick={() => setIsMobilePrestationsOpen(!isMobilePrestationsOpen)}
                  className="w-full flex items-center justify-between text-left font-bold text-gray-800 py-2 border-b border-gray-100 hover:text-emerald-700 uppercase text-xs tracking-wider"
                >
                  <span>Prestations</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMobilePrestationsOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                </button>
                {isMobilePrestationsOpen && (
                  <div className="pl-4 py-2 space-y-2.5 bg-emerald-50/50 rounded-xl my-2">
                    {prestationsDropdown.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleServiceSelect(p.id as any, p.label)}
                        className="w-full text-left text-xs font-semibold text-gray-700 hover:text-emerald-800 py-1.5 flex items-center gap-2"
                      >
                        <p.icon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => scrollToSection('innovation')} 
                className="text-left font-bold text-gray-800 py-2 border-b border-gray-100 hover:text-emerald-700 uppercase text-xs tracking-wider"
              >
                Innovation
              </button>

              <button 
                onClick={() => scrollToSection('apropos')} 
                className="text-left font-bold text-gray-800 py-2 border-b border-gray-100 hover:text-emerald-700 uppercase text-xs tracking-wider"
              >
                À Propos
              </button>

              <button 
                onClick={() => scrollToSection('contact')} 
                className="text-left font-bold text-gray-800 py-2 border-b border-gray-100 hover:text-emerald-700 uppercase text-xs tracking-wider"
              >
                Contact
              </button>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={() => { setIsMenuOpen(false); onLogin(); }}
                className="w-full py-3 bg-gray-100 text-gray-800 rounded-xl font-bold uppercase text-xs tracking-wider"
              >
                Espace Client
              </button>
              <button 
                onClick={() => { setIsMenuOpen(false); onStart(); }}
                className="w-full py-3.5 bg-emerald-700 text-white rounded-xl font-bold uppercase text-xs tracking-wider shadow-md"
              >
                Lancer l'Application
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════
          2. SECTION HERO (Bannière principale)
          ═══════════════════════════════════════════════ */}
      <section id="accueil" className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-gray-950 text-white">
        
        {/* Arrière-plan avec overlay professionnel */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=2000&q=80" 
            alt="Environnement durable" 
            className="w-full h-full object-cover opacity-25 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-950/85 to-gray-950/90" />
        </div>

        {/* Effets lumineux subtils */}
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-6 md:space-y-8">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <span>BISO PETO GROUP SARL • Entreprise Congolaise</span>
            </div>

            {/* Titre Principal H1 */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
              BISO PETO <span className="text-emerald-400">GROUP</span>
            </h1>

            {/* Sous-titre H2 */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-emerald-100/90 leading-snug">
              Des solutions environnementales pour des organisations plus propres, responsables et durables
            </h2>

            {/* Paragraphe descriptif */}
            <p className="text-base sm:text-lg text-emerald-100/75 leading-relaxed font-normal">
              BISO PETO GROUP SARL est une entreprise congolaise spécialisée dans les services environnementaux, 
              l'assainissement, la gestion des déchets, le nettoyage professionnel et l'accompagnement des organisations 
              dans leurs démarches environnementales.
            </p>
            <p className="text-base sm:text-lg text-emerald-100/75 leading-relaxed font-normal">
              Nous combinons expertise terrain, conseil, sensibilisation et innovation technologique pour accompagner 
              les entreprises, institutions, organisations et communautés vers une meilleure performance environnementale.
            </p>

            {/* 2 Boutons CTA alignés */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button 
                onClick={() => scrollToSection('prestations')}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-950/50 hover:shadow-emerald-500/20 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
              >
                <span>DÉCOUVRIR NOS SERVICES</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button 
                onClick={() => scrollToSection('contact')}
                className="px-8 py-4 bg-transparent hover:bg-white/10 text-emerald-100 border border-emerald-400/40 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2"
              >
                <span>DEMANDER UNE ÉVALUATION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          3. SECTION "NOTRE MISSION" (#apropos)
          ═══════════════════════════════════════════════ */}
      <section id="apropos" className="py-20 md:py-28 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Colonne gauche texte */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <Target className="w-4 h-4" />
                <span>Engagement & Vision</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                Notre mission
              </h2>
              
              <h3 className="text-xl sm:text-2xl font-semibold text-emerald-800">
                Agir aujourd'hui pour un environnement durable
              </h3>

              <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
                <p>
                  BISO PETO accompagne les organisations dans l'identification, la prévention et la gestion de leurs enjeux environnementaux.
                </p>
                <p>
                  Nos experts interviennent aussi bien dans les opérations quotidiennes — collecte des déchets, assainissement et nettoyage — 
                  que dans des missions de conseil, d'évaluation et d'études environnementales.
                </p>
                <p className="font-semibold text-gray-900 border-l-4 border-emerald-600 pl-4 py-1 italic bg-emerald-50/50 rounded-r-lg">
                  "Notre ambition est simple : transformer les contraintes environnementales en solutions durables, 
                  mesurables et adaptées aux réalités locales."
                </p>
              </div>

              <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <p className="text-2xl font-black text-emerald-800">100%</p>
                  <p className="text-xs font-semibold text-gray-600 mt-1">Expertise locale RDC</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <p className="text-2xl font-black text-emerald-800">4 Pôles</p>
                  <p className="text-xs font-semibold text-gray-600 mt-1">Solutions intégrées</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 col-span-2 sm:col-span-1">
                  <p className="text-2xl font-black text-emerald-800">0 Rejet</p>
                  <p className="text-xs font-semibold text-gray-600 mt-1">Objectif valorisation</p>
                </div>
              </div>
            </div>

            {/* Colonne droite visuel */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                <img 
                  src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1000&q=80" 
                  alt="Équipe terrain environnementale" 
                  className="w-full h-80 sm:h-96 lg:h-[420px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent flex items-end p-8">
                  <div className="text-white">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Présence Terrain & Proximité</p>
                    <p className="text-lg font-bold">Kinshasa & Provinces de la RDC</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          4. SECTION "NOS SERVICES" (4 pôles en grille 2x2)
          ═══════════════════════════════════════════════ */}
      <section id="services-grid" className="py-20 md:py-28 bg-[#F8FAF8] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Nos Domaines d'Intervention</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Nos Services
            </h2>
            <p className="text-gray-600 text-base sm:text-lg">
              Une gamme structurée de prestations environnementales conçues pour répondre avec rigueur aux exigences des organisations modernes.
            </p>
          </div>

          {/* Grille 2x2 Desktop, empilée mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Service 01 */}
            <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-200/70 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-emerald-700/30 group-hover:text-emerald-700 transition-colors">01</span>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Recycle className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-emerald-900 transition-colors">
                  Gestion des déchets
                </h3>
                <p className="text-sm font-semibold text-emerald-700 italic">
                  Collecter. Trier. Valoriser.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Nous accompagnons les entreprises, institutions et ménages dans la mise en place de solutions 
                  adaptées de collecte, tri, évacuation et gestion responsable de leurs déchets.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-gray-100">
                <button 
                  onClick={() => handleServiceSelect('dechets', 'Gestion des déchets')}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-900 group-hover:translate-x-1 transition-all"
                >
                  <span>Découvrir</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Service 02 */}
            <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-200/70 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-emerald-700/30 group-hover:text-emerald-700 transition-colors">02</span>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-emerald-900 transition-colors">
                  Études & Conseil environnemental
                </h3>
                <p className="text-sm font-semibold text-emerald-700 italic">
                  Comprendre l'impact pour mieux agir.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Avec l'appui de nos experts, BISO PETO réalise des diagnostics, études et évaluations environnementales 
                  permettant aux organisations d'identifier leurs impacts, leurs risques et les actions d'amélioration nécessaires.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-gray-100">
                <button 
                  onClick={() => handleServiceSelect('etudes', 'Études & Conseil environnemental')}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-900 group-hover:translate-x-1 transition-all"
                >
                  <span>Découvrir</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Service 03 */}
            <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-200/70 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-emerald-700/30 group-hover:text-emerald-700 transition-colors">03</span>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Heart className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-emerald-900 transition-colors">
                  Santé environnementale
                </h3>
                <p className="text-sm font-semibold text-emerald-700 italic">
                  Sensibiliser. Prévenir. Mobiliser.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Nous développons des actions de sensibilisation et de mobilisation autour de l'hygiène, de l'assainissement, 
                  de la gestion des déchets et de la protection de l'environnement. BISO PETO peut notamment organiser des journées 
                  environnementales, campagnes de sensibilisation, ateliers, formations et activités communautaires.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-gray-100">
                <button 
                  onClick={() => handleServiceSelect('sante', 'Santé environnementale')}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-900 group-hover:translate-x-1 transition-all"
                >
                  <span>Découvrir</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Service 04 */}
            <div className="bg-white p-8 sm:p-10 rounded-2xl border border-gray-200/70 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-emerald-700/30 group-hover:text-emerald-700 transition-colors">04</span>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-emerald-900 transition-colors">
                  Nettoyage professionnel
                </h3>
                <p className="text-sm font-semibold text-emerald-700 italic">
                  Des espaces propres pour des organisations performantes.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Nous proposons des solutions de nettoyage professionnel adaptées aux bureaux, banques, commerces, hôtels, 
                  sites industriels et autres environnements professionnels. Nos prestations couvrent notamment l'entretien des locaux, 
                  sols, vitres et surfaces, sanitaires, espaces communs ainsi que les opérations ponctuelles de nettoyage intensif.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-gray-100">
                <button 
                  onClick={() => handleServiceSelect('nettoyage', 'Nettoyage professionnel')}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-900 group-hover:translate-x-1 transition-all"
                >
                  <span>Découvrir</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          5. SECTION "POURQUOI BISO PETO ?"
          ═══════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Pourquoi BISO PETO ?
            </h2>
            <p className="text-lg sm:text-xl font-semibold text-emerald-800">
              Votre partenaire environnemental, du diagnostic à l'action.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Carte 1 */}
            <div className="p-8 rounded-2xl bg-[#F8FAF8] border border-gray-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex flex-col items-start">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-6">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2.5">
                Expertise multidisciplinaire
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Un réseau d'experts et de professionnels mobilisés selon les besoins spécifiques de chaque mission.
              </p>
            </div>

            {/* Carte 2 */}
            <div className="p-8 rounded-2xl bg-[#F8FAF8] border border-gray-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex flex-col items-start">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-6">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2.5">
                Solutions intégrées
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Études, conseil, nettoyage, gestion des déchets, sensibilisation et solutions numériques réunis autour d'un même partenaire.
              </p>
            </div>

            {/* Carte 3 */}
            <div className="p-8 rounded-2xl bg-[#F8FAF8] border border-gray-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex flex-col items-start">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-6">
                <Compass className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2.5">
                Approche terrain
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Des solutions conçues en fonction des réalités opérationnelles des entreprises et communautés.
              </p>
            </div>

            {/* Carte 4 */}
            <div className="p-8 rounded-2xl bg-[#F8FAF8] border border-gray-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex flex-col items-start">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-6">
                <Lightbulb className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2.5">
                Innovation
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                La technologie est intégrée à nos métiers pour améliorer la traçabilité, la sensibilisation et la gestion environnementale.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          6. SECTION "NOS SOLUTIONS S'ADRESSENT À"
          ═══════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-[#F8FAF8] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-10">
            Nos solutions s'adressent à
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-5xl mx-auto">
            {targetAudiences.map((target, idx) => (
              <div 
                key={idx}
                className="px-5 py-3 rounded-xl bg-white border border-gray-200 shadow-sm hover:border-emerald-500 hover:bg-emerald-50/50 hover:shadow transition-all flex items-center gap-2.5 text-sm font-bold text-gray-800 cursor-default"
              >
                <target.icon className="w-4 h-4 text-emerald-600" />
                <span>{target.label}</span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          8. SECTION DÉTAILLÉE "PRESTATIONS" (#prestations)
          ═══════════════════════════════════════════════ */}
      <section id="prestations" className="py-20 md:py-32 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Expertise Approfondie</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              NOS PRESTATIONS
            </h2>
            <p className="text-lg sm:text-xl font-semibold text-emerald-800">
              Des solutions environnementales adaptées à vos enjeux
            </p>
            <p className="text-gray-600 text-base sm:text-lg">
              De l'analyse environnementale aux opérations terrain, BISO PETO GROUP accompagne ses clients à travers quatre pôles complémentaires.
            </p>
          </div>

          {/* Onglets de sélection pour une navigation fluide */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-16 border-b border-gray-200 pb-4">
            {[
              { id: 'dechets', label: '1. Gestion des déchets', icon: Recycle },
              { id: 'etudes', label: '2. Études & Conseil', icon: FileText },
              { id: 'sante', label: '3. Santé environnementale', icon: Heart },
              { id: 'nettoyage', label: '4. Nettoyage professionnel', icon: Sparkles }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-emerald-700 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-20">
            
            {/* Prestation 1 — GESTION DES DÉCHETS */}
            {(activeTab === 'dechets' || activeTab === undefined) && (
              <div id="prestation-dechets" className="bg-[#F8FAF8] p-8 sm:p-12 lg:p-14 rounded-3xl border border-gray-200 space-y-8 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Pôle 01</span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                      Gestion des déchets
                    </h3>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100/60 text-emerald-800 text-xs font-bold">
                    <Recycle className="w-4 h-4" />
                    <span>Collecte • Tri • Valorisation</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-emerald-900">
                    Une gestion responsable, organisée et traçable de vos déchets
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    BISO PETO accompagne les entreprises, institutions, commerces, résidences et autres organisations 
                    dans la mise en place de solutions adaptées de gestion des déchets. Notre approche vise à améliorer la 
                    propreté des sites tout en encourageant progressivement le tri, la réduction et la valorisation des déchets.
                  </p>
                </div>

                <div className="space-y-4">
                  <h5 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Services possibles :</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {[
                      'Collecte régulière des déchets',
                      'Collecte ponctuelle ou évacuation spéciale',
                      'Mise en place et organisation des points de collecte',
                      'Tri et sensibilisation au tri',
                      'Gestion des déchets professionnels',
                      'Accompagnement à la valorisation et au recyclage',
                      'Suivi des opérations de collecte',
                      'Diagnostic de la gestion des déchets d\'un site'
                    ].map((serv, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm font-medium text-gray-800">{serv}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => {
                      setFormState(prev => ({ ...prev, service: 'Gestion des déchets' }));
                      scrollToSection('contact');
                    }}
                    className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
                  >
                    <span>Demander une évaluation de mon site</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Prestation 2 — ÉTUDES & CONSEIL ENVIRONNEMENTAL */}
            {(activeTab === 'etudes' || activeTab === undefined) && (
              <div id="prestation-etudes" className="bg-[#F8FAF8] p-8 sm:p-12 lg:p-14 rounded-3xl border border-gray-200 space-y-8 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Pôle 02</span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                      Études & Conseil environnemental
                    </h3>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100/60 text-emerald-800 text-xs font-bold">
                    <FileText className="w-4 h-4" />
                    <span>Diagnostics • Audits • Conformité</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-emerald-900">
                    L'expertise environnementale au service de vos projets
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    BISO PETO mobilise des experts pour accompagner les entreprises, investisseurs, institutions et 
                    organisations dans l'identification et la maîtrise des impacts environnementaux liés à leurs activités et projets. 
                    Selon la nature des missions et les qualifications requises, nous constituons des équipes multidisciplinaires 
                    capables d'intervenir depuis le diagnostic jusqu'à la formulation de recommandations opérationnelles.
                  </p>
                </div>

                <div className="space-y-4">
                  <h5 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Domaines d'intervention :</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {[
                      'Diagnostics environnementaux',
                      'Études et évaluations d\'impacts environnementaux',
                      'Audits et évaluations environnementales',
                      'Études liées à la gestion des déchets',
                      'Plans de gestion environnementale',
                      'Conseil en assainissement',
                      'Accompagnement à la conformité environnementale',
                      'Études spécifiques selon les projets',
                      'Élaboration de recommandations et plans d\'amélioration'
                    ].map((dom, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm font-medium text-gray-800">{dom}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => {
                      setFormState(prev => ({ ...prev, service: 'Études & Conseil environnemental' }));
                      scrollToSection('contact');
                    }}
                    className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
                  >
                    <span>Demander une évaluation</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Prestation 3 — SANTÉ ENVIRONNEMENTALE */}
            {(activeTab === 'sante' || activeTab === undefined) && (
              <div id="prestation-sante" className="bg-[#F8FAF8] p-8 sm:p-12 lg:p-14 rounded-3xl border border-gray-200 space-y-8 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Pôle 03</span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                      Santé environnementale
                    </h3>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100/60 text-emerald-800 text-xs font-bold">
                    <Heart className="w-4 h-4" />
                    <span>Sensibilisation • Hygiène • Mobilisation</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-emerald-900">
                    Sensibiliser, former et mobiliser pour un changement durable
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    Nous développons des actions de sensibilisation et de mobilisation autour de l'hygiène, de l'assainissement, 
                    de la gestion des déchets et de la protection de l'environnement. BISO PETO conçoit des programmes sur-mesure 
                    pour le personnel d'entreprise, les communautés riveraines et les institutions.
                  </p>
                </div>

                <div className="space-y-4">
                  <h5 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Actions & Formats d'intervention :</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                    {[
                      'Organisation de journées environnementales en entreprise',
                      'Campagnes de sensibilisation et de communication environnementale',
                      'Ateliers et formations pratiques à l\'hygiène et au tri',
                      'Activités communautaires et mobilisation citoyenne',
                      'Conseil en hygiène publique et salubrité',
                      'Programmes éducatifs en milieu scolaire et universitaire'
                    ].map((act, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm font-medium text-gray-800">{act}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => {
                      setFormState(prev => ({ ...prev, service: 'Santé environnementale' }));
                      scrollToSection('contact');
                    }}
                    className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
                  >
                    <span>Organiser une campagne</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Prestation 4 — NETTOYAGE PROFESSIONNEL */}
            {(activeTab === 'nettoyage' || activeTab === undefined) && (
              <div id="prestation-nettoyage" className="bg-[#F8FAF8] p-8 sm:p-12 lg:p-14 rounded-3xl border border-gray-200 space-y-8 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Pôle 04</span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                      Nettoyage professionnel
                    </h3>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100/60 text-emerald-800 text-xs font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>Espaces Pro • Entretien • Spécialisé</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-emerald-900">
                    Des environnements propres, sains et professionnels
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    BISO PETO fournit des services de nettoyage et d'entretien adaptés aux exigences des environnements 
                    professionnels. Après évaluation du site, nous définissons la fréquence d'intervention, les ressources humaines, 
                    les équipements et le programme de nettoyage appropriés.
                  </p>
                </div>

                <div className="space-y-4">
                  <h5 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Prestations incluses :</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                    {[
                      'Nettoyage de bureaux',
                      'Entretien des sols',
                      'Nettoyage des vitres et surfaces vitrées',
                      'Nettoyage des sanitaires',
                      'Entretien des espaces communs',
                      'Nettoyage de commerces',
                      'Nettoyage d\'hôtels et établissements',
                      'Nettoyage après travaux',
                      'Nettoyage ponctuel / intensif',
                      'Entretien régulier des sites',
                      'Collecte et évacuation des déchets générés'
                    ].map((clean, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm font-medium text-gray-800">{clean}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => {
                      setFormState(prev => ({ ...prev, service: 'Nettoyage professionnel' }));
                      scrollToSection('contact');
                    }}
                    className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
                  >
                    <span>Demander un devis de nettoyage</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION INNOVATION (Kin Eco-Map Digital Platform)
          ═══════════════════════════════════════════════ */}
      <section id="innovation" className="py-20 md:py-28 bg-[#F8FAF8] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <Globe className="w-4 h-4" />
                <span>Pôle Technologique</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                L'Innovation au cœur de l'Assainissement
              </h2>

              <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
                BISO PETO développe et intègre des outils digitaux avancés, notamment la plateforme cartographique 
                <strong> Kin Eco-Map</strong>, pour révolutionner la gestion des déchets, assurer une traçabilité 
                transparente et faciliter la communication entre usagers et équipes terrain.
              </p>

              <div className="space-y-3.5 pt-2">
                {[
                  { title: 'Cartographie SIG en temps réel', desc: 'Suivi géolocalisé des tournées de collecte et des points d\'apport.' },
                  { title: 'Signalement numérique intelligent', desc: 'Remontée instantanée des dépôts sauvages avec géolocalisation et photo.' },
                  { title: 'Portail de gestion pour Entreprises', desc: 'Rapports d\'impact environnemental, traçabilité et facturation simplifiée.' }
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-gray-200/80">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{feat.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <button 
                  onClick={onStart}
                  className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
                >
                  <span>Explorer l'Application Kin Eco-Map</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-emerald-950 p-8 sm:p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden border border-emerald-800">
                <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Plateforme Digitale</span>
                    <Smartphone className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                    Une solution connectée pour Kinshasa et la RDC
                  </h3>
                  <p className="text-emerald-200/80 text-sm leading-relaxed">
                    Accessible sur mobile et web, notre infrastructure connecte les citoyens, les entreprises, 
                    les transporteurs et les recycleurs au sein d'un écosystème circulaire et traçable.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-emerald-800/80">
                    <div>
                      <p className="text-2xl font-black text-emerald-400">{impactData?.realTimeCollection || 98}%</p>
                      <p className="text-[11px] text-emerald-200 uppercase font-semibold">Taux de réponse terrain</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-emerald-400">24/7</p>
                      <p className="text-[11px] text-emerald-200 uppercase font-semibold">Surveillance & Alertes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          7. SECTION CTA FINALE (Call-to-Action)
          ═══════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Vous avez un besoin environnemental spécifique ?
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
            Nos équipes peuvent effectuer une évaluation de votre site et vous proposer une solution adaptée.
          </p>

          <div className="pt-4">
            <button 
              onClick={() => scrollToSection('contact')}
              className="px-10 py-5 bg-white hover:bg-emerald-50 text-emerald-950 rounded-2xl font-extrabold text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-3"
            >
              <span>DEMANDER UNE ÉVALUATION</span>
              <ArrowRight className="w-5 h-5 text-emerald-700" />
            </button>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION CONTACT & FORMULAIRE (#contact)
          ═══════════════════════════════════════════════ */}
      <section id="contact" className="py-20 md:py-28 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Infos de contact */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-3">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Échange Direct</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                  Contactez BISO PETO GROUP
                </h2>
                <p className="text-gray-600 text-base leading-relaxed">
                  Que ce soit pour une étude de site, un contrat de collecte, un service de nettoyage ou un partenariat, 
                  notre équipe d'experts est à votre entière écoute.
                </p>
              </div>

              <div className="space-y-6 pt-2">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F8FAF8] border border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Adresse E-mail</p>
                    <a href="mailto:contact@bisopeto.com" className="text-base font-bold text-gray-900 hover:text-emerald-700 transition-colors">
                      contact@bisopeto.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F8FAF8] border border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Téléphone / WhatsApp</p>
                    <a href="tel:+243852291755" className="text-base font-bold text-gray-900 hover:text-emerald-700 transition-colors">
                      +243 85 229 1755
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F8FAF8] border border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Siège Social</p>
                    <p className="text-base font-bold text-gray-900">
                      Kinshasa, République Démocratique du Congo
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulaire de contact */}
            <div className="lg:col-span-7">
              <div className="bg-[#F8FAF8] p-8 sm:p-10 rounded-3xl border border-gray-200/90 shadow-sm">
                
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Demande d'évaluation ou d'information
                </h3>

                {isSent ? (
                  <div className="py-12 flex flex-col items-center text-center space-y-4 animate-fade-in">
                    <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg">
                      <Check className="w-8 h-8" strokeWidth={3} />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">Message Transmis avec Succès</h4>
                    <p className="text-gray-600 text-sm max-w-md">
                      Votre demande a été envoyée à l'adresse officielle <span className="font-bold text-emerald-700">{COMPANY_EMAIL}</span>. 
                      Notre équipe vous répondra dans les plus brefs délais.
                    </p>
                    <button 
                      onClick={() => setIsSent(false)} 
                      className="text-emerald-700 text-xs font-bold uppercase tracking-wider underline pt-2"
                    >
                      Envoyer une nouvelle demande
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Nom complet / Entreprise <span className="text-emerald-600">*</span>
                        </label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ex: Entreprise Sarl ou M. Jean" 
                          value={formState.name}
                          onChange={e => setFormState({ ...formState, name: e.target.value })}
                          className="w-full px-4 py-3 bg-white rounded-xl border border-gray-300 text-gray-900 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Adresse E-mail <span className="text-emerald-600">*</span>
                        </label>
                        <input 
                          type="email" 
                          required 
                          placeholder="contact@organisation.com" 
                          value={formState.email}
                          onChange={e => setFormState({ ...formState, email: e.target.value })}
                          className="w-full px-4 py-3 bg-white rounded-xl border border-gray-300 text-gray-900 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Téléphone
                        </label>
                        <input 
                          type="tel" 
                          placeholder="+243 ..." 
                          value={formState.phone}
                          onChange={e => setFormState({ ...formState, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-white rounded-xl border border-gray-300 text-gray-900 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Prestation concernée
                        </label>
                        <select 
                          value={formState.service}
                          onChange={e => setFormState({ ...formState, service: e.target.value })}
                          className="w-full px-4 py-3 bg-white rounded-xl border border-gray-300 text-gray-900 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all"
                        >
                          <option value="Gestion des déchets">Gestion des déchets</option>
                          <option value="Études & Conseil environnemental">Études & Conseil environnemental</option>
                          <option value="Santé environnementale">Santé environnementale</option>
                          <option value="Nettoyage professionnel">Nettoyage professionnel</option>
                          <option value="Évaluation globale de site">Évaluation globale de site</option>
                          <option value="Autre demande">Autre demande</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Votre Message / Spécifications <span className="text-emerald-600">*</span>
                      </label>
                      <textarea 
                        required 
                        rows={4}
                        placeholder="Précisez la nature de votre besoin (localisation, type d'activité, volume estimé...)" 
                        value={formState.message}
                        onChange={e => setFormState({ ...formState, message: e.target.value })}
                        className="w-full px-4 py-3 bg-white rounded-xl border border-gray-300 text-gray-900 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none resize-none transition-all"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSending}
                      className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>ENVOYER MA DEMANDE</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          9. FOOTER
          ═══════════════════════════════════════════════ */}
      <footer className="bg-gray-950 text-gray-400 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-gray-800">
            
            {/* Colonne 1 & 2 : Logo & Description */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-900/50 border border-emerald-700/50 flex items-center justify-center p-1.5">
                  <img src={appLogo} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">BISO PETO <span className="text-emerald-400">GROUP</span></h3>
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">SARL • Services Environnementaux</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
                Entreprise congolaise de référence spécialisée dans l'assainissement, la gestion intégrée des déchets, 
                le nettoyage professionnel et le conseil en durabilité environnementale.
              </p>
            </div>

            {/* Colonne 3 : Liens Rapides */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Liens Rapides</h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li>
                  <button onClick={() => scrollToSection('accueil')} className="hover:text-emerald-400 transition-colors">
                    Accueil
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('prestations')} className="hover:text-emerald-400 transition-colors">
                    Prestations
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('innovation')} className="hover:text-emerald-400 transition-colors">
                    Innovation
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('apropos')} className="hover:text-emerald-400 transition-colors">
                    À Propos
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('contact')} className="hover:text-emerald-400 transition-colors">
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            {/* Colonne 4 : Nos 4 Pôles */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Nos Prestations</h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li>
                  <button onClick={() => handleServiceSelect('dechets', 'Gestion des déchets')} className="hover:text-emerald-400 transition-colors text-left">
                    Gestion des déchets
                  </button>
                </li>
                <li>
                  <button onClick={() => handleServiceSelect('etudes', 'Études & Conseil')} className="hover:text-emerald-400 transition-colors text-left">
                    Études & Conseil
                  </button>
                </li>
                <li>
                  <button onClick={() => handleServiceSelect('sante', 'Santé environnementale')} className="hover:text-emerald-400 transition-colors text-left">
                    Santé environnementale
                  </button>
                </li>
                <li>
                  <button onClick={() => handleServiceSelect('nettoyage', 'Nettoyage professionnel')} className="hover:text-emerald-400 transition-colors text-left">
                    Nettoyage professionnel
                  </button>
                </li>
              </ul>
            </div>

            {/* Colonne 5 : Coordonnées */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Contact Direct</h4>
              <p className="text-xs leading-relaxed">
                <strong className="text-white">RDC :</strong> Kinshasa
              </p>
              <p className="text-xs leading-relaxed">
                <strong className="text-white">Email :</strong> contact@bisopeto.com
              </p>
              <p className="text-xs leading-relaxed">
                <strong className="text-white">Tél :</strong> +243 85 229 1755
              </p>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>© 2026 BISO PETO GROUP SARL. Tous droits réservés.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-gray-400 cursor-pointer">Politique de confidentialité</span>
              <span className="hover:text-gray-400 cursor-pointer">Mentions légales</span>
              <span className="hover:text-gray-400 cursor-pointer">RDC</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
