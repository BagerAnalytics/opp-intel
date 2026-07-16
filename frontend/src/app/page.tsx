'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import OpportunityCard from '@/components/OpportunityCard';
import AddOpportunityModal from '@/components/AddOpportunityModal';
import { Loader2, TrendingUp, CheckCircle, Database, Plus } from 'lucide-react';

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
}

export default function Home() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTopMatches, setShowTopMatches] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const [oppResponse, contactsResponse, complianceResponse] = await Promise.all([
        axios.get(`${apiUrl}/api/opportunities`),
        axios.get(`${apiUrl}/api/contacts`),
        axios.get(`${apiUrl}/api/compliance`)
      ]);
      const openOpps = oppResponse.data.filter((opp: Opportunity) => opp.status === 'open');
      setOpportunities(openOpps);
      setContacts(contactsResponse.data);
      setComplianceDocs(complianceResponse.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const handleRunScrapers = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.post(`${apiUrl}/api/scrapers/trigger-all`);
      alert("All scrapers (including the AI Discovery Engine) have been successfully triggered! They are now hunting for opportunities in the background. Check back in a few minutes to see the new data.");
      await fetchData(); // Refresh data to see scanning placeholders
    } catch (error) {
      console.error("Error running scrapers", error);
      alert("Failed to run scrapers. Please check the backend logs.");
    }
  };

  const filteredOpportunities = opportunities.filter(opp => {
    // 1. Tab filtering
    let tabMatch = true;
    if (activeTab !== 'All') {
      if (activeTab === 'Grants' && opp.opp_type !== 'Grant') tabMatch = false;
      else if (activeTab === 'Tenders' && opp.opp_type !== 'Tender') tabMatch = false;
      else if (activeTab === 'Awards' && opp.opp_type !== 'Award') tabMatch = false;
      else if (activeTab === 'Fellowships / Other' && opp.opp_type !== 'Other') tabMatch = false;
      else if (activeTab === 'Manually Added' && (opp.source !== 'Manual Entry' && opp.source !== 'Smart Link Extraction')) tabMatch = false;
    }
    if (!tabMatch) return false;

    // 2. Search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = opp.name?.toLowerCase().includes(query) || false;
      const matchFunder = opp.funder?.toLowerCase().includes(query) || false;
      if (!matchName && !matchFunder) return false;
    }

    // 3. Top Matches filtering
    if (showTopMatches && (opp.match_score || 0) < 80) {
      return false;
    }

    return true;
  });

  const kpiAvgScore = filteredOpportunities.length > 0 
    ? Math.round(filteredOpportunities.reduce((acc, curr) => acc + (curr.match_score || 0), 0) / filteredOpportunities.length)
    : 0;
    
  const topMatchesCount = filteredOpportunities.filter(o => (o.match_score || 0) >= 80).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-40 left-0 w-72 h-72 bg-sky-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 tracking-tight mb-2">Welcome back, Admin.</h1>
          <p className="text-slate-500 text-lg font-medium">You have <span className="text-emerald-600 font-bold">{opportunities.length}</span> open opportunities waiting to be reviewed.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-300 shadow-sm"
          >
            <Plus size={18} />
            Add Opportunity
          </button>
          <button 
            onClick={handleRunScrapers}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-bold text-white hover:shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all duration-300 shadow-sm"
          >
            Run AI Scrapers (Force Sync)
          </button>
        </div>
      </div>
      
      <AddOpportunityModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchData} 
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full blur-2xl -z-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-500 text-[13px] tracking-widest uppercase">Filtered Pipeline</h3>
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <Database className="text-emerald-600" size={20} strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-5xl font-extrabold text-slate-900 tracking-tight">{filteredOpportunities.length}</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-full blur-2xl -z-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-500 text-[13px] tracking-widest uppercase">Avg Match Score</h3>
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <TrendingUp className="text-emerald-600" size={20} strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-5xl font-extrabold text-slate-900 tracking-tight">
            {kpiAvgScore}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl border border-emerald-400/30 p-7 shadow-[0_8px_30px_rgba(16,185,129,0.2)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -z-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-xl -z-10" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-emerald-50 text-[13px] tracking-widest uppercase">Top Matches</h3>
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <CheckCircle className="text-white" size={20} strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-5xl font-extrabold text-white tracking-tight">
            {topMatchesCount}
          </p>
          <p className="text-[13px] text-emerald-100 mt-3 font-semibold uppercase tracking-widest">Score 80+</p>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-slate-200">
        <div className="w-full md:w-1/2">
          <input 
            type="text" 
            placeholder="Search opportunities by name or funder..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-600">Top Matches Only (80+)</span>
          <button 
            onClick={() => setShowTopMatches(!showTopMatches)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${showTopMatches ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${showTopMatches ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Grants', 'Tenders', 'Awards', 'Fellowships / Other', 'Manually Added'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                activeTab === tab 
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20' 
                  : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-5 text-[13px] font-bold tracking-wide uppercase text-slate-500">
          <span className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            High Match
          </span>
          <span className="flex items-center gap-2">
            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
            Med Match
          </span>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {filteredOpportunities.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-16 text-center border border-dashed border-slate-300 shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No {activeTab === 'All' ? 'opportunities' : activeTab.toLowerCase()} found</h3>
            <p className="text-slate-500 text-lg">Run the scrapers to find new ones, or change the filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredOpportunities.map(opp => (
              <OpportunityCard key={opp.id} opp={opp} contacts={contacts} complianceDocs={complianceDocs} onDeleteSuccess={fetchData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
