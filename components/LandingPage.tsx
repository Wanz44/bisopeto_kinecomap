
import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ArrowRight, Home, Building2, Truck, GraduationCap, 
  Target, Eye, CheckCircle2, Leaf, Mail, Phone, MapPin, 
  Clock, Send, Rocket, Menu, X, Globe, Star, PieChart,
  Sparkles, Smartphone, Loader2, Info, MessageSquare, ShieldCheck,
  Zap, Award, Users, Trash2, Download, MousePointer2, BarChart3,
  Recycle, Check, Play
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  appLogo: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin, appLogo }) => {
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
      
      {/* 1. Header Section */}
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
                <span className="font-black text-xl tracking-tighter text-primary dark:text-white leading-none">BISO PETO</span>
                <div className="hidden sm:flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Live</span>
                </div>
              </div>
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Kin Eco-Map</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {[
              { id: 'about', label: 'À Propos' },
              { id: 'modules', label: 'Fonctionnalités' },
              { id: 'objectives', label: 'Impact' },
              { id: 'contact', label: 'Contact' }
            ].map((item) => (
              <button key={item.id} onClick={() => handleSmoothScroll(item.id)} className="relative text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white transition-colors group">
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="hidden sm:flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] text-gray-600 dark:text-gray-400 hover:text-primary transition-all px-4 py-2">Connexion</button>
            <button onClick={onStart} className="group relative bg-primary hover:bg-primary-light text-white px-7 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-green-500/20 active:scale-95 transition-all overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">Commencer <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
            </button>
            <button className="lg:hidden p-3 bg-gray-100 dark:bg-gray-800 text-primary rounded-2xl transition-all" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-48 pb-24 md:pt-64 md:pb-40 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-primary/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[70%] bg-secondary/10 blur-[150px] rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-primary-light px-4 py-2 rounded-full mb-8 border border-green-100 dark:border-green-800">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Votre ville plus propre, votre avenir plus vert</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white tracking-tighter leading-[0.9] mb-8 uppercase">
              KIN <br/> <span className="text-primary italic">ECO-MAP</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-xl mb-12">
              Une plateforme numérique innovante pour transformer la gestion des déchets, l'assainissement urbain et promouvoir l'écologie citoyenne à Kinshasa.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <button onClick={onStart} className="bg-primary text-white px-10 py-5 rounded-3xl font-black text-lg uppercase tracking-widest shadow-[0_20px_50px_rgba(46,125,50,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                Ouvrir l'App <MousePointer2 size={24} />
              </button>
              <button onClick={() => handleSmoothScroll('contact')} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-2 border-gray-100 dark:border-gray-700 px-10 py-5 rounded-3xl font-black text-lg uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                Nous contacter <Mail size={24} />
              </button>
            </div>
          </div>

          <div className="relative animate-fade-in hidden lg:block">
            <div className="relative z-10 w-full aspect-square rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-white dark:border-gray-800 rotate-3 group cursor-pointer" onClick={onStart}>
              <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=80" alt="KIN ECO-MAP" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-500">
                    <Rocket size={32} />
                 </div>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 z-20 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl border border-gray-50 dark:border-gray-800">
               <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/30 text-primary rounded-2xl"><Award size={24}/></div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase">Impact Environnemental</p>
                    <p className="text-lg font-black dark:text-white leading-none mt-1">Leader en RDC</p>
                  </div>
               </div>
               <div className="h-1.5 bg-green-100 rounded-full overflow-hidden"><div className="h-full bg-primary w-[85%] animate-grow-width"></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. About Section */}
      <section id="about" className="py-32 bg-white dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8 order-2 lg:order-1">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Notre Mission & Vision</h2>
              <div className="w-20 h-2 bg-primary rounded-full"></div>
              <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                Portée par **BISO PETO Group SARL**, KIN ECO-MAP est la réponse technologique aux défis de l'assainissement urbain à Kinshasa.
              </p>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="p-8 rounded-[2.5rem] bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary transition-all group">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-primary/10 text-primary rounded-2xl group-hover:scale-110 transition-transform"><Target size={32} /></div>
                      <h4 className="text-xl font-black uppercase tracking-tight">Mission</h4>
                   </div>
                   <p className="text-gray-500 dark:text-gray-400 font-medium">Digitaliser la collecte des déchets pour garantir une traçabilité totale et une efficacité maximale dans nos 24 communes.</p>
                </div>
                <div className="p-8 rounded-[2.5rem] bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-secondary transition-all group">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-secondary/10 text-secondary rounded-2xl group-hover:scale-110 transition-transform"><Eye size={32} /></div>
                      <h4 className="text-xl font-black uppercase tracking-tight">Vision</h4>
                   </div>
                   <p className="text-gray-500 dark:text-gray-400 font-medium">Transformer Kinshasa en une ville modèle de développement durable en Afrique Centrale d'ici 2030.</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <img src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80" className="w-full rounded-[4rem] shadow-2xl" alt="Propreté" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Modules Section */}
      <section id="modules" className="py-32 bg-[#F8FAFC] dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6">Notre Écosystème</h2>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">Des outils adaptés à chaque acteur de la ville pour un impact collectif.</p>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { title: 'Éco-Citoyen', icon: Home, color: 'bg-green-50 text-primary', desc: 'Abonnements ménagers, suivi des collectes et programme de récompenses Eco-Points.', tags: ['Ménages', 'Particuliers'] },
             { title: 'Éco-Entreprise', icon: Building2, color: 'bg-blue-50 text-secondary', desc: 'Gestion des déchets industriels, certificats RSE et pilotage des tonnages.', tags: ['Bureaux', 'Industries'] },
             { title: 'Logistique', icon: Truck, color: 'bg-orange-50 text-orange-600', desc: 'Optimisation des tournées via GPS et monitoring de la flotte en temps réel.', tags: ['Opérateurs', 'Terrain'] },
             { title: 'Eco Academy', icon: GraduationCap, color: 'bg-purple-50 text-purple-600', desc: 'Formation continue, quiz éco-responsables et sensibilisation scolaire.', tags: ['Éducation', 'Savoir'] },
           ].map((mod, i) => (
             <div key={i} className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 hover:shadow-2xl transition-all group flex flex-col">
                <div className={`w-16 h-16 ${mod.color} rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform`}><mod.icon size={32}/></div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-4 tracking-tight">{mod.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-8 leading-relaxed flex-1">{mod.desc}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {mod.tags.map(t => <span key={t} className="text-[10px] font-black uppercase text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">{t}</span>)}
                </div>
                <button onClick={onStart} className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:translate-x-2 transition-transform">En savoir plus <ArrowRight size={14}/></button>
             </div>
           ))}
        </div>
      </section>

      {/* 5. Objectives / Progress Section */}
      <section id="objectives" className="py-32 bg-primary text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="grid grid-cols-10 gap-10">{Array.from({length: 100}).map((_, i) => <Star key={i} size={20}/>)}</div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none mb-8">Objectifs <br/> <span className="opacity-50">Impact 2025</span></h2>
              <p className="text-xl opacity-80 font-medium mb-12">Nous mesurons notre succès par l'amélioration réelle du cadre de vie des Kinois.</p>
              <button onClick={onStart} className="bg-white text-primary px-10 py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">Rejoindre le mouvement</button>
            </div>
            <div className="space-y-10 bg-white/10 backdrop-blur-xl p-10 rounded-[4rem] border border-white/20">
               {[
                 { label: 'Digitalisation des quartiers', val: 75, icon: Zap },
                 { label: 'Taux de recyclage plastique', val: 40, icon: Recycle },
                 { label: 'Sensibilisation scolaire', val: 65, icon: GraduationCap },
                 { label: 'Collecte temps réel (Gombe)', val: 95, icon: Truck },
               ].map((obj, i) => (
                 <div key={i} className="space-y-3">
                   <div className="flex justify-between items-end">
                      <span className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><obj.icon size={16}/> {obj.label}</span>
                      <span className="text-2xl font-black">{obj.val}%</span>
                   </div>
                   <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${obj.val}%` }}></div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Contact Section */}
      <section id="contact" className="py-32 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white dark:bg-gray-900 rounded-[4rem] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-gray-100 dark:border-gray-800">
             <div className="p-12 lg:p-20 space-y-12">
                <div>
                  <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">Contactez-nous</h2>
                  <p className="text-gray-500 font-medium italic">"Biso Peto, pour un Kinshasa plus fort et plus propre."</p>
                </div>

                <div className="space-y-8">
                   <div className="flex items-center gap-6 group">
                      <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Mail size={24}/></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Emails</p>
                        <p className="text-base font-black dark:text-white">contact@bisopeto.com</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-6 group">
                      <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Phone size={24}/></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Téléphone (WhatsApp)</p>
                        <p className="text-base font-black dark:text-white">+243 85 229 1755</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-6 group">
                      <div className="w-14 h-14 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><MapPin size={24}/></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Siège Social</p>
                        <p className="text-base font-black dark:text-white">N°63, Av. Colonel MONDJIBA</p>
                        <p className="text-xs text-gray-400 font-bold uppercase">Kinshasa / Gombe - RDC</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-gray-900 p-12 lg:p-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-white"><Rocket size={200}/></div>
                {isSent ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-scale-up">
                      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl"><Check size={40} strokeWidth={3}/></div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight">Message Envoyé !</h3>
                      <p className="text-gray-400 font-medium">Merci pour votre intérêt. Notre équipe commerciale vous contactera sous 24h.</p>
                      <button onClick={() => setIsSent(false)} className="text-primary text-xs font-black uppercase tracking-widest underline underline-offset-4">Envoyer un autre</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nom complet *</label>
                        <input required className="w-full bg-gray-800 border-none text-white p-5 rounded-2xl focus:ring-2 ring-primary outline-none font-bold" placeholder="Nom ou Entreprise" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email professionnel *</label>
                        <input required type="email" className="w-full bg-gray-800 border-none text-white p-5 rounded-2xl focus:ring-2 ring-primary outline-none font-bold" placeholder="votre@email.com" value={formState.email} onChange={e => setFormState({...formState, email: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Message *</label>
                        <textarea required rows={4} className="w-full bg-gray-800 border-none text-white p-5 rounded-2xl focus:ring-2 ring-primary outline-none font-bold resize-none" placeholder="Comment pouvons-nous vous aider ?" value={formState.message} onChange={e => setFormState({...formState, message: e.target.value})} />
                    </div>
                    <button disabled={isSending} className="w-full py-5 bg-primary hover:bg-primary-light text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50">
                      {isSending ? <Loader2 className="animate-spin" size={24}/> : <><Send size={20}/> Envoyer</>}
                    </button>
                  </form>
                )}
             </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-gray-900 text-white pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 lg:col-span-2 space-y-8">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl p-2">
                    <img src={appLogo} className="w-full h-full object-contain" alt="Logo"/>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter">BISO PETO</h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">KIN ECO-MAP SYSTEM</p>
                  </div>
               </div>
               <p className="text-gray-400 font-medium leading-relaxed max-w-sm">
                 Solution leader pour la digitalisation de la gestion des déchets et de l'assainissement urbain en République Démocratique du Congo.
               </p>
               <div className="bg-white/5 border border-white/10 p-5 rounded-3xl space-y-2">
                  <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Identité Légale</p>
                  <p className="text-[10px] font-bold text-gray-300 uppercase leading-none">BISO PETO Group SARL</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">CD/KNM/RCCM/25-B-01937</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">ID.NAT. 01-S9502-N76752K</p>
               </div>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-10">Navigation</h4>
              <ul className="space-y-4 font-black uppercase text-[10px] tracking-widest text-gray-400">
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleSmoothScroll('about')}>À Propos</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleSmoothScroll('modules')}>Solutions</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleSmoothScroll('objectives')}>Impact</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => handleSmoothScroll('contact')}>Contact</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-10">App</h4>
              <ul className="space-y-4 font-black uppercase text-[10px] tracking-widest text-gray-400">
                <li className="hover:text-white cursor-pointer transition-colors" onClick={onLogin}>Mon Compte</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={onStart}>Eco Citoyen</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={onStart}>Eco Entreprise</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={onStart}>Academy</li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">© 2025 BISO PETO Group SARL - KIN ECO-MAP. Tous droits réservés.</p>
            <div className="flex items-center gap-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white cursor-pointer transition-colors">Confidentialité</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white cursor-pointer transition-colors">Mentions Légales</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
