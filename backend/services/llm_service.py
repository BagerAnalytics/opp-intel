import os
import json
from dotenv import load_dotenv
import anthropic

load_dotenv()

# We will use Anthropic for the Matcher and Strategy Generator
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

PROFILE_PROMPT = """
You are an Opportunity Matching AI acting as a ruthless gatekeeper for two specific businesses:

1. **Premier Agric**: An agriculture and business consulting firm. They provide business plans, training, supply chain logistics, and agricultural consulting in South Africa and Africa.
2. **Badger Analytics**: A tech and data firm. They focus on data science, analytics, software development, and tech startups in South Africa and Africa.

CRITERIA FOR A HIGH MATCH (Score 80+):
- MUST clearly benefit either Premier Agric or Badger Analytics.
- MUST accept applicants from South Africa or Africa (the opportunity itself can be global, but SA must be eligible).
- The opportunity should be a Grant, Tender, Accelerator, or Funding mechanism that fits their core services.
- If an opportunity is generic (e.g. "Photography contest"), score it LOW (under 30).
- If an opportunity perfectly aligns with agricultural consulting/supply chain, assign `target_entity` as "Premier Agric".
- If an opportunity perfectly aligns with tech, data, or digital innovation, assign `target_entity` as "Badger Analytics".
- If it spans both (e.g. AgriTech data platform), assign `target_entity` as "Both".

Be harsh but fair. We only want highly lucrative, actionable opportunities.
"""

def generate_match_score(opportunity_description: str, feedback_context: str = "") -> dict:
    """
    Analyzes an opportunity description against the company profile 
    and returns a JSON with a match_score (0-100), reasoning, opp_type, and target_entity.
    """
    try:
        system_prompt = PROFILE_PROMPT + "\nOutput JSON format: {\"match_score\": 85, \"reasoning\": \"...\", \"opp_type\": \"Grant|Tender|Award|Other\", \"target_entity\": \"Premier Agric|Badger Analytics|Both\"}"
        if feedback_context:
            system_prompt += f"\n\n{feedback_context}\nUse this feedback to adjust your scoring. If an opportunity is similar to one we've lost, lower the score. If similar to one we've won, raise the score."
            
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            system=system_prompt,
            messages=[
                {"role": "user", "content": f"Analyze this opportunity and output ONLY valid JSON format:\n\n{opportunity_description}"}
            ]
        )
        cleaned_result = response.content[0].text
        if "```json" in cleaned_result:
            cleaned_result = cleaned_result.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned_result:
            cleaned_result = cleaned_result.split("```")[1].split("```")[0].strip()
        return cleaned_result
    except Exception as e:
        print(f"LLM Error: {e}")
        return json.dumps({"match_score": 0, "reasoning": str(e)})

def extract_opportunity_data(raw_text: str, url: str) -> dict:
    """
    Extracts structured fields from raw webpage text.
    """
    system_prompt = """
    You are an AI data extractor. I will provide you with the raw text from a webpage containing a grant, tender, or award opportunity.
    Extract the following fields and output as JSON. If a field is not found, leave it as null or an empty string.
    - name: The title of the opportunity
    - funder: The organization providing the funding (try to guess if not explicitly stated)
    - value: The prize or funding amount (e.g. "$15,000", or "Unknown")
    - closing_date: The deadline (e.g. "July 16, 2026")
    - description: A short 2-3 sentence summary
    - benefits: What the winner receives
    - eligibility_criteria: Who can apply
    - selection_criteria: How they choose winners
    - application_process: How to apply
    
    Output JSON strictly.
    """
    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=2000,
            system=system_prompt,
            messages=[
                {"role": "user", "content": f"URL: {url}\n\nRaw Text:\n{raw_text}\n\nOutput ONLY valid JSON format."}
            ]
        )
        cleaned_result = response.content[0].text
        if "```json" in cleaned_result:
            cleaned_result = cleaned_result.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned_result:
            cleaned_result = cleaned_result.split("```")[1].split("```")[0].strip()
        return json.loads(cleaned_result)
    except Exception as e:
        print(f"Extraction Error: {e}")
        return {}

def generate_strategy(opportunity_data: dict, historical_winners_context: str, feedback_context: str = "") -> str:
    """
    Generates an application strategy based on the opportunity and past winners.
    """
    prompt = f"""
    Based on the following opportunity and the historical context of past winners, generate a 
    winning application strategy tailored for Premier Agric or Badger Analytics.

    Opportunity: {opportunity_data}
    Past Winners Context: {historical_winners_context}
    
    Business Feedback Loop Context:
    {feedback_context}
    Use this feedback to avoid past mistakes and double-down on winning strategies!
    """
    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1500,
            system="You are an expert grant and funding strategist.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.content[0].text
    except Exception as e:
        print(f"LLM Error: {e}")
        return "Failed to generate strategy."
