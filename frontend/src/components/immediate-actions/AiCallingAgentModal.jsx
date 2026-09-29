import React, { useState, useEffect, useRef } from 'react';

const REGIONAL_LANGUAGES = {
  hi: { id: 'hi', name: 'Hindi (हिंदी)', langCode: 'hi-IN', voiceKeywords: ['hi-IN', 'hindi'] },
  en: { id: 'en', name: 'English', langCode: 'en-IN', voiceKeywords: ['en-IN', 'en-US', 'english'] },
  local_uttarakhand: { id: 'local_uttarakhand', name: 'Garhwali / Kumaoni', langCode: 'hi-IN', voiceKeywords: ['hi-IN', 'hindi'] },
  bn: { id: 'bn', name: 'Bengali (বাংলা)', langCode: 'bn-IN', voiceKeywords: ['bn-IN', 'bengali'] },
  mr: { id: 'mr', name: 'Marathi (मराठी)', langCode: 'mr-IN', voiceKeywords: ['mr-IN', 'marathi'] },
  te: { id: 'te', name: 'Telugu (తెలుగు)', langCode: 'te-IN', voiceKeywords: ['te-IN', 'telugu'] },
  ta: { id: 'ta', name: 'Tamil (தமிழ்)', langCode: 'ta-IN', voiceKeywords: ['ta-IN', 'tamil'] },
  gu: { id: 'gu', name: 'Gujarati (ગુજરાતી)', langCode: 'gu-IN', voiceKeywords: ['gu-IN', 'gujarati'] },
};

export default function AiCallingAgentModal({
  isOpen,
  onClose,
  defaultNumbers = ['9748379047', '98833 70734', '90195 86089'],
}) {
  const [activeLang, setActiveLang] = useState('hi');
  const [callState, setCallState] = useState('IDLE'); // IDLE, RINGING, CONNECTED, ENDED
  const [activeNumberIndex, setActiveNumberIndex] = useState(0);
  
  // AI Conversation State
  const [transcript, setTranscript] = useState('');
  const [agentStatus, setAgentStatus] = useState(''); // 'Speaking...', 'Listening...', 'Processing...'
  const [conversationHistory, setConversationHistory] = useState([]);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  
  const currentNumber = defaultNumbers[activeNumberIndex] || defaultNumbers[0];
  const langConfig = REGIONAL_LANGUAGES[activeLang];

  useEffect(() => {
    // Initialize Web Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleUserSpeech(text);
      };

      recognitionRef.current.onerror = (event) => {
        console.warn('Speech recognition error', event.error);
        if (callState === 'CONNECTED' && agentStatus === 'Listening...') {
            // Retry listening if no speech was detected
            if (event.error === 'no-speech') {
                recognitionRef.current.start();
            } else {
                setAgentStatus('Error listening');
            }
        }
      };
      
      recognitionRef.current.onend = () => {
          if (callState === 'CONNECTED' && agentStatus === 'Listening...') {
             // recognitionRef.current.start(); // Auto-restart if it stopped but should be listening
          }
      };
    }
    
    return () => {
      endCall();
    };
  }, [callState, activeLang]);

  const speakText = (text, langId, callback) => {
    if (!synthRef.current) return;
    synthRef.current.cancel(); // Cancel any ongoing speech
    
    setAgentStatus('Speaking...');
    const config = REGIONAL_LANGUAGES[langId] || REGIONAL_LANGUAGES['hi'];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = config.langCode;
    utterance.rate = 0.95;
    
    // Try to find a suitable voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => config.voiceKeywords.some(keyword => v.lang.toLowerCase().includes(keyword.toLowerCase())));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      if (callback) callback();
    };
    
    utterance.onerror = (e) => {
        console.error("Speech Synthesis Error:", e);
        if (callback) callback();
    };

    setConversationHistory(prev => [...prev, { role: 'agent', text }]);
    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = langConfig.langCode;
      setAgentStatus('Listening...');
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Recognition already started or error:", e);
      }
    } else {
      setAgentStatus('Speech Recognition not supported in this browser.');
    }
  };

  const handleUserSpeech = (text) => {
    setConversationHistory(prev => [...prev, { role: 'user', text }]);
    setAgentStatus('Processing...');
    
    // Simulate LLM Processing time
    setTimeout(() => {
        generateAiResponse(text);
    }, 1000);
  };

  const generateAiResponse = (userText) => {
    // Simulated AI Brain (Rule-based for local demo)
    const lowerText = userText.toLowerCase();
    let responseText = '';
    let currentLang = activeLang;

    // Detect Language Switching Commands
    if (lowerText.includes('english') || lowerText.includes('अंग्रेज़ी') || lowerText.includes('अंग्रेजी')) {
        currentLang = 'en';
        setActiveLang('en');
        responseText = 'I have switched to English. How can I assist you with the flash flood emergency?';
    } else if (lowerText.includes('hindi') || lowerText.includes('हिंदी')) {
        currentLang = 'hi';
        setActiveLang('hi');
        responseText = 'मैंने हिंदी में बात करना शुरू कर दिया है। मैं आपकी कैसे मदद कर सकती हूँ?';
    } else if (lowerText.includes('garhwali') || lowerText.includes('kumaoni') || lowerText.includes('गढ़वाली') || lowerText.includes('कुमाऊँनी')) {
        currentLang = 'local_uttarakhand';
        setActiveLang('local_uttarakhand');
        responseText = 'ठीक छ, मैं गढ़वाली मां बात करणु। त्वे क्य मदद चैंद?';
    } else if (lowerText.includes('bengali') || lowerText.includes('বাংলা') || lowerText.includes('bangla')) {
        currentLang = 'bn';
        setActiveLang('bn');
        responseText = 'আমি এখন বাংলায় কথা বলছি। আমি আপনাকে কীভাবে সাহায্য করতে পারি?';
    } else if (lowerText.includes('marathi') || lowerText.includes('मराठी')) {
        currentLang = 'mr';
        setActiveLang('mr');
        responseText = 'मी आता मराठीत बोलत आहे. मी तुम्हाला कशी मदत करू शकेन?';
    } else if (lowerText.includes('telugu') || lowerText.includes('తెలుగు')) {
        currentLang = 'te';
        setActiveLang('te');
        responseText = 'నేను ఇప్పుడు తెలుగులో మాట్లాడుతున్నాను. నేను మీకు ఎలా సహాయం చేయగలను?';
    } else if (lowerText.includes('tamil') || lowerText.includes('தமிழ்')) {
        currentLang = 'ta';
        setActiveLang('ta');
        responseText = 'நான் இப்போது தமிழில் பேசுகிறேன். நான் உங்களுக்கு எப்படி உதவ முடியும்?';
    } else if (lowerText.includes('gujarati') || lowerText.includes('ગુજરાતી')) {
        currentLang = 'gu';
        setActiveLang('gu');
        responseText = 'હું હવે ગુજરાતીમાં વાત કરી રહી છું. હું તમને કેવી રીતે મદદ કરી શકું?';
    } else {
        // Normal conversation logic based on current language
        if (currentLang === 'hi' || currentLang === 'local_uttarakhand') {
            if (lowerText.includes('मदद') || lowerText.includes('बचाओ') || lowerText.includes('help')) {
                responseText = 'घबराएं नहीं। हमने आपकी लोकेशन ट्रैक कर ली है। बचाव दल रास्ते में है। क्या आपके साथ और भी लोग हैं?';
            } else if (lowerText.includes('हां') || lowerText.includes('जी')) {
                responseText = 'ठीक है। कृपया ऊंचे स्थान पर बने रहें। हम आपसे संपर्क में रहेंगे।';
            } else {
                responseText = 'यह एक आपातकालीन अलर्ट है। कृपया तुरंत सुरक्षित स्थान पर जाएं। मैं आपकी स्थिति एसडीआरएफ को भेज रही हूं।';
            }
        } else if (currentLang === 'bn') {
            if (lowerText.includes('help') || lowerText.includes('সাহায্য') || lowerText.includes('বাঁচাও')) {
                responseText = 'ভয় পাবেন না। আমরা আপনার অবস্থান ট্র্যাক করেছি। উদ্ধারকারী দল পাঠানো হচ্ছে।';
            } else {
                responseText = 'এটি একটি জরুরি সতর্কতা। অবিলম্বে নিরাপদ স্থানে সরে যান।';
            }
        } else if (currentLang === 'mr') {
            if (lowerText.includes('help') || lowerText.includes('मदत') || lowerText.includes('वाचवा')) {
                responseText = 'घाबरू नका. आम्ही तुमचे लोकेशन ट्रॅक केले आहे. बचाव पथक वाटेत आहे.';
            } else {
                responseText = 'हा आपत्कालीन इशारा आहे. कृपया त्वरित सुरक्षित स्थळी जा.';
            }
        } else if (currentLang === 'te') {
            if (lowerText.includes('help') || lowerText.includes('సహాయం')) {
                responseText = 'భయపడవద్దు. మేము మీ స్థానాన్ని ట్రాక్ చేసాము. రెస్క్యూ టీమ్ వస్తోంది.';
            } else {
                responseText = 'ఇది అత్యవసర హెచ్చరిక. దయచేసి వెంటనే సురక్షిత ప్రాంతానికి వెళ్లండి.';
            }
        } else if (currentLang === 'ta') {
            if (lowerText.includes('help') || lowerText.includes('உதவி')) {
                responseText = 'பயப்பட வேண்டாம். மீட்பு குழு அனுப்பப்பட்டுள்ளது.';
            } else {
                responseText = 'இது ஒரு அவசர எச்சரிக்கை. உடனடியாக பாதுகாப்பான இடத்திற்கு செல்லுங்கள்.';
            }
        } else if (currentLang === 'gu') {
            if (lowerText.includes('help') || lowerText.includes('મદદ')) {
                responseText = 'ગભરાશો નહીં. બચાવ ટીમ રસ્તામાં છે.';
            } else {
                responseText = 'આ એક ઈમરજન્સી એલર્ટ છે. કૃપા કરીને સલામત સ્થળે પહોંચો.';
            }
        } else {
            if (lowerText.includes('help') || lowerText.includes('rescue') || lowerText.includes('trapped')) {
                responseText = 'Do not panic. We have recorded your distress signal. A rescue team is being dispatched. Are there others with you?';
            } else if (lowerText.includes('yes') || lowerText.includes('yeah')) {
                responseText = 'Understood. Please stay on high ground. We will keep this line open.';
            } else {
                responseText = 'This is an emergency alert. Please evacuate to safe ground immediately. Sending your coordinates to SDRF now.';
            }
        }
    }
    
    speakText(responseText, currentLang, () => {
        startListening();
    });
  };

  const startCall = () => {
    // Default to Hindi on every new call
    setActiveLang('hi');
    
    setConversationHistory([]);
    setTranscript('');
    setCallState('RINGING');
    setAgentStatus('Ringing...');
    
    // Simulate Ringing
    setTimeout(() => {
      setCallState('CONNECTED');
      
      // Initial Greeting (Always starts in Hindi as requested)
      const greeting = 'आपातकालीन चेतावनी। आपके क्षेत्र में फ्लैश फ्लड अलर्ट जारी किया गया है। मैं जल दृष्टि एआई असिस्टेंट हूं। क्या आपको तुरंत मदद चाहिए? To continue in English, please say English.';
        
      speakText(greeting, 'hi', () => {
          startListening();
      });
      
    }, 2000);
  };

  const endCall = () => {
    if (synthRef.current) {
        synthRef.current.cancel();
    }
    if (recognitionRef.current && agentStatus === 'Listening...') {
        try { recognitionRef.current.stop(); } catch(e){}
    }
    setCallState('ENDED');
    setAgentStatus('Call Terminated.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 p-4 border-b border-blue-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 animate-pulse">
              <span className="material-symbols-outlined text-xl">smart_toy</span>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Interactive AI Calling Agent
                <span className="text-[10px] uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Autonomous
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Two-way conversational AI • LLM + STT/TTS • Regional Support
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-sm">
          {/* Language Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Agent Language
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.values(REGIONAL_LANGUAGES).map((s) => {
                const isSelected = activeLang === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setActiveLang(s.id)}
                    disabled={callState !== 'IDLE' && callState !== 'ENDED'}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/15 border-blue-500 text-white shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    } disabled:opacity-50`}
                  >
                    <div className="font-semibold text-xs leading-tight flex items-center justify-between">
                      <span>{s.name}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipient Phone Switcher */}
          <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Target Number
                </label>
              </div>
              <div className="flex items-center gap-2">
                {defaultNumbers.map((num, idx) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setActiveNumberIndex(idx)}
                    disabled={callState !== 'IDLE' && callState !== 'ENDED'}
                    className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                      activeNumberIndex === idx
                        ? 'bg-slate-200 text-slate-900 shadow-sm font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    } disabled:opacity-50`}
                  >
                    +91 {num}
                  </button>
                ))}
              </div>
          </div>

          {/* AI Call Interface */}
          <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl p-4 border border-slate-800 shadow-inner flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
            
            {callState === 'IDLE' && (
              <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-2">
                      <span className="material-symbols-outlined text-3xl text-slate-500">record_voice_over</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Ready to Dispatch AI</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Initiate an autonomous outbound call. The AI agent will dial the number, speak the warning in {langConfig.name}, and listen to the citizen's response dynamically.
                  </p>
                  <button
                    onClick={startCall}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all mx-auto"
                  >
                    <span className="material-symbols-outlined text-lg">call</span>
                    <span>Start AI Outbound Call</span>
                  </button>
              </div>
            )}

            {callState === 'RINGING' && (
               <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-2 animate-pulse">
                      <span className="material-symbols-outlined text-3xl text-blue-400">ring_volume</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Dialing +91 {currentNumber}...</h3>
                  <p className="text-xs text-blue-400 font-mono animate-pulse">Connecting to PSTN Gateway...</p>
               </div>
            )}

            {callState === 'CONNECTED' && (
               <div className="w-full flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          CALL CONNECTED
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                          {agentStatus}
                      </div>
                  </div>

                  {/* Conversation History */}
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 max-h-[150px] min-h-[150px]">
                      {conversationHistory.length === 0 && agentStatus === 'Speaking...' && (
                          <div className="text-xs text-slate-500 italic text-center mt-8">Agent is generating response...</div>
                      )}
                      {conversationHistory.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] p-2.5 rounded-xl text-xs ${
                                  msg.role === 'user' 
                                  ? 'bg-slate-700 text-white rounded-br-none' 
                                  : 'bg-blue-900/40 border border-blue-800/50 text-blue-100 rounded-bl-none'
                              }`}>
                                  {msg.text}
                              </div>
                          </div>
                      ))}
                      {agentStatus === 'Listening...' && (
                           <div className="flex justify-end mt-2">
                              <div className="max-w-[80%] p-2 rounded-xl text-xs bg-slate-800 text-slate-400 border border-slate-700 rounded-br-none flex items-center gap-2">
                                  <span className="material-symbols-outlined text-sm animate-pulse text-red-400">mic</span>
                                  {transcript || 'Listening to your microphone...'}
                              </div>
                           </div>
                      )}
                  </div>

                  <div className="mt-auto flex justify-center">
                      <button
                        onClick={endCall}
                        className="px-5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">call_end</span>
                        <span>End Call</span>
                      </button>
                  </div>
               </div>
            )}

            {callState === 'ENDED' && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-2">
                      <span className="material-symbols-outlined text-3xl text-slate-500">call_end</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Call Terminated</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      The AI agent has successfully completed the interaction and logged the distress status.
                  </p>
                  <button
                    onClick={() => setCallState('IDLE')}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all mx-auto"
                  >
                    <span className="material-symbols-outlined text-lg">refresh</span>
                    <span>New Call</span>
                  </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
