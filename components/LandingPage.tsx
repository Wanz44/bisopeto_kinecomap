
import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ArrowRight, Home, Building2, Truck, GraduationCap, 
  Target, Eye, CheckCircle2, Leaf, Mail, Phone, MapPin, 
  Clock, Send, Rocket, Menu, X, Globe, Star, PieChart,
  Sparkles, Smartphone, Loader2, Info, MessageSquare, ShieldCheck,
  Zap, Award, Users, Trash2, Download, MousePointer2, BarChart3,
  Recycle, Check, Play, Camera, Shield
} from 'lucide-react';
import { GlobalImpact } from '../types';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  appLogo: string;
  impactData: GlobalImpact;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin, appLogo, impactData }) => {
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

  const handleSmoothScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setIsMenuOpen(false);
    }
  };

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

  return (
    <div className="w-full h-full overflow-y-auto bg-[#F8FAFC] dark:bg-[#050505] text-gray-800 dark:text-gray-200 no-scrollbar selection:bg-primary selection:text-white">
      
      <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 flex justify-center px-4 pt-4 md:pt-6 ${isScrolled ? 'pointer-events-none' : ''}`}>
        <nav className={`w-full max-w-7xl transition-all duration-500 pointer-events-auto flex items-center justify-between px-6 py-4 rounded-[2.5rem] ${
          isScrolled 
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/20 dark:border-white/5 py-3' 
          : 'bg-transparent'
        }`}>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-11 h-11 bg-white dark:bg-black rounded-2xl flex items-center justify-center p-2 shadow-xl group-hover:rotate-[10deg] group-hover:scale-110 transition-all duration-500 border border-gray-100 dark:border-white/10">
              <img src={appLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tighter text-primary dark:text-white leading-none">BISO PETO</span>
                <div className="hidden sm:flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[0.625rem] font-bold text-green-600 uppercase tracking-widest">Live</span>
                </div>
              </div>
              <span className="text-[0.6rem] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Kin Eco-Map</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {[
              { id: 'about', label: 'À Propos' },
              { id: 'modules', label: 'L\'Écosystème' },
              { id: 'process', label: 'Fonctionnement' },
              { id: 'objectives', label: 'Impact' },
              { id: 'contact', label: 'Contact' }
            ].map((item) => (
              <button key={item.id} onClick={() => handleSmoothScroll(item.id)} className="relative text-xs font-semibold uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors group">
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
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

      <section className="relative pt-48 pb-24 md:pt-64 md:pb-40 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-primary/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[70%] bg-secondary/10 blur-[150px] rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
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
              <button onClick={() => handleSmoothScroll('modules')} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-2 border-gray-100 dark:border-gray-700 px-10 py-5 rounded-3xl font-bold text-lg uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                Découvrir l'Espace <Play className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="relative animate-fade-in hidden lg:block">
            <div className="relative z-10 w-full aspect-square rounded-[4rem] overflow-hidden shadow-2xl border-[0.75rem] border-white dark:border-gray-800 rotate-3 group cursor-pointer" onClick={onStart}>
              <img src="https://xjllcclxkffrpdnbttmj.supabase.co/storage/v1/object/public/branding/hero-kinshasa.jpg?t=1" alt="Kinshasa Verte" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                   onError={(e) => e.currentTarget.src = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=80"} />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-500">
                    <Rocket className="w-8 h-8" />
                 </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -left-10 z-20 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl border border-gray-50 dark:border-gray-800">
               <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 text-primary rounded-2xl"><Award className="w-7 h-7"/></div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Inscriptions</p>
                    <p className="text-2xl font-bold dark:text-white leading-none mt-1">+24 Zones</p>
                  </div>
               </div>
               <div className="h-2 bg-green-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-primary w-[75%] animate-grow-width"></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-32 bg-white dark:bg-gray-950/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Pourquoi Biso Peto ?</h2>
                <div className="w-24 h-2 bg-primary rounded-full"></div>
              </div>
              
              <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                Chaque jour, Kinshasa produit plus de <span className="text-primary font-bold">10 000 tonnes</span> de déchets. Moins de 20% sont collectés de manière structurée. Notre mission est de combler ce fossé par la technologie.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-8 rounded-[2rem] bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                  <ShieldCheck className="w-10 h-10 text-primary mb-4" />
                  <h4 className="font-bold uppercase text-sm mb-2 dark:text-white">Traçabilité Totale</h4>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">De la poubelle au centre de recyclage, suivez chaque kilo via GPS et QR Code.</p>
                </div>
                <div className="p-8 rounded-[2rem] bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                  <Users className="w-10 h-10 text-secondary mb-4" />
                  <h4 className="font-bold uppercase text-sm mb-2 dark:text-white">Économie Inclusive</h4>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">Nous créons des emplois directs pour les collecteurs et récompensons les citoyens.</p>
                </div>
              </div>

              <div className="pt-8">
                <div className="flex items-center gap-4 p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/30">
                  <Info className="w-10 h-10 text-blue-600 shrink-0" />
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 leading-relaxed">
                    "Notre vision est d'intégrer le tri sélectif dans l'ADN de chaque Kinois d'ici 2030." — <strong>Directeur Stratégie, Biso Peto.</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="relative order-1 lg:order-2">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-75"></div>
              <img src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80" className="relative z-10 w-full rounded-[4rem] shadow-2xl border-[1rem] border-white dark:border-gray-800" alt="Action Terrain" />
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="py-32 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">Comment ça marche ?</h2>
            <p className="text-xl text-gray-500 font-medium">Une boucle vertueuse en 3 étapes simples.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Signaler', icon: Camera, desc: 'Prenez une photo d\'un tas d\'ordures ou de votre bac. Notre IA analyse instantanément le type de déchet et l\'urgence.' },
              { step: '02', title: 'Collecter', icon: Truck, desc: 'Un camion Biso Peto est dépêché via le SIG (Système d\'Information Géographique). Vous suivez son arrivée en temps réel.' },
              { step: '03', title: 'Valoriser', icon: Recycle, desc: 'Les déchets sont triés et acheminés vers des centres de recyclage partenaires. Vous gagnez des points échangeables.' },
            ].map((proc, i) => (
              <div key={i} className="relative group text-center md:text-left">
                <div className="text-8xl md:text-9xl font-bold text-gray-100 dark:text-gray-900 absolute -top-12 left-0 -z-10 group-hover:text-primary/10 transition-colors">{proc.step}</div>
                <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-8 shadow-xl border border-gray-100 dark:border-gray-700 group-hover:scale-110 group-hover:rotate-6 transition-all">
                  <proc.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold uppercase mb-4 dark:text-white">{proc.title}</h3>
                <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{proc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="modules" className="py-32 bg-white dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-6 text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter mb-6">Un Espace pour chacun</h2>
          <div className="w-32 h-2 bg-primary mx-auto rounded-full mb-8"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { title: 'Citoyens', icon: Home, color: 'bg-green-50 text-primary', desc: 'Gérez votre abonnement ménager, programmez vos collectes et transformez vos déchets plastiques en Eco-Points pour payer vos factures.', features: ['Collecte à domicile', 'Points Fidélité'] },
             { title: 'Entreprises', icon: Building2, color: 'bg-blue-50 text-secondary', desc: 'Optimisez votre gestion des déchets industriels. Obtenez des certificats officiels de valorisation pour vos rapports RSE et audits.', features: ['Rapportage RSE', 'Audit Déchets'] },
             { title: 'Logistique', icon: Truck, color: 'bg-orange-50 text-orange-600', desc: 'Outil pro pour les opérateurs de terrain. Planification intelligente des tournées, suivi GPS des flottes et validation par IA.', features: ['GPS Live', 'Preuve Photo IA'] },
             { title: 'Academy', icon: GraduationCap, color: 'bg-purple-50 text-purple-600', desc: 'Apprenez les gestes qui sauvent l\'environnement. Formations, Quiz et certifications pour écoles et agents municipaux.', features: ['Quiz Écolo', 'Certificats'] },
           ].map((mod, i) => (
             <div key={i} className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 hover:shadow-2xl transition-all group flex flex-col hover:-translate-y-2">
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
      </section>

      <section id="objectives" className="py-32 bg-primary text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-10 rotate-12"><Globe className="w-[25rem] h-[25rem]"/></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-[0.95]">Mesurer <br/> <span className="opacity-50">L'Impact</span></h2>
              <p className="text-xl opacity-80 font-medium max-w-md">La donnée est au cœur de notre stratégie. Nous suivons l'évolution de la propreté de Kinshasa en temps réel.</p>
              <div className="flex gap-4">
                 <div className="bg-white/10 p-6 rounded-3xl border border-white/20">
                    <p className="text-4xl font-bold">24</p>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-widest mt-2">Communes Actives</p>
                 </div>
                 <div className="bg-white/10 p-6 rounded-3xl border border-white/20">
                    <p className="text-4xl font-bold">+85%</p>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-widest mt-2">Satisfaction</p>
                 </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-[4rem] border border-white/20 space-y-10">
               {[
                 { label: 'Digitalisation des Zones', val: impactData.digitalization, icon: Zap },
                 { label: 'Valorisation Plastique', val: impactData.recyclingRate, icon: Recycle },
                 { label: 'Sensibilisation Academy', val: impactData.education, icon: GraduationCap },
                 { label: 'Connectivité Flotte', val: impactData.realTimeCollection, icon: Truck },
               ].map((obj, i) => (
                 <div key={i} className="space-y-3">
                   <div className="flex justify-between items-end">
                      <span className="text-sm font-semibold uppercase tracking-widest flex items-center gap-2"><obj.icon className="w-4 h-4"/> {obj.label}</span>
                      <span className="text-2xl font-bold">{obj.val}%</span>
                   </div>
                   <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all duration-[2s]" style={{ width: `${obj.val}%` }}></div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-32 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white dark:bg-gray-900 rounded-[4rem] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-gray-100 dark:border-gray-800">
             <div className="p-12 lg:p-20 space-y-12">
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter">Parlons d'Impact</h2>
                  <div className="w-16 h-2 bg-primary rounded-full"></div>
                  <p className="text-gray-500 font-medium italic leading-relaxed">Vous êtes une autorité municipale ou une entreprise engagée ? Contactez notre équipe dédiée aux partenariats institutionnels.</p>
                </div>

                <div className="space-y-8">
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"><Mail className="w-7 h-7"/></div>
                      <div>
                        <p className="text-[0.6rem] font-semibold text-gray-400 uppercase tracking-widest">Email Support & Partenaires</p>
                        <p className="text-lg font-bold dark:text-white">contact@bisopeto.com</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"><Phone className="w-7 h-7"/></div>
                      <div>
                        <p className="text-[0.6rem] font-semibold text-gray-400 uppercase tracking-widest">Ligne d'Urgence / WhatsApp</p>
                        <p className="text-lg font-bold dark:text-white">+243 85 229 1755</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"><MapPin className="w-7 h-7"/></div>
                      <div>
                        <p className="text-[0.6rem] font-semibold text-gray-400 uppercase tracking-widest">Quartier Général</p>
                        <p className="text-base font-bold dark:text-white leading-tight">63, Av. Colonel Mondjiba <br/><span className="text-gray-400 text-xs">Kinshasa / Gombe - RDC</span></p>
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
                      <p className="text-gray-400 font-medium max-w-xs mx-auto">Mbote! Nous avons bien reçu votre demande. Un consultant environnemental reviendra vers vous sous 24h.</p>
                      <button onClick={() => setIsSent(false)} className="text-primary text-xs font-semibold uppercase tracking-widest underline underline-offset-4">Envoyer un autre message</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[0.6rem] font-semibold text-gray-500 uppercase tracking-widest ml-1">Identité / Entreprise</label>
                        <input required className="w-full bg-white/5 border-2 border-white/10 text-white p-5 rounded-3xl focus:border-primary focus:ring-0 outline-none font-medium transition-all" placeholder="Nom complet" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[0.6rem] font-semibold text-gray-500 uppercase tracking-widest ml-1">E-mail professionnel</label>
                        <input required type="email" className="w-full bg-white/5 border-2 border-white/10 text-white p-5 rounded-3xl focus:border-primary focus:ring-0 outline-none font-medium transition-all" placeholder="votre@email.com" value={formState.email} onChange={e => setFormState({...formState, email: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[0.6rem] font-semibold text-gray-500 uppercase tracking-widest ml-1">Votre Message</label>
                        <textarea required rows={4} className="w-full bg-white/5 border-2 border-white/10 text-white p-5 rounded-3xl focus:border-primary focus:ring-0 outline-none font-medium resize-none transition-all" placeholder="Décrivez votre besoin..." value={formState.message} onChange={e => setFormState({...formState, message: e.target.value})} />
                    </div>
                    <button disabled={isSending} className="w-full py-5 bg-primary hover:bg-primary-light text-white rounded-3xl font-bold uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50">
                      {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-5 h-5"/> Envoyer la demande</>}
                    </button>
                  </form>
                )}
             </div>
          </div>
        </div>
      </section>

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
               <div className="flex gap-4">
                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[0.6rem] font-semibold uppercase tracking-widest text-gray-500">RCCM CD/KNM/25-B-01937</div>
                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[0.6rem] font-semibold uppercase tracking-widest text-gray-500">ID.NAT. 01-S9502-N76752K</div>
               </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 mb-10">Navigation</h4>
              <ul className="space-y-5 font-bold uppercase text-[0.6rem] tracking-[0.2em] text-gray-400">
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => handleSmoothScroll('about')}>Manifeste</li>
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => handleSmoothScroll('modules')}>Écosystème</li>
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => handleSmoothScroll('process')}>Le Modèle</li>
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => handleSmoothScroll('objectives')}>Objectifs 2030</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 mb-10">Plateforme</h4>
              <ul className="space-y-5 font-bold uppercase text-[0.6rem] tracking-[0.2em] text-gray-400">
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={onLogin}>Mon Compte</li>
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={onStart}>Eco Citoyen</li>
                <li className="hover:text-primary cursor-pointer transition-colors" onClick={onStart}>Expert Collecteur</li>
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
