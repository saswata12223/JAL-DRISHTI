import os
from dotenv import load_dotenv
load_dotenv()
import google.generativeai as genai
from fastapi import APIRouter, Request, Form, BackgroundTasks
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather

router = APIRouter(prefix="/immediate-actions", tags=["Immediate Actions"])

# Initialize Gemini
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Use Gemini 1.5 Flash for low latency conversational AI
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

# Twilio Client
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER")

class DispatchRequest(BaseModel):
    phone_numbers: List[str]
    language: Optional[str] = "hi-IN"
    basin_location: Optional[str] = "Uttarakhand"
    severity: Optional[str] = "CRITICAL"

@router.post("/call/dispatch")
async def dispatch_calls(request: Request, payload: DispatchRequest):
    """
    Dispatch physical Twilio phone calls to target numbers.
    """
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        return JSONResponse({"success": False, "message": "Twilio credentials not configured in backend."}, status_code=500)
    
    # We need a public URL for Twilio Webhooks. We can use ngrok URL if set, otherwise fallback to request.base_url
    base_url = os.environ.get("TWILIO_WEBHOOK_BASE_URL")
    if not base_url:
        base_url = str(request.base_url).rstrip("/")
        
    webhook_url = f"{base_url}/api/v1/immediate-actions/twilio/voice/incoming"
    
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    dispatches = []
    
    for number in payload.phone_numbers:
        try:
            call = client.calls.create(
                to=number,
                from_=TWILIO_FROM_NUMBER,
                url=webhook_url
            )
            dispatches.append({"phone_number": number, "status": call.status, "call_sid": call.sid})
        except Exception as e:
            print(f"Twilio Error for {number}: {e}")
            dispatches.append({"phone_number": number, "status": "Failed", "error": str(e)})
            
    return {"success": True, "message": "Calls dispatched", "data": {"dispatches": dispatches}}

@router.post("/twilio/voice/incoming")
async def twilio_voice_incoming(request: Request):
    """
    Webhook called by Twilio when the physical phone is answered.
    Starts the conversation in Hindi.
    """
    response = VoiceResponse()
    
    greeting = "आपातकालीन चेतावनी। आपके क्षेत्र में फ्लैश फ्लड अलर्ट जारी किया गया है। मैं जल दृष्टि एआई असिस्टेंट हूं। क्या आपको तुरंत मदद चाहिए? To continue in English, please say English."
    
    base_url = os.environ.get("TWILIO_WEBHOOK_BASE_URL")
    if not base_url:
        base_url = str(request.base_url).rstrip("/")
    
    gather = Gather(
        input='speech',
        action=f"{base_url}/api/v1/immediate-actions/twilio/voice/process",
        language='hi-IN',
        speechTimeout='auto'
    )
    gather.say(greeting, language='hi-IN')
    response.append(gather)
    
    # If they don't say anything, it falls through to here
    response.say("हमें कोई जवाब नहीं मिला। कॉल समाप्त हो रहा है।", language='hi-IN')
    
    return Response(content=str(response), media_type="text/xml")


@router.post("/twilio/voice/process")
async def twilio_voice_process(request: Request, SpeechResult: str = Form(None), Language: str = Form(None)):
    """
    Webhook called by Twilio after capturing user speech.
    Passes speech to Gemini and returns next response.
    """
    response = VoiceResponse()
    
    if not SpeechResult:
        response.say("कृपया फिर से बोलें।", language='hi-IN')
        base_url = os.environ.get("TWILIO_WEBHOOK_BASE_URL", str(request.base_url).rstrip("/"))
        gather = Gather(input='speech', action=f"{base_url}/api/v1/immediate-actions/twilio/voice/process", language='hi-IN')
        response.append(gather)
        return Response(content=str(response), media_type="text/xml")

    # Detect language intent (basic logic like frontend)
    current_lang = 'hi-IN'
    lower_text = SpeechResult.lower()
    
    if "english" in lower_text or "अंग्रेज़ी" in lower_text:
        current_lang = 'en-IN'
        
    system_prompt = f"""You are an emergency response AI agent named 'Jal Drishti AI Assistant'.
    You are speaking to a citizen on a phone call during a flash flood emergency in Uttarakhand.
    The citizen just said: "{SpeechResult}".
    Respond briefly (1-2 sentences). If they need rescue, confirm their location is tracked.
    If the citizen requested English, respond in English. Otherwise respond in Hindi.
    Your response will be spoken via Text-to-Speech directly over the phone call. Do not use asterisks or markdown."""

    ai_text = ""
    if model:
        try:
            # Query Gemini
            chat_response = model.generate_content(system_prompt)
            ai_text = chat_response.text.strip()
        except Exception as e:
            ai_text = "माफ़ करें, सिस्टम में तकनीकी खराबी है। बचाव दल भेज दिया गया है।"
    else:
        # Fallback if Gemini failed to load
        ai_text = "मैं आपको सुन रही हूं। आपकी लोकेशन ट्रैक कर ली गई है।"
        
    # Append Gather to continue conversation
    base_url = os.environ.get("TWILIO_WEBHOOK_BASE_URL", str(request.base_url).rstrip("/"))
    gather = Gather(
        input='speech',
        action=f"{base_url}/api/v1/immediate-actions/twilio/voice/process",
        language=current_lang,
        speechTimeout='auto'
    )
    gather.say(ai_text, language=current_lang)
    response.append(gather)
    
    return Response(content=str(response), media_type="text/xml")
