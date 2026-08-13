import os
import json
import time
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

# Initialize Groq Client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
# Use the latest 3.3 model since 3.1 was deprecated
MODEL_NAME = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

PROFILE_PROMPT = """
You are an Opportunity Matching AI acting as a ruthless gatekeeper for two specific businesses:

1. **Premier Agric**: An agriculture and business consulting firm. They provide business plans, training, supply chain logistics, and agricultural consulting in South Africa and Africa.
2. **Badger Analytics**: A tech and data firm. They focus on data science, analytics, software development, and tech startups in South Africa and Africa.

CRITERIA FOR A HIGH MATCH (Score 80+):
- MUST clearly benefit either Premier Agric or Badger Analytics.
- MUST accept applicants from South Africa or Africa (the opportunity itself can be global, but SA must be eligible).
- HISTORICAL ALIGNMENT: The opportunity must strongly align with the funding organization's historical funding patterns. If the organization typically funds entirely different industries, heavily penalize the match score.
- The opportunity should be a Grant, Tender, Accelerator, or Funding mechanism that fits their core services.
- If an opportunity is generic (e.g. "Photography contest"), score it LOW (under 30).
- If an opportunity perfectly aligns with agricultural consulting/supply chain, assign `target_entity` as "Premier Agric".
- If an opportunity perfectly aligns with tech, data, or digital innovation, assign `target_entity` as "Badger Analytics".
- If it spans both (e.g. AgriTech data platform), assign `target_entity` as "Both".
- IF THE OPPORTUNITY DEADLINE HAS PASSED OR IT IS EXPLICITLY STATED AS CLOSED, SCORE IT 0.

Be harsh but fair. We only want highly lucrative, actionable opportunities.
You MUST output strictly in JSON format.
"""

def generate_match_score(opportunity_description: str, feedback_context: str = "") -> dict:
    system_prompt = PROFILE_PROMPT
    if feedback_context:
        system_prompt += f"\n\n{feedback_context}\nUse this feedback to adjust your scoring. If an opportunity is similar to one we've lost, lower the score. If similar to one we've won, raise the score."
        
    for attempt in range(4):
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt + "\nEnsure response strictly matches schema: {match_score: int, reasoning: str, opp_type: str, target_entity: str}"},
                    {"role": "user", "content": f"Analyze this opportunity:\n\n{opportunity_description}"}
                ],
                response_format={"type": "json_object"}
            )
            return response.choices[0].message.content
        except Exception as e:
            err_str = str(e).lower()
            if "rate limit" in err_str or "429" in err_str:
                if attempt < 3:
                    print(f"Groq 429 Rate Limit hit in Match Score. Backing off for {5 * (attempt + 1)} seconds...")
                    time.sleep(5 * (attempt + 1))
                else:
                    print(f"Groq API Quota Error fully exhausted: {e}")
                    raise Exception("API_QUOTA_EXCEEDED")
            else:
                print(f"Groq Matcher Error: {e}")
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
    You MUST output strictly in JSON format.
    """
    
    for attempt in range(4):
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"URL: {url}\n\nRaw Text:\n{raw_text}\n\nOutput fields: name, funder, value, closing_date, description (short 2-sentence summary), benefits (short bullet points), eligibility_criteria (short bullet points). DO NOT output selection_criteria or application_process. If rejecting, output {{}}."}
                ],
                response_format={"type": "json_object"}
            )
            cleaned_result = response.choices[0].message.content.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned_result)
        except Exception as e:
            err_str = str(e).lower()
            if "rate limit" in err_str or "429" in err_str:
                if attempt < 3:
                    print(f"Groq 429 Rate Limit hit. Backing off for {5 * (attempt + 1)} seconds...")
                    time.sleep(5 * (attempt + 1))
                else:
                    print(f"Groq API Quota Error fully exhausted: {e}")
                    raise Exception("API_QUOTA_EXCEEDED")
            else:
                print(f"Groq Extraction Error: {e}")
                return {}

def deep_extract_opportunity(raw_text: str) -> dict:
    system_prompt = """
    You are an AI data extractor. Extract the deep, complex fields from this opportunity webpage text.
    Output ONLY valid JSON format.
    """
    for attempt in range(4):
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Raw Text:\n{raw_text}\n\nOutput fields: selection_criteria, application_process, past_winners, application_form_questions (extract any specific application questions/fields you can find)."}
                ],
                response_format={"type": "json_object"}
            )
            cleaned_result = response.choices[0].message.content.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned_result)
        except Exception as e:
            err_str = str(e).lower()
            if "rate limit" in err_str or "429" in err_str:
                if attempt < 3:
                    print(f"Groq 429 Rate Limit hit in Deep Extract. Backing off for {5 * (attempt + 1)} seconds...")
                    time.sleep(5 * (attempt + 1))
                else:
                    print(f"Groq API Quota Error fully exhausted: {e}")
                    return {"error": str(e)}
            else:
                print(f"Groq Deep Extraction Error: {e}")
                return {"error": str(e)}

def generate_strategy(opportunity_data: dict, historical_winners_context: str, feedback_context: str = "") -> str:
    prompt = f"""
    You are a Custom Application Template Developer.
    Based on the following opportunity and the historical context of past winners, you MUST generate an independent, highly custom application template tailored for Premier Agric or Badger Analytics.

    Opportunity Data (including specific form questions if extracted): {opportunity_data}
    Past Winners Context (MANDATORY TO ALIGN WITH THIS PROFILE): {historical_winners_context}
    
    Business Feedback Loop Context:
    {feedback_context}
    
    CRITICAL REQUIREMENTS:
    1. Do not give generic advice. Generate specific, targeted application answers based on the online form requirements.
    2. Ensure the answers match exactly what this specific organization historically funds.
    3. PRE-CLARIFICATION DIRECTIVE: You must preemptively answer potential follow-up questions and provide deep clarification in the first round to avoid subsequent interviews.
    
    Your output must include a specific section labeled exactly: "### Anticipated Questions & Answers" containing these pre-clarifications.
    """
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system", 
                    "content": "You are a master Application Template Builder. You write highly specific, non-generic application responses.\n\nCRITICAL BUSINESS IDENTITY:\n1. Premier Agric: An agritech startup providing AI-driven intelligence, precision agriculture data, drone scouting, and IoT solutions to farmers. THEY ARE NOT A FARM. They are a B2B technology provider.\n2. Badger Analytics: A B2B data analytics consultancy focusing on business intelligence, market research, and corporate dashboards."
                },
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        err_str = str(e).lower()
        if "rate limit" in err_str or "429" in err_str or "quota" in err_str:
            print(f"Groq API Quota Error: {e}")
            raise Exception("API_QUOTA_EXCEEDED")
        else:
            print(f"Groq Strategy Error: {e}")
            return "Failed to generate strategy on LLM."
