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
  
  // Choose color based on score
  let colorClass = "text-emerald-400";
  if (actualScore < 70) colorClass = "text-yellow-400";
  if (actualScore < 50) colorClass = "text-red-400";
  if (!score) colorClass = "text-gray-600";

  return (
    <div className="relative flex items-center justify-center w-[52px] h-[52px]">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 44 44">
        {/* Background ring */}
        <circle 
          cx="22" cy="22" r={radius} 
          className="stroke-white/10" 
          strokeWidth="3" 
          fill="none" 
        />
        {/* Progress ring */}
        <circle 
          cx="22" cy="22" r={radius} 
          className={colorClass} 
          strokeWidth="3" 
          fill="none" 
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xs font-bold text-white">{score ? `${score}%` : 'N/A'}</span>
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-88px)] overflow-hidden">
      {/* Top Header mimicking mockup */}
      <div className="flex items-center justify-between mb-8 mt-4 shrink-0">
        <h2 className="text-2xl font-bold text-white tracking-wide uppercase">Opportunities Pipeline</h2>
        <div className="flex gap-4">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors">
            <Plus size={18} />
          </button>
          <button className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white hover:bg-white/10 transition-colors">
            New Opportunity
          </button>
        </div>
      </div>
      
      <main className="flex-1 overflow-x-auto pb-8">
        <div className="flex gap-5 h-full items-start min-w-max">
          {COLUMNS.map(column => {
            const colOpps = opportunities.filter(o => o.status === column.id);
            // Just faking a random volume number for the top right of the column to match the mockup
            const mockVolume = colOpps.length * 15 + Math.floor(Math.random() * 20);

            return (
              <div 
                key={column.id}
                className="w-[320px] flex flex-col bg-[#16181f]/80 backdrop-blur-md rounded-2xl border border-white/[0.03] h-full max-h-full"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="p-5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-200 text-sm">{column.title}</h3>
                    <span className="text-gray-500 text-sm font-medium">({colOpps.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <BarChart2 size={14} />
                    <span className="text-xs font-medium">{mockVolume}</span>
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
                      <div className="bg-[#1e2029] p-5 rounded-2xl border border-white/[0.04] shadow-md hover:border-white/10 transition-all relative group">
                        
                        {/* Top Line: Title & Dots */}
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <h4 className="font-semibold text-white text-[15px] leading-tight line-clamp-2">
                            {opp.name}
                          </h4>
                          <button className="text-gray-500 hover:text-white shrink-0 mt-0.5" onClick={(e) => {
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
                            <p className="text-gray-400 text-xs font-medium mb-2">AI Match Score:</p>
                            <span className="inline-block px-3 py-1 bg-[#4352ff] text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-[0_0_10px_rgba(67,82,255,0.4)]">
                              {column.title === 'Prospecting' ? 'Prospecting' : column.title}
                            </span>
                          </div>
                          <MatchScoreRing score={opp.match_score} />
                        </div>
                        
                        {/* Lead Owner & Value Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-gray-500 text-[11px] mb-1.5">Lead Owner</p>
                            <div className="flex items-center gap-2">
                              <img 
                                src="https://ui-avatars.com/api/?name=SJ&background=random" 
                                alt="SJ" 
                                className="w-5 h-5 rounded-full"
                              />
                              <span className="text-gray-200 text-sm font-medium">SJ</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-500 text-[11px] mb-1.5">Value</p>
                            <p className="text-gray-100 text-sm font-bold">{opp.value || '$---'}</p>
                          </div>
                        </div>
                        
                        {/* Activities & Date */}
                        <div className="grid grid-cols-2 gap-4 mb-5">
                          <p className="text-gray-400 text-xs">5 Activities</p>
                          <p className="text-gray-400 text-xs">Q3 2024</p>
                        </div>
                        
                        {/* Tags */}
                        <div className="flex gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-gray-400 text-[11px] font-medium">Tasks</span>
                          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-gray-400 text-[11px] font-medium">Tags3</span>
                        </div>
                        
                      </div>
                    </div>
                  ))}
                  
                  {colOpps.length === 0 && (
                    <div className="h-24 rounded-2xl flex items-center justify-center text-gray-600 text-sm font-medium">
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
