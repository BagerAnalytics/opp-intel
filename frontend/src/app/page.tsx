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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const [oppResponse, contactsResponse] = await Promise.all([
        axios.get(`${apiUrl}/api/opportunities`),
        axios.get(`${apiUrl}/api/contacts`)
      ]);
      const openOpps = oppResponse.data.filter((opp: Opportunity) => opp.status === 'open');
      setOpportunities(openOpps);
      setContacts(contactsResponse.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const scoredOpps = opportunities.filter(o => o.match_score !== null);
  const highMatches = scoredOpps.filter(o => o.match_score! >= 80).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-8">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Opportunity Intelligence</h2>
        <p className="text-gray-500 mt-2 text-sm">Analyze and score global funding opportunities against your business profile.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Database size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Open Records</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {isLoading ? <Loader2 className="animate-spin inline" size={24}/> : opportunities.length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">AI Scored</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {isLoading ? <Loader2 className="animate-spin inline" size={24}/> : scoredOpps.length}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">High Match (&gt;80%)</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {isLoading ? <Loader2 className="animate-spin inline" size={24}/> : highMatches}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Inbox (New Opportunities)</h3>
          <div className="text-sm font-medium text-gray-500">
            Showing {opportunities.length} live records
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
            <Loader2 size={40} className="animate-spin text-gray-400" />
            <p className="text-sm font-medium">Loading intelligence core...</p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-100">
            No opportunities found in the database.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {opportunities.map(opp => (
              <OpportunityCard key={opp.id} opp={opp} contacts={contacts} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
