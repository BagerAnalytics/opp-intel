'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Plus, MoreVertical, BarChart2 } from 'lucide-react';

interface Opportunity {
  id: number;
  name: string;
  funder: string;
  closing_date: string;
  value: string;
  description: string;
  match_score: number | null;
  status: string;
}

const COLUMNS = [
  { id: 'interested', title: 'Prospecting' },
  { id: 'drafting', title: 'Qualification' },
  { id: 'submitted', title: 'Proposal Sent' },
  { id: 'won', title: 'Closed Won' },
  { id: 'lost', title: 'Closed Lost' },
];

const MatchScoreRing = ({ score }: { score: number | null }) => {
  const actualScore = score || 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (actualScore / 100) * circumference;
  
  let colorClass = "text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]";
  if (actualScore < 70) colorClass = "text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]";
  if (actualScore < 50) colorClass = "text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.4)]";
  if (!score) colorClass = "text-slate-200 drop-shadow-none";

  return (
    <div className="relative flex items-center justify-center w-[52px] h-[52px]">
      <div className="absolute inset-0 bg-white/60 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"></div>
      <svg className="transform -rotate-90 w-full h-full relative z-10" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={radius} className="stroke-slate-100" strokeWidth="3" fill="none" />
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
        <span className="text-[11px] font-extrabold text-slate-900 tracking-tight">{score ? `${score}%` : 'N/A'}</span>
      </div>
    </div>
  );
};

export default function PipelinePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${apiUrl}/api/opportunities`);
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

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedId === null) return;
    
    const opp = opportunities.find(o => o.id === draggedId);
    if (!opp || opp.status === status) return;

    setOpportunities(prev => prev.map(o => o.id === draggedId ? { ...o, status } : o));
    setDraggedId(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.put(`${apiUrl}/api/opportunities/${draggedId}/status?status=${status}`);
    } catch (error) {
      console.error("Failed to update status", error);
      fetchData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-88px)] overflow-hidden relative">
      <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl -z-10 pointer-events-none" />
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8 mt-4 shrink-0 px-2 relative z-10">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 tracking-tight">Opportunities Pipeline</h2>
        <div className="flex gap-4">
          <button className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-white/60 text-slate-500 hover:text-slate-900 shadow-sm hover:shadow-md transition-all duration-300">
            <Plus size={20} strokeWidth={2.5} />
          </button>
          <button className="px-6 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-bold text-white hover:shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all duration-300 shadow-sm flex items-center gap-2">
            New Opportunity
          </button>
        </div>
      </div>
      
      <main className="flex-1 overflow-x-auto pb-8 px-2 relative z-10">
        <div className="flex gap-6 h-full items-start min-w-max">
          {COLUMNS.map(column => {
            const colOpps = opportunities.filter(o => o.status === column.id);
            const mockVolume = colOpps.length * 15 + Math.floor(Math.random() * 20);

            return (
              <div 
                key={column.id}
                className="w-[340px] flex flex-col bg-slate-50/60 backdrop-blur-xl rounded-3xl border border-white/50 shadow-[0_4px_24px_rgb(0,0,0,0.02)] h-full max-h-full"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="p-5 flex items-center justify-between shrink-0 border-b border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <h3 className="font-extrabold text-slate-900 text-[15px] tracking-tight">{column.title}</h3>
                    <span className="text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-full text-xs font-bold">{colOpps.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 bg-white/60 px-2 py-1 rounded-lg border border-slate-100/50 shadow-sm">
                    <BarChart2 size={14} strokeWidth={2.5} />
                    <span className="text-xs font-bold">${mockVolume}k</span>
                  </div>
                </div>
                
                <div className="flex-1 px-4 py-4 overflow-y-auto space-y-4 scrollbar-hide">
                  {colOpps.map(opp => (
                    <div 
                      key={opp.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, opp.id)}
                      className="cursor-move group/card"
                    >
                      <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] group-hover/card:-translate-y-1 group-hover/card:border-emerald-100/60 transition-all duration-300 relative">
                        
                        {/* Top Line: Title & Dots */}
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <h4 className="font-extrabold text-slate-900 text-[15px] leading-tight line-clamp-2 group-hover/card:text-emerald-700 transition-colors">
                            {opp.name}
                          </h4>
                          <button className="text-slate-400 hover:text-slate-900 shrink-0 mt-0.5 transition-colors p-1 rounded-md hover:bg-slate-100" onClick={(e) => {
                            e.stopPropagation();
                            if(confirm('Remove opportunity from pipeline?')) {
                              try {
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                axios.put(`${apiUrl}/api/opportunities/${opp.id}/status?status=open`);
                                setOpportunities(prev => prev.filter(o => o.id !== opp.id));
                              } catch (err) {}
                            }
                          }}>
                            <MoreVertical size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                        
                        {/* Match Score & Status Pill */}
                        <div className="flex justify-between items-center mb-6 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-2">AI Match Score</p>
                            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-100 shadow-[inset_0_2px_4px_rgba(255,255,255,1)]">
                              {column.title === 'Prospecting' ? 'Prospecting' : column.title}
                            </span>
                          </div>
                          <MatchScoreRing score={opp.match_score} />
                        </div>
                        
                        {/* Lead Owner & Value Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-5">
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-1.5">Lead Owner</p>
                            <div className="flex items-center gap-2">
                              <img 
                                src="https://ui-avatars.com/api/?name=SJ&background=0D8BD9&color=fff&rounded=true&bold=true" 
                                alt="SJ" 
                                className="w-5 h-5 rounded-full ring-2 ring-white shadow-sm"
                              />
                              <span className="text-slate-700 text-[13px] font-bold">SJ</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-1.5">Value</p>
                            <p className="text-slate-900 text-[14px] font-extrabold">{opp.value || '$---'}</p>
                          </div>
                        </div>
                        
                        {/* Activities & Date */}
                        <div className="grid grid-cols-2 gap-4 mb-5 border-t border-slate-100/60 pt-4">
                          <p className="text-slate-500 text-xs font-semibold">5 Activities</p>
                          <p className="text-slate-500 text-xs font-semibold">Q3 2024</p>
                        </div>
                        
                        {/* Tags */}
                        <div className="flex gap-2">
                          <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-[11px] font-bold shadow-sm">Tasks</span>
                          <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-[11px] font-bold shadow-sm">Tags3</span>
                        </div>
                        
                      </div>
                    </div>
                  ))}
                  
                  {colOpps.length === 0 && (
                    <div className="h-32 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-white/30 text-slate-400 text-sm font-bold tracking-wide">
                      No deals here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
