import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Layout, Image as ImageIcon, Linkedin, Facebook, 
  Twitter, Instagram, Search, History, BarChart3, 
  ChevronRight, Copy, Check, Loader2, Globe, 
  MapPin, Palette, Layers, MousePointer2, LogIn,
  RotateCcw, Share2, Package, Menu, X, ArrowLeft, Download
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { useBatch } from './hooks/useBatch';
import { INDUSTRIES, COUNTRIES, PLATFORMS, EMOTIONS, COLOR_PALETTES } from './constants/data';
import { cn } from './utils/cn';

// --- Components ---

const Button = ({ children, className, variant = 'primary', ...props }: any) => {
  const variants = {
    primary: "bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#06b6d4] text-white shadow-[0_2px_8px_rgba(99,102,241,0.3)] hover:opacity-90",
    ghost: "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white",
    outline: "border border-[#7c3aed]/40 text-[#7c3aed] hover:bg-[#7c3aed]/10"
  };

  return (
    <motion.button
      whileHover={{ translateY: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant as keyof typeof variants],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};

const Card = ({ children, className, title, icon: Icon }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-2xl hover:border-[#7c3aed]/20 transition-all", className)}
  >
    {title && (
      <div className="flex items-center gap-2 mb-4 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
        {Icon && <Icon size={14} />}
        {title}
      </div>
    )}
    {children}
  </motion.div>
);

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium whitespace-nowrap",
      active 
        ? "text-[#7c3aed]" 
        : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
    )}
  >
    <Icon size={16} />
    {label}
    {active && (
      <motion.div 
        layoutId="activeTab"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7c3aed] rounded-full"
      />
    )}
  </button>
);

const CopyButton = ({ text, className }: { text: string, className?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success("Copied to clipboard!", {
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(124,58,237,0.2)' }
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className={cn("flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all", 
        copied ? "text-[#10b981]" : "text-slate-500 hover:text-white",
        className
      )}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied! ✓" : "Copy"}
    </button>
  );
};

const CharacterCounter = ({ text, limit }: { text: string, limit?: number }) => {
  const count = text?.length || 0;
  const isOver = limit ? count > limit : false;
  
  return (
    <div className={cn("text-[10px] font-mono", isOver ? "text-red-500" : "text-slate-500")}>
      {count}{limit ? ` / ${limit}` : ''} chars
    </div>
  );
};

const SEOScoreBadge = ({ score }: { score: number }) => {
  const getColor = (s: number) => {
    if (s >= 80) return "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20";
    if (s >= 50) return "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20";
    return "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20";
  };

  return (
    <div className={cn("px-2 py-1 rounded-md border text-[10px] font-bold flex items-center gap-1", getColor(score))}>
      <Search size={10} />
      SEO: {score}/100
    </div>
  );
};

const LoadingOverlay = ({ text }: { text: string }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-[#0f0f0f]/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6"
  >
    <div className="relative mb-12">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-32 h-32 border-4 border-[#7c3aed]/10 border-t-[#7c3aed] rounded-full"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <Zap size={48} className="text-[#7c3aed] fill-[#7c3aed]/20" />
      </motion.div>
    </div>
    <motion.h2 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-3xl font-black text-white mb-4 tracking-tighter"
    >
      {text}
    </motion.h2>
    <motion.p 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="text-slate-400 max-w-md leading-relaxed"
    >
      Our AI high-command is orchestrating your content empire. 
      Sit back while we build your digital legacy.
    </motion.p>
  </motion.div>
);

const EmptyState = ({ icon: Icon, title, description }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="h-full flex flex-col items-center justify-center text-center p-12"
  >
    <div className="w-24 h-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
      <Icon size={40} className="text-slate-600" />
    </div>
    <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
    <p className="text-[#a1a1aa] max-w-xs leading-relaxed">{description}</p>
  </motion.div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('imagePrompts');
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiStatus, setApiStatus] = useState<'ready' | 'missing' | 'checking'>('checking');
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');

  useEffect(() => {
    localStorage.setItem('GEMINI_API_KEY', customApiKey);
  }, [customApiKey]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setApiStatus(data.apiConfigured ? 'ready' : 'missing');
      } catch (e) {
        setApiStatus('missing');
      }
    };
    checkHealth();
  }, []);
  const { batches, stats, loading, generateBatch, deleteBatch, nextPage, prevPage, page, hasMore, exportAllToCSV, shareBatch, getBatchById } = useBatch();

  const sortedBatches = [...batches].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    // Handle Firestore Timestamps
    const aTime = aVal?.toDate ? aVal.toDate().getTime() : new Date(aVal).getTime();
    const bTime = bVal?.toDate ? bVal.toDate().getTime() : new Date(bVal).getTime();

    if (sortConfig.key === 'timestamp') {
      return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime;
    }
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Form State
  const [formData, setFormData] = useState({
    industry: INDUSTRIES[0],
    country: COUNTRIES[0].name,
    city: COUNTRIES[0].cities[0],
    platforms: ['Instagram', 'Facebook'],
    emotionHook: 'FOMO',
    colorPalette: COLOR_PALETTES[0].name,
    batchSize: 10
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    
    // Check for shared batch in URL
    const params = new URLSearchParams(window.location.search);
    const sharedBatchId = params.get('batch');
    if (sharedBatchId) {
      getBatchById(sharedBatchId).then(batch => {
        if (batch) {
          setSelectedBatch(batch);
          toast.success("Shared batch loaded! 🔱");
        } else {
          toast.error("Shared batch not found or expired.");
        }
      });
    }

    return () => unsubscribe();
  }, []);

  const handleReset = () => {
    setFormData({
      industry: INDUSTRIES[0],
      country: COUNTRIES[0].name,
      city: COUNTRIES[0].cities[0],
      platforms: ['Instagram', 'Facebook'],
      emotionHook: 'FOMO',
      colorPalette: COLOR_PALETTES[0].name,
      batchSize: 10
    });
    toast.success("Form reset! 🧹");
  };

  const isFormValid = formData.industry && formData.city && formData.country && formData.platforms.length > 0;

  const copyAllPrompts = () => {
    if (!selectedBatch?.content?.imagePrompts) return;
    const prompts = selectedBatch.content.imagePrompts
      .map((p: any, i: number) => `${i + 1}. ${p.prompt}`)
      .join('\n\n');
    navigator.clipboard.writeText(prompts);
    toast.success("All image prompts copied! 📸");
  };

  const handleDownloadProject = async () => {
    const loadingToast = toast.loading('Preparing project export...');
    try {
      const response = await fetch('/api/export');
      if (!response.ok) {
        throw new Error('Failed to generate export');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agentforge-source-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Project source downloaded successfully!', { id: loadingToast });
    } catch (error: any) {
      console.error('Download Error:', error);
      toast.error('Failed to download project source. Please try again.', { id: loadingToast });
    }
  };

  const exportSocialPack = () => {
    if (!selectedBatch?.content?.platforms) {
      toast.error("No social content available to export.");
      return;
    }
    let pack = `GENIUZLAB SOCIAL PACK - ${selectedBatch.industry.toUpperCase()}\n`;
    pack += `Location: ${selectedBatch.city}, ${selectedBatch.country}\n`;
    pack += `Generated: ${new Date().toLocaleString()}\n\n`;
    pack += `========================================\n\n`;

    Object.entries(selectedBatch.content.platforms).forEach(([platform, posts]: [string, any]) => {
      if (!Array.isArray(posts)) return;
      pack += `[ ${platform.toUpperCase()} ]\n\n`;
      posts.forEach((post: any, i: number) => {
        pack += `POST #${i + 1}\n`;
        if (post.caption) pack += `Caption: ${post.caption}\n`;
        if (post.post) pack += `Post: ${post.post}\n`;
        if (post.hook) pack += `Hook: ${post.hook}\n`;
        if (post.script) pack += `Script: ${post.script}\n`;
        if (post.engagementHook) pack += `Engagement Hook: ${post.engagementHook}\n`;
        if (post.cta) pack += `CTA: ${post.cta}\n`;
        if (post.trending_sounds_suggestion) pack += `Audio Suggestion: ${post.trending_sounds_suggestion}\n`;
        if (post.standalone) pack += `Standalone Tweet: ${post.standalone}\n`;
        if (post.thread) pack += `Thread:\n${post.thread.map((t: string, ti: number) => `  ${ti + 1}. ${t}`).join('\n')}\n`;
        if (post.hashtags) pack += `Hashtags: ${post.hashtags.join(' ')}\n`;
        pack += `SEO Score: ${post.seoScore}/100\n\n`;
      });
      pack += `----------------------------------------\n\n`;
    });

    const blob = new Blob([pack], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `social_pack_${selectedBatch.industry.toLowerCase()}_${selectedBatch.city.toLowerCase()}.txt`;
    link.click();
    toast.success("Social pack downloaded! 📦");
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      toast.error("Login failed");
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      toast.error("Please login first");
      return;
    }
    try {
      const result = await generateBatch(formData, customApiKey);
      setSelectedBatch(result);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      // Error handled in hook
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied! ✓", {
      style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#6366f1] to-[#06b6d4] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/20">
            <Zap size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight">GeniuzLab <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#06b6d4]">Content Factory</span></h1>
          <p className="text-slate-400 mb-8 leading-relaxed">The ultimate AI content engine for digital marketing agencies. Generate entire content empires in seconds.</p>
          <Button onClick={handleLogin} className="w-full py-4 text-lg">
            <LogIn size={20} />
            Enter the Factory
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-slate-200 font-sans selection:bg-[#7c3aed]/30">
      <Toaster position="bottom-right" />
      
      <AnimatePresence>
        {loading && <LoadingOverlay text="🔱 SHIVA is generating your empire content..." />}
      </AnimatePresence>
      
      {/* Header */}
      <header className="h-20 border-b border-[#2a2a2a] bg-[#0f0f0f]/80 backdrop-blur-xl sticky top-0 z-[100] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#7c3aed] rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-none">GeniuzLab Content Factory</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">AI-Powered Content Empire</p>
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-8">
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Batches</span>
              <span className="text-white font-mono font-bold">{stats.totalBatches}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Posts Generated</span>
              <span className="text-white font-mono font-bold">{stats.totalPosts}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Today's Count</span>
              <span className="text-[#7c3aed] font-mono font-bold">{stats.dailyCount}/100</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 bg-[#1a1a2e] border border-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              title="System Settings"
            >
              <BarChart3 size={20} />
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden w-10 h-10 bg-[#1a1a2e] border border-white/5 rounded-xl flex items-center justify-center text-slate-400"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 overflow-hidden">
              <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] relative">
        
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
            />
          )}
        </AnimatePresence>

        {/* Sidebar - Input Panel */}
        <aside className={cn(
          "w-full lg:w-80 flex-shrink-0 border-r border-[#2a2a2a] p-6 space-y-8 bg-[#0f0f0f] lg:sticky lg:top-20 lg:h-[calc(100vh-80px)] overflow-y-auto transition-all duration-300 z-[90]",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "fixed lg:relative top-20 lg:top-0 left-0 h-[calc(100vh-80px)]"
        )}>
          <div className="lg:hidden flex justify-end mb-4">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-[#a1a1aa] uppercase font-bold tracking-wider flex items-center gap-2">
                <Globe size={12} /> Industry
              </label>
              <select 
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:border-[#7c3aed] outline-none transition-all"
              >
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-[#a1a1aa] uppercase font-bold tracking-wider flex items-center gap-2">
                  <Globe size={12} /> Country
                </label>
                <select 
                  value={formData.country}
                  onChange={(e) => {
                    const country = COUNTRIES.find(c => c.name === e.target.value);
                    setFormData({...formData, country: e.target.value, city: country?.cities[0] || ''});
                  }}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:border-[#7c3aed] outline-none transition-all"
                >
                  {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-[#a1a1aa] uppercase font-bold tracking-wider flex items-center gap-2">
                  <MapPin size={12} /> City
                </label>
                <select 
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:border-[#7c3aed] outline-none transition-all"
                >
                  {COUNTRIES.find(c => c.name === formData.country)?.cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-[#a1a1aa] uppercase font-bold tracking-wider flex items-center gap-2">
                <Layout size={12} /> Platforms
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map(p => (
                  <label key={p} className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 cursor-pointer hover:bg-white/5 transition-all">
                    <input 
                      type="checkbox" 
                      checked={formData.platforms.includes(p)}
                      onChange={(e) => {
                        const next = e.target.checked 
                          ? [...formData.platforms, p]
                          : formData.platforms.filter(x => x !== p);
                        setFormData({...formData, platforms: next});
                      }}
                      className="accent-[#7c3aed]"
                    />
                    <span className="text-xs">{p}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-[#a1a1aa] uppercase font-bold tracking-wider flex items-center gap-2">
                <Zap size={12} /> Emotion Hook
              </label>
              <div className="space-y-2">
                {EMOTIONS.map(e => (
                  <label key={e.id} className={cn(
                    "flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all cursor-pointer",
                    formData.emotionHook === e.id ? "bg-[#7c3aed]/10 border-[#7c3aed]/40 text-white" : "bg-[#1a1a1a] border-[#2a2a2a] text-[#a1a1aa] hover:border-white/20"
                  )}>
                    <div className="flex items-center gap-3">
                      <span>{e.icon}</span>
                      <div className="text-left">
                        <div className="text-xs font-bold">{e.label}</div>
                        <div className="text-[10px] opacity-60">{e.description}</div>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="emotion" 
                      className="hidden" 
                      checked={formData.emotionHook === e.id}
                      onChange={() => setFormData({...formData, emotionHook: e.id})}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-[#a1a1aa] uppercase font-bold tracking-wider flex items-center gap-2">
                <Palette size={12} /> Color Palette
              </label>
              <select 
                value={formData.colorPalette}
                onChange={(e) => setFormData({...formData, colorPalette: e.target.value})}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:border-[#7c3aed] outline-none transition-all"
              >
                {COLOR_PALETTES.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-[#a1a1aa] uppercase font-bold tracking-wider flex items-center gap-2">
                  <Layers size={12} /> Batch Size
                </label>
                <span className="text-[#7c3aed] font-mono font-bold text-xs">{formData.batchSize}</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="30" 
                step="5"
                value={formData.batchSize}
                onChange={(e) => setFormData({...formData, batchSize: parseInt(e.target.value)})}
                className="w-full accent-[#7c3aed]"
              />
              <p className="text-[9px] text-slate-600 italic">Limited to 30 for stability & quality</p>
            </div>

            <div className="flex gap-3 pt-6">
              <Button 
                variant="ghost" 
                className="flex-1"
                onClick={handleReset}
                disabled={loading}
              >
                <RotateCcw size={18} className="mr-2" />
                Reset
              </Button>
              <Button 
                onClick={() => {
                  handleGenerate();
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }} 
                disabled={loading || !isFormValid}
                className="flex-[2] py-4 shadow-xl shadow-indigo-500/20"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Zap size={18} className="fill-white" />}
                {loading ? "SHIVA is generating..." : "Generate Empire"}
              </Button>
            </div>

            <div className="pt-8 border-t border-[#2a2a2a]">
              <div className="text-[10px] text-[#a1a1aa] uppercase font-bold tracking-wider mb-4">System Status</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#a1a1aa]">AI Engine</span>
                  <span className="text-[#10b981] flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#a1a1aa]">Database</span>
                  <span className="text-[#10b981] flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#a1a1aa]">API Key</span>
                  <span className={`${apiStatus === 'ready' ? 'text-[#10b981]' : apiStatus === 'checking' ? 'text-[#f59e0b]' : 'text-[#ef4444]'} flex items-center gap-1 uppercase font-bold text-[10px]`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'ready' ? 'bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]' : apiStatus === 'checking' ? 'bg-[#f59e0b] animate-pulse' : 'bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                    {apiStatus === 'ready' ? 'Active' : apiStatus === 'checking' ? 'Checking' : 'Missing'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 flex flex-col bg-[#0f0f0f]">
          
          {/* Tabs */}
          <div className="border-b border-[#2a2a2a] px-6 py-4 flex items-center gap-2 overflow-x-auto no-scrollbar bg-[#0f0f0f]/50 backdrop-blur-sm sticky top-0 z-40">
            <TabButton active={activeTab === 'imagePrompts'} onClick={() => setActiveTab('imagePrompts')} icon={ImageIcon} label="Image Prompts" />
            
            {selectedBatch?.platforms?.includes('Pinterest') && (
              <TabButton active={activeTab === 'pinterest'} onClick={() => setActiveTab('pinterest')} icon={Layout} label="Pinterest" />
            )}
            {selectedBatch?.platforms?.includes('LinkedIn') && (
              <TabButton active={activeTab === 'linkedin'} onClick={() => setActiveTab('linkedin')} icon={Linkedin} label="LinkedIn" />
            )}
            {selectedBatch?.platforms?.includes('Facebook') && (
              <TabButton active={activeTab === 'facebook'} onClick={() => setActiveTab('facebook')} icon={Facebook} label="Facebook" />
            )}
            {selectedBatch?.platforms?.includes('TikTok') && (
              <TabButton active={activeTab === 'tiktok'} onClick={() => setActiveTab('tiktok')} icon={Zap} label="TikTok" />
            )}
            {selectedBatch?.platforms?.includes('Twitter/X') && (
              <TabButton active={activeTab === 'twitter'} onClick={() => setActiveTab('twitter')} icon={Twitter} label="Twitter" />
            )}
            {selectedBatch?.platforms?.includes('Instagram') && (
              <TabButton active={activeTab === 'instagram'} onClick={() => setActiveTab('instagram')} icon={Instagram} label="Instagram" />
            )}

            <TabButton active={activeTab === 'seo'} onClick={() => setActiveTab('seo')} icon={Search} label="SEO Data" />
            <TabButton active={activeTab === 'share'} onClick={() => setActiveTab('share')} icon={Share2} label="Share & Export" />
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              {!selectedBatch ? (
                <EmptyState 
                  icon={MousePointer2}
                  title="Select platforms and click Generate"
                  description="Configure the factory on the left and click generate to build your content empire."
                />
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Batch Header Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2a2a2a]">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setSelectedBatch(null)}
                        className="w-10 h-10 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl flex items-center justify-center text-[#a1a1aa] hover:text-white transition-colors"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <div>
                        <h2 className="text-2xl font-bold text-white leading-tight">
                          {selectedBatch.industry} <span className="text-[#a1a1aa] text-lg font-normal">in {selectedBatch.city}</span>
                        </h2>
                        <p className="text-[#a1a1aa] text-xs font-mono uppercase tracking-widest mt-1">
                          {selectedBatch.timestamp ? new Date(selectedBatch.timestamp?.toDate ? selectedBatch.timestamp.toDate() : selectedBatch.timestamp).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        className="text-[10px] uppercase tracking-widest font-bold"
                        onClick={() => shareBatch(selectedBatch.id)}
                      >
                        <Share2 size={14} className="mr-2" />
                        Share
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="text-[10px] uppercase tracking-widest font-bold"
                        onClick={exportSocialPack}
                      >
                        <Package size={14} className="mr-2" />
                        Social Pack
                      </Button>
                    </div>
                  </div>

                  {activeTab === 'imagePrompts' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                          <ImageIcon className="text-[#7c3aed]" /> Image Ad Factory
                        </h2>
                        <Button variant="ghost" className="text-xs py-2" onClick={copyAllPrompts}>
                          <Copy size={14} className="mr-2" /> Copy All Prompts
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {selectedBatch.content.imagePrompts.map((p: any) => (
                          <Card key={p.id} title={`Prompt #${p.id}`} icon={ImageIcon}>
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <p className="text-sm text-[#a1a1aa] leading-relaxed italic flex-1">"{p.prompt}"</p>
                                {p.seoScore && <SEOScoreBadge score={p.seoScore} />}
                              </div>
                              <div className="p-4 bg-black/20 rounded-xl border border-[#2a2a2a]">
                                <div className="text-[10px] text-[#a1a1aa] uppercase font-bold mb-1">Text Overlay</div>
                                <div className="text-[#7c3aed] font-bold">{p.textOverlay}</div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="px-3 py-1 bg-[#7c3aed]/10 text-[#7c3aed] text-[10px] font-bold rounded-full uppercase tracking-wider">
                                  {p.useCase}
                                </span>
                                <CopyButton text={p.prompt} />
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {['pinterest', 'linkedin', 'facebook', 'tiktok', 'twitter', 'instagram'].includes(activeTab) && (
                    <div className="space-y-6 max-w-4xl mx-auto">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold capitalize flex items-center gap-2">
                          {activeTab} Content
                        </h2>
                      </div>
                      {selectedBatch.content.platforms?.[activeTab] ? (
                        selectedBatch.content.platforms[activeTab].map((item: any, idx: number) => (
                          <Card key={idx} className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 flex items-center gap-3">
                              {item.seoScore && <SEOScoreBadge score={item.seoScore} />}
                              <CopyButton text={JSON.stringify(item, null, 2)} />
                            </div>
                            
                            {activeTab === 'linkedin' && (
                              <div className="space-y-4">
                                <div className="text-lg font-bold text-white border-l-4 border-[#7c3aed] pl-4">{item.hook}</div>
                                <div className="text-[#a1a1aa] whitespace-pre-wrap leading-relaxed">{item.post}</div>
                                <div className="flex justify-end pt-2">
                                  <CharacterCounter text={item.post} limit={3000} />
                                </div>
                              </div>
                            )}

                            {activeTab === 'facebook' && (
                              <div className="space-y-4">
                                <div className="text-lg font-bold text-white border-l-4 border-[#1877f2] pl-4">{item.engagementHook}</div>
                                <div className="text-[#a1a1aa] whitespace-pre-wrap leading-relaxed">{item.post}</div>
                                <div className="flex justify-end pt-2">
                                  <CharacterCounter text={item.post} limit={5000} />
                                </div>
                              </div>
                            )}

                            {activeTab === 'pinterest' && (
                              <div className="space-y-4">
                                <div className="text-[#a1a1aa] leading-relaxed">{item.caption}</div>
                                <div className="flex flex-wrap gap-2">
                                  {item.hashtags?.map((h: string) => <span key={h} className="text-[#e60023] text-sm">{h}</span>)}
                                </div>
                                <div className="flex justify-end">
                                  <CharacterCounter text={item.caption} limit={500} />
                                </div>
                                <div className="pt-4 border-t border-[#2a2a2a]">
                                  <div className="text-[10px] text-[#a1a1aa] uppercase font-bold mb-2">SEO Keywords</div>
                                  <div className="flex flex-wrap gap-2">
                                    {item.seoKeywords?.map((k: string) => <span key={k} className="px-2 py-1 bg-white/5 rounded text-[10px]">{k}</span>)}
                                  </div>
                                </div>
                              </div>
                            )}

                            {activeTab === 'tiktok' && (
                              <div className="space-y-6">
                                <div className="p-4 bg-black rounded-xl border border-[#2a2a2a]">
                                  <div className="text-[10px] text-[#a1a1aa] uppercase font-bold mb-2">Scroll Stopper (0-3s)</div>
                                  <div className="text-white font-bold text-lg italic">"{item.hook}"</div>
                                </div>
                                <div className="space-y-2">
                                  <div className="text-[10px] text-[#a1a1aa] uppercase font-bold">Full Script</div>
                                  <div className="text-[#a1a1aa] whitespace-pre-wrap italic">"{item.script}"</div>
                                  <div className="flex justify-end">
                                    <CharacterCounter text={item.script} />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2a2a2a]">
                                  <div>
                                    <div className="text-[10px] text-[#a1a1aa] uppercase font-bold mb-1">CTA</div>
                                    <div className="text-[#7c3aed] font-bold">{item.cta}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-[#a1a1aa] uppercase font-bold mb-1">Audio Suggestion</div>
                                    <div className="text-[#a1a1aa] text-xs">{item.trending_sounds_suggestion}</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {activeTab === 'twitter' && (
                              <div className="space-y-8">
                                <div className="space-y-4">
                                  <div className="text-[10px] text-slate-500 uppercase font-bold">Thread Format</div>
                                  {item.thread?.map((t: string, i: number) => (
                                    <div key={i} className="flex gap-4">
                                      <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold">{i+1}</div>
                                        {i < item.thread.length - 1 && <div className="w-px flex-1 bg-white/10 my-1"></div>}
                                      </div>
                                      <div className="flex-1 pt-1 text-[#a1a1aa]">
                                        {t}
                                        <div className="flex justify-end mt-1">
                                          <CharacterCounter text={t} limit={280} />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="pt-6 border-t border-[#2a2a2a] space-y-2">
                                  <div className="text-[10px] text-[#a1a1aa] uppercase font-bold">Standalone Tweet</div>
                                  <div className="text-white italic">"{item.standalone}"</div>
                                  <div className="flex justify-end">
                                    <CharacterCounter text={item.standalone} limit={280} />
                                  </div>
                                </div>
                              </div>
                            )}

                            {activeTab === 'instagram' && (
                              <div className="space-y-6">
                                <div className="text-[#a1a1aa] whitespace-pre-wrap leading-relaxed">{item.caption}</div>
                                <div className="flex flex-wrap gap-2">
                                  {item.hashtags?.map((h: string) => <span key={h} className="text-[#e1306c] text-sm">{h}</span>)}
                                </div>
                                <div className="flex justify-end">
                                  <CharacterCounter text={item.caption} limit={2200} />
                                </div>
                                <div className="p-4 bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045]/20 rounded-xl border border-[#2a2a2a]">
                                  <div className="text-[10px] text-white/60 uppercase font-bold mb-1">Story Concept</div>
                                  <div className="text-white font-medium">{item.storyIdea}</div>
                                </div>
                              </div>
                            )}
                          </Card>
                        ))
                      ) : (
                        <EmptyState 
                          icon={Layout}
                          title="No Content Generated"
                          description="No content generated for this platform in this batch. Try generating a new batch with this platform selected."
                        />
                      )}
                    </div>
                  )}

                  {activeTab === 'seo' && (
                    <div className="space-y-8 max-w-4xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card title="Primary Keyword" icon={Search}>
                          <div className="text-2xl font-black text-white tracking-tight">{selectedBatch.content.seoData.primaryKeyword}</div>
                        </Card>
                        <Card title="Content Theme" icon={Layers}>
                          <div className="text-lg font-bold text-[#7c3aed]">{selectedBatch.content.seoData.contentTheme}</div>
                        </Card>
                        <Card title="Search Volume" icon={BarChart3}>
                          <div className="text-2xl font-black text-[#10b981] tracking-tight">{selectedBatch.content.seoData.searchVolumeEstimate || 'N/A'}</div>
                          <div className="text-[10px] text-[#a1a1aa] uppercase font-bold mt-1">Est. Monthly Searches</div>
                        </Card>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title="Competition Level" icon={Zap}>
                          <div className={cn(
                            "inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                            selectedBatch.content.seoData.competitionLevel === 'Low' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                            selectedBatch.content.seoData.competitionLevel === 'Medium' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                            "bg-red-500/10 text-red-500 border-red-500/20"
                          )}>
                            {selectedBatch.content.seoData.competitionLevel || 'Medium'}
                          </div>
                          <p className="text-xs text-[#a1a1aa] mt-3 leading-relaxed">
                            Market difficulty for ranking in {selectedBatch.city}.
                          </p>
                        </Card>
                        <Card title="Content Gap Opportunity" icon={Layout}>
                          <p className="text-sm text-[#a1a1aa] leading-relaxed">
                            {selectedBatch.content.seoData.contentGapOpportunity || 'Focus on local long-tail keywords and "near me" variations.'}
                          </p>
                        </Card>
                      </div>
                      
                      <Card title="Secondary Keywords" icon={ChevronRight}>
                        <div className="flex flex-wrap gap-3">
                          {selectedBatch.content.seoData.secondaryKeywords.map((k: string) => (
                            <span key={k} className="px-4 py-2 bg-white/5 border border-[#2a2a2a] rounded-xl text-[#a1a1aa] hover:border-[#7c3aed]/40 transition-all">
                              {k}
                            </span>
                          ))}
                        </div>
                      </Card>

                      <Card title="Target Audience" icon={BarChart3}>
                        <p className="text-lg text-[#a1a1aa] italic">"{selectedBatch.content.seoData.targetAudience}"</p>
                      </Card>

                      <Button className="w-full py-4">
                        Add to SEO Database
                      </Button>
                    </div>
                  )}

                  {activeTab === 'share' && (
                    <div className="space-y-8 max-w-4xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card title="Share Content" icon={Share2}>
                          <div className="space-y-4">
                            <p className="text-sm text-[#a1a1aa] leading-relaxed">
                              Share this specific content batch with your team or clients. They will receive a read-only view of all generated assets.
                            </p>
                            <Button 
                              onClick={() => shareBatch(selectedBatch.id)}
                              className="w-full"
                            >
                              <Copy size={18} className="mr-2" />
                              Copy Share Link
                            </Button>
                          </div>
                        </Card>

                        <Card title="Download Content" icon={Download}>
                          <div className="space-y-4">
                            <p className="text-sm text-[#a1a1aa] leading-relaxed">
                              Download all social media captions, hooks, and scripts as a structured text file for easy scheduling.
                            </p>
                            <Button 
                              variant="ghost"
                              onClick={exportSocialPack}
                              className="w-full"
                            >
                              <Package size={18} className="mr-2" />
                              Download Social Pack
                            </Button>
                          </div>
                        </Card>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[#2a2a2a]">
                        <Card title="Share Application" icon={Globe}>
                          <div className="space-y-4">
                            <p className="text-sm text-[#a1a1aa] leading-relaxed">
                              Want to share the entire GeniuzLab Content Factory? Use the <strong>Share</strong> button in the top-right corner of the AI Studio interface.
                            </p>
                            <div className="p-4 bg-[#7c3aed]/10 border border-[#7c3aed]/20 rounded-xl text-xs text-[#7c3aed] font-medium italic">
                              "Perfect for demonstrating the power of AI to your agency partners."
                            </div>
                          </div>
                        </Card>

                        <Card title="Download Application" icon={Package}>
                          <div className="space-y-4">
                            <p className="text-sm text-[#a1a1aa] leading-relaxed">
                              To download the full source code or deploy it to your own infrastructure:
                            </p>
                            <ul className="text-xs text-[#a1a1aa] space-y-2 list-disc pl-4">
                              <li>Open the <strong>Settings</strong> menu (gear icon) in AI Studio.</li>
                              <li>Select <strong>Export to ZIP</strong> for local development.</li>
                              <li>Select <strong>Export to GitHub</strong> for production deployment.</li>
                            </ul>
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Batch History Panel */}
          <div className="h-64 border-t border-[#2a2a2a] bg-[#0f0f0f] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa] flex items-center gap-2">
                <History size={14} /> Batch History
              </h2>
              <Button 
                variant="ghost" 
                className="text-[10px] px-3 py-1"
                onClick={exportAllToCSV}
              >
                <Download size={14} className="mr-2" />
                Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[#a1a1aa] border-b border-[#2a2a2a]">
                  <tr>
                    <th className="pb-3 font-bold cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('timestamp')}>
                      Date {sortConfig.key === 'timestamp' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="pb-3 font-bold cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('industry')}>
                      Industry {sortConfig.key === 'industry' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="pb-3 font-bold">Location</th>
                    <th className="pb-3 font-bold">Platforms</th>
                    <th className="pb-3 font-bold cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('batchSize')}>
                      Size {sortConfig.key === 'batchSize' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="pb-3 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[#a1a1aa]">
                  {sortedBatches.map((b) => (
                    <tr key={b.id} className="border-b border-[#2a2a2a] hover:bg-white/5 transition-colors group">
                      <td className="py-3">{b.timestamp?.toDate ? b.timestamp.toDate().toLocaleDateString() : 'Just now'}</td>
                      <td className="py-3 font-bold text-white">{b.industry}</td>
                      <td className="py-3">{b.city}, {b.country}</td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          {b.platforms.slice(0, 3).map((p: string) => (
                            <span key={p} className="px-1.5 py-0.5 bg-white/5 rounded text-[8px]">{p}</span>
                          ))}
                          {b.platforms.length > 3 && <span className="text-[8px] text-[#a1a1aa]">+{b.platforms.length - 3}</span>}
                        </div>
                      </td>
                      <td className="py-3 font-mono">{b.batchSize}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setSelectedBatch(b)}
                            className="text-[#7c3aed] hover:underline font-bold"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this batch?")) {
                                deleteBatch(b.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-400 font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2a2a2a]">
              <div className="text-[10px] text-[#a1a1aa] uppercase font-bold">
                Page {page}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  className="px-3 py-1 text-[10px]" 
                  onClick={prevPage}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="ghost" 
                  className="px-3 py-1 text-[10px]" 
                  onClick={nextPage}
                  disabled={!hasMore}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-8 max-w-lg w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <BarChart3 className="text-[#7c3aed]" /> System Settings
                </h2>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#a1a1aa] hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="text-[10px] text-[#a1a1aa] uppercase font-bold tracking-widest">API Configuration</div>
                  <div className="p-4 bg-black/40 rounded-2xl border border-[#2a2a2a] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#a1a1aa]">Gemini API Key</span>
                      <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${apiStatus === 'ready' || customApiKey ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#f59e0b]/10 text-[#f59e0b]'}`}>
                        {apiStatus === 'ready' || customApiKey ? 'Configured' : 'Missing'}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] text-[#a1a1aa] uppercase font-bold">Custom API Key (Optional)</label>
                      <input 
                        type="password"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="Paste your Gemini API key here..."
                        className="w-full bg-white/5 border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7c3aed] transition-all"
                      />
                      <p className="text-[10px] text-[#a1a1aa] italic">
                        If provided, this key will be used instead of the server-side key.
                      </p>
                    </div>

                    <p className="text-xs text-[#a1a1aa] leading-relaxed">
                      To use the server-side key, go to the <strong>Settings</strong> menu (gear icon) in the AI Studio sidebar, click <strong>Secrets</strong>, and update the <strong>GEMINI_API_KEY</strong> value.
                    </p>
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#7c3aed] text-xs font-bold hover:underline flex items-center gap-1"
                    >
                      Get a new API key <ChevronRight size={12} />
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] text-[#a1a1aa] uppercase font-bold tracking-widest">Factory Quotas</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-[#2a2a2a]">
                      <div className="text-[10px] text-[#a1a1aa] uppercase font-bold mb-1">Daily Limit</div>
                      <div className="text-xl font-black text-white">100 <span className="text-xs font-normal text-[#a1a1aa]">Batches</span></div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-[#2a2a2a]">
                      <div className="text-[10px] text-[#a1a1aa] uppercase font-bold mb-1">Rate Limit</div>
                      <div className="text-xl font-black text-white">10 <span className="text-xs font-normal text-[#a1a1aa]">Req/Min</span></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] text-[#a1a1aa] uppercase font-bold tracking-widest">Project Export</div>
                  <div className="p-4 bg-black/40 rounded-2xl border border-[#2a2a2a] space-y-4">
                    <p className="text-xs text-[#a1a1aa] leading-relaxed">
                      If you're having trouble with the platform's export features, you can download the full project source code as a ZIP file directly from here.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleDownloadProject}
                      className="w-full py-3 text-sm"
                    >
                      <Download size={18} className="mr-2" />
                      Download Source Code (.zip)
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={() => setShowSettings(false)}
                  className="w-full py-4"
                >
                  Close Settings
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
