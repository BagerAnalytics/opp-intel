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
      // Filter out 'open' since they belong on the dashboard
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

    // Optimistic UI update
    setOpportunities(prev => prev.map(o => o.id === draggedId ? { ...o, status } : o));
    setDraggedId(null);

    // Persist to backend
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.put(`${apiUrl}/api/opportunities/${draggedId}/status?status=${status}`);
    } catch (error) {
      console.error("Failed to update status", error);
      // Revert on failure
      fetchData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#f8faf9] overflow-hidden">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shrink-0">
        <h2 className="text-lg font-semibold text-gray-800">Application Pipeline</h2>
      </header>
      
      <main className="flex-1 overflow-x-auto p-8">
        <div className="flex gap-6 h-full items-start min-w-max">
          {COLUMNS.map(column => (
            <div 
              key={column.id}
              className="w-80 flex flex-col bg-gray-50 rounded-xl border border-gray-200 h-full max-h-full"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="p-4 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
                <h3 className="font-semibold text-gray-800 flex items-center justify-between">
                  {column.title}
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
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
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all">
                      <h4 className="font-medium text-gray-900 text-sm mb-1">{opp.name}</h4>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">{opp.funder}</p>
                      
                      <div className="flex justify-between items-center text-xs">
                        {opp.match_score ? (
                          <span className={`px-2 py-1 rounded font-medium ${opp.match_score >= 80 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                            {opp.match_score}% Fit
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Unscored</span>
                        )}
                        <span className="text-gray-500">{opp.closing_date}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {opportunities.filter(o => o.status === column.id).length === 0 && (
                  <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm font-medium">
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
