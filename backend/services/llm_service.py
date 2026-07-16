import os
from dotenv import load_dotenv
import openai

load_dotenv()

# We will use OpenAI for the Matcher and Strategy Generator
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

PROFILE_PROMPT = """
You are an Opportunity Matching AI for two businesses:
1. Premier Agric: Consulting, training, business plans, agriculture, and supply chain.
2. Badger Analytics: Data science, analytics, and tech.

Criteria for a High Match:
- MUST accept applicants from South Africa (the opportunity itself can be global).
- Size and years of operation do not matter.
- Does NOT have to be strictly agriculture, as long as it fits Consulting, Training, Business Plans, or Tech/Data Science.
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
            
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analyze this opportunity:\n\n{opportunity_description}"}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"LLM Error: {e}")
        import json
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
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"URL: {url}\n\nRaw Text:\n{raw_text}"}
            ]
        )
        import json
        cleaned_result = response.choices[0].message.content.replace("```json", "").replace("```", "").strip()
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
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are an expert grant and funding strategist."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"LLM Error: {e}")
        return "Failed to generate strategy."
