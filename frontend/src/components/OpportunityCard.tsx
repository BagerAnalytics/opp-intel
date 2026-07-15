'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Loader2, Zap, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Gift, ListChecks, FileText, Trophy, Target, AlertCircle, Plus, Users } from 'lucide-react';

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

const MatchScoreRing = ({ score }: { score: number | null }) => {
  const actualScore = score || 0;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (actualScore / 100) * circumference;
  
  let colorClass = "text-emerald-500";
  if (actualScore < 70) colorClass = "text-yellow-500";
  if (actualScore < 50) colorClass = "text-red-500";
  if (!score) colorClass = "text-slate-300";

  return (
    <div className="relative flex items-center justify-center w-[64px] h-[64px]">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} className="stroke-slate-100" strokeWidth="4" fill="none" />
        <circle 
          cx="28" cy="28" r={radius} 
          className={colorClass} 
          stroke="currentColor"
          strokeWidth="4" 
          fill="none" 
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-slate-900">{score ? `${score}%` : 'N/A'}</span>
      </div>
    </div>
  );
};

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
    e.stopPropagation();
    setIsScoring(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/opportunities/${opp.id}/score`);
      setScoreData({
        score: response.data.match_score,
        reasoning: response.data.reasoning,
        strategy: response.data.strategy
      });
      setIsExpanded(true);
    } catch (error) {
      console.error("Failed to score opportunity", error);
    } finally {
      setIsScoring(false);
    }
  };

  const hasScore = scoreData.score !== null;
  const hasDeepData = opp.benefits || opp.eligibility_criteria || opp.selection_criteria;
  const warmConnections = contacts.filter(c => c.organization?.toLowerCase().includes(opp.funder?.toLowerCase() || 'unmatchable') || opp.funder?.toLowerCase().includes(c.organization?.toLowerCase() || 'unmatchable'));

  const missingDocs = complianceDocs
    .filter(doc => doc.status !== 'Uploaded')
    .filter(doc => (opp.eligibility_criteria || '').toLowerCase().includes(doc.document_name.toLowerCase()) || 
                   (opp.application_process || '').toLowerCase().includes(doc.document_name.toLowerCase()));

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow hover:border-slate-300 transition-all cursor-pointer relative group overflow-hidden
      ${missingDocs.length > 0 ? '!border-red-300 !shadow-red-50' : ''}
    `} onClick={() => setIsExpanded(!isExpanded)}>
      
      {/* Top Bar / Summary */}
      <div className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start">
        
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-slate-900 leading-tight tracking-tight mb-2">{opp.name}</h3>
              <p className="text-sm text-slate-500 uppercase tracking-wider mb-2 font-medium">{opp.funder}</p>
            </div>
            
            <div className="flex flex-col items-center">
              <p className="text-slate-400 text-[11px] mb-1 font-semibold tracking-wider uppercase">AI Fit</p>
              <MatchScoreRing score={scoreData.score} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <div>
              <p className="text-slate-400 text-[11px] mb-1.5 font-semibold tracking-wider uppercase">VALUE</p>
              <p className="text-slate-900 text-[15px] font-bold">{opp.value || '$---'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px] mb-1.5 font-semibold tracking-wider uppercase">DEADLINE</p>
              <p className="text-slate-900 text-[15px] font-bold">{opp.closing_date || 'Open'}</p>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              {warmConnections.length > 0 ? (
                <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-2 w-full">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                  <div>
                    <p className="text-emerald-700 text-[11px] font-bold leading-none mb-1">WARM CONNECTION</p>
                    <p className="text-emerald-900 text-xs font-semibold leading-none">{warmConnections[0].name}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2 w-full">
                  <Users size={14} className="text-slate-400" />
                  <p className="text-slate-500 text-xs font-medium">No warm connections found</p>
                </div>
              )}
            </div>
          </div>
            
          <p className={`text-slate-600 text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
            {opp.description || "No description provided."}
          </p>
          
          {missingDocs.length > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-100">
              <AlertCircle size={14} className="text-red-500" />
              Missing Docs: {missingDocs.map(d => d.document_name).join(', ')}
            </div>
          )}
        </div>

        <div className="shrink-0 w-full md:w-auto flex flex-row md:flex-col items-center gap-3 md:pl-6 md:border-l md:border-slate-100 h-full pt-2">
          {opp.status === "open" && (
            <button 
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                  await axios.put(`${apiUrl}/api/opportunities/${opp.id}/status?status=interested`);
                  window.location.reload();
                } catch (err) {}
              }}
              className="w-full px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add to Pipeline
            </button>
          )}
          
          <button 
            onClick={handleScoreMatch}
            disabled={isScoring || hasScore}
            className={`w-full px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border
              ${hasScore 
                ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' 
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
          >
            {isScoring ? (
              <><Loader2 size={16} className="animate-spin text-emerald-600" /> Analyzing...</>
            ) : hasScore ? (
              'Analyzed Fit'
            ) : (
              <><Zap size={16} className="text-yellow-500" /> Score Fit</>
            )}
          </button>
          
          <button className="p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-colors self-start md:self-center mt-2 relative z-10">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Expanded Deep Data Section */}
      {isExpanded && (
        <div className="mt-2 border-t border-slate-100 p-6 bg-slate-50" onClick={(e) => e.stopPropagation()}>
          
          {hasScore && scoreData.reasoning && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-5 bg-white rounded-xl border border-slate-200 text-sm leading-relaxed shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-emerald-700 font-semibold text-[13px] uppercase tracking-wider">
                  <Zap size={16} className="text-emerald-500" /> AI Match Reasoning
                </div>
                <p className="text-slate-600">{scoreData.reasoning}</p>
              </div>
              {scoreData.strategy && (
                <div className="p-5 bg-white rounded-xl border border-slate-200 text-sm leading-relaxed shadow-sm">
                  <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold text-[13px] uppercase tracking-wider">
                    <Target size={16} className="text-blue-500" /> Strategy
                  </div>
                  <p className="text-slate-600 whitespace-pre-wrap">{scoreData.strategy}</p>
                </div>
              )}
            </div>
          )}

          {hasDeepData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {opp.benefits && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Gift size={16} className="text-emerald-600" /> Benefits
                  </div>
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{opp.benefits}</div>
                </div>
              )}
              
              {opp.eligibility_criteria && (
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <CheckCircle2 size={16} className="text-emerald-600" /> Eligibility
                  </div>
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{opp.eligibility_criteria}</div>
                </div>
              )}

              {opp.selection_criteria && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <ListChecks size={16} className="text-emerald-600" /> Selection Criteria
                  </div>
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{opp.selection_criteria}</div>
                </div>
              )}

              {opp.application_process && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <FileText size={16} className="text-emerald-600" /> How to Apply
                  </div>
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{opp.application_process}</div>
                </div>
              )}

              {opp.past_winners && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Trophy size={16} className="text-emerald-600" /> Past Winners
                  </div>
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{opp.past_winners}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic text-center py-4">
              Deep data has not been scraped for this historical record.
            </div>
          )}

          {opp.link && (
            <div className="pt-8 flex justify-end">
              <a 
                href={opp.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
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
