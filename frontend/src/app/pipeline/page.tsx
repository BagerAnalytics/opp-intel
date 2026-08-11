'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, MoreVertical, TrendingUp, DollarSign, Activity, PieChart as PieChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';

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
  opp_type?: string;
  target_entity?: string;
}

const COLUMNS = [
  { id: 'interested', title: 'Prospecting' },
  { id: 'drafting', title: 'Qualification' },
  { id: 'submitted', title: 'Proposal Sent' },
  { id: 'won', title: 'Closed Won' },
  { id: 'lost', title: 'Closed Lost' },
];



const PIE_DATA = [
  { name: 'Closed Won', value: 65, color: '#10B981' }, // emerald-500
  { name: 'Prospecting', value: 25, color: '#3B82F6' }, // blue-500
  { name: 'Closed Lost', value: 10, color: '#EF4444' }  // red-500
];

const MatchScoreRing = ({ score }: { score: number | null }) => {
  const actualScore = score || 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (actualScore / 100) * circumference;
  
  let colorClass = "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]";
  if (actualScore < 70) colorClass = "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]";
  if (actualScore < 50) colorClass = "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]";
  if (!score) colorClass = "text-slate-200 drop-shadow-none";

  return (
    <div className="relative flex items-center justify-center w-[52px] h-[52px]">
      <div className="absolute inset-0 bg-white/20 backdrop-blur-md/50 backdrop-blur-md rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-white/50"></div>
      <svg className="transform -rotate-90 w-full h-full relative z-10" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={radius} className="stroke-slate-100" strokeWidth="2.5" fill="none" />
        <circle 
          cx="22" cy="22" r={radius} 
          className={colorClass} 
          stroke="currentColor"
          strokeWidth="3.5" 
          fill="none" 
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center z-20">
        <span className="text-[11px] font-semibold text-slate-800 tracking-tight">{score ? `${score}%` : 'N/A'}</span>
      </div>
    </div>
  );
};

export default function PipelinePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  // --- DYNAMIC DATA COMPUTATIONS ---
  const parseCurrency = (valStr: string | null) => {
    if (!valStr) return 0;
    const num = valStr.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(num);
    return isNaN(parsed) ? 0 : parsed;
  };

  const wonOpps = opportunities.filter(o => o.status === 'won');
  const lostOpps = opportunities.filter(o => o.status === 'lost');
  const prospectingOpps = opportunities.filter(o => o.status !== 'won' && o.status !== 'lost');

  const totalRevenue = wonOpps.reduce((sum, opp) => sum + parseCurrency(opp.value), 0);
  const formattedRevenue = totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  
  const withdrawnRevenue = lostOpps.reduce((sum, opp) => sum + parseCurrency(opp.value), 0);
  const formattedWithdrawn = withdrawnRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const totalFinished = wonOpps.length + lostOpps.length;
  const winRate = totalFinished === 0 ? 0 : Math.round((wonOpps.length / totalFinished) * 100);

  const PIE_DATA = [
    { name: 'Closed Won', value: wonOpps.length || (totalFinished === 0 ? 0 : 1), color: '#10B981' },
    { name: 'Prospecting', value: prospectingOpps.length, color: '#3B82F6' },
    { name: 'Closed Lost', value: lostOpps.length, color: '#EF4444' }
  ];

  // Distribute total revenue backward smoothly for the 8-month chart
  const REVENUE_DATA = totalRevenue === 0 ? [
    { name: 'Jan', value: 0 }, { name: 'Feb', value: 0 }, { name: 'Mar', value: 0 },
    { name: 'Apr', value: 0 }, { name: 'May', value: 0 }, { name: 'Jun', value: 0 },
    { name: 'Jul', value: 0 }, { name: 'Aug', value: 0 }
  ] : [
    { name: 'Jan', value: Math.round(totalRevenue * 0.2) }, 
    { name: 'Feb', value: Math.round(totalRevenue * 0.3) }, 
    { name: 'Mar', value: Math.round(totalRevenue * 0.45) }, 
    { name: 'Apr', value: Math.round(totalRevenue * 0.55) }, 
    { name: 'May', value: Math.round(totalRevenue * 0.5) }, 
    { name: 'Jun', value: Math.round(totalRevenue * 0.75) },
    { name: 'Jul', value: Math.round(totalRevenue * 0.85) }, 
    { name: 'Aug', value: totalRevenue }
  ];


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const apiUrl = 'https://opp-intel-production.up.railway.app';
      const response = await axios.get(`${apiUrl}/api/opportunities`).catch(() => ({ data: [] }));
      setOpportunities(response.data.filter((opp: Opportunity) => opp.status !== 'open' && opp.status !== 'closed'));
    } catch (error) {
      console.error("Error fetching opportunities", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (!draggedId) return;

    // Optimistic UI update
    setOpportunities(prev => prev.map(opp => 
      opp.id === draggedId ? { ...opp, status: targetStatus } : opp
    ));

    try {
      const apiUrl = 'https://opp-intel-production.up.railway.app';
      await axios.put(`${apiUrl}/api/opportunities/${draggedId}/status?status=${targetStatus}`);
    } catch (error) {
      console.error("Failed to update status", error);
      fetchData(); // Revert on failure
    }
    setDraggedId(null);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-[#f5f7fa]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-gradient" />
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Loading Market Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-88px)] bg-[#f5f7fa] overflow-y-auto overflow-x-hidden animate-in fade-in duration-300 scrollbar-hide">
      
      {/* TOP SECTION: ANALYTICS DASHBOARD */}
      <div className="p-8 pb-4 shrink-0">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Main Revenue Chart */}
          <div className="xl:col-span-2 bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Total Revenue</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-3xl font-semibold text-gradient">{formattedRevenue}</span>
                  <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    <TrendingUp size={12} className="mr-1" /> +8.4%
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white/20 backdrop-blur-md text-slate-500 rounded-xl text-xs font-medium hover:bg-slate-100">Monthly</button>
                <button className="px-4 py-2 gradient-accent rounded-xl text-xs font-medium shadow-md shadow-sm">Weekly</button>
              </div>
            </div>
            
            <div className="flex-1 min-h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dx={-10} tickFormatter={(val) => `$${val}k`} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    itemStyle={{ color: '#007AFF' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#007AFF" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Stats & Pie Chart */}
          <div className="flex flex-col gap-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
                  <DollarSign size={18} strokeWidth={2.5} />
                </div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Withdrawn</p>
                <h3 className="text-xl font-semibold text-slate-800">{formattedWithdrawn}</h3>
                <p className="text-[10px] font-medium text-rose-500 mt-1">-1.5% from last week</p>
              </div>
              <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                  <Activity size={18} strokeWidth={2.5} />
                </div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Win Rate</p>
                <h3 className="text-xl font-semibold text-slate-800">{winRate}%</h3>
                <p className="text-[10px] font-medium text-emerald-500 mt-1">+2.7% from last week</p>
              </div>
            </div>

            {/* Pipeline Distribution Pie Chart */}
            <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex-1 flex flex-col justify-center items-center relative">
              <h3 className="text-sm font-semibold text-slate-800 absolute top-6 left-6">Pipeline Distribution</h3>
              <div className="h-40 w-full mt-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PIE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {PIE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Pie Chart Legend */}
              <div className="flex items-center justify-center gap-6 mt-2">
                {PIE_DATA.map((entry, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">{entry.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{entry.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: KANBAN BOARD */}
      <div className="px-8 pb-10 flex-1 flex flex-col min-h-[600px]">
        <div className="flex items-center justify-between mb-6 mt-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Active Pipeline</h2>
            <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">Drag and drop to manage stages</p>
          </div>
        </div>

        {/* Board Container */}
        <div className="flex-1 overflow-hidden pb-4">
          <div className="flex gap-4 h-full w-full">
            {COLUMNS.map(column => {
              const colOpps = opportunities.filter(o => o.status === column.id);
              
              // Calculate dummy volume
              const mockVolume = colOpps.length * 45;

              return (
                <div 
                  key={column.id}
                  className="flex-1 min-w-0 flex flex-col bg-white/40 backdrop-blur-2xl rounded-[32px] border border-white shadow-[0_8px_32px_rgba(0,0,0,0.03)] h-full max-h-full"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <div className="p-6 flex items-center justify-between shrink-0 border-b border-white/60">
                    <div className="flex items-center gap-3">
                      <h3 className="font-extrabold text-slate-900 text-[16px] tracking-tight">{column.title}</h3>
                      <span className="text-white bg-[#007AFF] px-2.5 py-0.5 rounded-full text-xs font-medium shadow-md shadow-sm">{colOpps.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gradient bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                      <DollarSign size={14} strokeWidth={3} />
                      <span className="text-xs font-semibold">{mockVolume}k</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 px-5 py-5 overflow-y-auto space-y-4 scrollbar-hide">
                    {colOpps.map(opp => (
                      <div 
                        key={opp.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, opp.id)}
                        className="cursor-move group/card"
                      >
                        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] group-hover/card:-translate-y-1 group-hover/card:border-indigo-100 transition-all duration-300 relative">
                          
                          {/* Top Line: Title & Dots */}
                          <div className="flex justify-between items-start gap-4 mb-5">
                            <h4 className="font-semibold text-slate-800 text-[16px] leading-snug line-clamp-2 group-hover/card:text-gradient transition-colors">
                              {opp.name}
                            </h4>
                            <button className="text-slate-300 hover:text-rose-500 shrink-0 mt-0.5 transition-colors p-1.5 rounded-xl hover:bg-rose-50" onClick={(e) => {
                              e.stopPropagation();
                              if(confirm('Remove opportunity from pipeline?')) {
                                try {
                                  const apiUrl = 'https://opp-intel-production.up.railway.app';
                                  axios.put(`${apiUrl}/api/opportunities/${opp.id}/status?status=open`);
                                  setOpportunities(prev => prev.filter(o => o.id !== opp.id));
                                } catch (err) {}
                              }
                            }}>
                              <MoreVertical size={16} strokeWidth={2.5} />
                            </button>
                          </div>
                          
                          {/* Match Score & Funder */}
                          <div className="flex justify-between items-center mb-6 bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-slate-100/80">
                            <div>
                              <p className="text-slate-400 text-[10px] font-medium tracking-widest uppercase mb-1">Funder</p>
                              <p className="text-slate-700 text-sm font-extrabold line-clamp-1">{opp.funder}</p>
                            </div>
                            <MatchScoreRing score={opp.match_score} />
                          </div>
                          
                          {/* Lead Owner & Value Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-5">
                            <div>
                              <p className="text-slate-400 text-[10px] font-medium tracking-widest uppercase mb-2">Lead Owner</p>
                              <div className="flex items-center gap-2">
                                <img 
                                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(opp.target_entity || 'User')}&background=f5f7fa&color=3f20b3&rounded=true&bold=true`}
                                  alt="Owner" 
                                  className="w-6 h-6 rounded-full shadow-sm"
                                />
                                <span className="text-slate-700 text-[13px] font-extrabold line-clamp-1">{opp.target_entity || 'Unassigned'}</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-slate-400 text-[10px] font-medium tracking-widest uppercase mb-2">Value</p>
                              <p className="text-gradient text-[15px] font-semibold">{opp.value || '$---'}</p>
                            </div>
                          </div>
                          
                          {/* Tags */}
                          <div className="flex gap-2 pt-5 border-t border-slate-100">
                            <span className="px-3 py-1.5 rounded-xl bg-[#f5f7fa] text-slate-500 text-[10px] font-semibold uppercase tracking-widest border border-slate-100">
                              {opp.opp_type || 'Opportunity'}
                            </span>
                          </div>
                          
                        </div>
                      </div>
                    ))}
                    
                    {colOpps.length === 0 && (
                      <div className="h-32 rounded-[24px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-white/50 text-slate-400 text-sm font-medium tracking-wide">
                        No deals here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
