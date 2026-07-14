'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

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
  { id: 'interested', title: 'Interested' },
  { id: 'drafting', title: 'Drafting' },
  { id: 'submitted', title: 'Submitted' },
  { id: 'won', title: 'Won 🏆' },
  { id: 'lost', title: 'Lost' },
  { id: 'closed', title: 'Closed (Expired)' }
];

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
      setOpportunities(response.data.filter((opp: Opportunity) => opp.status !== 'open'));
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <div className="mb-6 px-8 pt-8 shrink-0">
        <h2 className="text-2xl font-bold text-white tracking-tight">Application Pipeline</h2>
        <p className="text-gray-400 text-sm mt-1">Drag and drop to track progress.</p>
      </div>
      
      <main className="flex-1 overflow-x-auto px-8 pb-8">
        <div className="flex gap-6 h-full items-start min-w-max pb-4">
          {COLUMNS.map(column => (
            <div 
              key={column.id}
              className="w-80 flex flex-col glass-panel rounded-xl h-full max-h-full"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="p-4 border-b border-white/5 bg-white/5 rounded-t-xl shrink-0 backdrop-blur-md">
                <h3 className="font-semibold text-gray-200 flex items-center justify-between">
                  {column.title}
                  <span className="bg-white/10 text-gray-300 px-2 py-0.5 rounded-full text-xs font-medium">
                    {opportunities.filter(o => o.status === column.id).length}
                  </span>
                </h3>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {opportunities.filter(o => o.status === column.id).map(opp => (
                  <div 
                    key={opp.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, opp.id)}
                    className="cursor-move"
                  >
                    <div className="bg-[#18181b] p-4 rounded-lg shadow-sm border border-white/5 hover:border-indigo-500/50 hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)] transition-all relative group">
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                            await axios.put(`${apiUrl}/api/opportunities/${opp.id}/status?status=open`);
                            setOpportunities(prev => prev.filter(o => o.id !== opp.id));
                          } catch (err) {
                            console.error("Failed to remove from pipeline", err);
                          }
                        }}
                        className="absolute top-3 right-3 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from Pipeline (Move back to Inbox)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                      <h4 className="font-medium text-white text-sm mb-1 pr-6 tracking-tight">{opp.name}</h4>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">{opp.funder}</p>
                      
                      <div className="flex justify-between items-center text-xs">
                        {opp.match_score ? (
                          <span className={`px-2 py-1 rounded-full font-medium border
                            ${opp.match_score >= 80 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                            {opp.match_score}% Fit
                          </span>
                        ) : (
                          <span className="text-gray-500 italic">Unscored</span>
                        )}
                        <span className="text-gray-500">{opp.closing_date}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {opportunities.filter(o => o.status === column.id).length === 0 && (
                  <div className="h-24 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center text-gray-500 text-sm font-medium">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
