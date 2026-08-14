'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, Target, FileText, Send, MoreVertical, Activity, ArrowRight, Database, Briefcase, Plus, Brain, X, ChevronLeft, Star, Heart, CheckCircle2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface Opportunity {
  id: number;
  name: string;
  funder: string;
  closing_date: string;
  value: string;
  description: string;
  benefits: string | null;
  eligibility_criteria: string | null;
  selection_criteria: string | null;
  application_process: string | null;
  past_winners: string | null;
  match_score: number | null;
  match_reasoning: string | null;
  strategy: string | null;
  status: string;
  link: string | null;
  source?: string;
  opp_type?: string;
  target_entity?: string;
  location?: string;
}

export default function Home() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<any[]>([]);
  const [portals, setPortals] = useState<any[]>([]);
  const [credits, setCredits] = useState({ gemini: 'Checking...', scraper: 'Checking...' });
  const [isLoading, setIsLoading] = useState(true);
  
  // Toggles between visual dashboard, data table, and upload form
  const [viewMode, setViewMode] = useState<'dashboard' | 'table' | 'upload' | 'details'>('dashboard');
  const [activeTab, setActiveTab] = useState('All Open');
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [newPortalUrl, setNewPortalUrl] = useState('');
  const [isAddingPortal, setIsAddingPortal] = useState(false);
  
  // Data Table State
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [selectedOppForScan, setSelectedOppForScan] = useState<Opportunity | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Upload Form State
  const [extractUrl, setExtractUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Opportunity>>({
    name: '', funder: '', value: '', closing_date: '', opp_type: '', target_entity: 'Both',
    location: '', description: '', benefits: '', eligibility_criteria: '', link: ''
  });

  const [dailyStats, setDailyStats] = useState<{name: string, extracted: number, failed: number}[]>([]);
  const [progress, setProgress] = useState<{is_active: boolean, current_task: string, progress_percent: number}>({
    is_active: false,
    current_task: "Idle",
    progress_percent: 0
  });

  useEffect(() => {
    fetchData();
    
    // Poll scraper progress
    const fetchProgress = async () => {
      try {
        const apiUrl = 'https://opp-intel-production.up.railway.app';
        const res = await axios.get(`${apiUrl}/api/scrapers/progress`);
        setProgress(prev => {
          if (prev.is_active && !res.data.is_active) {
            fetchData(); // Auto-refresh data when scraper finishes
          }
          return res.data;
        });
      } catch (e) {
        console.error("Progress fetch error", e);
      }
    };
    
    const interval = setInterval(fetchProgress, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const apiUrl = 'https://opp-intel-production.up.railway.app';
      const [oppResponse, contactsResponse, complianceResponse, portalsResponse, creditsResponse, statsResponse] = await Promise.all([
        axios.get(`${apiUrl}/api/opportunities`).catch(() => ({ data: [] })),
        axios.get(`${apiUrl}/api/contacts`).catch(() => ({ data: [] })),
        axios.get(`${apiUrl}/api/compliance`).catch(() => ({ data: [] })),
        axios.get(`${apiUrl}/api/portals`).catch(() => ({ data: [] })),
        axios.get(`${apiUrl}/api/system/credits`).catch(() => ({ data: { gemini: 'Error', scraper: 'Error' } })),
        axios.get(`${apiUrl}/api/stats/daily`).catch(() => ({ data: [] }))
      ]);
      setOpportunities(oppResponse.data || []);
      setContacts(contactsResponse.data || []);
      setComplianceDocs(complianceResponse.data || []);
      setPortals(portalsResponse.data || []);
      setDailyStats(statsResponse.data || []);
      setCredits(creditsResponse.data || { gemini: 'Active (Pro)', scraper: 'Active' });
    } catch (error) {
      console.warn("API is unreachable, using empty state fallback.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSmartScan = async (oppId: number) => {
    try {
      await axios.post(`https://opp-intel-production.up.railway.app/api/scrapers/smart-scan/${oppId}`);
      alert("Smart Scan initiated! Refreshing data in a few seconds...");
      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      console.error("Failed to start Smart Scan:", error);
      alert("Failed to start Smart Scan. Check console.");
    }
  };

  const handleRunScrapers = async () => {
    const apiUrl = 'https://opp-intel-production.up.railway.app';
    
    if (progress.is_active) {
      try {
        await axios.post(`${apiUrl}/api/scrapers/cancel`);
        setProgress({ is_active: false, current_task: "Idle", progress_percent: 0 });
      } catch (error) {
        console.error("Error canceling scrapers", error);
      }
      return;
    }

    try {
      await axios.post(`${apiUrl}/api/scrapers/trigger-all`);
      setProgress({ is_active: true, current_task: "Initializing AI Scraper...", progress_percent: 5 });
    } catch (error) {
      console.error("Error running scrapers", error);
      alert("Failed to start scrapers. Please check backend logs.");
    }
  };

  const handleSmartExtract = async () => {
    if (!extractUrl) return alert("Please enter a URL first.");
    setIsExtracting(true);
    try {
      const apiUrl = 'https://opp-intel-production.up.railway.app';
      const res = await axios.post(`${apiUrl}/api/opportunities/extract-link`, { url: extractUrl });
      
      // Merge extracted data into form
      setFormData(prev => ({
        ...prev,
        name: res.data.name || prev.name,
        funder: res.data.funder || prev.funder,
        description: res.data.description || prev.description,
        benefits: res.data.benefits || prev.benefits,
        eligibility_criteria: res.data.eligibility_criteria || prev.eligibility_criteria,
        closing_date: res.data.closing_date || prev.closing_date,
        value: res.data.value || prev.value,
        opp_type: res.data.opp_type || prev.opp_type,
        location: res.data.location || prev.location,
        link: extractUrl
      }));
    } catch (error) {
      console.error("Extraction error", error);
      alert("Failed to auto-extract from URL. The AI might have timed out or hit a block.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveOpportunity = async () => {
    setIsSaving(true);
    try {
      const apiUrl = 'https://opp-intel-production.up.railway.app';
      await axios.post(`${apiUrl}/api/opportunities`, formData);
      alert("Opportunity saved successfully!");
      fetchData(); // Refresh table
      setViewMode('table');
      setFormData({
        name: '', funder: '', value: '', closing_date: '', opp_type: '', target_entity: 'Both',
        location: '', description: '', benefits: '', eligibility_criteria: '', link: ''
      });
      setExtractUrl('');
    } catch (error) {
      console.error("Save error", error);
      alert("Failed to save opportunity.");
    } finally {
      setIsSaving(false);
    }
  };

  
  const handleAddPortal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortalUrl) return;
    setIsAddingPortal(true);
    try {
      const apiUrl = 'https://opp-intel-production.up.railway.app';
      await axios.post(`${apiUrl}/api/portals`, { url: newPortalUrl });
      setNewPortalUrl('');
      fetchData();
    } catch (err) {
      alert("Failed to add portal.");
    } finally {
      setIsAddingPortal(false);
    }
  };

  const handleDeletePortal = async (id: number) => {
    try {
      const apiUrl = 'https://opp-intel-production.up.railway.app';
      await axios.delete(`${apiUrl}/api/portals/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete portal.");
    }
  };

  const getPriorityInfo = (score: number | null) => {
    if (!score) return { label: 'Medium', color: 'text-orange-500', dot: 'bg-orange-500' };
    if (score >= 80) return { label: 'Perfect Fit', color: 'text-emerald-500', dot: 'bg-emerald-500' };
    if (score >= 60) return { label: 'Good Match', color: 'text-orange-500', dot: 'bg-orange-500' };
    return { label: 'Low Match', color: 'text-slate-400', dot: 'bg-slate-400' };
  };

  const renderMarkdown = (text: string | null | undefined) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      
      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={i} className="text-sm font-semibold text-gradient mt-4 mb-2">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('#### ')) {
        return <h5 key={i} className="text-sm font-medium text-slate-800 mt-3 mb-1">{line.replace('#### ', '')}</h5>;
      }
      
      // Bold text parsing using regex for **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      
      return (
        <p key={i} className="text-sm text-slate-600 leading-relaxed mb-2">
          {parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={index} className="font-medium text-slate-800">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  const getStatusColor = (status: string) => {
    if (status === 'open') return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    if (status === 'queued' || status === 'Scanning...') return 'text-orange-500 bg-orange-50 border-orange-100';
    if (status === 'failed') return 'text-red-500 bg-red-50 border-red-100';
    if (status === 'Submitted' || status === 'won') return 'text-gradient bg-[#007AFF]/10 border-[#007AFF]/20';
    return 'text-slate-500 bg-white/20 backdrop-blur-md border-slate-100';
  };

  // --- DYNAMIC DATA FOR CHARTS ---
  const activeOppsCount = opportunities.filter(o => o.status !== 'closed' && o.status !== 'failed').length;
  
  const successCount = opportunities.filter(o => o.status !== 'failed' && o.status !== 'queued' && o.status !== 'Scanning...').length;
  const totalProcessed = opportunities.filter(o => o.status !== 'queued' && o.status !== 'Scanning...').length;
  const systemHealthPercent = totalProcessed === 0 ? 100 : Math.round((successCount / totalProcessed) * 100);
  
  const totalExtracted = opportunities.filter(o => o.status !== 'failed').length;
  const totalFailed = opportunities.filter(o => o.status === 'failed').length;
  const lineChartData = dailyStats.length > 0 ? dailyStats : [{ name: 'Mon', extracted: 0, failed: 0 }];
    
  const queueTotal = opportunities.length === 0 ? 1 : opportunities.length;
  const pctOpen = Math.round((opportunities.filter(o => o.status === 'open').length / queueTotal) * 100);
  const pctQueued = Math.round((opportunities.filter(o => o.status === 'queued' || o.status === 'Scanning...').length / queueTotal) * 100);
  const pctFailed = Math.round((opportunities.filter(o => o.status === 'failed').length / queueTotal) * 100);
  const COLORS = ['#10b981', '#ef4444'];
  
  const pieData = [
    { name: 'Success', value: successCount === 0 && totalProcessed === 0 ? 1 : successCount },
    { name: 'Failed', value: totalProcessed - successCount }
  ];
  
  // --- SUBSETS FOR UI ---
  const openOpps = opportunities.filter(o => o.status === 'open');
  const submittedOpps = opportunities.filter(o => o.status === 'Submitted' || o.status === 'won');
  const topMatches = openOpps.sort((a, b) => (b.match_score || 0) - (a.match_score || 0)).slice(0, 3);
  const featuredPortals = portals.slice(0, 5);

  const filteredOpportunities = [...opportunities].filter(opp => {
    if (activeTab === 'Queue Backlog') return opp.status === 'queued' || opp.status === 'Scanning...';
    if (activeTab === 'Failed Extraction') return opp.status === 'failed';
    return opp.status === 'open';
  }).sort((a, b) => b.id - a.id);

  if (viewMode === 'table') {
    return (
      <div className="max-w-full w-full relative animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setViewMode('dashboard')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-gradient hover:bg-white/20 backdrop-blur-md transition-all shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100"
            title="Back to Dashboard"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => setViewMode('upload')}
            className="flex items-center gap-2 gradient-accent px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-sm hover:-translate-y-0.5 transition-all"
          >
            <Plus size={18} /> Upload Opportunity
          </button>
        </div>
        <div className="bg-white rounded-[30px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-xl font-medium text-slate-800">Recent Intelligence Logs</h3>
              <p className="text-sm text-slate-400 mt-1">Showing {filteredOpportunities.length} records</p>
            </div>
            <div className="flex items-center gap-2 p-1 bg-white/20 backdrop-blur-md rounded-full border border-slate-100">
              {['All Open', 'Queue Backlog', 'Failed Extraction'].map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`px-6 py-2 rounded-full text-[13px] font-medium transition-all ${
                    activeTab === tab 
                      ? 'gradient-accent shadow-md' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-4 px-4 font-medium text-slate-400 text-xs uppercase tracking-wider w-16 text-center whitespace-nowrap">Match</th>
                  <th className="py-4 px-4 font-medium text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Log ID</th>
                  <th className="py-4 px-4 font-medium text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Entity Name</th>
                  <th className="py-4 px-4 font-medium text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Value</th>
                  <th className="py-4 px-4 font-medium text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Closing Date</th>
                  <th className="py-4 px-4 font-medium text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Type</th>
                  <th className="py-4 px-4 font-medium text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="py-4 px-4 font-medium text-slate-400 text-xs uppercase tracking-wider whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="py-12 text-center text-slate-400">Loading...</td></tr>
                ) : filteredOpportunities.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-slate-400">No records found.</td></tr>
                ) : (
                  filteredOpportunities.slice((currentPage - 1) * 5, currentPage * 5).map((opp, index) => (
                    <React.Fragment key={opp.id}>
                      <tr className={`border-b border-slate-50 hover:bg-white/20 backdrop-blur-md/50 transition-colors ${expandedRowId === opp.id ? 'bg-indigo-50/30' : ''}`}>
                        <td className="py-5 px-4">
                          <div className="flex flex-col max-w-[40px]">
                            <span className="text-sm font-semibold text-slate-800 tracking-tight">{opp.match_score || 0}%</span>
                            <div className="w-full h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                              <div 
                                className={`h-full ${
                                  (opp.match_score || 0) >= 80 ? 'bg-emerald-500' :
                                  (opp.match_score || 0) >= 60 ? 'bg-orange-500' :
                                  'bg-slate-400'
                                }`} 
                                style={{ width: `${opp.match_score || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-4 text-sm font-semibold text-slate-500">#{String(opp.id).padStart(4, '0')}</td>
                        <td className="py-5 px-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={
                                opp.target_entity?.toLowerCase().includes('badger') ? 'https://ui-avatars.com/api/?name=Badger&background=3f20b3&color=fff&font-size=0.4&rounded=true&bold=true' :
                                opp.target_entity?.toLowerCase().includes('premier') ? 'https://ui-avatars.com/api/?name=Premier&background=10b981&color=fff&font-size=0.4&rounded=true&bold=true' :
                                'https://ui-avatars.com/api/?name=BP&background=1e293b&color=fff&font-size=0.4&rounded=true&bold=true'
                              }
                              alt="Entity"
                              className="w-10 h-10 rounded-full shadow-sm ring-2 ring-slate-50"
                            />
                            <div className="max-w-[200px]">
                              <p className="text-sm font-medium text-slate-800 line-clamp-1">{opp.funder || 'Unknown'}</p>
                              <p className="text-xs text-slate-400 line-clamp-1">{opp.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-4 text-sm font-medium text-slate-700">{opp.value || 'Unspecified'}</td>
                        <td className="py-5 px-4 text-sm font-medium text-slate-500">{opp.closing_date || 'Ongoing'}</td>
                        <td className="py-5 px-4">
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                            {opp.opp_type || 'GENERAL'}
                          </span>
                        </td>
                        <td className="py-5 px-4">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize ${getStatusColor(opp.status)}`}>{opp.status}</span>
                        </td>
                        <td className="py-5 px-4">
                          <button 
                            onClick={() => {
                              setSelectedOppForScan(opp);
                              setViewMode('details');
                            }}
                            className="w-28 text-center flex justify-center py-2 rounded-xl text-xs font-medium transition-all shadow-sm bg-white border border-slate-200 text-slate-600 hover:border-[#007AFF] hover:text-gradient"
                          >
                            View More
                          </button>
                        </td>
                      </tr>
                      
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* PAGINATION */}
          {filteredOpportunities.length > 5 && (
            <div className="flex items-center justify-between px-8 py-6 border-t border-slate-100 bg-white/20 backdrop-blur-md rounded-b-[24px]">
              <span className="text-sm font-semibold text-slate-500">
                Showing {(currentPage - 1) * 5 + 1}-{Math.min(currentPage * 5, filteredOpportunities.length)} of {filteredOpportunities.length} opportunities
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/20 backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <div className="flex gap-1 hidden md:flex">
                  {Array.from({ length: Math.ceil(filteredOpportunities.length / 5) }).map((_, i) => {
                    const pageNum = i + 1;
                    const totalPages = Math.ceil(filteredOpportunities.length / 5);
                    if (pageNum === 1 || pageNum === totalPages || Math.abs(currentPage - pageNum) <= 1) {
                      return (
                        <button 
                          key={i}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${currentPage === pageNum ? 'gradient-accent shadow-lg shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (Math.abs(currentPage - pageNum) === 2) {
                      return <span key={i} className="w-10 h-10 flex items-center justify-center text-slate-400">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredOpportunities.length / 5), prev + 1))}
                  disabled={currentPage === Math.ceil(filteredOpportunities.length / 5)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-white/20 backdrop-blur-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === 'details' && selectedOppForScan) {
    const opp = selectedOppForScan;
    const priority = getPriorityInfo(opp.match_score);
    
    return (
      <div className="max-w-full w-full relative animate-in slide-in-from-right-8 duration-300">
        <button 
          onClick={() => setViewMode('table')}
          className="mb-6 w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-gradient hover:bg-white/20 backdrop-blur-md transition-all shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100"
          title="Back to Table"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* LEFT SIDEBAR CARD (Blue Box Equivalent) */}
          <div className="w-full lg:w-[320px] glass-panel rounded-3xl overflow-hidden shrink-0">
            <div className="h-24 bg-[#f5f7fa] w-full border-b border-slate-100"></div>
            <div className="px-8 pb-8 -mt-12 flex flex-col items-center">
              <img 
                src={
                  opp.target_entity?.toLowerCase().includes('badger') ? 'https://ui-avatars.com/api/?name=Badger&background=3f20b3&color=fff&font-size=0.4&rounded=true&bold=true' :
                  opp.target_entity?.toLowerCase().includes('premier') ? 'https://ui-avatars.com/api/?name=Premier&background=10b981&color=fff&font-size=0.4&rounded=true&bold=true' :
                  'https://ui-avatars.com/api/?name=BP&background=1e293b&color=fff&font-size=0.4&rounded=true&bold=true'
                }
                alt="Entity"
                className="w-24 h-24 rounded-3xl shadow-lg ring-4 ring-white mb-6 object-cover bg-white"
              />
              <h2 className="text-xl font-semibold text-slate-800 text-center leading-tight mb-1">{opp.funder || 'Unknown Funder'}</h2>
              <p className="text-sm font-semibold text-slate-400 text-center mb-8">{opp.name}</p>
              
              <button 
                onClick={() => document.getElementById('smart-scan-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full bg-indigo-50 hover:bg-[#007AFF] hover:text-white text-indigo-600 font-medium py-3.5 rounded-2xl transition-all shadow-sm flex justify-center items-center gap-2 mb-8 group"
              >
                <Brain size={18} className="group-hover:animate-pulse" /> Run Smart Scan
              </button>

              <div className="w-full flex justify-between px-2 border-t border-slate-100 pt-6">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[10px] bg-white/20 backdrop-blur-md border border-slate-200">
                      {opp.match_score || 0}%
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Match</span>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <Star className="text-yellow-400 w-5 h-5 fill-yellow-400" />
                    <span className="text-sm font-semibold text-slate-700">4.5</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Priority</span>
                </div>
              </div>
              
              <div className="w-full mt-6 bg-white/20 backdrop-blur-md rounded-xl p-4 flex items-center gap-3 justify-center text-slate-600 border border-slate-100">
                <Target size={16} />
                <span className="text-sm font-medium truncate max-w-[200px]">{opp.location || 'Global Remote'}</span>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT COLUMN */}
          <div className="flex-1 flex flex-col gap-6 w-full">
            
            {/* HEADER BAR (Green Box Equivalent) */}
            <div className="glass-panel rounded-3xl p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-8">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-800 tracking-tight leading-tight">{opp.name}</h1>
                  <p className="text-sm font-semibold text-gradient mt-2 flex items-center gap-2">
                    <Briefcase size={16} /> {opp.funder} <span className="text-slate-300">•</span> Posted recently
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <a href={opp.link || '#'} target="_blank" rel="noopener noreferrer" className="gradient-accent px-8 py-3 rounded-2xl font-medium shadow-lg shadow-sm transition-all flex items-center gap-2">
                    Apply Now
                  </a>
                  <button className="w-12 h-12 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-2xl flex items-center justify-center transition-all shadow-sm">
                    <Heart className="w-5 h-5 fill-current" />
                  </button>
                  <button className="w-12 h-12 bg-white border border-slate-200 text-slate-400 hover:text-indigo-500 hover:border-indigo-200 hover:bg-indigo-50 rounded-2xl flex items-center justify-center transition-all shadow-sm">
                    <Send size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-slate-400 border border-slate-100">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Type</p>
                    <p className="text-sm font-semibold text-slate-700 capitalize">{opp.opp_type || 'General'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-slate-400 border border-slate-100">
                    <Target size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Closing Date</p>
                    <p className="text-sm font-semibold text-slate-700">{opp.closing_date || 'Ongoing'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-slate-400 border border-slate-100">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Status</p>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${getStatusColor(opp.status)}`}>{opp.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-slate-400 border border-slate-100">
                    <Database size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-0.5">Value</p>
                    <p className="text-sm font-semibold text-slate-700 truncate max-w-[100px]">{opp.value || 'Unspecified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* OVERVIEW SECTION (Yellow Box Equivalent) */}
            <div className="glass-panel rounded-3xl p-10">
              <h3 className="text-xl font-semibold text-slate-800 mb-6">Overview</h3>
              <p className="text-sm font-semibold text-slate-500 leading-relaxed mb-10 whitespace-pre-line">
                {opp.description || 'Detailed overview not available yet. Please run an extraction on this opportunity.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Eligibility
                  </h4>
                  <ul className="space-y-4">
                    {(opp.eligibility_criteria || 'No specific eligibility mapped.').split('\n').map((line, i) => line.trim() ? (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 flex-shrink-0 text-emerald-500 w-4 h-4" />
                        <span className="text-sm font-medium text-slate-600 leading-relaxed">{line.replace(/^-\s*/, '')}</span>
                      </li>
                    ) : null)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Benefits
                  </h4>
                  <ul className="space-y-4">
                    {(opp.benefits || 'No specific benefits mapped.').split('\n').map((line, i) => line.trim() ? (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 flex-shrink-0 text-emerald-500 w-4 h-4" />
                        <span className="text-sm font-medium text-slate-600 leading-relaxed">{line.replace(/^-\s*/, '')}</span>
                      </li>
                    ) : null)}
                  </ul>
                </div>
              </div>
            </div>

            {/* GALLERY / SMART SCAN ZONE */}
            <div id="smart-scan-section" className="glass-panel rounded-3xl p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 gradient-accent rounded-2xl flex items-center justify-center font-semibold text-xl shadow-lg shadow-sm">
                    <Brain size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 tracking-tight">AI Smart Scan Analysis</h3>
                    <p className="text-xs font-medium text-gradient uppercase tracking-widest mt-1">Deep Intelligence</p>
                  </div>
                </div>
                {(opp.match_reasoning || opp.strategy) && (
                  <button 
                    onClick={(e) => {
                      const btn = e.currentTarget;
                      const originalText = btn.innerHTML;
                      btn.innerHTML = '<span class="flex items-center gap-2"><svg class="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Scanning...</span>';
                      btn.disabled = true;
                      axios.post(`https://opp-intel-production.up.railway.app/api/scrapers/smart-scan/${opp.id}`)
                        .then(() => fetchData())
                        .catch(() => alert('Scan failed'))
                        .finally(() => {
                          btn.innerHTML = originalText;
                          btn.disabled = false;
                        });
                    }}
                    className="text-xs bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 px-4 py-2 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2"
                  >
                    <Brain size={14} /> Re-run Scan
                  </button>
                )}
              </div>

              {!opp.match_reasoning && !opp.strategy ? (
                <div className="w-full h-48 bg-white/20 backdrop-blur-md border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center">
                  <Brain size={32} className="text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium mb-2">AI Analysis hasn't run on this opportunity yet.</p>
                  <button 
                    onClick={(e) => {
                      const btn = e.currentTarget;
                      const originalText = btn.innerHTML;
                      btn.innerHTML = 'Scanning...';
                      btn.disabled = true;
                      axios.post(`https://opp-intel-production.up.railway.app/api/scrapers/smart-scan/${opp.id}`)
                        .then(() => fetchData())
                        .catch(() => alert('Scan failed'))
                        .finally(() => {
                          btn.innerHTML = originalText;
                          btn.disabled = false;
                        });
                    }}
                    className="text-sm font-medium text-gradient hover:underline disabled:opacity-50"
                  >Force Smart Scan Now</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/20 backdrop-blur-md p-6 rounded-3xl border border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Target size={14} className="text-gradient" /> How to Win (Strategy)
                    </h4>
                    <div className="whitespace-pre-wrap">
                      {opp.strategy ? renderMarkdown(opp.strategy) : <p className="text-sm text-slate-600">No strategy generated.</p>}
                    </div>
                  </div>
                  
                  <div className="bg-white/20 backdrop-blur-md p-6 rounded-3xl border border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FileText size={14} className="text-emerald-500" /> Selection Criteria
                    </h4>
                    <div className="whitespace-pre-wrap">
                      {opp.selection_criteria ? renderMarkdown(opp.selection_criteria) : <p className="text-sm text-slate-600">No detailed criteria generated.</p>}
                    </div>
                  </div>
                  
                  <div className="bg-white/20 backdrop-blur-md p-6 rounded-3xl border border-slate-100 md:col-span-2">
                    <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Brain size={14} className="text-orange-500" /> Match Reasoning
                    </h4>
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="relative w-32 h-32 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={[{value: opp.match_score || 0}, {value: 100 - (opp.match_score || 0)}]} innerRadius={45} outerRadius={60} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                              <Cell fill={priority.dot.replace('bg-', '')} />
                              <Cell fill="#e2e8f0" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-semibold text-slate-800">{opp.match_score || 0}%</span>
                        </div>
                      </div>
                      <div className="whitespace-pre-wrap flex-1">
                        {opp.match_reasoning ? renderMarkdown(opp.match_reasoning) : <p className="text-sm text-slate-600">No match reasoning generated.</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'upload') {
    return (
      <div className="max-w-4xl mx-auto w-full relative animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setViewMode('table')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-gradient hover:bg-white/20 backdrop-blur-md transition-all shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-slate-100"
            title="Back to Table"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="flex gap-4">
            <button onClick={() => setViewMode('table')} className="px-6 py-2.5 rounded-xl font-medium text-slate-500 hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleSaveOpportunity}
              disabled={isSaving}
              className="gradient-accent px-8 py-2.5 rounded-xl font-medium shadow-lg shadow-sm hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Opportunity'}
            </button>
          </div>
        </div>

        {/* AI AUTO-FILL BAR */}
        <div className="bg-gradient-to-r from-[#007AFF] to-indigo-600 rounded-[24px] p-8 shadow-xl shadow-sm text-white mb-8 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0">
              <Brain size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold tracking-tight mb-2">Smart AI Auto-Extract</h2>
              <p className="text-indigo-100 text-sm mb-4">Paste the link to the grant or tender. The AI will instantly read the page and fill out this entire form for you.</p>
              <div className="flex gap-3 w-full">
                <input 
                  type="text" 
                  placeholder="https://example.com/grant-details" 
                  value={extractUrl}
                  onChange={(e) => setExtractUrl(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button 
                  onClick={handleSmartExtract}
                  disabled={isExtracting}
                  className="bg-white text-gradient px-6 py-3 rounded-xl font-medium hover:bg-white/20 backdrop-blur-md transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-80"
                >
                  {isExtracting ? 'Extracting...' : 'Auto-Fill Form'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* THE FORM */}
        <div className="glass-panel rounded-3xl overflow-hidden">
          {/* GENERALS */}
          <div className="p-10 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#007AFF]"></span> Generals
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div className="relative">
                <label className="text-xs font-medium text-slate-400 absolute -top-5 left-0">Funder / Org Name</label>
                <input type="text" value={formData.funder} onChange={e => setFormData({...formData, funder: e.target.value})} className="w-full border-b border-slate-200 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#007AFF] transition-colors bg-transparent" placeholder="e.g. World Bank" />
              </div>
              <div className="relative">
                <label className="text-xs font-medium text-slate-400 absolute -top-5 left-0">Opportunity Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-b border-slate-200 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#007AFF] transition-colors bg-transparent" placeholder="e.g. Innovation Grant 2026" />
              </div>
              <div className="relative">
                <label className="text-xs font-medium text-slate-400 absolute -top-5 left-0">Type of Application</label>
                <select value={formData.opp_type} onChange={e => setFormData({...formData, opp_type: e.target.value})} className="w-full border-b border-slate-200 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#007AFF] transition-colors bg-transparent appearance-none">
                  <option value="">Select Type</option>
                  <option value="Grant">Grant</option>
                  <option value="Tender">Tender</option>
                  <option value="Accelerator">Accelerator</option>
                  <option value="RFP">RFP</option>
                </select>
              </div>
              <div className="relative flex gap-8">
                <div className="flex-1 relative">
                  <label className="text-xs font-medium text-slate-400 absolute -top-5 left-0">Closing Date</label>
                  <input type="text" value={formData.closing_date || ''} onChange={e => setFormData({...formData, closing_date: e.target.value})} className="w-full border-b border-slate-200 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#007AFF] transition-colors bg-transparent" placeholder="e.g. Oct 24, 2026" />
                </div>
                <div className="flex-1 relative">
                  <label className="text-xs font-medium text-slate-400 absolute -top-5 left-0">Estimated Value</label>
                  <input type="text" value={formData.value || ''} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full border-b border-slate-200 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#007AFF] transition-colors bg-transparent" placeholder="e.g. $50,000" />
                </div>
              </div>
            </div>
          </div>

          {/* CRITERIA & MATCHING */}
          <div className="p-10 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Criteria & Matching
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mb-10">
              <div className="relative">
                <label className="text-xs font-medium text-slate-400 absolute -top-5 left-0">Target Entity Fit</label>
                <select value={formData.target_entity} onChange={e => setFormData({...formData, target_entity: e.target.value})} className="w-full border-b border-slate-200 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors bg-transparent appearance-none">
                  <option value="Both">Both (Badger & Premier)</option>
                  <option value="Badger">Badger Analytics</option>
                  <option value="Premier">Premier Agric</option>
                </select>
              </div>
              <div className="relative">
                <label className="text-xs font-medium text-slate-400 absolute -top-5 left-0">Location / Region</label>
                <input type="text" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border-b border-slate-200 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 transition-colors bg-transparent" placeholder="e.g. Global, South Africa" />
              </div>
            </div>
            
            <div className="relative">
              <label className="text-xs font-medium text-slate-400 mb-2 block">Eligibility Criteria</label>
              <textarea value={formData.eligibility_criteria || ''} onChange={e => setFormData({...formData, eligibility_criteria: e.target.value})} rows={3} className="w-full border border-slate-200 rounded-xl p-4 text-sm font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition-colors bg-white/20 backdrop-blur-md/50 resize-none" placeholder="Who is eligible for this opportunity?"></textarea>
            </div>
          </div>

          {/* DEEP DETAILS */}
          <div className="p-10">
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span> Deep Details
            </h3>
            
            <div className="space-y-8">
              <div className="relative">
                <label className="text-xs font-medium text-slate-400 mb-2 block">Opportunity Description</label>
                <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} className="w-full border border-slate-200 rounded-xl p-4 text-sm font-semibold text-slate-700 focus:outline-none focus:border-orange-500 transition-colors bg-white/20 backdrop-blur-md/50 resize-none" placeholder="Provide a detailed overview of the opportunity..."></textarea>
              </div>
              <div className="relative">
                <label className="text-xs font-medium text-slate-400 mb-2 block">Benefits & Prize</label>
                <textarea value={formData.benefits || ''} onChange={e => setFormData({...formData, benefits: e.target.value})} rows={2} className="w-full border border-slate-200 rounded-xl p-4 text-sm font-semibold text-slate-700 focus:outline-none focus:border-orange-500 transition-colors bg-white/20 backdrop-blur-md/50 resize-none" placeholder="What do we win? (Funding, credits, support)"></textarea>
              </div>
              <div className="relative">
                <label className="text-xs font-medium text-slate-400 absolute -top-5 left-0">Application Link (Source)</label>
                <input type="text" value={formData.link || ''} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full border-b border-slate-200 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 transition-colors bg-transparent" placeholder="https://..." />
              </div>
            </div>
          </div>
          
        </div>
      </div>
    );
  }

  // --- VISUAL DASHBOARD ---
  return (
    <div className="max-w-full w-full flex flex-col gap-8 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Intelligence Dashboard</h2>
          <p className="text-sm font-semibold text-slate-500 mt-1">Real-time overview of AI opportunity extraction and matching.</p>
        </div>
      </div>

      {/* 1. TOP 4 KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Deep Purple */}
        <div className="bg-[#007AFF] rounded-[24px] p-6 shadow-lg shadow-[#007AFF]/20 text-white relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-indigo-200 tracking-widest uppercase mb-1">Entities</span>
              <p className="text-[32px] font-semibold tracking-tight leading-none">{isLoading ? '...' : contacts.length}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm"><Users size={20} className="text-white" /></div>
          </div>
        </div>

        {/* Sky Blue */}
        <div className="bg-[#0ea5e9] rounded-[24px] p-6 shadow-lg shadow-sky-500/20 text-white relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-sky-100 tracking-widest uppercase mb-1">Active Opps</span>
              <p className="text-[32px] font-semibold tracking-tight leading-none">{isLoading ? '...' : openOpps.length}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm"><Target size={20} className="text-white" /></div>
          </div>
        </div>

        {/* Emerald Green */}
        <div className="bg-[#10b981] rounded-[24px] p-6 shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-emerald-100 tracking-widest uppercase mb-1">Reports (WTD)</span>
              <p className="text-[32px] font-semibold tracking-tight leading-none">{isLoading ? '...' : complianceDocs.length}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm"><FileText size={20} className="text-white" /></div>
          </div>
        </div>

        {/* Amber/Lime Green */}
        <div className="bg-[#f59e0b] rounded-[24px] p-6 shadow-lg shadow-amber-500/20 text-white relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-amber-100 tracking-widest uppercase mb-1">Apps Sent</span>
              <p className="text-[32px] font-semibold tracking-tight leading-none">{isLoading ? '...' : submittedOpps.length}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm"><Send size={20} className="text-white" /></div>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE SECTION (GREEN IN MOCKUP) - TRACKER & GRAPH */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side Tracker (System Health & APIs) */}
        <div className="bg-white rounded-[30px] p-6 shadow-sm border border-slate-100 flex flex-col items-center">
          <h3 className="w-full text-left text-sm font-medium text-slate-800 mb-6 flex items-center gap-2">
            <Activity size={18} className="text-emerald-500" />
            System Health & Efficiency
          </h3>
          
          <div className="relative w-48 h-48 mb-6 group cursor-pointer" onClick={handleRunScrapers}>
            <ResponsiveContainer width="100%" height="100%">
              {progress.is_active ? (
                <PieChart>
                  <Pie
                    data={[{name: 'progress', value: progress.progress_percent}, {name: 'rem', value: 100 - progress.progress_percent}]}
                    innerRadius={65}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <Cell fill="#007AFF" className="transition-all duration-1000" />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                </PieChart>
              ) : (
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={65}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="group-hover:opacity-80 transition-opacity" />
                    ))}
                  </Pie>
                </PieChart>
              )}
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {progress.is_active ? (
                <>
                  <p className="text-3xl font-semibold text-gradient tracking-tighter animate-pulse group-hover:hidden">{progress.progress_percent}%</p>
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest text-center px-4 leading-tight mt-1 group-hover:hidden">{progress.current_task}</p>
                  
                  <p className="text-xl font-semibold text-red-500 tracking-tighter hidden group-hover:block">CANCEL</p>
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest text-center px-4 leading-tight mt-1 hidden group-hover:block">Stop Scraper</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-semibold text-slate-800 tracking-tighter group-hover:text-emerald-500 transition-colors">{systemHealthPercent}%</p>
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest text-center px-4 leading-tight group-hover:hidden mt-1">Success</p>
                  <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-widest text-center px-4 leading-tight hidden group-hover:block mt-1">Run Scraper</p>
                </>
              )}
            </div>
          </div>

          <div className="flex w-full justify-between px-2 mb-8">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-2 border border-emerald-100">
                <span className="text-emerald-600 font-medium text-xs">{pctOpen}%</span>
              </div>
              <span className="text-[10px] font-medium text-slate-500 uppercase">Open</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-2 border border-orange-100">
                <span className="text-orange-500 font-medium text-xs">{pctQueued}%</span>
              </div>
              <span className="text-[10px] font-medium text-slate-500 uppercase">Queued</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-2 border border-red-100">
                <span className="text-red-500 font-medium text-xs">{pctFailed}%</span>
              </div>
              <span className="text-[10px] font-medium text-slate-500 uppercase">Failed</span>
            </div>
          </div>

          <div className="w-full bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-slate-100">
            <h4 className="text-xs font-medium text-slate-600 uppercase tracking-widest mb-3">API Credits Remaining</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-500">Groq Llama 3</span>
                <span className="font-medium text-emerald-500">{credits?.gemini || 'Active (Pro)'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-500">ScraperAPI</span>
                <span className="font-medium text-gradient">{credits?.scraper || 'Active'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Graph (AI Extraction Volume) */}
        <div className="lg:col-span-2 bg-white rounded-[30px] p-6 shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-medium text-slate-800">AI Extraction Volume</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#007AFF]"></div>
                <span className="text-xs font-semibold text-slate-500">Extracted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <span className="text-xs font-semibold text-slate-500">Failed</span>
              </div>
              <select className="text-xs font-medium text-slate-500 bg-white/20 backdrop-blur-md border border-slate-200 rounded-lg px-2 py-1 outline-none">
                <option>This Week</option>
                <option>Last Week</option>
              </select>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                />
                <Line type="monotone" dataKey="extracted" stroke="#007AFF" strokeWidth={4} dot={{ r: 4, fill: '#007AFF', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="failed" stroke="#f87171" strokeWidth={3} dot={{ r: 3, fill: '#f87171', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. RED SECTION - TOP RECOMMENDED OPPORTUNITIES */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-lg font-medium text-slate-800">Recommended Opportunities</h3>
          <button 
            onClick={() => setViewMode('table')}
            className="text-sm font-medium text-gradient hover:underline flex items-center gap-1"
          >
            View More <ArrowRight size={14} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topMatches.map(opp => (
            <button 
              key={opp.id} 
              onClick={() => {
                setSelectedOppForScan(opp);
                setViewMode('details');
              }}
              className="text-left glass-panel rounded-[24px] p-6 hover:-translate-y-1 transition-all flex flex-col group"
            >
              <div className="flex justify-between items-start w-full mb-4">
                <div className="w-12 h-12 bg-white/40 text-slate-500 border border-slate-200/50 rounded-2xl flex items-center justify-center">
                  <Briefcase size={22} strokeWidth={2} />
                </div>
                <div className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-semibold tracking-widest border border-slate-200">
                  {opp.match_score}% MATCH
                </div>
              </div>
              <h4 className="font-medium text-slate-800 text-base line-clamp-1 mb-1">{opp.name}</h4>
              <p className="text-sm font-semibold text-slate-500 line-clamp-1 mb-4">{opp.funder}</p>
              
              <p className="text-xs text-slate-400 line-clamp-2 mb-6">
                {opp.opp_type || 'Opportunity overview not available. Click to view full analysis.'}
              </p>
              
              <div className="mt-auto flex items-center justify-between w-full border-t border-slate-100/50 pt-4">
                <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md text-slate-500 rounded-lg text-[11px] font-medium uppercase tracking-wider border border-white/40">
                  {opp.location || 'Durban'}
                </div>
                <div className="text-sm font-medium text-slate-500 group-hover:text-slate-800 transition-colors flex items-center gap-1">
                  Details <ArrowRight size={14} />
                </div>
              </div>
            </button>
          ))}
          {topMatches.length === 0 && !isLoading && (
            <div className="col-span-3 text-center py-8 text-slate-400">No scored opportunities available yet.</div>
          )}
        </div>
      </div>

      {/* 4. YELLOW SECTION - SAVED PORTALS */}
      <div className="flex flex-col gap-4 mb-10">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-lg font-medium text-slate-800">Featured Data Portals</h3>
          <button onClick={() => setIsPortalModalOpen(true)} className="text-sm font-medium text-slate-500 hover:text-gradient transition-colors">
            Manage Portals
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {featuredPortals.map(portal => (
            <div key={portal.id} className="min-w-[200px] bg-white rounded-[20px] p-4 shadow-sm border border-slate-100 flex items-center gap-4 hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <Database size={18} />
              </div>
              <div className="flex flex-col">
                <h5 className="text-sm font-medium text-slate-700 line-clamp-1">{portal.name || portal.url}</h5>
                <p className="text-xs font-semibold text-emerald-500">{portal.opportunities_found} Extractions</p>
              </div>
            </div>
          ))}
          
          {/* Add New Portal Tile */}
          <div onClick={() => setIsPortalModalOpen(true)} className="min-w-[200px] bg-white/20 backdrop-blur-md border-2 border-dashed border-slate-200 rounded-[20px] p-4 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
            <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Plus size={16} /> Add Portal
            </span>
          </div>
        </div>
      </div>


      {/* Manage Portals Modal */}
      {isPortalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Manage Portals</h2>
              <button onClick={() => setIsPortalModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {portals.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No portals configured yet. Add one below.</div>
              ) : (
                <div className="flex flex-col gap-3 mb-6">
                  {portals.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{p.name || p.url}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[250px]">{p.url}</p>
                      </div>
                      <button 
                        onClick={() => handleDeletePortal(p.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddPortal} className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">Add New Intelligence Portal URL</label>
                <div className="flex gap-3">
                  <input 
                    type="url" 
                    required 
                    value={newPortalUrl}
                    onChange={(e) => setNewPortalUrl(e.target.value)}
                    placeholder="https://example.com/tenders" 
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={isAddingPortal}
                    className="px-4 py-2 bg-[#007AFF] text-white text-sm font-medium rounded-xl hover:bg-[#007AFF]/90 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {isAddingPortal ? 'Adding...' : 'Add Portal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
