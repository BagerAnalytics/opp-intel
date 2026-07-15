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
  
  let colorClass = "text-emerald-400";
  if (actualScore < 70) colorClass = "text-yellow-400";
  if (actualScore < 50) colorClass = "text-red-400";
  if (!score) colorClass = "text-gray-600";

  return (
    <div className="relative flex items-center justify-center w-[64px] h-[64px]">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} className="stroke-white/10" strokeWidth="4" fill="none" />
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
        <span className="text-sm font-bold text-white">{score ? `${score}%` : 'N/A'}</span>
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
    <div className={`bg-[#1e2029] rounded-2xl border border-white/[0.04] shadow-md hover:border-white/10 transition-all cursor-pointer relative group overflow-hidden
      ${missingDocs.length > 0 ? '!border-red-500/30' : ''}
    `} onClick={() => setIsExpanded(!isExpanded)}>
      
      {/* Top Bar / Summary */}
      <div className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start">
        
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-white leading-tight tracking-tight mb-2">{opp.name}</h3>
              <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">{opp.funder}</p>
            </div>
            
            <div className="flex flex-col items-center">
              <p className="text-gray-500 text-[11px] mb-1 font-medium">AI MATCH</p>
              <MatchScoreRing score={scoreData.score} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <div>
              <p className="text-gray-500 text-[11px] mb-1.5 font-medium">VALUE</p>
              <p className="text-gray-100 text-[15px] font-bold">{opp.value || '$---'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-[11px] mb-1.5 font-medium">DEADLINE</p>
              <p className="text-gray-100 text-[15px] font-bold">{opp.closing_date || 'Open'}</p>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              {warmConnections.length > 0 ? (
                <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg flex items-center gap-2 w-full">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
                  <div>
                    <p className="text-blue-400 text-[11px] font-bold leading-none mb-1">WARM CONNECTION</p>
                    <p className="text-blue-100 text-xs font-medium leading-none">{warmConnections[0].name}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 w-full">
                  <Users size={14} className="text-gray-500" />
                  <p className="text-gray-400 text-xs font-medium">No warm connections found</p>
                </div>
              )}
            </div>
          </div>
            
          <p className={`text-gray-400 text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
            {opp.description || "No description provided."}
          </p>
          
          {missingDocs.length > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-semibold border border-red-500/20 shadow-[inset_0_0_12px_rgba(239,68,68,0.1)]">
              <AlertCircle size={14} className="text-red-400" />
              Missing Docs: {missingDocs.map(d => d.document_name).join(', ')}
            </div>
          )}
        </div>

        <div className="shrink-0 w-full md:w-auto flex flex-row md:flex-col items-center gap-3 md:pl-6 md:border-l md:border-white/5 h-full pt-2">
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
              className="w-full px-5 py-2.5 bg-[#4352ff] text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add to Pipeline
            </button>
          )}
          
          <button 
            onClick={handleScoreMatch}
            disabled={isScoring || hasScore}
            className={`w-full px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border backdrop-blur-md
              ${hasScore 
                ? 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed' 
                : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20'}`}
          >
            {isScoring ? (
              <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
            ) : hasScore ? (
              'Analyzed Fit'
            ) : (
              <><Zap size={16} className="text-yellow-400" /> Score Fit</>
            )}
          </button>
          
          <button className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5 transition-colors self-start md:self-center mt-2 relative z-10 border border-transparent">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Expanded Deep Data Section */}
      {isExpanded && (
        <div className="mt-2 pt-6 border-t border-white/[0.04] p-6 bg-black/20" onClick={(e) => e.stopPropagation()}>
          
          {hasScore && scoreData.reasoning && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-5 bg-[#16181f] rounded-xl border border-white/5 text-sm leading-relaxed shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-yellow-400 font-semibold text-[13px] uppercase tracking-wider">
                  <Zap size={16} className="fill-yellow-500/20" /> AI Match Reasoning
                </div>
                <p className="text-gray-300">{scoreData.reasoning}</p>
              </div>
              {scoreData.strategy && (
                <div className="p-5 bg-[#16181f] rounded-xl border border-white/5 text-sm leading-relaxed shadow-sm">
                  <div className="flex items-center gap-2 mb-3 text-blue-400 font-semibold text-[13px] uppercase tracking-wider">
                    <Target size={16} className="fill-blue-500/20" /> Strategy
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
                    <Gift size={16} className="text-blue-400" /> Benefits
                  </div>
                  <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{opp.benefits}</div>
                </div>
              )}
              
              {opp.eligibility_criteria && (
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-medium text-sm">
                    <CheckCircle2 size={16} className="text-blue-400" /> Eligibility
                  </div>
                  <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{opp.eligibility_criteria}</div>
                </div>
              )}

              {opp.selection_criteria && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-medium text-sm">
                    <ListChecks size={16} className="text-blue-400" /> Selection Criteria
                  </div>
                  <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{opp.selection_criteria}</div>
                </div>
              )}

              {opp.application_process && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-medium text-sm">
                    <FileText size={16} className="text-blue-400" /> How to Apply
                  </div>
                  <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{opp.application_process}</div>
                </div>
              )}

              {opp.past_winners && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-medium text-sm">
                    <Trophy size={16} className="text-blue-400" /> Past Winners
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
                className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
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
