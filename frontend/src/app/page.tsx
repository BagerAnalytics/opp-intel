'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import OpportunityCard from '@/components/OpportunityCard';
import { Loader2, TrendingUp, CheckCircle, Database } from 'lucide-react';

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
}

export default function Home() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const avgScore = opportunities.length > 0 
    ? Math.round(opportunities.reduce((acc, curr) => acc + (curr.match_score || 0), 0) / opportunities.length)
    : 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome back, Admin.</h1>
        <p className="text-gray-400 text-lg">You have {opportunities.length} open opportunities waiting to be reviewed.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#16181f]/80 backdrop-blur-md rounded-2xl border border-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-400 text-sm">OPEN PIPELINE</h3>
            <Database className="text-[#4352ff]" size={20} />
          </div>
          <p className="text-4xl font-bold text-white">{opportunities.length}</p>
        </div>
        
        <div className="bg-[#16181f]/80 backdrop-blur-md rounded-2xl border border-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-400 text-sm">AVG FIT SCORE</h3>
            <TrendingUp className="text-emerald-400" size={20} />
          </div>
          <p className="text-4xl font-bold text-white">
            {avgScore}%
          </p>
        </div>

        <div className="bg-[#1e2029]/80 backdrop-blur-md rounded-2xl border border-blue-500/20 p-6 relative overflow-hidden shadow-[0_0_20px_rgba(67,82,255,0.1)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#4352ff]/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="font-semibold text-blue-400 text-sm">ACTION REQUIRED</h3>
            <CheckCircle className="text-blue-400" size={20} />
          </div>
          <p className="text-4xl font-bold text-white relative z-10">
            {opportunities.filter(o => o.match_score === null).length}
          </p>
          <p className="text-xs text-blue-300/70 mt-2 relative z-10 font-medium uppercase tracking-wider">Unscored grants</p>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-wide uppercase">Inbox</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div> High Match</span>
          <span className="flex items-center gap-1 ml-4"><div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div> Med Match</span>
        </div>
      </div>

      <div className="space-y-6">
        {opportunities.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center border-dashed">
            <h3 className="text-xl font-medium text-gray-300 mb-2">Inbox Zero!</h3>
            <p className="text-gray-500">Run the scrapers to find new grants and tenders.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {opportunities.map(opp => (
              <OpportunityCard key={opp.id} opp={opp} contacts={contacts} complianceDocs={complianceDocs} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
