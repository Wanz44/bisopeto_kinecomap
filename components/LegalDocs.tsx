
import React from 'react';
import { X, FileText, Shield, Scale, Lock, AlertTriangle } from 'lucide-react';

interface LegalDocsProps {
    isOpen: boolean;
    type: 'terms' | 'privacy' | null;
    onClose: () => void;
}

export const LegalDocs: React.FC<LegalDocsProps> = ({ isOpen, type, onClose }) => {
    if (!isOpen || !type) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white dark:bg-gray-900 w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl relative z-10 flex flex-col animate-fade-in-up">
                
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur rounded-t-3xl z-20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-[#2962FF] rounded-xl">
                            {type === 'terms' ? <Scale size={24} /> : <Shield size={24} />}
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                            {type === 'terms' ? "Conditions Générales d'Utilisation" : "Politique de Confidentialité & Sécurité"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed space-y-8 text-justify">
                    
                    {type === 'terms' ? (
                        <>
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <h4 className="font-bold text-red-600 dark:text-red-400 mb-1">Clause Importante : Non-Remboursement</h4>
                                    <p className="text-xs text-red-500/90 dark:text-red-400/80">
                                        En souscrivant à nos services, vous reconnaissez expressément que <strong>les abonnements payés ne sont JAMAIS remboursables</strong>, en totalité ou en partie, quelle que soit la raison (insatisfaction, déménagement, erreur de manipulation, ou suspension de compte pour non-respect des règles).
                                    </p>
                                </div>
                            </div>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">1. Préambule et Acceptation</h3>
                                <p>
                                    Les présentes Conditions Générales d'Utilisation (ci-après "CGU") régissent l'intégralité des services fournis par l'application KIN ECO-MAP (ci-après "l'Application"), opérant sur le territoire de la République Démocratique du Congo, spécifiquement à Kinshasa.
                                </p>
                                <p className="mt-2">
                                    En téléchargeant, installant ou utilisant l'Application, vous (ci-après "l'Utilisateur") acceptez sans réserve d'être lié par les termes du présent contrat. Si vous n'acceptez pas ces termes, veuillez désinstaller l'Application immédiatement.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">2. Description des Services</h3>
                                <p>
                                    KIN ECO-MAP est une plateforme technologique de mise en relation entre des générateurs de déchets (ménages, entreprises) et des opérateurs de collecte agréés. L'Application propose :
                                </p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-500 dark:text-gray-400">
                                    <li>La planification de collectes de déchets ménagers et industriels.</li>
                                    <li>Le suivi en temps réel des véhicules de collecte.</li>
                                    <li>Un système de paiement électronique intégré.</li>
                                    <li>Un module éducatif sur l'écologie.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">3. Abonnements et Paiements</h3>
                                <p>
                                    L'accès aux services de collecte nécessite la souscription à un abonnement (Standard, Plus, Premium ou Spécial).
                                </p>
                                <ul className="list-disc pl-5 mt-2 space-y-2 text-gray-500 dark:text-gray-400">
                                    <li><strong>Modes de Paiement :</strong> Les paiements sont acceptés via Mobile Money (M-Pesa, Orange Money, Airtel Money, Africell) et Carte Bancaire (Visa/Mastercard).</li>
                                    <li><strong>Validité :</strong> L'abonnement est valide pour une période de 30 jours à compter de la date de paiement.</li>
                                    <li>
                                        <strong>Politique de Non-Remboursement Stricte :</strong> KIN ECO-MAP applique une politique de tolérance zéro concernant les remboursements. Une fois la transaction validée par l'opérateur de paiement, les fonds sont considérés comme définitivement acquis par KIN ECO-MAP pour couvrir les frais opérationnels, logistiques et administratifs engagés dès l'activation du compte. Aucune exception ne sera accordée.
                                    </li>
                                    <li><strong>Retard de Paiement :</strong> Tout retard de paiement supérieur à 3 jours entraînera la suspension immédiate des services de collecte jusqu'à régularisation.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">4. Obligations de l'Utilisateur</h3>
                                <p>L'Utilisateur s'engage à :</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-500 dark:text-gray-400">
                                    <li>Fournir des informations exactes lors de l'inscription (localisation GPS, téléphone).</li>
                                    <li>Trier ses déchets conformément aux directives de l'Application (séparation plastique, organique, verre).</li>
                                    <li>Ne pas déposer de déchets dangereux (toxiques, médicaux, explosifs) dans les bacs standards.</li>
                                    <li>Assurer l'accessibilité de ses poubelles aux collecteurs aux horaires prévus.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">5. Limitation de Responsabilité</h3>
                                <p>
                                    KIN ECO-MAP agit en tant qu'intermédiaire. Nous ne saurions être tenus responsables des dommages directs ou indirects résultant de :
                                </p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-500 dark:text-gray-400">
                                    <li>Retards de collecte dus à des cas de force majeure (inondations, émeutes, blocages routiers, pannes généralisées).</li>
                                    <li>Mauvaise manipulation des déchets par l'Utilisateur.</li>
                                    <li>Dysfonctionnements des réseaux de télécommunication ou des services de Mobile Money.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">6. Suspension et Résiliation</h3>
                                <p>
                                    KIN ECO-MAP se réserve le droit de suspendre ou de bannir définitivement tout compte utilisateur en cas de violation des présentes CGU, d'agression verbale ou physique envers nos agents, ou de fraude, sans préavis ni indemnité.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">7. Droit Applicable</h3>
                                <p>
                                    Les présentes conditions sont régies par le droit de la République Démocratique du Congo. Tout litige sera soumis à la compétence exclusive des tribunaux de Kinshasa/Gombe.
                                </p>
                            </section>
                        </>
                    ) : (
                        <>
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl flex items-start gap-3">
                                <Lock className="text-blue-500 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-1">Sécurité des Données Maximale</h4>
                                    <p className="text-xs text-blue-500/90 dark:text-blue-400/80">
                                        Nous utilisons des protocoles de chiffrement de niveau militaire pour garantir que vos informations personnelles et financières restent strictement confidentielles.
                                    </p>
                                </div>
                            </div>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">1. Collecte des Données</h3>
                                <p>
                                    Dans le cadre de l'utilisation de KIN ECO-MAP, nous sommes amenés à collecter et traiter les données suivantes, nécessaires au bon fonctionnement du service :
                                </p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-500 dark:text-gray-400">
                                    <li><strong>Données d'Identité :</strong> Nom, prénom, adresse e-mail, numéro de téléphone, photo de profil (facultatif).</li>
                                    <li><strong>Données de Géolocalisation :</strong> Coordonnées GPS précises de votre domicile ou entreprise pour permettre l'intervention des camions de collecte.</li>
                                    <li><strong>Données Financières :</strong> Historique des transactions, méthode de paiement préférée (nous ne stockons PAS les numéros complets de carte bancaire ni les codes PIN Mobile Money).</li>
                                    <li><strong>Données Techniques :</strong> Adresse IP, type d'appareil, version du système d'exploitation, journaux de connexion.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">2. Utilisation des Données</h3>
                                <p>Vos données sont exclusivement utilisées pour :</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-500 dark:text-gray-400">
                                    <li>Assurer la prestation logistique de collecte des déchets.</li>
                                    <li>Traiter vos paiements et gérer la facturation.</li>
                                    <li>Vous envoyer des notifications de service (arrivée du camion, confirmation de paiement).</li>
                                    <li>Améliorer nos algorithmes d'optimisation de tournée pour réduire l'empreinte carbone.</li>
                                    <li>Respecter nos obligations légales et réglementaires en RDC.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">3. Sécurité et Stockage des Données</h3>
                                <p>
                                    La sécurité de vos données est notre priorité absolue. Nous mettons en œuvre des mesures techniques et organisationnelles robustes :
                                </p>
                                <ul className="list-disc pl-5 mt-2 space-y-2 text-gray-500 dark:text-gray-400">
                                    <li><strong>Chiffrement :</strong> Toutes les données sensibles sont chiffrées au repos (AES-256) et en transit (TLS 1.3 / HTTPS).</li>
                                    <li><strong>Contrôle d'accès :</strong> L'accès à vos données personnelles est strictement limité aux employés de KIN ECO-MAP ayant besoin d'en connaître pour l'exécution de leur mission.</li>
                                    <li><strong>Serveurs Sécurisés :</strong> Nos infrastructures sont hébergées dans des centres de données sécurisés, protégés contre les intrusions physiques et numériques.</li>
                                    <li><strong>Audits :</strong> Des audits de sécurité réguliers sont effectués pour identifier et corriger toute vulnérabilité potentielle.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">4. Partage des Données</h3>
                                <p>
                                    Nous ne vendons, ne louons et ne commercialisons JAMAIS vos données personnelles à des tiers à des fins publicitaires. Vos données peuvent être partagées uniquement avec :
                                </p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-500 dark:text-gray-400">
                                    <li>Nos prestataires de paiement (pour valider les transactions).</li>
                                    <li>Les autorités administratives ou judiciaires compétentes, sur réquisition légale formelle.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">5. Vos Droits</h3>
                                <p>
                                    Conformément à la législation en vigueur sur la protection des données, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Vous pouvez exercer ces droits en contactant notre délégué à la protection des données à l'adresse : privacy@kinecomap.cd.
                                </p>
                                <p className="mt-2 text-xs italic text-gray-400">
                                    Note : La suppression de certaines données (comme l'adresse ou le téléphone) peut entraîner l'impossibilité de fournir le service de collecte.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">6. Cookies et Traceurs</h3>
                                <p>
                                    L'Application utilise des cookies techniques strictement nécessaires au fonctionnement du service (authentification, session). Aucune donnée n'est collectée à des fins de ciblage publicitaire comportemental.
                                </p>
                            </section>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 rounded-b-3xl">
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-[#2962FF] hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2"
                    >
                        <Shield size={18} />
                        J'ai lu et j'accepte
                    </button>
                </div>
            </div>
        </div>
    );
};
