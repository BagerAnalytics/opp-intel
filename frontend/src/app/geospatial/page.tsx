'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('../../components/Map'), { ssr: false });

import axios from 'axios';
import { Globe, Activity, Plus, Trophy, X, Map as MapIcon, Calendar, DollarSign, Building } from 'lucide-react';

interface Opportunity {
  id: number;
  name: string;
  funder: string;
  value: string;
  location?: string;
  closing_date?: string;
  status: string;
}

interface RegionData {
  location: string;
  count: number;
  coordinates: { top: string, left: string };
  color: string;
}

const REGION_MAPPING: Record<string, { top: string, left: string, color: string }> = {
  'South Africa': { top: '75%', left: '55%', color: 'bg-emerald-500' },
  'Africa': { top: '60%', left: '50%', color: 'bg-indigo-500' },
  'West Africa': { top: '55%', left: '45%', color: 'bg-amber-500' },
  'Global': { top: '45%', left: '50%', color: 'bg-blue-500' },
  'Remote': { top: '35%', left: '30%', color: 'bg-purple-500' },
  'Europe': { top: '30%', left: '52%', color: 'bg-pink-500' },
  'North America': { top: '30%', left: '20%', color: 'bg-orange-500' },
};

export default function GeospatialPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'map' | 'portfolio'>('map');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAward, setNewAward] = useState({ name: '', funder: '', value: '', closing_date: '' });

  useEffect(() => {
    fetchOpps();
  }, []);

  const fetchOpps = async () => {
    try {
      const apiUrl = 'https://opp-intel-production.up.railway.app';
      const res = await axios.get(`${apiUrl}/api/opportunities`).catch(() => ({ data: [] }));
      setOpportunities(res.data);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiUrl = 'https://opp-intel-production.up.railway.app';
      await axios.post(`${apiUrl}/api/opportunities`, {
        ...newAward,
        status: 'won', // Force status to won
        description: 'Manually tracked award/funding',
        match_score: 100
      });
      setIsModalOpen(false);
      setNewAward({ name: '', funder: '', value: '', closing_date: '' });
      fetchOpps();
    } catch (error) {
      console.error("Error uploading award:", error);
      alert("Failed to upload award.");
    }
  };

  // Aggregate Data for Map
  const regions: Record<string, RegionData> = {};
  opportunities.filter(o => o.status === 'open').forEach(opp => {
    let loc = opp.location || 'Global';
    if (loc.toLowerCase().includes('south africa')) loc = 'South Africa';
    else if (loc.toLowerCase().includes('west africa')) loc = 'West Africa';
    else if (loc.toLowerCase().includes('africa')) loc = 'Africa';
    
    if (!regions[loc]) {
      const mapping = REGION_MAPPING[loc] || { top: `${30 + Math.random() * 40}%`, left: `${20 + Math.random() * 60}%`, color: 'bg-[#007AFF]' };
      regions[loc] = {
        location: loc,
        count: 0,
        coordinates: { top: mapping.top, left: mapping.left },
        color: mapping.color
      };
    }
    regions[loc].count += 1;
  });

  const sortedRegions = Object.values(regions).sort((a, b) => b.count - a.count);
  const wonOpportunities = opportunities.filter(o => o.status === 'won');

  return (
    <div className={`flex-1 flex flex-col ${viewMode === 'map' ? 'h-[calc(100vh-88px)] overflow-hidden' : 'min-h-[calc(100vh-88px)]'} bg-[#f5f7fa] animate-in fade-in duration-300 relative`}>
      
      {/* HEADER */}
      <div className="bg-white rounded-b-[40px] px-12 py-10 shadow-[0_12px_40px_rgb(0,0,0,0.03)] z-20 shrink-0 border-b border-slate-100 sticky top-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${viewMode === 'map' ? 'bg-indigo-50 text-gradient' : 'bg-emerald-50 text-emerald-600'}`}>
              {viewMode === 'map' ? <Globe size={24} /> : <Trophy size={24} />}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
                {viewMode === 'map' ? 'Geospatial Intelligence' : 'Won Portfolio'}
              </h1>
              <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">
                {viewMode === 'map' ? 'Global Pipeline Map' : 'Tracked Awards & Grants'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* View Toggle */}
            <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
              <button 
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-white text-gradient shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <MapIcon size={16} /> Map View
              </button>
              <button 
                onClick={() => setViewMode('portfolio')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${viewMode === 'portfolio' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Trophy size={16} /> Won Portfolio
              </button>
            </div>

            {viewMode === 'map' ? (
              <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-100">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-medium text-slate-600">Live Tracking</span>
              </div>
            ) : (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-medium shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Plus size={18} strokeWidth={2.5} /> Manual Upload
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      {viewMode === 'map' ? (
        <div className="flex-1 flex overflow-hidden p-8 gap-8 animate-in slide-in-from-bottom-4 duration-500 fade-in">
          
          {/* LEFT PANEL - TOP REGIONS */}
          <div className="w-[380px] glass-panel rounded-3xl border border-slate-100 flex flex-col overflow-hidden shrink-0 z-10">
            <div className="p-8 border-b border-slate-100 bg-[#f5f7fa]/50">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                Top Regions
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Active funding concentration</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div></div>
              ) : sortedRegions.length === 0 ? (
                <p className="text-center text-slate-400 p-10 font-medium">No location data found.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {sortedRegions.map((region, idx) => (
                    <div 
                      key={region.location}
                      onMouseEnter={() => setActiveRegion(region.location)}
                      onMouseLeave={() => setActiveRegion(null)}
                      className={`p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between border ${activeRegion === region.location ? 'bg-white/20 backdrop-blur-md border-slate-200 shadow-sm' : 'bg-white border-transparent hover:bg-white/20 backdrop-blur-md'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center font-semibold text-slate-300 text-lg">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800">{region.location}</h3>
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1 mt-0.5">
                            <Activity size={10} /> High Activity
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-semibold text-gradient">{region.count}</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Opps</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL - MAP VIEW */}
          <div className="flex-1 glass-panel rounded-3xl border border-slate-100 relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_3px,transparent_3px)] [background-size:24px_24px] opacity-50"></div>
            
            <div className="p-8 relative z-10 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">Intelligence Map</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">Geospatial distribution of pipeline</p>
              </div>
            </div>

            <div className="flex-1 relative w-full overflow-hidden" style={{ minHeight: '400px' }}>
                <Map opportunities={opportunities} />
              </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-12 overflow-y-auto animate-in slide-in-from-bottom-4 duration-500 fade-in">
          {wonOpportunities.length === 0 ? (
            <div className="w-full bg-white rounded-[32px] border border-slate-100 p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy size={40} />
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-2">Your Portfolio is Empty</h3>
              <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">You haven't tracked any won awards or closed grants yet. Use the manual upload button to add your first win!</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-medium shadow-lg shadow-emerald-600/20 transition-all inline-flex items-center gap-2"
              >
                <Plus size={18} strokeWidth={2.5} /> Upload First Win
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
              {wonOpportunities.map(opp => (
                <div key={opp.id} className="bg-white rounded-[32px] p-8 shadow-[0_4px_24px_rgb(0,0,0,0.02)] border border-slate-100 hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner shrink-0">
                      <Trophy size={24} />
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-semibold uppercase tracking-widest rounded-xl border border-emerald-200/50">
                      Awarded
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-slate-800 text-xl leading-tight mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {opp.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-slate-500 mb-8">
                    <Building size={14} />
                    <span className="text-sm font-medium">{opp.funder || 'Private Funder'}</span>
                  </div>
                  
                  <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                        <Calendar size={12} /> Award Date
                      </p>
                      <p className="text-sm font-medium text-slate-700">{opp.closing_date || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1 mb-1">
                        <DollarSign size={12} /> Value
                      </p>
                      <p className="text-lg font-semibold text-emerald-600">{opp.value || 'Undisclosed'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MANUAL UPLOAD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-[#f5f7fa]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Trophy size={20} />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Log Won Opportunity</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <form onSubmit={handleManualUpload} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Award / Project Name</label>
                <input 
                  type="text" 
                  required
                  value={newAward.name}
                  onChange={(e) => setNewAward({...newAward, name: e.target.value})}
                  placeholder="e.g. Agripreneur of the Year 2024"
                  className="w-full px-5 py-3.5 bg-white/20 backdrop-blur-md border-b-2 border-slate-200 focus:bg-white focus:border-emerald-500 outline-none transition-all font-medium text-slate-800 placeholder:font-semibold placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Awarding Body / Funder</label>
                <input 
                  type="text" 
                  required
                  value={newAward.funder}
                  onChange={(e) => setNewAward({...newAward, funder: e.target.value})}
                  placeholder="e.g. African Farming Magazine"
                  className="w-full px-5 py-3.5 bg-white/20 backdrop-blur-md border-b-2 border-slate-200 focus:bg-white focus:border-emerald-500 outline-none transition-all font-medium text-slate-800 placeholder:font-semibold placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Funding Value</label>
                  <input 
                    type="text" 
                    value={newAward.value}
                    onChange={(e) => setNewAward({...newAward, value: e.target.value})}
                    placeholder="e.g. $50,000"
                    className="w-full px-5 py-3.5 bg-white/20 backdrop-blur-md border-b-2 border-slate-200 focus:bg-white focus:border-emerald-500 outline-none transition-all font-medium text-slate-800 placeholder:font-semibold placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Date Awarded</label>
                  <input 
                    type="date" 
                    required
                    value={newAward.closing_date}
                    onChange={(e) => setNewAward({...newAward, closing_date: e.target.value})}
                    className="w-full px-5 py-3.5 bg-white/20 backdrop-blur-md border-b-2 border-slate-200 focus:bg-white focus:border-emerald-500 outline-none transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-slate-500 font-medium hover:bg-white/20 backdrop-blur-md rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
                >
                  Save to Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
