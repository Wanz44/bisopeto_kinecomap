import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ArrowRight, Home, Building2, Truck, GraduationCap, 
  Target, Eye, CheckCircle2, Leaf, Mail, Phone, MapPin, 
  Clock, Send, Rocket, Menu, X, Globe, Star, PieChart,
  Sparkles, Smartphone, Loader2, Info, MessageSquare, ShieldCheck,
  Zap, Award, Users, Trash2, Download, MousePointer2, BarChart3,
  // Added missing Recycle icon used on line 290
  Recycle
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSmoothScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
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
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setFormState({ name: '', email: '', message: '' });
      alert("Merci ! Votre message a été envoyé à l'équipe BISO PETO.");
    }, 1500);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-white dark:bg-[#050505] text-gray-800 dark:text-gray-200 no-scrollbar selection:bg-primary selection:text-white">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        isScrolled 
        ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl shadow-lg py-3' 
        : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center p-2 shadow-xl group-hover:rotate-12 transition-transform">
              <img src="logobisopeto.png" alt="BISO PETO" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter text-primary dark:text-white leading-none">BISO PETO</span>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">KIN ECO-MAP</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            {['about', 'modules', 'objectives', 'contact'].map((item) => (
              <button 
                key={item}
                onClick={() => handleSmoothScroll(item)}
                className="text-sm font-black uppercase tracking-widest text-gray-500 hover:text-primary transition-colors"
              >
                {item === 'about' ? 'À Propos' : item === 'objectives' ? 'Objectifs' : item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onLogin} className="hidden sm:block text-sm font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:text-primary">Connexion</button>
            <button 
              onClick={onStart}
              className="bg-primary hover:bg-primary-light text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-green-500/20 active:scale-95 transition-all"
            >
              Lancer l'App
            </button>
            <button className="lg:hidden p-2 text-primary" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[110] bg-white dark:bg-gray-950 flex flex-col p-8 animate-fade-in lg:hidden">
          <div className="flex justify-between items-center mb-12">
            <span className="font-black text-2xl text-primary">MENU</span>
            <button onClick={() => setIsMenuOpen(false)}><X size={32}/></button>
          </div>
          <div className="flex flex-col gap-8">
            {['about', 'modules', 'objectives', 'contact'].map((item) => (
              <button key={item} onClick={() => handleSmoothScroll(item)} className="text-4xl font-black uppercase tracking-tighter text-left hover:text-primary transition-colors">
                {item === 'about' ? 'À Propos' : item}
              </button>
            ))}
          </div>
          <button onClick={onLogin} className="mt-auto w-full py-6 bg-gray-100 dark:bg-gray-800 rounded-3xl font-black uppercase tracking-widest">Se Connecter</button>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 md:pt-64 md:pb-40 overflow-hidden">
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
              <button onClick={() => handleSmoothScroll('contact')} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-2 border-gray-100 dark:border-gray-700 px-10 py-5 rounded-3xl font-black text-lg uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3">
                Nous contacter <Mail size={24} />
              </button>
            </div>

            <div className="mt-16 flex items-center gap-8 grayscale opacity-50">
              <div className="flex flex-col">
                <span className="text-2xl font-black">5000+</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Utilisateurs</span>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="flex flex-col">
                <span className="text-2xl font-black">120+</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Quartiers</span>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="flex flex-col">
                <span className="text-2xl font-black">85%</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Satisfaction</span>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in hidden lg:block">
            <div className="relative z-10 w-full aspect-square rounded-[4rem] overflow-hidden shadow-2xl border-[12px] border-white dark:border-gray-800 rotate-3">
              <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=80" alt="KIN ECO-MAP" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-10 -right-10 z-20 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl animate-float border border-gray-50 dark:border-gray-800">
               <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/30 text-primary rounded-2xl"><Award size={24}/></div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase">Impact Environnemental</p>
                    <p className="text-lg font-black dark:text-white leading-none mt-1">Leader en RDC</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <div className="h-1.5 flex-1 bg-green-100 rounded-full overflow-hidden"><div className="h-full bg-primary w-[85%]"></div></div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 bg-gray-50 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl"><Target size={32} /></div>
                    <h4 className="text-xl font-black uppercase tracking-tight">Notre Mission</h4>
                  </div>
                  <p className="text-base text-gray-500 leading-relaxed font-medium">
                    KIN ECO-MAP est une plateforme numérique complète qui centralise la gestion intelligente des déchets, combinant cartographie interactive, éducation environnementale et engagement communautaire.
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-secondary/10 text-secondary rounded-2xl"><Eye size={32} /></div>
                    <h4 className="text-xl font-black uppercase tracking-tight">Notre Vision</h4>
                  </div>
                  <p className="text-base text-gray-500 leading-relaxed font-medium">
                    Créer des villes africaines plus propres, plus vertes et plus durables grâce à l'innovation technologique et à la mobilisation citoyenne.
                  </p>
                </div>
            </div>

            <div className="order-1 lg:order-2 space-y-8 animate-fade-in-up">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">À propos de KIN ECO-MAP</h2>
              <div className="w-20 h-2 bg-primary rounded-full"></div>
              <p className="text-xl text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                Une initiative portée par **BISO PETO Group SARL** pour transformer radicalement la gestion des déchets à Kinshasa.
              </p>
              <div className="space-y-4">
                {[
                  "Digitalisation complète de la chaîne de collecte",
                  "Sensibilisation écologique interactive",
                  "Données en temps réel pour une ville intelligente"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="p-1 bg-green-100 text-primary rounded-full"><CheckCircle2 size={18} /></div>
                    <span className="font-bold text-gray-600 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest">
                  <Leaf size={16} /> Éco-innovation made in Congo
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-32">
        <div className="max-w-7xl mx-auto px-6 text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6">Nos Modules</h2>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-medium">Des fonctionnalités complètes pour une gestion optimale des déchets à Kinshasa.</p>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { id: '1', title: 'Éco-Citoyen', icon: Home, color: 'bg-green-50 text-primary', desc: 'Gérez vos abonnements, suivez les collectes et participez à la propreté urbaine.', features: ['Profil citoyen digital', 'Carte interactive', 'Paiement sécurisé'] },
             { id: '2', title: 'Éco-Entreprise', icon: Building2, color: 'bg-blue-50 text-secondary', desc: 'Optimisez votre impact environnemental et votre gestion des déchets.', features: ['Tableau de bord analytique', 'Certification RSE', 'Reporting environnemental'] },
             { id: '3', title: 'Collecte & Logistique', icon: Truck, color: 'bg-orange-50 text-orange-600', desc: 'Optimisez vos opérations de collecte avec notre outil de gestion terrain.', features: ['Planification intelligente', 'Suivi GPS temps réel', 'Gestion des incidents'] },
             { id: '4', title: 'Éducation & Formation', icon: GraduationCap, color: 'bg-purple-50 text-purple-600', desc: 'Sensibilisez et formez vos équipes aux bonnes pratiques environnementales.', features: ['Cours vidéo interactifs', 'Quiz et certifications', 'Programmes scolaires'] },
           ].map((mod) => (
             <div key={mod.id} className="group p-8 rounded-[3rem] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all hover:-translate-y-2 flex flex-col">
                <div className={`w-16 h-16 ${mod.color} rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform`}>
                  <mod.icon size={32}/>
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">{mod.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">{mod.desc}</p>
                <div className="space-y-2 mb-8">
                  {mod.features.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                      <div className="w-1 h-1 bg-primary rounded-full"></div> {f}
                    </div>
                  ))}
                </div>
                <button onClick={onStart} className="mt-auto text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">Démarrer <ArrowRight size={14}/></button>
             </div>
           ))}
        </div>
      </section>

      {/* Objectives / Impact */}
      <section id="objectives" className="py-32 bg-primary text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="grid grid-cols-10 gap-10">
            {Array.from({length: 100}).map((_, i) => <Star key={i} size={20}/>)}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-end gap-12 mb-24">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none mb-8">Nos Objectifs</h2>
              <p className="text-xl opacity-80 font-medium">Les ambitions qui guident notre action quotidienne pour un Kinshasa durable.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
             {[
               { title: 'Responsabilité écologique', desc: 'Sensibiliser et impliquer citoyens et entreprises.', percent: 85, icon: Recycle },
               { title: 'Digitalisation', desc: 'Moderniser la chaîne complète grâce au numérique.', percent: 70, icon: Smartphone },
               { title: 'Éducation environnementale', desc: 'Développer une culture durable par les savoirs.', percent: 65, icon: GraduationCap },
               { title: 'Performance urbaine', desc: 'Améliorer la qualité de vie des Kinois.', percent: 60, icon: BarChart3 },
             ].map((obj, i) => (
               <div key={i} className="p-8 rounded-[3rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col h-full">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                    <obj.icon size={24} />
                  </div>
                  <h4 className="text-xl font-black mb-4 uppercase tracking-tight leading-tight">{obj.title}</h4>
                  <p className="text-sm opacity-70 leading-relaxed font-medium mb-8">{obj.desc}</p>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                      <span>Progrès</span>
                      <span>{obj.percent}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-white transition-all duration-1000" style={{ width: `${obj.percent}%` }}></div>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white dark:bg-gray-900 rounded-[4rem] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
             <div className="p-12 lg:p-20 space-y-12">
                <div>
                  <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">Contactez-nous</h2>
                  <p className="text-gray-500 font-medium">Parlons de votre projet, de vos besoins ou d'un signalement urgent.</p>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center gap-6 group cursor-pointer">
                      <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all"><Mail size={24}/></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Emails</p>
                        <p className="text-base font-black dark:text-white">contact@bisopeto.com</p>
                        <p className="text-xs text-gray-400 font-bold">support@kin-ecomap.com</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-6 group cursor-pointer">
                      <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 text-secondary rounded-2xl flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all"><Phone size={24}/></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Téléphones</p>
                        <p className="text-base font-black dark:text-white">+243 85 229 1755</p>
                        <p className="text-xs text-gray-400 font-bold">+243 81 234 5678</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-6 group cursor-pointer">
                      <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 text-red-500 rounded-2xl flex items-center justify-center group-hover:bg-red-50 group-hover:text-white transition-all"><MapPin size={24}/></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Siège Social</p>
                        <p className="text-base font-black dark:text-white">N°63, Av. Colonel MONDJIBA</p>
                        <p className="text-xs text-gray-400 font-bold">Kinshasa, Gombe - RDC</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-6 group cursor-pointer">
                      <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 text-orange-500 rounded-2xl flex items-center justify-center group-hover:bg-orange-50 group-hover:text-white transition-all"><Clock size={24}/></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Heures d'ouverture</p>
                        <p className="text-base font-black dark:text-white">Lun - Ven: 8h - 18h</p>
                        <p className="text-xs text-gray-400 font-bold">Sam: 9h - 13h</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-gray-900 p-12 lg:p-20">
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nom complet *</label>
                      <input 
                        required
                        className="w-full bg-gray-800 border-none text-white p-5 rounded-2xl focus:ring-2 ring-primary outline-none font-bold" 
                        placeholder="Jean-Pierre Kabeya"
                        value={formState.name}
                        onChange={e => setFormState({...formState, name: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email professionnel *</label>
                      <input 
                        required
                        type="email"
                        className="w-full bg-gray-800 border-none text-white p-5 rounded-2xl focus:ring-2 ring-primary outline-none font-bold" 
                        placeholder="kabeya@entreprise.cd"
                        value={formState.email}
                        onChange={e => setFormState({...formState, email: e.target.value})}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Message *</label>
                      <textarea 
                        required
                        rows={4}
                        className="w-full bg-gray-800 border-none text-white p-5 rounded-2xl focus:ring-2 ring-primary outline-none font-bold resize-none" 
                        placeholder="Expliquez-nous votre besoin..."
                        value={formState.message}
                        onChange={e => setFormState({...formState, message: e.target.value})}
                      />
                   </div>
                   <button 
                    disabled={isSending}
                    className="w-full py-5 bg-primary hover:bg-primary-light text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-green-500/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                   >
                     {isSending ? <Loader2 className="animate-spin" size={24}/> : <><Send size={20}/> Envoyer le message</>}
                   </button>
                </form>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-20 pb-12 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 lg:col-span-2 space-y-8">
               <div className="flex items-center gap-4">
                  <img src="logobisopeto.png" className="w-16 h-16 brightness-0 invert" alt="Logo"/>
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter">BISO PETO</h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">KIN ECO-MAP</p>
                  </div>
               </div>
               <p className="text-gray-400 font-medium leading-relaxed max-w-sm">
                 Leader dans la digitalisation de la gestion des déchets et la promotion de l'écologie urbaine en République Démocratique du Congo.
               </p>
               <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
                  <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Identifiants légaux</p>
                  <p className="text-[10px] font-bold text-gray-300 uppercase">CD/KNM/RCCM/25-B-01937</p>
                  <p className="text-[10px] font-bold text-gray-300 uppercase">Id.Nat.01-S9502-N76752K | A2537519K</p>
               </div>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-10">Navigation</h4>
              <ul className="space-y-4 font-black uppercase text-[10px] tracking-widest text-gray-400">
                <li className="hover:text-white cursor-pointer" onClick={() => handleSmoothScroll('about')}>À Propos</li>
                <li className="hover:text-white cursor-pointer" onClick={() => handleSmoothScroll('modules')}>Modules</li>
                <li className="hover:text-white cursor-pointer" onClick={() => handleSmoothScroll('objectives')}>Objectifs</li>
                <li className="hover:text-white cursor-pointer" onClick={() => handleSmoothScroll('contact')}>Contact</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-10">Communauté</h4>
              <ul className="space-y-4 font-black uppercase text-[10px] tracking-widest text-gray-400">
                <li className="hover:text-white cursor-pointer">Éco-Citoyen</li>
                <li className="hover:text-white cursor-pointer">Éco-Entreprise</li>
                <li className="hover:text-white cursor-pointer">Marketplace</li>
                <li className="hover:text-white cursor-pointer">Eco Academy</li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">© 2025 BISO PETO Group SARL - KIN ECO-MAP. Tous droits réservés.</p>
            <div className="flex items-center gap-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white cursor-pointer">Confidentialité</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white cursor-pointer">Mentions Légales</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
