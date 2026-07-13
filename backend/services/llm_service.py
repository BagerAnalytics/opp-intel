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

def generate_match_score(opportunity_description: str) -> dict:
    """
    Analyzes an opportunity description against the company profile 
    and returns a JSON with a match_score (0-100) and reasoning.
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": PROFILE_PROMPT + "\nOutput JSON format: {\"match_score\": 85, \"reasoning\": \"...\"}"},
                {"role": "user", "content": f"Analyze this opportunity:\n\n{opportunity_description}"}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"LLM Error: {e}")
        return {"match_score": 0, "reasoning": str(e)}

def generate_strategy(opportunity_data: dict, historical_winners_context: str) -> str:
    """
    Generates an application strategy based on the opportunity and past winners.
    """
    prompt = f"""
    Based on the following opportunity and the historical context of past winners, generate a 
    winning application strategy tailored for Premier Agric or Badger Analytics.

    Opportunity: {opportunity_data}
    Past Winners Context: {historical_winners_context}
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
