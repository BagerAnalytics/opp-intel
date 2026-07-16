"""
scorer_service.py
Standalone scoring service extracted from main.py to avoid circular imports
when called from subprocesses (generic_scraper.py, bulk_scraper.py, etc.)
"""
import json
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import models
from database import SessionLocal
from services.llm_service import generate_match_score, generate_strategy


def score_opportunity(opp_id: int, db=None):
    """
    Score a single opportunity by ID using the LLM matcher.
    Can be called with an existing DB session or will open its own.
    """
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        opp = db.query(models.Opportunity).filter(models.Opportunity.id == opp_id).first()
        if not opp:
            print(f"score_opportunity: Opportunity ID {opp_id} not found.")
            return None

        # Gather feedback loop context
        won_opps = db.query(models.Opportunity).filter(models.Opportunity.status == "won").all()
        lost_opps = db.query(models.Opportunity).filter(models.Opportunity.status == "lost").all()

        feedback_context = "Historical Business Context:\n"
        if won_opps:
            feedback_context += "We have WON these types of opportunities: " + ", ".join([o.name for o in won_opps]) + "\n"
        if lost_opps:
            feedback_context += "We have LOST these types (adjust strategy): " + ", ".join([o.name for o in lost_opps]) + "\n"

        # Build context for the LLM
        deep_context = f"Title: {opp.name}\n"
        if opp.description:
            deep_context += f"Summary: {opp.description}\n"
        if opp.eligibility_criteria:
            deep_context += f"Eligibility: {opp.eligibility_criteria}\n"
        if opp.selection_criteria:
            deep_context += f"Selection: {opp.selection_criteria}\n"
        if opp.benefits:
            deep_context += f"Benefits: {opp.benefits}\n"

        # Run matcher and strategy
        result = generate_match_score(deep_context, feedback_context)
        historical_context = opp.past_winners or "No past winners data available."
        strategy = generate_strategy(deep_context, historical_context, feedback_context)

        try:
            cleaned_result = result.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned_result)
            opp.match_score = data.get("match_score")
            opp.match_reasoning = data.get("reasoning")
            if "opp_type" in data:
                opp.opp_type = data.get("opp_type")
            if "target_entity" in data:
                opp.target_entity = data.get("target_entity")
            opp.strategy = strategy
            db.commit()
            print(f"score_opportunity: Scored opp {opp_id} -> {opp.match_score}%")
            return data
        except Exception as e:
            print(f"score_opportunity: Failed to parse LLM response for opp {opp_id}: {e}")
            return None

    except Exception as e:
        print(f"score_opportunity: Error scoring opp {opp_id}: {e}")
        return None
    finally:
        if should_close:
            db.close()
