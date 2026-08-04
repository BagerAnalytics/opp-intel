import os
import json
from dotenv import load_dotenv
import google.generativeai as genai
from google.api_core import exceptions

load_dotenv()

# Initialize Gemini Client
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

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
- IF THE OPPORTUNITY DEADLINE HAS PASSED OR IT IS EXPLICITLY STATED AS CLOSED, SCORE IT 0.

Be harsh but fair. We only want highly lucrative, actionable opportunities.
"""

def generate_match_score(opportunity_description: str, feedback_context: str = "") -> dict:
    system_prompt = PROFILE_PROMPT
    if feedback_context:
        system_prompt += f"\n\n{feedback_context}\nUse this feedback to adjust your scoring. If an opportunity is similar to one we've lost, lower the score. If similar to one we've won, raise the score."
        
    import time
    for attempt in range(4):
        try:
            model = genai.GenerativeModel(
                'models/gemini-3.6-flash',
                system_instruction=system_prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema={
                        "type": "object",
                        "properties": {
                            "match_score": {"type": "integer"},
                            "reasoning": {"type": "string"},
                            "opp_type": {"type": "string", "enum": ["Grant", "Tender", "Award", "Accelerator", "Other"]},
                            "target_entity": {"type": "string", "enum": ["Premier Agric", "Badger Analytics", "Both"]}
                        },
                        "required": ["match_score", "reasoning", "opp_type", "target_entity"]
                    }
                )
            )
            response = model.generate_content(f"Analyze this opportunity:\n\n{opportunity_description}")
            return response.text
        except exceptions.ResourceExhausted as e:
            if attempt < 3:
                print(f"Gemini 429 Rate Limit hit in Match Score. Backing off for {5 * (attempt + 1)} seconds...")
                time.sleep(5 * (attempt + 1))
            else:
                print(f"Gemini API Quota Error fully exhausted: {e}")
                raise Exception("API_QUOTA_EXCEEDED")
        except Exception as e:
            print(f"Gemini Matcher Error: {e}")
            return json.dumps({"match_score": 0, "reasoning": f"LLM failed: {e}", "opp_type": "Other", "target_entity": "Unknown"})

def extract_opportunity_data(raw_text: str, url: str) -> dict:
    system_prompt = """
    You are an AI data extractor. I will provide you with the raw text from a webpage containing a grant, tender, or award opportunity.
    Extract the following fields and output as JSON. If a field is not found, leave it as null or an empty string.
    
    CRITICAL INSTRUCTION:
    If this webpage is a generic platform homepage, a portal, an 'About Us' page, or a list of multiple grants WITHOUT specific, concrete application details for a single opportunity, you MUST reject it.
    If the opportunity deadline has passed, or it is explicitly stated as EXPIRED or CLOSED, you MUST reject it.
    If you are rejecting it, you MUST return an EXACTLY empty JSON object: {}
    ONLY extract data if the webpage is a specific, individual, concrete grant/tender/award that is STILL OPEN.
    """
    
    # We use string manipulation to handle the empty JSON object {} fallback because response_schema strictly enforces fields.
    # So we don't enforce a schema, just standard JSON parsing.
    
    import time
    for attempt in range(4):
        try:
            model = genai.GenerativeModel(
                'models/gemini-3.6-flash',
                system_instruction=system_prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
            response = model.generate_content(
                f"URL: {url}\n\nRaw Text:\n{raw_text}\n\nOutput fields: name, funder, value, closing_date, description (short 2-sentence summary), benefits (short bullet points), eligibility_criteria (short bullet points). DO NOT output selection_criteria or application_process. If rejecting, output {{}}."
            )
            cleaned_result = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned_result)
        except exceptions.ResourceExhausted as e:
            if attempt < 3:
                print(f"Gemini 429 Rate Limit hit. Backing off for {5 * (attempt + 1)} seconds...")
                time.sleep(5 * (attempt + 1))
            else:
                print(f"Gemini API Quota Error fully exhausted: {e}")
                raise Exception("API_QUOTA_EXCEEDED")
        except Exception as e:
            print(f"Gemini Extraction Error: {e}")
            return {}

def deep_extract_opportunity(raw_text: str) -> dict:
    system_prompt = """
    You are an AI data extractor. Extract the deep, complex fields from this opportunity webpage text.
    Output ONLY valid JSON format.
    """
    import time
    for attempt in range(4):
        try:
            model = genai.GenerativeModel(
                'models/gemini-3.6-flash',
                system_instruction=system_prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
            response = model.generate_content(
                f"Raw Text:\n{raw_text}\n\nOutput fields: selection_criteria, application_process, past_winners."
            )
            cleaned_result = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned_result)
        except exceptions.ResourceExhausted as e:
            if attempt < 3:
                print(f"Gemini 429 Rate Limit hit in Deep Extract. Backing off for {5 * (attempt + 1)} seconds...")
                time.sleep(5 * (attempt + 1))
            else:
                print(f"Gemini API Quota Error fully exhausted: {e}")
                return {}
        except Exception as e:
            print(f"Gemini Deep Extraction Error: {e}")
            return {}

def generate_strategy(opportunity_data: dict, historical_winners_context: str, feedback_context: str = "") -> str:
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
        model = genai.GenerativeModel(
            'models/gemini-3.6-flash',
            system_instruction="You are an expert grant and funding strategist."
        )
        response = model.generate_content(prompt)
        return response.text
    except exceptions.ResourceExhausted as e:
        print(f"Gemini API Quota Error: {e}")
        raise Exception("API_QUOTA_EXCEEDED")
    except Exception as e:
        print(f"Gemini Strategy Error: {e}")
        return "Failed to generate strategy on LLM."
