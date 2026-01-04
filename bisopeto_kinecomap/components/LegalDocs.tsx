
import React from 'react';
import { X, Shield, Scale, Lock, AlertTriangle, ShieldAlert } from 'lucide-react';

interface LegalDocsProps {
    isOpen: boolean;
    type: 'terms' | 'privacy' | null;
    onClose: () => void;
}

export const LegalDocs: React.FC<LegalDocsProps> = ({ isOpen, type, onClose }) => {
    if (!isOpen || !type) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl relative z-10 flex flex-col animate-scale-up border border-gray-100 dark:border-gray-800">
                
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-t-3xl z-20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-[#2962FF] rounded-xl">
                            {type === 'terms' ? <Scale size={24} /> : <Shield size={24} />}
                        </div>
                        <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">
                            {type === 'terms' ? "Contrat d'Utilisation & Modération" : "Sécurité & Confidentialité"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 text-sm text-gray-600 dark:text-gray-300 leading-relaxed space-y-8 text-justify no-scrollbar">
                    
                    {type === 'terms' ? (
                        <>
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-5 rounded-2xl flex items-start gap-4">
                                <AlertTriangle className="text-red-500 shrink-0 mt-1" size={24} />
                                <div>
                                    <h4 className="font-black text-red-600 dark:text-red-400 uppercase text-xs tracking-widest mb-1">Clause Fondamentale : Aucun Remboursement</h4>
                                    <p className="text-[11px] text-red-500/90 dark:text-red-400/80 font-bold">
                                        Les abonnements payés sont définitifs. Aucun remboursement ne sera effectué en cas de déménagement ou de suspension de compte pour faute grave.
                                    </p>
                                </div>
                            </div>

                            <section>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">1. Politique de Modération</h3>
                                <p className="mb-4">
                                    L'Application KIN ECO-MAP est un outil d'intérêt public. Pour garantir l'efficacité des services de collecte, l'Utilisateur s'engage à respecter les règles de conduite suivantes :
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex gap-3 items-start">
                                        <div className="mt-1"><ShieldAlert size={16} className="text-orange-500" /></div>
                                        <p><strong>Zéro Fausse Alerte :</strong> Tout signalement de déchets fictif ou malveillant entraînera une suspension immédiate du compte pour une durée de 30 jours. En cas de récidive, le bannissement sera définitif.</p>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="mt-1"><ShieldAlert size={16} className="text-orange-500" /></div>
                                        <p><strong>Respect des Agents :</strong> Toute agression verbale ou physique envers un collecteur BISO PETO sur le terrain est strictement interdite et fera l'objet de poursuites judiciaires.</p>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="mt-1"><ShieldAlert size={16} className="text-orange-500" /></div>
                                        <p><strong>Contenu Marketplace :</strong> Les annonces publiées sur le marché circulaire doivent concerner exclusivement des matières recyclables ou des objets d'occasion. Les contenus illicites ou hors-sujet sont supprimés sans préavis.</p>
                                    </li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">2. Abonnements & Services</h3>
                                <p>
                                    L'accès à la collecte nécessite un abonnement actif. L'Utilisateur doit assurer l'accessibilité de ses déchets aux horaires prévus. KIN ECO-MAP ne peut être tenue responsable des retards causés par des embouteillages majeurs ou inondations à Kinshasa.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">3. Litiges</h3>
                                <p>
                                    Les présentes conditions sont régies par le droit congolais (RDC). En cas de désaccord persistant, les tribunaux de Kinshasa/Gombe sont seuls compétents.
                                </p>
                            </section>
                        </>
                    ) : (
                        <>
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-5 rounded-2xl flex items-start gap-4">
                                <Lock className="text-blue-500 shrink-0 mt-1" size={24} />
                                <div>
                                    <h4 className="font-black text-blue-600 dark:text-blue-400 uppercase text-xs tracking-widest mb-1">Protection de l'Identité Numérique</h4>
                                    <p className="text-[11px] text-blue-500/90 dark:text-blue-400/80 font-bold">
                                        Vos données de géolocalisation et vos numéros de téléphone sont chiffrés et ne sont jamais partagés à des tiers publicitaires.
                                    </p>
                                </div>
                            </div>

                            <section>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">1. Collecte des Données</h3>
                                <p>
                                    Nous collectons les données strictement nécessaires au fonctionnement du SIG (Système d'Information Géographique) :
                                </p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-500 dark:text-gray-400">
                                    <li><strong>Coordonnées GPS :</strong> Pour localiser votre bac à déchets.</li>
                                    <li><strong>Identité :</strong> Pour la facturation et le suivi KYC.</li>
                                    <li><strong>Historique de Recyclage :</strong> Pour le calcul de vos points Eco.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">2. Utilisation & Consentement</h3>
                                <p>
                                    En cochant la case facultative lors de l'inscription, vous autorisez l'envoi de rapports d'impact mensuels et d'offres partenaires sur votre adresse e-mail. Vous pouvez révoquer ce consentement à tout moment dans vos paramètres.
                                </p>
                            </section>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-3xl">
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-[#2962FF] hover:bg-blue-700 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                        J'ai bien compris
                    </button>
                </div>
            </div>
        </div>
    );
};
