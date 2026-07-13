'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Loader2, Zap, Calendar, Users, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, Gift, ListChecks, FileText, Trophy } from 'lucide-react';

interface Opportunity {
  id: number;
  name: string;
  funder: string;
  deadline: string;
  value: string;
  description: string;
  
  // Deep Fields
  benefits: string | null;
  eligibility_criteria: string | null;
  selection_criteria: string | null;
  application_process: string | null;
  past_winners: string | null;

  match_score: number | null;
  match_reasoning: string | null;
  status: string;
  link: string | null;
}

export default function OpportunityCard({ opp }: { opp: Opportunity }) {
  const [isScoring, setIsScoring] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [scoreData, setScoreData] = useState<{score: number | null, reasoning: string | null}>({
    score: opp.match_score,
    reasoning: opp.match_reasoning
  });

  const handleScoreMatch = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent expanding card when clicking score
    setIsScoring(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/opportunities/${opp.id}/score`);
      setScoreData({
        score: response.data.match_score,
        reasoning: response.data.reasoning
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

  return (
    <div 
      className={`bg-white p-6 md:p-8 rounded-xl border transition-all duration-300 cursor-pointer 
        ${isExpanded ? 'border-gray-300 shadow-md ring-1 ring-gray-100' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
        
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-lg font-semibold text-gray-900 tracking-tight">{opp.name}</h4>
            {hasScore && (
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium flex items-center gap-1 ${scoreData.score! >= 80 ? 'bg-green-50 text-green-700 border border-green-200' : scoreData.score! >= 50 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                <Zap size={12} className={scoreData.score! >= 80 ? 'fill-green-600' : ''} />
                {scoreData.score}% FIT
              </span>
            )}
          </div>
          
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">{opp.funder || "Unknown Funder"}</p>
          
          <p className={`text-gray-600 text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
            {opp.description || "No description provided."}
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2 text-sm">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Calendar size={14} />
              <span>{opp.deadline || "Open"}</span>
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
        </div>

        <div className="shrink-0 w-full md:w-auto flex flex-row md:flex-col items-center gap-3">
          <button 
            onClick={handleScoreMatch}
            disabled={isScoring || hasScore}
            className={`w-full md:w-auto px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 border
              ${hasScore 
                ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' 
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 shadow-sm'}`}
          >
            {isScoring ? (
              <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
            ) : hasScore ? (
              'Analyzed'
            ) : (
              <><Zap size={16} /> Analyze Fit</>
            )}
          </button>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Expanded Deep Data Section */}
      {isExpanded && (
        <div className="mt-8 pt-6 border-t border-gray-100 space-y-6" onClick={(e) => e.stopPropagation()}>
          
          {hasScore && scoreData.reasoning && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-800 leading-relaxed">
              <div className="flex items-center gap-2 mb-2 text-gray-900 font-medium">
                <Zap size={16} className="text-yellow-600 fill-yellow-600" /> AI Reasoning
              </div>
              <p className="text-gray-600">{scoreData.reasoning}</p>
            </div>
          )}

          {hasDeepData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {opp.benefits && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900 font-medium text-sm">
                    <Gift size={16} className="text-gray-400" /> Benefits
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{opp.benefits}</div>
                </div>
              )}
              
              {opp.eligibility_criteria && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900 font-medium text-sm">
                    <CheckCircle2 size={16} className="text-gray-400" /> Eligibility
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{opp.eligibility_criteria}</div>
                </div>
              )}

              {opp.selection_criteria && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900 font-medium text-sm">
                    <ListChecks size={16} className="text-gray-400" /> Selection Criteria
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{opp.selection_criteria}</div>
                </div>
              )}

              {opp.application_process && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900 font-medium text-sm">
                    <FileText size={16} className="text-gray-400" /> How to Apply
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{opp.application_process}</div>
                </div>
              )}

              {opp.past_winners && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900 font-medium text-sm">
                    <Trophy size={16} className="text-gray-400" /> Past Winners
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{opp.past_winners}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic text-center py-4">
              Deep data has not been scraped for this historical record.
            </div>
          )}

          {opp.link && (
            <div className="pt-4 flex justify-end">
              <a 
                href={opp.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
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
