
import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, Home, Building2, Truck, GraduationCap, 
  Leaf, Mail, Phone, MapPin, 
  Send, Rocket, Menu, X, Globe,
  Sparkles, Loader2, Info, ShieldCheck,
  Zap, Award, Users, MousePointer2,
  Recycle, Check, Play, Camera, Shield,
  Target, BarChart3, Heart, Layout, 
  Smartphone, Bell, QrCode, ClipboardCheck,
  /* Added missing icon imports */
  CheckCircle2, Eye, User, Activity
} from 'lucide-react';
import { GlobalImpact, AppView } from '../types';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  appLogo: string;
  impactData: GlobalImpact;
  onChangeView: (view: AppView) => void;
  currentView: AppView;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin, appLogo, impactData, onChangeView, currentView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
      setFormState({ name: '', email: '', message: '' });
      setTimeout(() => setIsSent(false), 5000);
    }, 2000);
  };

  const isMainLanding = currentView === AppView.LANDING;

  const navItems = [
    { view: AppView.LANDING_ABOUT, label: 'À Propos' },
    { view: AppView.LANDING_ECOSYSTEM, label: 'L\'Écosystème' },
    { view: AppView.LANDING_PROCESS, label: 'Fonctionnement' },
    { view: AppView.LANDING_IMPACT, label: 'Impact' },
    { view: AppView.LANDING_CONTACT, label: 'Contact' }
  ];

  const handleNavClick = (view: AppView) => {
    onChangeView(view);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F8FAFC] dark:bg-[#050505] text-gray-800 dark:text-gray-200 no-scrollbar selection:bg-primary selection:text-white font-sans">
      
      {/* NAVIGATION HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 flex justify-center px-4 pt-4 md:pt-6 ${isScrolled ? 'pointer-events-none' : ''}`}>
        <nav className={`w-full max-w-7xl transition-all duration-500 pointer-events-auto flex items-center justify-between px-6 py-4 rounded-[2.5rem] ${
          isScrolled 
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/20 dark:border-white/5 py-3' 
          : 'bg-transparent'
        }`}>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNavClick(AppView.LANDING)}>
            <div className="w-11 h-11 bg-white dark:bg-black rounded-2xl flex items-center justify-center p-2 shadow-xl group-hover:rotate-[10deg] group-hover:scale-110 transition-all duration-500 border border-gray-100 dark:border-white/10">
              <img src={appLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tighter text-primary dark:text-white leading-none">BISO PETO</span>
              </div>
              <span className="text-[0.6rem] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Kin Eco-Map</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <button 
                key={item.view} 
                onClick={() => handleNavClick(item.view)} 
                className={`relative text-xs font-semibold uppercase tracking-[0.15em] transition-colors group ${currentView === item.view ? 'text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white'}`}
              >
                {item.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${currentView === item.view ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-gray-600 dark:text-gray-400 hover:text-primary transition-all px-4 py-2">Connexion</button>
            <button onClick={onStart} className="group relative bg-primary hover:bg-primary-light text-white px-7 py-3 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-green-500/20 active:scale-95 transition-all overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">Commencer <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
            </button>
            <button className="lg:hidden p-3 bg-gray-100 dark:bg-gray-800 text-primary rounded-2xl transition-all" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* MOBILE MENU OVERLAY */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[110] bg-white dark:bg-[#050505] p-8 flex flex-col animate-fade-in">
           <div className="flex justify-between items-center mb-12">
              <img src={appLogo} className="w-12 h-12 object-contain" alt="Logo" />
              <button onClick={() => setIsMenuOpen(false)} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl"><X/></button>
           </div>
           <div className="flex flex-col gap-6">
              {navItems.map(item => (
                <button key={item.view} onClick={() => handleNavClick(item.view)} className="text-2xl font-bold text-left uppercase tracking-tighter hover:text-primary transition-colors">{item.label}</button>
              ))}
              <div className="h-px bg-gray-100 dark:bg-gray-800 my-4"></div>
              <button onClick={onLogin} className="text-xl font-bold text-left uppercase tracking-tighter text-secondary">Se Connecter</button>
              <button onClick={onStart} className="w-full py-5 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest text-sm">Nous Rejoindre</button>
           </div>
        </div>
      )}

      {/* HERO SECTION / PAGE HEADER */}
      <section className={`relative transition-all duration-700 overflow-hidden ${isMainLanding ? 'pt-48 pb-24 md:pt-64 md:pb-40' : 'pt-32 pb-12'}`}>
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-primary/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[70%] bg-secondary/10 blur-[150px] rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6">
          {isMainLanding ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="animate-fade-in-up">
                <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-primary-light px-4 py-2 rounded-full mb-8 border border-green-100 dark:border-green-800">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-widest">L'Intelligence Artificielle au service de Kinshasa</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white tracking-tighter leading-[1.05] mb-8 uppercase">
                  REPENSONS <br/> <span className="text-primary italic">L'URBAIN</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-xl mb-12">
                  Transformez chaque déchet en ressource. Biso Peto connecte les citoyens, les entreprises et les collecteurs pour un Kinshasa propre, connecté et durable.
                </p>
                <div className="flex flex-col sm:flex-row gap-5">
                  <button onClick={onStart} className="bg-primary text-white px-10 py-5 rounded-3xl font-bold text-lg uppercase tracking-widest shadow-[0_20px_50px_rgba(46,125,50,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                    Rejoindre le Réseau <MousePointer2 className="w-6 h-6" />
                  </button>
                  <button onClick={() => handleNavClick(AppView.LANDING_PROCESS)} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-2 border-gray-100 dark:border-gray-700 px-10 py-5 rounded-3xl font-bold text-lg uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                    Le Modèle <Play className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="relative animate-fade-in hidden lg:block">
                <div className="relative z-10 w-full aspect-square rounded-[4rem] overflow-hidden shadow-2xl border-[0.75rem] border-white dark:border-gray-800 rotate-3 group cursor-pointer" onClick={onStart}>
                  <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=80" alt="Kinshasa Verte" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-500">
                        <Rocket className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center animate-fade-in py-10">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">
                  {navItems.find(i => i.view === currentView)?.label}
                </h1>
                <div className="w-24 h-1.5 bg-primary mx-auto mt-6 rounded-full shadow-[0_0_20px_rgba(46,125,50,0.4)]"></div>
            </div>
          )}
        </div>
      </section>

      {/* CONTENT PAGES */}
      <main className="animate-fade-in pb-32">
        
        {/* PAGE: À PROPOS */}
        {currentView === AppView.LANDING_ABOUT && (
          <div className="max-w-6xl mx-auto px-6 space-y-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-block px-4 py-2 bg-primary/5 text-primary rounded-xl font-bold text-xs uppercase tracking-widest">Manifeste BISO PETO</div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Une filiale de <span className="text-primary">BISO PETO GROUP SARL</span></h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium leading-relaxed text-justify">
                  BISO PETO est une entreprise congolaise engagée dans la transformation durable, spécialisée dans la gestion, le tri et la valorisation des déchets à Kinshasa et en RDC. 
                  Créée pour répondre à l’urgence environnementale, nous développons des solutions innovantes et opérationnelles pour structurer le secteur et réduire la pollution urbaine.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    "Innovation digitale", "Impact mesurable", "Emplois verts", "Économie circulaire"
                  ].map(val => (
                    <div key={val} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-white/5">
                      <CheckCircle2 className="text-primary w-5 h-5 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-tight">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white dark:border-gray-800 rotate-2">
                 <img src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80" className="w-full h-auto" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="bg-primary text-white p-12 rounded-[3.5rem] shadow-xl relative overflow-hidden">
                  <Target className="absolute -right-10 -bottom-10 w-64 h-64 opacity-10" />
                  <h3 className="text-3xl font-bold uppercase tracking-tighter mb-6">Notre Mission</h3>
                  <p className="text-lg opacity-90 leading-relaxed font-medium">Réinventer la gestion des déchets à Kinshasa en transformant un problem urbain en opportunité environnementale, économique et sociale.</p>
               </div>
               <div className="bg-secondary text-white p-12 rounded-[3.5rem] shadow-xl relative overflow-hidden">
                  <Eye className="absolute -right-10 -bottom-10 w-64 h-64 opacity-10" />
                  <h3 className="text-3xl font-bold uppercase tracking-tighter mb-6">Notre Vision</h3>
                  <p className="text-lg opacity-90 leading-relaxed font-medium">Faire de Kinshasa une ville propre, moderne et durable, en positionnant la RDC comme référence africaine de l’économie circulaire.</p>
               </div>
            </div>

            <div className="space-y-12">
              <div className="text-center">
                <h3 className="text-3xl font-bold uppercase tracking-tighter mb-4">Nos Services de Pointe</h3>
                <p className="text-gray-400 font-medium max-w-2xl mx-auto uppercase text-xs tracking-widest">Des solutions adaptées aux besoins urbains et professionnels</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                   { title: "Collecte & Tri", icon: Truck, desc: "Collecte sélective, points de tri de quartier et accompagnement à la gestion des flux de déchets ménagers." },
                   { title: "Recyclage", icon: Recycle, desc: "Transformation des plastiques et déchets ménagers secs en ressources réutilisables dans l'économie locale." },
                   { title: "Solutions Pro", icon: Building2, desc: "Gestion externalisée des déchets d’entreprise et accompagnement à la conformité environnementale (RSE)." },
                   { title: "Éducation", icon: GraduationCap, desc: "Programmes de sensibilisation communautaire et actions éducatives dans les écoles de la ville-province." },
                   { title: "Digitalisation", icon: Globe, desc: "Propulsion de Kin Eco-Map, première carte intelligente de gestion environnementale structurant l’écosystème." }
                 ].map((service, i) => (
                   <div key={i} className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-white/5 hover:border-primary transition-all group">
                      <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform"><service.icon size={28}/></div>
                      <h4 className="text-xl font-bold uppercase mb-4 tracking-tight">{service.title}</h4>
                      <p className="text-sm text-gray-500 font-medium leading-relaxed">{service.desc}</p>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        )}

        {/* PAGE: FONCTIONNEMENT */}
        {currentView === AppView.LANDING_PROCESS && (
          <div className="max-w-5xl mx-auto px-6 space-y-20">
            <div className="text-center space-y-4">
              <p className="text-lg text-gray-500 font-medium leading-relaxed">Kin Eco-Map est une plateforme digitale simple, intuitive et accessible à tous, qui permet aux citoyens et entreprises de gérer efficacement leurs besoins.</p>
            </div>

            <div className="space-y-16">
               {[
                 { step: "01", title: "Compte & Abonnement", icon: User, desc: "Création de compte en quelques clics, choix d'un plan adapté (ménage, entreprise, institution) et paiement sécurisé en ligne pour un accès immédiat.", items: ["Validation directe", "Outils numériques intégrés"] },
                 { step: "02", title: "Signalement Intelligent", icon: Camera, desc: "Faites un signalement rapide avec photo, localisation GPS automatique et description. Ouvert aux citoyens, entreprises et associations.", items: ["Photo HD", "Priorisation par urgence"] },
                 { step: "03", title: "Évacuations Spéciales", icon: Zap, desc: "Commandez une intervention ponctuelle pour des encombrants, après un événement ou pour des déchets industriels spécifiques.", items: ["Suivi programmation", "Confirmation mission"] },
                 { step: "04", title: "Alertes Live", icon: Bell, desc: "Restez informé en permanence : confirmation des signalements, suivi de traitement et notifications d’intervention dans votre zone.", items: ["Traçabilité", "Confiance accrue"] },
                 { step: "05", title: "Academy Éducative", icon: GraduationCap, desc: "Accès à des contenus pédagogiques sur le tri et la gestion durable. Formations pour écoles et entreprises avec certifications.", items: ["Quiz écolo", "Certificats officiels"] },
                 { step: "06", title: "Géolocalisation SIG", icon: MapPin, desc: "Visualisez les tricycles et camions affectés à votre secteur en temps réel sur la carte pour une coordination parfaite.", items: ["Mouvements actifs", "Identification équipe"] },
                 { step: "07", title: "Console Client", icon: Layout, desc: "Espace personnel sécurisé centralisant factures, historique, statistiques d'impact et suivi complet des interventions.", items: ["Tableau de bord pro", "Historique paiements"] }
               ].map((step, i) => (
                 <div key={i} className="flex flex-col md:flex-row gap-10 items-start group">
                    <div className="shrink-0 w-24 h-24 bg-primary text-white rounded-[2rem] flex flex-col items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                      <span className="text-xs font-black opacity-40 leading-none mb-1">{step.step}</span>
                      <step.icon size={32} />
                    </div>
                    <div className="flex-1 space-y-4">
                       <h3 className="text-2xl font-bold uppercase tracking-tighter">{step.title}</h3>
                       <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{step.desc}</p>
                       <div className="flex flex-wrap gap-2">
                         {step.items.map(it => <span key={it} className="px-3 py-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary">{it}</span>)}
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            <div className="bg-gray-900 p-12 rounded-[4rem] text-center text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5"><Smartphone size={200}/></div>
               <h3 className="text-3xl font-bold uppercase tracking-tighter mb-6">Tout Kinshasa dans votre poche</h3>
               <p className="text-lg opacity-80 mb-10 max-w-xl mx-auto">Plus qu'une simple carte, Kin Eco-Map est votre partenaire quotidien pour une ville durable.</p>
               <button onClick={onStart} className="px-10 py-5 bg-primary rounded-2xl font-bold uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Démarrer l'expérience</button>
            </div>
          </div>
        )}

        {/* PAGE: IMPACT */}
        {currentView === AppView.LANDING_IMPACT && (
          <div className="max-w-6xl mx-auto px-6 space-y-20">
            <div className="bg-primary/5 p-10 rounded-[3.5rem] border border-primary/10 text-center">
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">Ce que nous changeons concrètement</h3>
              <p className="text-gray-500 font-medium max-w-3xl mx-auto">Kin Eco-Map est une solution mesurable et durable pour transformer les déchets en valeur et l’écologie en moteur de développement pour Kinshasa.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {[
                 { title: "Impact Environnemental", color: "text-green-600", bg: "bg-green-50", items: ["Réduction des déchets abandonnés", "Amélioration de la propreté urbaine", "Protection des sols et cours d’eau", "Promotion de comportements responsables"] },
                 { title: "Impact Économique", color: "text-blue-600", bg: "bg-blue-50", items: ["Création d’emplois verts", "Stimulation de la filière recyclage", "Opportunités pour entrepreneurs", "Économie circulaire locale"] },
                 { title: "Impact Social", color: "text-red-600", bg: "bg-red-50", items: ["Sensibilisation des citoyens", "Participation communautaire active", "Amélioration du cadre de vie", "Contribution à la santé publique"] },
                 { title: "Impact Structurel", color: "text-purple-600", bg: "bg-purple-50", items: ["Cartographie de l’écosystème", "Mise en relation des acteurs", "Données exploitables (Open Data)", "Support aux initiatives publiques"] },
               ].map((axe, i) => (
                 <div key={i} className="p-10 bg-white dark:bg-gray-900 rounded-[3.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all">
                    <h4 className={`text-2xl font-bold uppercase tracking-tight mb-8 ${axe.color}`}>{axe.title}</h4>
                    <ul className="space-y-4">
                      {axe.items.map((item, j) => (
                        <li key={j} className="flex gap-4 items-center">
                           <div className={`w-2 h-2 rounded-full ${axe.bg.replace('50', '500')}`}></div>
                           <span className="text-sm font-bold dark:text-white uppercase tracking-tight opacity-70">{item}</span>
                        </li>
                      ))}
                    </ul>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-10">
               <div className="space-y-8">
                  <h3 className="text-4xl font-bold uppercase tracking-tighter leading-none">Indicateurs de Performance (KPI)</h3>
                  <div className="space-y-6">
                     {[
                        { label: "Digitalisation des Zones", val: impactData.digitalization, icon: Smartphone },
                        { label: "Recyclage Plastique", val: impactData.recyclingRate, icon: Recycle },
                        { label: "Éducation Academy", val: impactData.education, icon: GraduationCap },
                        { label: "Réponse Terrain Live", val: impactData.realTimeCollection, icon: Activity }
                     ].map((kpi, i) => (
                       <div key={i} className="space-y-2">
                          <div className="flex justify-between items-end px-2">
                             <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><kpi.icon size={12}/> {kpi.label}</span>
                             <span className="text-xl font-bold text-primary">{kpi.val}%</span>
                          </div>
                          <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all duration-[2s]" style={{ width: `${kpi.val}%` }}></div></div>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="p-10 bg-gray-50 dark:bg-gray-900 rounded-[3.5rem] border dark:border-white/5 text-center flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center"><BarChart3 size={40}/></div>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed italic">"Toutes nos données sont auditées et accessibles via notre console administrative pour les partenaires gouvernementaux et institutionnels."</p>
                  <button onClick={onStart} className="text-xs font-black uppercase text-primary border-b-2 border-primary tracking-widest pb-1">Voir le rapport complet 2024</button>
               </div>
            </div>
          </div>
        )}

        {/* PAGE: ÉCOSYSTÈME (MODULES) */}
        {currentView === AppView.LANDING_ECOSYSTEM && (
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Citoyens', icon: Home, color: 'bg-green-50 text-primary', desc: 'Gérez votre abonnement ménager, programmez vos collectes et transformez vos déchets plastiques en Eco-Points pour payer vos factures.', features: ['Collecte à domicile', 'Points Fidélité'] },
              { title: 'Entreprises', icon: Building2, color: 'bg-blue-50 text-secondary', desc: 'Optimisez votre gestion des déchets industriels. Obtenez des certificats officiels de valorisation pour vos rapports RSE et audits.', features: ['Rapportage RSE', 'Audit Déchets'] },
              { title: 'Logistique', icon: Truck, color: 'bg-orange-50 text-orange-600', desc: 'Outil pro pour les opérateurs de terrain. Planification intelligente des tournées, suivi GPS des flottes et validation par IA.', features: ['GPS Live', 'Preuve Photo IA'] },
              { title: 'Academy', icon: GraduationCap, color: 'bg-purple-50 text-purple-600', desc: 'Apprenez les gestes qui sauvent l\'environnement. Formations, Quiz et certifications pour écoles et agents municipaux.', features: ['Quiz Écolo', 'Certificats'] },
            ].map((mod, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-white/5 hover:shadow-2xl transition-all group flex flex-col hover:-translate-y-2">
                  <div className={`w-16 h-16 ${mod.color} rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform`}><mod.icon className="w-8 h-8"/></div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase mb-4 tracking-tight">{mod.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-8 leading-relaxed flex-1">{mod.desc}</p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {mod.features.map(f => <span key={f} className="text-[0.6rem] font-semibold uppercase text-gray-400 border border-gray-200 dark:border-gray-800 px-2 py-1 rounded-lg">{f}</span>)}
                  </div>
                  <button onClick={onStart} className="w-full py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-bold text-xs uppercase tracking-widest text-gray-900 dark:text-white hover:bg-primary hover:text-white transition-all">Accéder à l'espace</button>
              </div>
            ))}
          </div>
        )}

        {/* PAGE: CONTACT */}
        {currentView === AppView.LANDING_CONTACT && (
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-white dark:bg-gray-900 rounded-[4rem] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-gray-100 dark:border-gray-800">
              <div className="p-12 lg:p-20 space-y-12">
                  <div className="space-y-4">
                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">Parlons d'Impact</h2>
                    <p className="text-gray-500 font-medium italic leading-relaxed">Vous êtes une autorité municipale ou une entreprise engagée ? Contactez notre équipe dédiée aux partenariats institutionnels.</p>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"><Mail className="w-7 h-7"/></div>
                        <div>
                          <p className="text-[0.6rem] font-semibold text-gray-400 uppercase tracking-widest">Email Partenaires</p>
                          <p className="text-lg font-bold dark:text-white">contact@bisopeto.com</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"><Phone className="w-7 h-7"/></div>
                        <div>
                          <p className="text-[0.6rem] font-semibold text-gray-400 uppercase tracking-widest">Urgence / WhatsApp</p>
                          <p className="text-lg font-bold dark:text-white">+243 85 229 1755</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"><MapPin className="w-7 h-7"/></div>
                        <div>
                          <p className="text-[0.6rem] font-semibold text-gray-400 uppercase tracking-widest">Quartier Général</p>
                          <p className="text-base font-bold dark:text-white">63, Av. Colonel Mondjiba, Kinshasa</p>
                        </div>
                    </div>
                  </div>
              </div>

              <div className="bg-gray-900 p-12 lg:p-20 relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute top-0 right-0 p-8 opacity-5 text-white"><Shield className="w-[12rem] h-[12rem]"/></div>
                  {isSent ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-scale-up">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl"><Check className="w-10 h-10" strokeWidth={4}/></div>
                        <h3 className="text-3xl font-bold text-white uppercase tracking-tight leading-none">Message Reçu</h3>
                        <p className="text-gray-400 font-medium max-w-xs mx-auto">Un consultant environnemental reviendra vers vous sous 24h.</p>
                        <button onClick={() => setIsSent(false)} className="text-primary text-xs font-semibold uppercase tracking-widest underline underline-offset-4">Envoyer un autre message</button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                      <div className="space-y-2">
                          <label className="text-[0.6rem] font-semibold text-gray-500 uppercase tracking-widest ml-1">Identité / Entreprise</label>
                          <input required className="w-full bg-white/5 border-2 border-white/10 text-white p-5 rounded-3xl focus:border-primary outline-none font-medium transition-all" placeholder="Nom complet" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[0.6rem] font-semibold text-gray-500 uppercase tracking-widest ml-1">E-mail professionnel</label>
                          <input required type="email" className="w-full bg-white/5 border-2 border-white/10 text-white p-5 rounded-3xl focus:border-primary outline-none font-medium transition-all" placeholder="votre@email.com" value={formState.email} onChange={e => setFormState({...formState, email: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[0.6rem] font-semibold text-gray-500 uppercase tracking-widest ml-1">Votre Message</label>
                          <textarea required rows={4} className="w-full bg-white/5 border-2 border-white/10 text-white p-5 rounded-3xl focus:border-primary outline-none font-medium resize-none transition-all" placeholder="Décrivez votre besoin..." value={formState.message} onChange={e => setFormState({...formState, message: e.target.value})} />
                      </div>
                      <button disabled={isSending} className="w-full py-5 bg-primary hover:bg-primary-light text-white rounded-3xl font-bold uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50">
                        {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5"/> Envoyer la demande</>}
                      </button>
                    </form>
                  )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-white pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
            <div className="col-span-1 lg:col-span-2 space-y-8">
               <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white rounded-3xl p-3 shadow-2xl">
                    <img src={appLogo} className="w-full h-full object-contain" alt="Logo"/>
                  </div>
                  <div>
                    <h3 className="text-4xl font-bold tracking-tighter leading-none">BISO PETO</h3>
                    <p className="text-[0.6rem] font-semibold text-gray-500 uppercase tracking-[0.4em] mt-1">Group SARL</p>
                  </div>
               </div>
               <p className="text-gray-400 font-medium leading-relaxed max-w-sm">
                 Première plateforme congolaise de digitalisation environnementale, certifiée pour l'assainissement durable de la ville-province de Kinshasa.
               </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 mb-10">Navigation</h4>
              <ul className="space-y-5 font-bold uppercase text-[0.6rem] tracking-[0.2em] text-gray-400">
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => handleNavClick(AppView.LANDING_ABOUT)}>À Propos</li>
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => handleNavClick(AppView.LANDING_ECOSYSTEM)}>Écosystème</li>
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => handleNavClick(AppView.LANDING_PROCESS)}>Fonctionnement</li>
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => handleNavClick(AppView.LANDING_IMPACT)}>Impact</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 mb-10">Plateforme</h4>
              <ul className="space-y-5 font-bold uppercase text-[0.6rem] tracking-[0.2em] text-gray-400">
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={onLogin}>Mon Compte</li>
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={onStart}>Eco Citoyen</li>
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={onStart}>Eco Academy</li>
              </ul>
            </div>
          </div>

          <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[0.6rem] font-semibold tracking-[0.3em] text-gray-600">© 2025 BISO PETO Group SARL. KIN ECO-MAP est un produit protégé.</p>
            <div className="flex items-center gap-8">
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-gray-500 hover:text-white cursor-pointer transition-colors">Confidentialité</span>
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-gray-500 hover:text-white cursor-pointer transition-colors">Mentions Légales</span>
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all cursor-pointer"><Rocket className="w-4 h-4"/></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
