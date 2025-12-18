
import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, ArrowRight, Home, Building2, Truck, GraduationCap, 
  Target, Eye, CheckCircle2, Leaf, Mail, Phone, MapPin, 
  Clock, Send, Rocket, Menu, X, Globe, Star, PieChart,
  Sparkles, Smartphone, Loader2, ChevronUp, MessageSquare
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isNewsletterSending, setIsNewsletterSending] = useState(false);

  // Scroll Listener for Header & Back to top
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setIsMenuOpen(false);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
        alert("Veuillez entrer une adresse email valide.");
        return;
    }
    setIsNewsletterSending(true);
    setTimeout(() => {
        alert("Merci pour votre inscription à la newsletter !");
        setNewsletterEmail('');
        setIsNewsletterSending(false);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) {
        alert("Veuillez remplir les champs obligatoires (*)");
        return;
    }
    setIsSending(true);
    // Simulation d'envoi
    setTimeout(() => {
      setIsSending(false);
      alert("Merci ! Votre message a été envoyé à l'équipe BISO PETO.");
      setFormState({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 1500);
  };

  const navLinks = [
    { label: 'À propos', id: 'about' },
    { label: 'Modules', id: 'modules' },
    { label: 'Objectifs', id: 'objectives' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-white dark:bg-[#050505] text-gray-800 dark:text-gray-200 scroll-smooth selection:bg-[#00C853] selection:text-white font-sans no-scrollbar">
      
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isScrolled ? 'bg-white/95 dark:bg-[#050505]/95 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'
      }`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-gradient-to-br from-[#00C853] to-[#2962FF] rounded-xl flex items-center justify-center p-0.5 shadow-lg group-hover:rotate-12 transition-transform">
              <div className="bg-white dark:bg-black w-full h-full rounded-[10px] flex items-center justify-center overflow-hidden">
                <img src="logobisopeto.png" alt="Logo" className="w-7 h-7 object-contain" />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className={`font-black text-xl tracking-tighter ${isScrolled ? 'text-gray-900 dark:text-white' : 'text-white md:text-gray-900 md:dark:text-white'}`}>BISO PETO</span>
              <span className="font-bold text-[10px] tracking-widest text-[#2962FF]">KIN ECO-MAP</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a 
                key={link.id} 
                href={`#${link.id}`} 
                onClick={(e) => handleSmoothScroll(e, link.id)}
                className={`text-sm font-bold transition-colors hover:text-[#00C853] ${isScrolled ? 'text-gray-600 dark:text-gray-300' : 'text-white md:text-gray-600 md:dark:text-gray-300'}`}
              >
                {link.label}
              </a>
            ))}
            <button 
              onClick={onLogin}
              className="bg-[#00C853] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Se Connecter
            </button>
          </nav>

          <button className="md:hidden p-2 text-[#00C853]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-[#111827] border-t border-gray-100 dark:border-gray-800 shadow-2xl animate-fade-in flex flex-col p-6 space-y-4 md:hidden">
            {navLinks.map(link => (
              <a key={link.id} href={`#${link.id}`} onClick={(e) => handleSmoothScroll(e, link.id)} className="text-lg font-bold text-gray-700 dark:text-gray-200 hover:text-[#00C853]">{link.label}</a>
            ))}
            <button onClick={onLogin} className="w-full bg-[#00C853] text-white py-4 rounded-2xl font-black text-lg shadow-lg">Se Connecter</button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-br from-[#00C853]/5 to-[#2962FF]/5 dark:from-[#00C853]/10 dark:to-[#2962FF]/10 -z-10"></div>
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6">
              <Sparkles size={14} /> Innovation RDC
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mb-6">KIN ECO-MAP</h1>
            <p className="text-xl md:text-2xl font-bold text-[#00C853] mb-4">Votre ville plus propre, votre avenir plus vert</p>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-xl leading-relaxed font-medium">Une plateforme numérique innovante pour transformer la gestion des déchets, l'assainissement urbain et promouvoir l'écologie citoyenne à Kinshasa.</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={onStart} className="bg-[#00C853] text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-green-500/30 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all"><Rocket size={20} /> Commencer</button>
              <button onClick={(e) => handleSmoothScroll(e, 'contact')} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-100 dark:border-gray-700 px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"><Mail size={20} /> Nous contacter</button>
            </div>
            <div className="mt-16 grid grid-cols-3 gap-8 pt-10 border-t border-gray-100 dark:border-gray-800">
              <div><span className="block text-3xl font-black text-gray-900 dark:text-white">5000+</span><span className="text-xs uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Utilisateurs</span></div>
              <div><span className="block text-3xl font-black text-gray-900 dark:text-white">120+</span><span className="text-xs uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Quartiers</span></div>
              <div><span className="block text-3xl font-black text-gray-900 dark:text-white">85%</span><span className="text-xs uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Satisfaction</span></div>
            </div>
          </div>
          <div className="relative hidden lg:block animate-fade-in">
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white dark:border-gray-800">
              <img src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80" alt="Kinshasa Green" className="w-full h-auto scale-105 hover:scale-100 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-6 text-center max-w-3xl mb-20">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">À propos de KIN ECO-MAP</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-medium leading-relaxed">Une initiative portée par <span className="text-[#00C853] font-bold">BISO PETO Group SARL</span> pour transformer radicalement la gestion des déchets à Kinshasa.</p>
        </div>
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-[#2962FF] rounded-2xl flex items-center justify-center mb-6"><Target size={32} /></div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Notre Mission</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">KIN ECO-MAP est une plateforme numérique complète qui centralise la gestion intelligente des déchets, combinant cartographie interactive, éducation environnementale et engagement communautaire.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 text-[#00C853] rounded-2xl flex items-center justify-center mb-6"><Eye size={32} /></div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Notre Vision</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Créer des villes africaines plus propres, plus vertes et plus durables grâce à l'innovation technologique et à la mobilisation citoyenne massive.</p>
            </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-24 bg-white dark:bg-[#050505]">
        <div className="container mx-auto px-6 text-center max-w-3xl mb-20">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Nos Modules</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">Des solutions adaptées à chaque acteur de la ville</p>
        </div>
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Home, title: 'Éco-Citoyen', color: 'text-[#00C853]', bg: 'bg-green-50 dark:bg-green-900/20', features: ['Profil digital', 'Carte interactive', 'Paiement Mobile'] },
              { icon: Building2, title: 'Éco-Entreprise', color: 'text-[#2962FF]', bg: 'bg-blue-50 dark:bg-blue-900/20', features: ['Dashboard analytique', 'Certification', 'Reporting'] },
              { icon: Truck, title: 'Logistique', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', features: ['Planification IA', 'Télémétrie', 'Rapports'] },
              { icon: GraduationCap, title: 'Éducation', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', features: ['Cours Vidéo', 'Quiz & Badges', 'Certification'] },
            ].map((module, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-8 rounded-[2.5rem] border border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-750 hover:shadow-xl transition-all group">
                <div className={`w-14 h-14 ${module.bg} ${module.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}><module.icon size={28} /></div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">{module.title}</h3>
                <ul className="space-y-3 mb-8">
                  {module.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400"><CheckCircle2 size={14} className={module.color} /> {f}</li>
                  ))}
                </ul>
                <button onClick={onStart} className={`flex items-center gap-2 text-sm font-black uppercase tracking-wider ${module.color}`}>S'inscrire <ArrowRight size={16} /></button>
              </div>
            ))}
        </div>
      </section>

      {/* Objectives Section */}
      <section id="objectives" className="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-center max-w-3xl mb-20">
          <h2 className="text-4xl font-black mb-4 tracking-tight">Nos Objectifs</h2>
          <p className="text-lg text-gray-400 font-medium">Les ambitions qui guident notre action quotidienne</p>
        </div>
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Responsabilité', value: 85, icon: Leaf, color: 'bg-[#00C853]' },
              { label: 'Digitalisation', value: 70, icon: Smartphone, color: 'bg-[#2962FF]' },
              { label: 'Éducation', value: 65, icon: GraduationCap, color: 'bg-purple-500' },
              { label: 'Performance', value: 60, icon: PieChart, color: 'bg-orange-500' },
            ].map((obj, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/10">
                <div className="flex justify-between items-start mb-8"><div className="p-3 bg-white/10 rounded-xl"><obj.icon size={24} /></div><span className="text-2xl font-black opacity-40">{obj.value}%</span></div>
                <h4 className="font-bold text-lg mb-4">{obj.label}</h4>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className={`h-full ${obj.color} transition-all duration-1000`} style={{ width: `${obj.value}%` }}></div></div>
              </div>
            ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-white dark:bg-[#050505]">
        <div className="container mx-auto px-6 text-center max-w-3xl mb-20">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Contactez-nous</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">Parlons de votre projet et de vos besoins</p>
        </div>
        <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-[2rem] flex gap-6"><MapPin size={24} className="text-blue-600" /><div><h4 className="font-black text-lg dark:text-white">Adresse</h4><p className="text-gray-500 dark:text-gray-400 text-sm">N°63, Av. Colonel MONDJIBA, Kinshasa</p></div></div>
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-[2rem] flex gap-6"><Phone size={24} className="text-green-600" /><div><h4 className="font-black text-lg dark:text-white">Téléphone</h4><p className="text-gray-500 dark:text-gray-400 text-sm">+243 85 229 1755</p></div></div>
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[3rem] p-10 border border-gray-100 dark:border-gray-700 shadow-2xl">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3"><MessageSquare size={28} className="text-[#2962FF]" /> Envoyer un message</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input required placeholder="Nom complet *" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-[#00C853] border border-transparent dark:text-white focus:border-[#00C853]" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                  <input required type="email" placeholder="Email *" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-[#00C853] border border-transparent dark:text-white focus:border-[#00C853]" value={formState.email} onChange={e => setFormState({...formState, email: e.target.value})} />
                </div>
                <textarea required rows={4} placeholder="Votre message *" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 outline-none focus:ring-2 focus:ring-[#00C853] border border-transparent dark:text-white focus:border-[#00C853] resize-none" value={formState.message} onChange={e => setFormState({...formState, message: e.target.value})} />
                <button disabled={isSending} type="submit" className="w-full py-5 bg-[#00C853] text-white rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">{isSending ? <Loader2 className="animate-spin" /> : <Send size={20} />} {isSending ? 'Envoi...' : 'Envoyer'}</button>
              </form>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white pt-20 pb-10">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-3"><img src="./logobisopeto.png" alt="Logo" className="w-12 h-12" /><h3 className="font-black text-2xl text-[#00C853]">BISO PETO</h3></div>
              <p className="text-gray-500 font-medium">Leader dans la digitalisation de la gestion des déchets à Kinshasa.</p>
            </div>
            <div>
              <h4 className="font-black text-lg mb-8 uppercase text-white/50">Navigation</h4>
              <ul className="space-y-3">
                {navLinks.map(link => (
                  <li key={link.id}>
                    <button 
                      onClick={(e) => handleSmoothScroll(e, link.id)} 
                      className="text-gray-400 hover:text-[#00C853] transition-colors font-bold text-sm"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div><h4 className="font-black text-lg mb-8 uppercase text-white/50">Newsletter</h4>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input type="email" placeholder="Votre email" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex-1 text-sm outline-none focus:border-[#00C853] transition-colors" value={newsletterEmail} onChange={e => setNewsletterEmail(e.target.value)} />
                <button className="bg-[#00C853] p-3 rounded-xl hover:bg-green-600 transition-colors">{isNewsletterSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}</button>
              </form>
            </div>
        </div>
      </footer>

      {/* Back to Top */}
      {isScrolled && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-10 right-10 z-[110] bg-[#00C853] text-white p-4 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all">
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  );
};
