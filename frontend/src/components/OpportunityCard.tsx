'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Loader2, Zap, Calendar, Users, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Gift, ListChecks, FileText, Trophy, Target, AlertCircle } from 'lucide-react';

interface OpportunityCardProps {
  opp: {
    id: number;
    name: string;
    funder: string;
    closing_date: string | null;
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
  };
  contacts?: any[];
  complianceDocs?: any[];
}

export default function OpportunityCard({ opp: initialOpp, contacts = [], complianceDocs = [] }: OpportunityCardProps) {
  const [opp, setOpp] = useState(initialOpp);
  const [isScoring, setIsScoring] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [scoreData, setScoreData] = useState<{score: number | null, reasoning: string | null, strategy: string | null}>({
    score: opp.match_score,
    reasoning: opp.match_reasoning,
    strategy: opp.strategy
  });

  const handleScoreMatch = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent expanding card when clicking score
    setIsScoring(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/opportunities/${opp.id}/score`);
      setScoreData({
        score: response.data.match_score,
        reasoning: response.data.reasoning,
        strategy: response.data.strategy
      });
      setIsExpanded(true); // Auto expand to show reasoning
    } catch (error) {
      console.error("Failed to score opportunity", error);
    } finally {
      setIsScoring(false);
    }
  };

  const hasScore = scoreData.score !== null;
  const hasDeepData = opp.benefits || opp.eligibility_criteria || opp.selection_criteria;
  const warmConnections = contacts.filter(c => c.organization?.toLowerCase().includes(opp.funder?.toLowerCase() || 'unmatchable') || opp.funder?.toLowerCase().includes(c.organization?.toLowerCase() || 'unmatchable'));

  // Calculate missing compliance docs
  const missingDocs = complianceDocs
    .filter(doc => doc.status !== 'Uploaded')
    .filter(doc => (opp.eligibility_criteria || '').toLowerCase().includes(doc.document_name.toLowerCase()) || 
                   (opp.application_process || '').toLowerCase().includes(doc.document_name.toLowerCase()));

  return (
    <div className={`premium-card glow-border rounded-xl overflow-hidden cursor-pointer relative group
      ${missingDocs.length > 0 ? '!border-red-500/30' : 
        hasScore && scoreData.score! >= 80 ? '!border-emerald-500/30' : ''}
    `} onClick={() => setIsExpanded(!isExpanded)}>
      
      {/* Top Bar / Summary */}
      <div className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start">
        
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white leading-tight tracking-tight">{opp.name}</h3>
            {hasScore && (
              <span className={`px-3 py-1 text-xs font-bold rounded-full border
                ${scoreData.score! >= 80 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[inset_0_0_12px_rgba(16,185,129,0.1)]' 
                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[inset_0_0_12px_rgba(234,179,8,0.1)]'}`}>
                {scoreData.score}% Match
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-400 font-medium">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-gray-500" /> 
              {opp.funder}
              {warmConnections.length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_0_12px_rgba(59,130,246,0.1)]">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
                  Warm Connection: {warmConnections[0].name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" /> {opp.closing_date || "Open"}
            </div>
          </div>
            
          <p className={`text-gray-400 text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
            {opp.description || "No description provided."}
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2 text-sm">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Calendar size={14} />
              <span>{opp.closing_date || "Open"}</span>
            </div>
            {opp.value && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <Gift size={14} />
                <span>{opp.value}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-gray-500">
              <Users size={14} />
              <span className="capitalize">{opp.status}</span>
            </div>
          </div>
          
          {missingDocs.length > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-semibold border border-red-500/20 shadow-[inset_0_0_12px_rgba(239,68,68,0.1)]">
              <AlertCircle size={14} className="text-red-400" />
              Missing Docs: {missingDocs.map(d => d.document_name).join(', ')}
            </div>
          )}
        </div>

        <div className="shrink-0 w-full md:w-auto flex flex-row md:flex-col items-center gap-3">
          <div className="flex flex-col gap-2 w-full md:w-auto relative z-10">
            {opp.status === "open" && (
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                    await axios.put(`${apiUrl}/api/opportunities/${opp.id}/status?status=interested`);
                    window.location.reload();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-indigo-500"
              >
                Add to Pipeline
              </button>
            )}
            
            <button 
              onClick={handleScoreMatch}
              disabled={isScoring || hasScore}
              className={`w-full md:w-auto px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 border backdrop-blur-md
                ${hasScore 
                  ? 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed' 
                  : 'bg-white/10 text-white border-white/10 hover:bg-white/15 hover:border-white/20 shadow-sm'}`}
            >
              {isScoring ? (
                <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
              ) : hasScore ? (
                'Analyzed'
              ) : (
                <><Zap size={16} className="text-indigo-400" /> Analyze Fit</>
              )}
            </button>
          </div>
          
          <button className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors self-start md:self-center mt-2 md:mt-0 relative z-10">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Expanded Deep Data Section */}
      {isExpanded && (
        <div className="mt-4 pt-6 border-t border-white/5 p-6 bg-black/20" onClick={(e) => e.stopPropagation()}>
          
          {hasScore && scoreData.reasoning && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-5 bg-yellow-500/5 rounded-xl border border-yellow-500/10 text-sm leading-relaxed shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-yellow-500 font-semibold text-base tracking-tight">
                  <Zap size={18} className="fill-yellow-500/50" /> AI Match Reasoning
                </div>
                <p className="text-gray-300">{scoreData.reasoning}</p>
              </div>
              {scoreData.strategy && (
                <div className="p-5 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-sm leading-relaxed shadow-sm">
                  <div className="flex items-center gap-2 mb-3 text-indigo-400 font-semibold text-base tracking-tight">
                    <Target size={18} className="fill-indigo-500/50 text-indigo-400" /> How to Win (Strategy)
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">{scoreData.strategy}</p>
                </div>
              )}
            </div>
          )}

          {hasDeepData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {opp.benefits && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-medium text-sm">
                    <Gift size={16} className="text-indigo-400" /> Benefits
                  </div>
                  <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{opp.benefits}</div>
                </div>
              )}
              
              {opp.eligibility_criteria && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-medium text-sm">
                    <CheckCircle2 size={16} className="text-indigo-400" /> Eligibility
                  </div>
                  <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{opp.eligibility_criteria}</div>
                </div>
              )}

              {opp.selection_criteria && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-medium text-sm">
                    <ListChecks size={16} className="text-indigo-400" /> Selection Criteria
                  </div>
                  <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{opp.selection_criteria}</div>
                </div>
              )}

              {opp.application_process && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-medium text-sm">
                    <FileText size={16} className="text-indigo-400" /> How to Apply
                  </div>
                  <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{opp.application_process}</div>
                </div>
              )}

              {opp.past_winners && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-medium text-sm">
                    <Trophy size={16} className="text-indigo-400" /> Past Winners
                  </div>
                  <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{opp.past_winners}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic text-center py-4">
              Deep data has not been scraped for this historical record.
            </div>
          )}

          {opp.link && (
            <div className="pt-8 flex justify-end">
              <a 
                href={opp.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                Apply Now <ExternalLink size={16} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
