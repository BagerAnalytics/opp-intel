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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const avgScore = opportunities.length > 0 
    ? Math.round(opportunities.reduce((acc, curr) => acc + (curr.match_score || 0), 0) / opportunities.length)
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Welcome back, Admin.</h1>
        <p className="text-slate-500 text-lg">You have {opportunities.length} open opportunities waiting to be reviewed.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-500 text-sm tracking-wide uppercase">OPEN PIPELINE</h3>
            <Database className="text-emerald-600" size={20} />
          </div>
          <p className="text-4xl font-bold text-slate-900">{opportunities.length}</p>
        </div>
        
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-500 text-sm tracking-wide uppercase">AVG FIT SCORE</h3>
            <TrendingUp className="text-emerald-600" size={20} />
          </div>
          <p className="text-4xl font-bold text-slate-900">
            {avgScore}%
          </p>
        </div>

        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-emerald-700 text-sm tracking-wide uppercase">ACTION REQUIRED</h3>
            <CheckCircle className="text-emerald-600" size={20} />
          </div>
          <p className="text-4xl font-bold text-emerald-900">
            {opportunities.filter(o => o.match_score === null).length}
          </p>
          <p className="text-xs text-emerald-600 mt-2 font-medium uppercase tracking-wider">Unscored grants</p>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Inbox</h2>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
          <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> High Match</span>
          <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div> Med Match</span>
        </div>
      </div>

      <div className="space-y-6">
        {opportunities.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Inbox Zero!</h3>
            <p className="text-slate-500">Run the scrapers to find new grants and tenders.</p>
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
