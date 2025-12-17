
import React, { useState } from 'react';
import { 
    ArrowLeft, BookOpen, Plus, Video, Edit2, Trash2, Save, X, Check, 
    HelpCircle, Layout, ListChecks, BarChart3, Users, Clock, Award, 
    GripVertical, FileText, Image as ImageIcon, PlayCircle, Eye, MoreVertical,
    TrendingUp, Filter, Search
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { Course, QuizQuestion } from '../types';

interface AdminAcademyProps {
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

// --- EXTENDED TYPES FOR LMS ---
interface ExtendedCourse extends Course {
    difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
    duration: string; // ex: "2h 30m"
    xp: number;
    enrolled: number;
    completionRate: number;
    category: string;
    modulesCount: number;
    lastUpdated: string;
}

// --- MOCK DATA - RESET TO ZERO ---
const MOCK_COURSES: ExtendedCourse[] = [];

const ANALYTICS_DATA = [
    { name: 'Lun', learners: 0, completions: 0 },
    { name: 'Mar', learners: 0, completions: 0 },
    { name: 'Mer', learners: 0, completions: 0 },
    { name: 'Jeu', learners: 0, completions: 0 },
    { name: 'Ven', learners: 0, completions: 0 },
    { name: 'Sam', learners: 0, completions: 0 },
    { name: 'Dim', learners: 0, completions: 0 },
];

const CATEGORY_DATA = [
    { name: 'Recyclage', value: 0, color: '#00C853' },
    { name: 'Compost', value: 0, color: '#FFB300' },
    { name: 'Business', value: 0, color: '#2962FF' },
    { name: 'Santé', value: 0, color: '#FF5252' },
];

export const AdminAcademy: React.FC<AdminAcademyProps> = ({ onBack, onToast }) => {
    const [courses, setCourses] = useState<ExtendedCourse[]>(MOCK_COURSES);
    const [viewMode, setViewMode] = useState<'list' | 'analytics' | 'editor'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Editor State
    const [editingCourse, setEditingCourse] = useState<Partial<ExtendedCourse> | null>(null);
    const [editorTab, setEditorTab] = useState<'meta' | 'curriculum' | 'settings'>('meta');

    // Quiz Question Form (Temporary State within Editor)
    const [newQuestion, setNewQuestion] = useState<Partial<QuizQuestion>>({
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0
    });

    // --- Actions ---

    const handleCreateCourse = () => {
        setEditingCourse({
            title: '',
            description: '',
            difficulty: 'Débutant',
            duration: '0h 00m',
            category: 'Général',
            status: 'draft',
            xp: 100,
            icon: 'book',
            color: 'bg-blue-100 text-blue-600',
            quiz: []
        });
        setViewMode('editor');
        setEditorTab('meta');
    };

    const handleEditCourse = (course: ExtendedCourse) => {
        setEditingCourse({ ...course });
        setViewMode('editor');
        setEditorTab('meta');
    };

    const handleSaveCourse = () => {
        if (!editingCourse?.title) {
            if (onToast) onToast("Le titre est obligatoire", "error");
            return;
        }

        const now = new Date().toLocaleDateString('fr-FR');
        
        if (editingCourse.id) {
            // Update
            setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...c, ...editingCourse, lastUpdated: now } as ExtendedCourse : c));
            if (onToast) onToast("Cours mis à jour", "success");
        } else {
            // Create
            const newCourse: ExtendedCourse = {
                ...(editingCourse as ExtendedCourse),
                id: Date.now().toString(),
                progress: 0,
                enrolled: 0,
                completionRate: 0,
                modulesCount: 0,
                lastUpdated: now
            };
            setCourses([newCourse, ...courses]);
            if (onToast) onToast("Cours créé avec succès", "success");
        }
        setViewMode('list');
        setEditingCourse(null);
    };

    const handleDeleteCourse = (id: string) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce cours ? Cette action est irréversible.")) {
            setCourses(prev => prev.filter(c => c.id !== id));
            if (onToast) onToast("Cours supprimé", "success");
        }
    };

    // --- Quiz Actions ---
    const handleAddQuestion = () => {
        if (!newQuestion.question || newQuestion.options?.some(o => !o)) return;
        
        const q: QuizQuestion = {
            id: Date.now().toString(),
            question: newQuestion.question!,
            options: newQuestion.options as string[],
            correctIndex: newQuestion.correctIndex || 0
        };

        setEditingCourse(prev => ({
            ...prev,
            quiz: [...(prev?.quiz || []), q]
        }));
        setNewQuestion({ question: '', options: ['', '', '', ''], correctIndex: 0 });
    };

    const handleDeleteQuestion = (qId: string) => {
        setEditingCourse(prev => ({
            ...prev,
            quiz: prev?.quiz?.filter(q => q.id !== qId)
        }));
    };

    // --- Filtered List ---
    const filteredCourses = courses.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- SUB-COMPONENTS (Inline for simplicity) ---

    const renderAnalytics = () => (
        <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><Users size={20} /></div>
                        <span className="text-xs font-bold text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded">0%</span>
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 dark:text-white">0</h3>
                    <p className="text-xs text-gray-500">Apprenants Actifs</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg"><Award size={20} /></div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 dark:text-white">0</h3>
                    <p className="text-xs text-gray-500">Certificats Délivrés</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg"><Clock size={20} /></div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 dark:text-white">0min</h3>
                    <p className="text-xs text-gray-500">Temps Moyen / Session</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg"><BookOpen size={20} /></div>
                    </div>
                    <h3 className="text-2xl font-black text-gray-800 dark:text-white">{courses.length}</h3>
                    <p className="text-xs text-gray-500">Cours Publiés</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Engagement Hebdomadaire</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={ANALYTICS_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }} 
                                />
                                <Line type="monotone" dataKey="learners" stroke="#2962FF" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                                <Line type="monotone" dataKey="completions" stroke="#00C853" strokeWidth={3} dot={{r: 4}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Répartition par Sujet</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={CATEGORY_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {CATEGORY_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {CATEGORY_DATA.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                <span className="text-xs font-bold text-gray-500">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEditor = () => (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in border border-gray-100 dark:border-gray-700">
            {/* Editor Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-750">
                <div>
                    <h2 className="text-lg font-black text-gray-800 dark:text-white">
                        {editingCourse?.title || 'Nouveau Cours'}
                    </h2>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${editingCourse?.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                        {editingCourse?.status === 'published' ? 'En Ligne' : 'Brouillon'}
                    </span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setViewMode('list')} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">Annuler</button>
                    <button onClick={handleSaveCourse} className="px-4 py-2 text-sm font-bold bg-[#2962FF] text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Save size={16} /> Enregistrer
                    </button>
                </div>
            </div>

            {/* Editor Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 border-r border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800 p-4 space-y-2">
                    <button 
                        onClick={() => setEditorTab('meta')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors ${editorTab === 'meta' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <FileText size={18} /> Métadonnées
                    </button>
                    <button 
                        onClick={() => setEditorTab('curriculum')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors ${editorTab === 'curriculum' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <ListChecks size={18} /> Curriculum & Quiz
                    </button>
                    <button 
                        onClick={() => setEditorTab('settings')}
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-colors ${editorTab === 'settings' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <MoreVertical size={18} /> Paramètres
                    </button>
                </div>

                {/* Main Editor Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    
                    {editorTab === 'meta' && (
                        <div className="max-w-2xl space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Titre du cours</label>
                                <input 
                                    className="w-full p-4 text-lg font-bold rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-[#2962FF] outline-none"
                                    value={editingCourse?.title}
                                    onChange={e => setEditingCourse(prev => ({...prev, title: e.target.value}))}
                                    placeholder="Ex: Introduction au Recyclage"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                                <textarea 
                                    className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-[#2962FF] outline-none h-32 resize-none"
                                    value={editingCourse?.description}
                                    onChange={e => setEditingCourse(prev => ({...prev, description: e.target.value}))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Catégorie</label>
                                    <select 
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none"
                                        value={editingCourse?.category}
                                        onChange={e => setEditingCourse(prev => ({...prev, category: e.target.value}))}
                                    >
                                        <option>Général</option>
                                        <option>Gestion Déchets</option>
                                        <option>Agriculture Urbaine</option>
                                        <option>Business</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Niveau</label>
                                    <select 
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white outline-none"
                                        value={editingCourse?.difficulty}
                                        onChange={e => setEditingCourse(prev => ({...prev, difficulty: e.target.value as any}))}
                                    >
                                        <option value="Débutant">Débutant</option>
                                        <option value="Intermédiaire">Intermédiaire</option>
                                        <option value="Avancé">Avancé</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Média Principal (Vidéo)</label>
                                <div className="flex gap-4">
                                    <input 
                                        className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-[#2962FF] outline-none"
                                        value={editingCourse?.videoUrl}
                                        onChange={e => setEditingCourse(prev => ({...prev, videoUrl: e.target.value}))}
                                        placeholder="https://youtube.com/..."
                                    />
                                    <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold flex items-center gap-2">
                                        <Eye size={18} /> Aperçu
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {editorTab === 'curriculum' && (
                        <div className="space-y-8">
                            {/* Quiz Builder Section */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                                        <HelpCircle size={20} /> Quiz de Validation
                                    </h3>
                                    <span className="text-xs font-bold bg-white dark:bg-blue-900/40 text-blue-600 px-3 py-1 rounded-full">
                                        {editingCourse?.quiz?.length || 0} Questions
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {editingCourse?.quiz?.map((q, idx) => (
                                        <div key={q.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-4 group">
                                            <div className="mt-1 text-gray-400">
                                                <GripVertical size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800 dark:text-white text-sm mb-2">
                                                    <span className="text-blue-500 mr-2">Q{idx + 1}.</span>{q.question}
                                                </p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {q.options.map((opt, i) => (
                                                        <div key={i} className={`text-xs px-2 py-1 rounded border ${i === q.correctIndex ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                                            {opt}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteQuestion(q.id)}
                                                className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Question Form */}
                                <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800/30">
                                    <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-3">Nouvelle Question</h4>
                                    <div className="space-y-3">
                                        <input 
                                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm outline-none"
                                            placeholder="Intitulé de la question..."
                                            value={newQuestion.question}
                                            onChange={e => setNewQuestion({...newQuestion, question: e.target.value})}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            {newQuestion.options?.map((opt, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <input 
                                                        type="radio" 
                                                        name="correct" 
                                                        checked={newQuestion.correctIndex === i}
                                                        onChange={() => setNewQuestion({...newQuestion, correctIndex: i})}
                                                        className="accent-blue-500"
                                                    />
                                                    <input 
                                                        className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-xs outline-none"
                                                        placeholder={`Option ${i + 1}`}
                                                        value={opt}
                                                        onChange={e => {
                                                            const newOpts = [...(newQuestion.options || [])];
                                                            newOpts[i] = e.target.value;
                                                            setNewQuestion({...newQuestion, options: newOpts});
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={handleAddQuestion}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-blue-500/20"
                                        >
                                            Ajouter la question
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {editorTab === 'settings' && (
                        <div className="space-y-6 max-w-lg">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <h4 className="font-bold text-gray-800 dark:text-white mb-4">Paramètres de Publication</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Statut du cours</p>
                                            <p className="text-xs text-gray-500">Visible par les utilisateurs</p>
                                        </div>
                                        <select 
                                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none outline-none text-sm font-bold"
                                            value={editingCourse?.status}
                                            onChange={e => setEditingCourse(prev => ({...prev, status: e.target.value as any}))}
                                        >
                                            <option value="draft">Brouillon</option>
                                            <option value="published">Publié</option>
                                            <option value="archived">Archivé</option>
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Points XP</p>
                                            <p className="text-xs text-gray-500">Récompense de complétion</p>
                                        </div>
                                        <input 
                                            type="number" 
                                            className="w-20 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none outline-none text-sm font-bold text-right"
                                            value={editingCourse?.xp}
                                            onChange={e => setEditingCourse(prev => ({...prev, xp: parseInt(e.target.value)}))}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Durée estimée</p>
                                            <p className="text-xs text-gray-500">Affiché sur la carte du cours</p>
                                        </div>
                                        <input 
                                            type="text" 
                                            className="w-24 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none outline-none text-sm font-bold text-right"
                                            value={editingCourse?.duration}
                                            onChange={e => setEditingCourse(prev => ({...prev, duration: e.target.value}))}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button className="text-red-500 font-bold text-sm flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 px-4 py-2 rounded-lg transition-colors">
                                    <Trash2 size={16} /> Supprimer ce cours définitivement
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300">
            
            {/* Header Toolbar */}
            {viewMode !== 'editor' && (
                <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col gap-4 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                            </button>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Eco Academy Studio</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Gérez vos programmes éducatifs</p>
                            </div>
                        </div>
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-white' : 'text-gray-500'}`}
                            >
                                <Layout size={18} />
                            </button>
                            <button 
                                onClick={() => setViewMode('analytics')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'analytics' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-white' : 'text-gray-500'}`}
                            >
                                <BarChart3 size={18} />
                            </button>
                        </div>
                    </div>

                    {viewMode === 'list' && (
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher un cours..." 
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-sm text-gray-800 dark:text-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handleCreateCourse}
                                className="bg-[#2962FF] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                            >
                                <Plus size={18} /> <span className="hidden md:inline">Nouveau</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Content Area */}
            <div className={`flex-1 overflow-hidden ${viewMode === 'editor' ? 'p-4' : 'p-5'}`}>
                
                {viewMode === 'analytics' && renderAnalytics()}

                {viewMode === 'editor' && renderEditor()}

                {viewMode === 'list' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 animate-fade-in overflow-y-auto h-full">
                        {filteredCourses.length === 0 && (
                            <div className="col-span-full text-center py-20 text-gray-400">
                                <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Aucun cours disponible.</p>
                            </div>
                        )}
                        {filteredCourses.map(course => (
                            <div key={course.id} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
                                {/* Card Header / Cover */}
                                <div className={`h-32 ${course.color} bg-opacity-20 relative p-4 flex flex-col justify-between`}>
                                    <div className="flex justify-between items-start">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md bg-white/80 dark:bg-black/20 backdrop-blur-sm ${course.status === 'published' ? 'text-green-700' : 'text-gray-600'}`}>
                                            {course.status === 'published' ? 'Publié' : 'Brouillon'}
                                        </span>
                                        <button onClick={() => handleEditCourse(course)} className="p-2 bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-lg hover:bg-white transition-colors">
                                            <Edit2 size={14} className="text-gray-700 dark:text-white" />
                                        </button>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm text-xl`}>
                                            {course.icon === 'recycle' ? '♻️' : course.icon === 'leaf' ? '🌿' : '💼'}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-800 dark:text-white mb-2 line-clamp-1 group-hover:text-[#2962FF] transition-colors">{course.title}</h3>
                                    <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-1">{course.description}</p>
                                    
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Apprenants</p>
                                            <p className="text-sm font-bold text-gray-700 dark:text-white">{course.enrolled}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Complétion</p>
                                            <p className="text-sm font-bold text-green-600">{course.completionRate}%</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                                        <span className="flex items-center gap-1"><Award size={12} className="text-yellow-500" /> {course.xp} XP</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
