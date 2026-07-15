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
  { id: 'won', title: 'Negotiation' },
  { id: 'lost', title: 'Closed Won' },
];

const MatchScoreRing = ({ score }: { score: number | null }) => {
  const actualScore = score || 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (actualScore / 100) * circumference;
  
  let colorClass = "text-emerald-500";
  if (actualScore < 70) colorClass = "text-yellow-500";
  if (actualScore < 50) colorClass = "text-red-500";
  if (!score) colorClass = "text-slate-300";

  return (
    <div className="relative flex items-center justify-center w-[52px] h-[52px]">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 44 44">
        <circle 
          cx="22" cy="22" r={radius} 
          className="stroke-slate-100" 
          strokeWidth="3" 
          fill="none" 
        />
        <circle 
          cx="22" cy="22" r={radius} 
          className={colorClass} 
          stroke="currentColor"
          strokeWidth="3" 
          fill="none" 
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xs font-bold text-slate-900">{score ? `${score}%` : 'N/A'}</span>
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-88px)] overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8 mt-4 shrink-0 px-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">Opportunities Pipeline</h2>
        <div className="flex gap-4">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm transition-colors">
            <Plus size={18} />
          </button>
          <button className="px-5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
            New Opportunity
          </button>
        </div>
      </div>
      
      <main className="flex-1 overflow-x-auto pb-8 px-2">
        <div className="flex gap-5 h-full items-start min-w-max">
          {COLUMNS.map(column => {
            const colOpps = opportunities.filter(o => o.status === column.id);
            const mockVolume = colOpps.length * 15 + Math.floor(Math.random() * 20);

            return (
              <div 
                key={column.id}
                className="w-[320px] flex flex-col bg-slate-50 rounded-2xl border border-slate-200 shadow-sm h-full max-h-full"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="p-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{column.title}</h3>
                    <span className="text-slate-500 text-sm font-medium">({colOpps.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <BarChart2 size={14} />
                    <span className="text-xs font-semibold">{mockVolume}</span>
                  </div>
                </div>
                
                <div className="flex-1 px-3 pb-4 overflow-y-auto space-y-3 scrollbar-hide">
                  {colOpps.map(opp => (
                    <div 
                      key={opp.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, opp.id)}
                      className="cursor-move"
                    >
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition-all relative group">
                        
                        {/* Top Line: Title & Dots */}
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <h4 className="font-bold text-slate-900 text-[15px] leading-tight line-clamp-2">
                            {opp.name}
                          </h4>
                          <button className="text-slate-400 hover:text-slate-900 shrink-0 mt-0.5 transition-colors" onClick={(e) => {
                            e.stopPropagation();
                            if(confirm('Remove opportunity from pipeline?')) {
                              try {
                                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                axios.put(`${apiUrl}/api/opportunities/${opp.id}/status?status=open`);
                                setOpportunities(prev => prev.filter(o => o.id !== opp.id));
                              } catch (err) {}
                            }
                          }}>
                            <MoreVertical size={16} />
                          </button>
                        </div>
                        
                        {/* Match Score & Status Pill */}
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <p className="text-slate-400 text-[11px] font-semibold tracking-wider uppercase mb-2">AI Match Score:</p>
                            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-100">
                              {column.title === 'Prospecting' ? 'Prospecting' : column.title}
                            </span>
                          </div>
                          <MatchScoreRing score={opp.match_score} />
                        </div>
                        
                        {/* Lead Owner & Value Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-slate-400 text-[11px] font-semibold tracking-wider uppercase mb-1.5">Lead Owner</p>
                            <div className="flex items-center gap-2">
                              <img 
                                src="https://ui-avatars.com/api/?name=SJ&background=random" 
                                alt="SJ" 
                                className="w-5 h-5 rounded-full"
                              />
                              <span className="text-slate-700 text-sm font-semibold">SJ</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[11px] font-semibold tracking-wider uppercase mb-1.5">Value</p>
                            <p className="text-slate-900 text-sm font-bold">{opp.value || '$---'}</p>
                          </div>
                        </div>
                        
                        {/* Activities & Date */}
                        <div className="grid grid-cols-2 gap-4 mb-5">
                          <p className="text-slate-500 text-xs font-medium">5 Activities</p>
                          <p className="text-slate-500 text-xs font-medium">Q3 2024</p>
                        </div>
                        
                        {/* Tags */}
                        <div className="flex gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-semibold">Tasks</span>
                          <span className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-semibold">Tags3</span>
                        </div>
                        
                      </div>
                    </div>
                  ))}
                  
                  {colOpps.length === 0 && (
                    <div className="h-24 rounded-2xl flex items-center justify-center border border-dashed border-slate-300 text-slate-400 text-sm font-medium">
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
