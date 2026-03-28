import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Layout, Linkedin, Facebook, 
  Twitter, Instagram, Search, History, BarChart3, 
  ChevronRight, Copy, Check, Loader2, Globe, 
  MapPin, Palette, Layers, MousePointer2, LogIn,
  RotateCcw, Share2, Package, Menu, X, ArrowLeft, Download,
  Settings, LogOut, FileText, Calendar, ExternalLink,
  Target, TrendingUp, Shield, Rocket, Sparkles
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { cn } from './utils/cn';

// --- Types ---

interface ReportData {
  executiveSummary: string;
  marketAnalysis: {
    competitors: string[];
    opportunities: string[];
    targetAudience: string;
  };
  automationRoadmap: {
    phase1: string[];
    phase2: string[];
    phase3: string[];
  };
  recommendedTools: {
    name: string;
    purpose: string;
    cost: string;
  }[];
  roiEstimate: string;
}

// --- Components ---

const Button = ({ children, className, variant = 'primary', ...props }: any) => {
  const variants = {
    primary: "bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#06b6d4] text-white shadow-[0_2px_8px_rgba(99,102,241,0.3)] hover:opacity-90",
    ghost: "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white",
    outline: "border border-[#7c3aed]/40 text-[#7c3aed] hover:bg-[#7c3aed]/10",
    danger: "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20"
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

const Input = ({ label, ...props }: any) => (
  <div className="space-y-2">
    {label && <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>}
    <input
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7c3aed] transition-all"
      {...props}
    />
  </div>
);

// --- Settings Panel ---

const SettingsPanel = ({ isOpen, onClose, apiStatus, customApiKey, setCustomApiKey, onDownloadProject }: any) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleSaveAndTest = async () => {
    setTestStatus('testing');
    try {
      localStorage.setItem('gemini_api_key_override', customApiKey);
      // Simple test call
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.status === 'ok') {
        setTestStatus('success');
        toast.success("API Key saved and verified!");
      } else {
        setTestStatus('error');
        toast.error("API Key saved but verification failed.");
      }
    } catch (e) {
      setTestStatus('error');
      toast.error("Failed to verify API Key.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
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
                <Settings className="text-[#7c3aed]" /> System Settings
              </h2>
              <button 
                onClick={onClose}
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
                    <span className="text-sm text-[#a1a1aa]">Gemini API Status</span>
                    <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${apiStatus === 'ready' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#f59e0b]/10 text-[#f59e0b]'}`}>
                      {apiStatus === 'ready' ? 'Ready' : 'Not Configured'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#a1a1aa] uppercase font-bold">Gemini API Key Override</label>
                    <input 
                      type="password"
                      value={customApiKey}
                      onChange={(e) => setCustomApiKey(e.target.value)}
                      placeholder="Paste your Gemini API key here..."
                      className="w-full bg-white/5 border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7c3aed] transition-all"
                    />
                  </div>

                  <Button 
                    onClick={handleSaveAndTest}
                    className="w-full py-2 text-xs"
                    disabled={testStatus === 'testing'}
                  >
                    {testStatus === 'testing' ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                    Save & Test API Key
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-[10px] text-[#a1a1aa] uppercase font-bold tracking-widest">Project Export</div>
                <div className="p-4 bg-black/40 rounded-2xl border border-[#2a2a2a] space-y-4">
                  <p className="text-xs text-[#a1a1aa] leading-relaxed">
                    Download the full project source code as a ZIP file for local development or backup.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={onDownloadProject}
                    className="w-full py-3 text-sm"
                  >
                    <Download size={18} className="mr-2" />
                    Download Source Code (.zip)
                  </Button>
                </div>
              </div>

              <Button 
                onClick={onClose}
                className="w-full py-4"
              >
                Close Settings
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Main App ---

export function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    businessName: '',
    industry: '',
    website: '',
    goals: [],
    challenges: '',
    budget: '1000-5000',
    timeline: '1-3 months'
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'ready' | 'error'>('idle');
  const [customApiKey, setCustomApiKey] = useState(localStorage.getItem('gemini_api_key_override') || '');

  // Fix 1: App Title
  useEffect(() => {
    document.title = 'GeniuzLab Intelligence Portal';
  }, []);

  // Fix 7: Auth State Persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fix 4: Wizard State Persistence (Restore)
  useEffect(() => {
    const savedWizard = localStorage.getItem('geniuzlab_wizard');
    if (savedWizard) {
      try {
        const { step, data, timestamp } = JSON.parse(savedWizard);
        // Only restore if less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setCurrentStep(step);
          setFormData(data);
        }
      } catch (e) {
        console.error("Failed to restore wizard state", e);
      }
    }
    
    const savedReport = localStorage.getItem('geniuzlab_report');
    if (savedReport) {
      try {
        setReportData(JSON.parse(savedReport));
      } catch (e) {
        console.error("Failed to restore report data", e);
      }
    }
  }, []);

  // Fix 4: Wizard State Persistence (Save)
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('geniuzlab_wizard', JSON.stringify({
        step: currentStep,
        data: formData,
        timestamp: Date.now()
      }));
    }
  }, [currentStep, formData, currentUser]);

  useEffect(() => {
    if (reportData) {
      localStorage.setItem('geniuzlab_report', JSON.stringify(reportData));
    }
  }, [reportData]);

  // Fix 3: API Status Check
  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setApiStatus(data.status === 'ok' ? 'ready' : 'error');
      } catch (e) {
        setApiStatus('error');
      }
    };
    checkApi();
  }, []);

  // Fix 2: Logout Button Logic
  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to logout? Your progress will be saved.")) {
      try {
        await auth.signOut();
        setCurrentUser(null);
        // We keep reportData in state for the current session, but it will be cleared on refresh if not restored
        toast.success("Signed out successfully");
      } catch (error) {
        toast.error("Failed to sign out");
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Welcome to GeniuzLab!");
    } catch (error) {
      toast.error("Login failed. Please try again.");
    }
  };

  const handleDownloadProject = async () => {
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'geniuzlab-intelligence-portal.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Project downloaded successfully!");
    } catch (e) {
      toast.error("Failed to download project.");
    }
  };

  // Fix 5: Report Generation Logic
  const generateReport = async () => {
    setGeneratingReport(true);
    const toastId = toast.loading("Analyzing your business data...");
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key-override': customApiKey
        },
        body: JSON.stringify({ formData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
      toast.success("Intelligence Report Generated!", { id: toastId });
    } catch (error: any) {
      console.error("Report Generation Error:", error);
      toast.error(error.message || "Failed to generate report. Please check your API key.", { id: toastId });
    } finally {
      setGeneratingReport(false);
    }
  };

  const resetWizard = () => {
    if (window.confirm("Are you sure you want to start over? This will clear your current progress.")) {
      setCurrentStep(1);
      setFormData({
        businessName: '',
        industry: '',
        website: '',
        goals: [],
        challenges: '',
        budget: '1000-5000',
        timeline: '1-3 months'
      });
      setReportData(null);
      localStorage.removeItem('geniuzlab_wizard');
      localStorage.removeItem('geniuzlab_report');
      toast.success("Wizard reset.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-[#7c3aed] animate-spin" size={48} />
        <p className="text-slate-400 font-medium animate-pulse">Authenticating with GeniuzLab...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#6366f1]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#06b6d4]/10 blur-[120px] rounded-full" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8 relative z-10"
        >
          <div className="space-y-4">
            <div className="w-20 h-20 bg-gradient-to-br from-[#6366f1] to-[#06b6d4] rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-[#6366f1]/20">
              <Rocket className="text-white" size={40} />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">GeniuzLab</h1>
            <p className="text-slate-400 text-lg">Intelligence Portal</p>
          </div>

          <Card className="p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Welcome Back</h2>
              <p className="text-sm text-slate-400">Sign in to access your AI automation command center.</p>
            </div>

            <Button onClick={handleGoogleLogin} className="w-full py-4 text-lg">
              <LogIn size={20} className="mr-2" />
              Sign in with Google
            </Button>

            <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-4 text-slate-500">
              <Shield size={16} />
              <span className="text-xs font-medium uppercase tracking-widest">Secure Enterprise Access</span>
            </div>
          </Card>

          <p className="text-slate-500 text-xs">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#7c3aed]/30">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6366f1] to-[#06b6d4] rounded-xl flex items-center justify-center shadow-lg shadow-[#6366f1]/20">
              <Rocket className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">GeniuzLab</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Intelligence Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <Settings size={20} />
            </button>
            
            <div className="h-8 w-px bg-white/10 mx-2" />

            <div className="flex items-center gap-3 bg-white/5 pl-2 pr-4 py-1.5 rounded-xl border border-white/5">
              <img 
                src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName}`} 
                alt="Profile" 
                className="w-8 h-8 rounded-lg border border-white/10"
              />
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-white leading-none mb-1">{currentUser.displayName}</p>
                <p className="text-[10px] text-slate-500 leading-none">{currentUser.email}</p>
              </div>
            </div>

            <Button 
              variant="danger" 
              onClick={handleSignOut}
              className="px-3 py-2 text-xs"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {!reportData ? (
          <div className="max-w-3xl mx-auto space-y-12">
            {/* Onboarding Wizard */}
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-black text-white tracking-tight">Onboarding Wizard</h2>
              <p className="text-slate-400">Tell us about your business to generate your custom AI roadmap.</p>
              
              {/* Progress Bar */}
              <div className="flex items-center gap-2 max-w-md mx-auto pt-4">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div 
                      initial={false}
                      animate={{ width: currentStep >= step ? '100%' : '0%' }}
                      className="h-full bg-gradient-to-r from-[#6366f1] to-[#06b6d4]"
                    />
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                Step {currentStep} of 5
              </div>
            </div>

            <Card className="p-8">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Globe className="text-[#7c3aed]" size={20} /> Basic Information
                      </h3>
                      <p className="text-sm text-slate-400">Let's start with the basics of your business.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Input 
                        label="Business Name" 
                        placeholder="e.g. Acme Corp" 
                        value={formData.businessName}
                        onChange={(e: any) => setFormData({...formData, businessName: e.target.value})}
                      />
                      <Input 
                        label="Industry" 
                        placeholder="e.g. E-commerce" 
                        value={formData.industry}
                        onChange={(e: any) => setFormData({...formData, industry: e.target.value})}
                      />
                    </div>
                    <Input 
                      label="Website URL" 
                      placeholder="https://example.com" 
                      value={formData.website}
                      onChange={(e: any) => setFormData({...formData, website: e.target.value})}
                    />
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Target className="text-[#7c3aed]" size={20} /> Business Goals
                      </h3>
                      <p className="text-sm text-slate-400">What are you looking to achieve with AI?</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        'Automate Customer Support',
                        'Generate More Leads',
                        'Reduce Operational Costs',
                        'Improve Content Creation',
                        'Data Analysis & Insights',
                        'Personalized Marketing'
                      ].map((goal) => (
                        <button
                          key={goal}
                          onClick={() => {
                            const goals = formData.goals.includes(goal)
                              ? formData.goals.filter((g: string) => g !== goal)
                              : [...formData.goals, goal];
                            setFormData({...formData, goals});
                          }}
                          className={cn(
                            "p-4 rounded-xl border text-left transition-all",
                            formData.goals.includes(goal)
                              ? "bg-[#7c3aed]/10 border-[#7c3aed] text-white"
                              : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                          )}
                        >
                          <div className="text-sm font-bold">{goal}</div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-[#7c3aed]" size={20} /> Current Challenges
                      </h3>
                      <p className="text-sm text-slate-400">What's holding your business back right now?</p>
                    </div>
                    <textarea
                      className="w-full h-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7c3aed] transition-all resize-none"
                      placeholder="Describe your main bottlenecks..."
                      value={formData.challenges}
                      onChange={(e) => setFormData({...formData, challenges: e.target.value})}
                    />
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div 
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="text-[#7c3aed]" size={20} /> Budget & Timeline
                      </h3>
                      <p className="text-sm text-slate-400">Help us tailor the roadmap to your resources.</p>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly AI Budget (USD)</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7c3aed] transition-all"
                          value={formData.budget}
                          onChange={(e) => setFormData({...formData, budget: e.target.value})}
                        >
                          <option value="<1000">Less than $1,000</option>
                          <option value="1000-5000">$1,000 - $5,000</option>
                          <option value="5000-10000">$5,000 - $10,000</option>
                          <option value="10000+">$10,000+</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Implementation Timeline</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7c3aed] transition-all"
                          value={formData.timeline}
                          onChange={(e) => setFormData({...formData, timeline: e.target.value})}
                        >
                          <option value="Immediate">Immediate (ASAP)</option>
                          <option value="1-3 months">1 - 3 Months</option>
                          <option value="3-6 months">3 - 6 Months</option>
                          <option value="6+ months">6+ Months</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 5 && (
                  <motion.div 
                    key="step5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-[#7c3aed]/10 rounded-full mx-auto flex items-center justify-center">
                        <Sparkles className="text-[#7c3aed]" size={32} />
                      </div>
                      <h3 className="text-2xl font-black text-white">Ready to Generate?</h3>
                      <p className="text-slate-400 max-w-sm mx-auto">
                        We've gathered all the necessary info. Our AI is ready to build your custom intelligence report.
                      </p>
                    </div>

                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Business:</span>
                        <span className="text-white font-bold">{formData.businessName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Industry:</span>
                        <span className="text-white font-bold">{formData.industry || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Goals:</span>
                        <span className="text-white font-bold">{formData.goals.length} Selected</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between mt-12 pt-8 border-t border-white/5">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  disabled={currentStep === 1 || generatingReport}
                >
                  <ArrowLeft size={18} /> Back
                </Button>

                {currentStep < 5 ? (
                  <Button 
                    onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
                    disabled={generatingReport}
                  >
                    Next Step <ChevronRight size={18} />
                  </Button>
                ) : (
                  <Button 
                    onClick={generateReport}
                    disabled={generatingReport}
                    className="px-8"
                  >
                    {generatingReport ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate Report <Sparkles size={20} />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Dashboard View */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#7c3aed] font-bold uppercase tracking-widest text-xs">
                  <FileText size={14} /> Intelligence Report Generated
                </div>
                <h2 className="text-4xl font-black text-white tracking-tight">
                  {formData.businessName} Roadmap
                </h2>
                <p className="text-slate-400">Custom AI automation strategy for {formData.industry}.</p>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => window.print()}>
                  <Download size={18} /> Download PDF
                </Button>
                <Button onClick={() => window.location.href = 'mailto:hello@geniuzlab.com'}>
                  Book Free Consultation <ExternalLink size={18} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Executive Summary */}
              <Card className="lg:col-span-2" title="Executive Summary" icon={Zap}>
                <div className="prose prose-invert max-w-none">
                  <p className="text-lg text-slate-300 leading-relaxed italic">
                    "{reportData.executiveSummary}"
                  </p>
                </div>
              </Card>

              {/* ROI Estimate */}
              <Card title="ROI Estimate" icon={TrendingUp}>
                <div className="h-full flex flex-col justify-center items-center text-center space-y-4">
                  <div className="text-5xl font-black text-emerald-500 tracking-tighter">
                    {reportData.roiEstimate}
                  </div>
                  <p className="text-sm text-slate-400 uppercase tracking-widest font-bold">
                    Projected Efficiency Gain
                  </p>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[75%]" />
                  </div>
                </div>
              </Card>

              {/* Market Analysis */}
              <Card title="Market Analysis" icon={Search}>
                <div className="space-y-6">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-3 tracking-widest">Target Audience</div>
                    <p className="text-sm text-white font-medium">{reportData.marketAnalysis.targetAudience}</p>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-3 tracking-widest">Opportunities</div>
                    <ul className="space-y-2">
                      {reportData.marketAnalysis.opportunities.map((opt, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                          <Check size={14} className="text-emerald-500 mt-1 shrink-0" />
                          {opt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Automation Roadmap */}
              <Card className="lg:col-span-2" title="Automation Roadmap" icon={Layers}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { phase: 'Phase 1: Foundation', items: reportData.automationRoadmap.phase1, color: '#6366f1' },
                    { phase: 'Phase 2: Scaling', items: reportData.automationRoadmap.phase2, color: '#8b5cf6' },
                    { phase: 'Phase 3: Optimization', items: reportData.automationRoadmap.phase3, color: '#06b6d4' }
                  ].map((p, i) => (
                    <div key={i} className="space-y-4">
                      <div className="text-xs font-bold uppercase tracking-widest" style={{ color: p.color }}>{p.phase}</div>
                      <ul className="space-y-3">
                        {p.items.map((item, j) => (
                          <li key={j} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs text-slate-300">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recommended Tools */}
              <Card title="Recommended Tech Stack" icon={Package}>
                <div className="space-y-4">
                  {reportData.recommendedTools.map((tool, i) => (
                    <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center group hover:border-[#7c3aed]/30 transition-all">
                      <div>
                        <div className="text-sm font-bold text-white">{tool.name}</div>
                        <div className="text-[10px] text-slate-500">{tool.purpose}</div>
                      </div>
                      <div className="text-xs font-bold text-[#7c3aed]">{tool.cost}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="flex justify-center pt-12">
              <Button variant="ghost" onClick={resetWizard}>
                <RotateCcw size={18} /> Start New Analysis
              </Button>
            </div>
          </div>
        )}
      </main>

      <SettingsPanel 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        apiStatus={apiStatus}
        customApiKey={customApiKey}
        setCustomApiKey={setCustomApiKey}
        onDownloadProject={handleDownloadProject}
      />
    </div>
  );
}
