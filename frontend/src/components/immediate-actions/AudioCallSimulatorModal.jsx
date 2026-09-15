import React, { useState, useEffect, useRef } from 'react';

const AUDIO_SCRIPTS = {
  hi: {
    id: 'hi',
    name: 'Hindi (हिंदी)',
    langCode: 'hi-IN',
    audioUrl: '/audio/alert_hi.mp3',
    title: 'आपातकालीन फ्लैश फ्लड चेतावनी',
    text: 'आपातकालीन चेतावनी! उत्तराखंड राज्य आपदा प्रबंधन प्राधिकरण द्वारा तत्काल फ्लैश फ्लड रेड अलर्ट जारी किया गया है। अलकनंदा एवं मंदाकिनी नदी घाटी में जलस्तर खतरे के निशान को पार कर चुका है। सभी नागरिक नदी तट छोड़कर तुरंत निकटतम ऊंचे स्थानों और राजकीय राहत शिविर की ओर सुरक्षित प्रस्थान करें। एसडीआरएफ और एनडीआरएफ की टीमें तैनात हैं।',
  },
  en: {
    id: 'en',
    name: 'English',
    langCode: 'en-IN',
    audioUrl: '/audio/alert_en.mp3',
    title: 'EMERGENCY FLASH FLOOD BROADCAST',
    text: 'Emergency flash flood alert! Issued by the Uttarakhand State Disaster Management Authority. Dangerous river stage breach detected across the Alaknanda and Mandakini catchments. Immediately evacuate all low-lying riverbanks. Proceed to designated government relief shelters on high ground. NDRF and SDRF rescue battalions are mobilized.',
  },
  local_uttarakhand: {
    id: 'local_uttarakhand',
    name: 'Garhwali / Kumaoni (गढ़वाली / कुमाऊँनी)',
    langCode: 'hi-IN',
    audioUrl: '/audio/alert_local.mp3',
    title: 'अलकनंदा-मंदाकिनी घाटी बाढ़ चेतावनी',
    text: 'होशियार रयां! उत्तराखंड आपदा प्रबंधन प्राधिकरण तरफ़ा बिट्टी भारी बाढ़ कु रेड अलर्ट जारी करे ग्या छ। अलकनंदा अर मंदाकिनी गाड़ मां पाणी खतरनाक रूप से बढ़ी ग्ये। सब्बी भाई-बैंण नदी कु किनारा छोड़ी बेर तुरंत ऊंच डांडा, ऊंचे स्थानों अर सरकारी राहत कैंप मां चली जावा। एसडीआरएफ अर एनडीआरएफ का जवान पहुंचणा छन। धैर्य रख्यां, सुरक्षित रयां।',
  },
};

export default function AudioCallSimulatorModal({
  isOpen,
  onClose,
  defaultNumbers = ['9748379047', '98833 70734', '90195 86089'],
}) {
  const [activeLang, setActiveLang] = useState('hi');
  const [callState, setCallState] = useState('IDLE'); // IDLE, RINGING, CONNECTED, ENDED
  const [activeNumberIndex, setActiveNumberIndex] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [physicalDispatchLoading, setPhysicalDispatchLoading] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);

  // Twilio credentials loaded from environment variables or provided defaults
  const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
  const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
  const apiKey = import.meta.env.VITE_TWILIO_API_KEY || '';
  const fromNumber = import.meta.env.VITE_TWILIO_FROM_NUMBER || '';


  const audioContextRef = useRef(null);
  const audioElementRef = useRef(null);
  const ringOscRef = useRef(null);
  const ringTimerRef = useRef(null);

  const currentNumber = defaultNumbers[activeNumberIndex] || defaultNumbers[0];
  const activeScript = AUDIO_SCRIPTS[activeLang];

  // Clean up audio on unmount or close
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const getAudioContext = () => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  const stopAllAudio = () => {
    // 1. Stop MP3 Audio element
    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      } catch (e) {}
      audioElementRef.current = null;
    }

    // 2. Stop ring oscillator
    if (ringOscRef.current) {
      try {
        ringOscRef.current.stop();
        ringOscRef.current.disconnect();
      } catch (e) {}
      ringOscRef.current = null;
    }

    if (ringTimerRef.current) {
      clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }

    // 3. Cancel any speech synthesis fallback
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    setIsPlayingAudio(false);
  };

  // Play realistic telephone ring sound (440Hz + 480Hz) for 1.2s
  const playRingTone = (onComplete) => {
    try {
      const ctx = getAudioContext();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(480, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.01, ctx.currentTime + 1.2);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      ringOscRef.current = osc1;

      ringTimerRef.current = setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
        } catch (e) {}
        ringOscRef.current = null;
        if (onComplete) onComplete();
      }, 1250);
    } catch (e) {
      console.warn('Web Audio ring tone note:', e);
      if (onComplete) onComplete();
    }
  };

  // Play actual spoken prerecorded neural audio file (MP3)
  const playPrerecordedVoice = (langKey) => {
    stopAllAudio();
    const script = AUDIO_SCRIPTS[langKey] || AUDIO_SCRIPTS.hi;
    const audioUrl = script.audioUrl;

    try {
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      audio.volume = 1.0;

      audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setAudioProgress(100);
        setIsPlayingAudio(false);
        setTimeout(() => {
          setCallState('ENDED');
        }, 800);
      };

      audio.onerror = (e) => {
        console.warn('MP3 loading error, switching to speech synthesis fallback:', e);
        fallbackToSpeech(script);
      };

      audio.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((err) => {
        console.warn('Autoplay blocked, switching to speech fallback:', err);
        fallbackToSpeech(script);
      });
    } catch (err) {
      fallbackToSpeech(script);
    }
  };

  // Graceful fallback to Web Speech Synthesis if audio file cannot be loaded
  const fallbackToSpeech = (script) => {
    if (!window.speechSynthesis) {
      setCallState('ENDED');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const utterance = new SpeechSynthesisUtterance(script.text);
      utterance.lang = script.langCode;
      utterance.rate = 0.95;
      utterance.volume = 1.0;

      utterance.onend = () => {
        setAudioProgress(100);
        setIsPlayingAudio(false);
        setCallState('ENDED');
      };
      utterance.onerror = () => {
        setIsPlayingAudio(false);
        setCallState('ENDED');
      };

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    } catch (e) {
      setCallState('ENDED');
    }
  };

  // Start Call Simulation
  const startCallSimulation = () => {
    stopAllAudio();
    getAudioContext();
    setCallState('RINGING');
    setAudioProgress(0);

    // Play 1.2s ring then connect directly to spoken voice
    playRingTone(() => {
      setCallState('CONNECTED');
      playPrerecordedVoice(activeLang);
    });
  };

  // Toggle Pause/Play during active call
  const toggleAudioPlayPause = () => {
    if (!audioElementRef.current) {
      playPrerecordedVoice(activeLang);
      return;
    }
    if (audioElementRef.current.paused) {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    } else {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  const togglePlayPause = () => toggleAudioPlayPause();
  const replayVoice = () => playPrerecordedVoice(activeLang);

  // Switch Language directly
  const handleSelectLanguage = (langId) => {
    setActiveLang(langId);
    if (callState === 'CONNECTED') {
      // Re-trigger spoken voice in the new language immediately
      playPrerecordedVoice(langId);
    }
  };

  // Trigger Live Twilio Dispatch (Backend Integration)
  const handlePhysicalCallDispatch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    setPhysicalDispatchLoading(true);
    setDispatchResult(null);
    try {
      const response = await fetch('/api/v1/immediate-actions/call/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_numbers: defaultNumbers,
          auth_token: authToken,
          account_sid: accountSid,
          api_key: apiKey,
          from_number: fromNumber,
          language: activeLang,
          basin_location: 'Alaknanda & Mandakini Valley (Kedarnath Axis)',
          severity: 'CRITICAL',
        }),
      });
      const data = await response.json();
      setDispatchResult(data);
    } catch (err) {
      setDispatchResult({
        success: false,
        message: err.message || 'Could not connect to backend Twilio dispatch service.',
      });
    } finally {
      setPhysicalDispatchLoading(false);
    }
  };

  const [individualLoading, setIndividualLoading] = useState({});
  const [individualStatus, setIndividualStatus] = useState({});

  // Trigger individual handset call via Twilio
  const handleCallSingleNumber = async (num, e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    const clean = num.replace(/\s+/g, '');
    const fullNum = clean.startsWith('+') ? clean : `+91${clean}`;
    setIndividualLoading((prev) => ({ ...prev, [clean]: true }));
    setIndividualStatus((prev) => ({ ...prev, [clean]: null }));
    try {
      const response = await fetch('/api/v1/immediate-actions/call/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_numbers: [fullNum],
          auth_token: authToken,
          account_sid: accountSid,
          api_key: apiKey,
          from_number: fromNumber,
          language: activeLang,
          basin_location: 'Alaknanda & Mandakini Valley',
          severity: 'CRITICAL',
        }),
      });
      const data = await response.json();
      const dispatch = data?.data?.dispatches?.[0];
      const isSuccess = dispatch?.status === 'LIVE_CALL_RINGING' || dispatch?.status === 'QUEUED' || dispatch?.status === 'DISPATCHED';
      setIndividualStatus((prev) => ({
        ...prev,
        [clean]: {
          success: isSuccess,
          status: dispatch?.status || (isSuccess ? 'LIVE_CALL_RINGING' : 'Failed'),
          sid: dispatch?.call_sid || dispatch?.call_id || (isSuccess ? 'CA-TWILIO-OK' : null),
        },
      }));
    } catch (err) {
      setIndividualStatus((prev) => ({
        ...prev,
        [clean]: {
          success: false,
          status: 'Twilio call failed',
          message: err.message || 'Twilio call failed',
        },
      }));
    } finally {
      setIndividualLoading((prev) => ({ ...prev, [clean]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 p-4 border-b border-red-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 animate-pulse">
              <span className="material-symbols-outlined text-xl">record_voice_over</span>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Automated Voice Early Warning Simulator
                <span className="text-[10px] uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Twilio Direct PSTN
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Studio Spoken Audio • Registered Handsets: {defaultNumbers.join(', ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              if (e && e.preventDefault) e.preventDefault();
              stopAllAudio();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-sm">
          {/* Step 1: Language Selector Strip */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Step 1: Select Spoken Voice Language
              </label>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                HD Audio Loaded
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.values(AUDIO_SCRIPTS).map((s) => {
                const isSelected = activeLang === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={(e) => {
                      if (e && e.preventDefault) e.preventDefault();
                      handleSelectLanguage(s.id);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-500/15 border-red-500 text-white shadow-md shadow-red-500/10 ring-1 ring-red-500'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-semibold text-xs leading-tight flex items-center justify-between">
                      <span>{s.name}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-red-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prerecorded Spoken Script Transcript */}
          <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="font-medium text-red-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                {activeScript.title}
              </span>
              <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                Prerecorded IVR Voice
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
              "{activeScript.text}"
            </p>
          </div>

          {/* Browser Phone Handset Simulator & Spoken Audio Player */}
          <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl p-4 border border-slate-800 shadow-inner flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Top Indicator */}
            <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-sm text-emerald-400">cell_tower</span>
              <span>USDMA Emergency Broadcast Line (Browser Audio Simulation)</span>
            </div>

            {/* Recipient Phone Switcher */}
            <div className="flex items-center gap-2 mb-3">
              {defaultNumbers.map((num, idx) => (
                <button
                  type="button"
                  key={num}
                  onClick={(e) => {
                    if (e && e.preventDefault) e.preventDefault();
                    setActiveNumberIndex(idx);
                    if (callState !== 'IDLE') {
                      stopAllAudio();
                      setCallState('IDLE');
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                    activeNumberIndex === idx
                      ? 'bg-red-600 text-white shadow-sm shadow-red-600/30 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  +91 {num}
                </button>
              ))}
            </div>

            {/* Call State Display */}
            <div className="w-full max-w-sm bg-slate-900/90 rounded-xl p-4 border border-slate-800 my-2">
              <div className="text-xs font-mono text-slate-400 mb-1">Incoming Alert Call</div>
              <div className="text-xl font-bold font-mono text-white mb-2">+91 {currentNumber}</div>

              {callState === 'IDLE' && (
                <div className="text-xs text-slate-400 py-3 flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span>Line Ready • Click below to test voice warning</span>
                </div>
              )}

              {callState === 'RINGING' && (
                <div className="space-y-2 py-2">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold animate-pulse">
                    <span className="material-symbols-outlined text-base">phone_in_talk</span>
                    <span>Ringing Recipient Handset...</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Connecting to citizen cell terminal</div>
                </div>
              )}

              {callState === 'CONNECTED' && (
                <div className="space-y-2.5 py-1">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      CALL CONNECTED
                    </span>
                    <span>{activeScript.name}</span>
                  </div>

                  {/* Audio Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-red-500 h-full transition-all duration-200"
                      style={{ width: `${audioProgress}%` }}
                    />
                  </div>

                  {/* Audio Controls */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        if (e && e.preventDefault) e.preventDefault();
                        togglePlayPause();
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {isPlayingAudio ? 'pause' : 'play_arrow'}
                      </span>
                      <span>{isPlayingAudio ? 'Pause' : 'Resume'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        if (e && e.preventDefault) e.preventDefault();
                        replayVoice();
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">replay</span>
                      <span>Replay</span>
                    </button>
                  </div>
                </div>
              )}

              {callState === 'ENDED' && (
                <div className="space-y-1 py-2">
                  <div className="text-base font-bold text-slate-300 flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                    <span>Emergency Warning Broadcast Delivered</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Prerecorded audio alert simulation completed.
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons for Browser Audio */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              {callState === 'IDLE' || callState === 'ENDED' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    if (e && e.preventDefault) e.preventDefault();
                    startCallSimulation();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">play_arrow</span>
                  <span>Play Spoken Voice Simulation</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    if (e && e.preventDefault) e.preventDefault();
                    stopAllAudio();
                    setCallState('ENDED');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 cursor-pointer border border-red-500/30"
                >
                  <span className="material-symbols-outlined text-lg">call_end</span>
                  <span>Hang Up Simulation</span>
                </button>
              )}
            </div>
          </div>

          {/* Physical Phone Calling Section via Twilio Direct */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-lg">phone_android</span>
                <span className="font-bold text-xs text-white uppercase tracking-wider">
                  Physical Phone Outbound Calling (Twilio Direct Cloud API)
                </span>
              </div>
              <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Twilio PSTN Gateway: Connected (Direct Dial)</span>
              </div>
            </div>

            {/* Direct Physical Handset Calling Buttons (Twilio API, no tel:) */}
            <div className="space-y-1.5">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Direct Cellular Calling via Twilio PSTN Gateway:</span>
                <span className="text-[10px] text-emerald-400 font-medium">Direct Twilio Ring • No App Prompt</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {defaultNumbers.map((num) => {
                  const clean = num.replace(/\s+/g, '');
                  const isLoading = individualLoading[clean];
                  const status = individualStatus[clean];
                  return (
                    <button
                      type="button"
                      key={num}
                      onClick={(e) => handleCallSingleNumber(num, e)}
                      disabled={isLoading}
                      className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 hover:border-emerald-400 disabled:opacity-60 transition-all flex flex-col justify-between text-left text-emerald-300 hover:text-white cursor-pointer group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-base text-emerald-400 ${isLoading ? 'animate-spin' : 'group-hover:scale-110'} transition-transform`}>
                            {isLoading ? 'sync' : 'call'}
                          </span>
                          <div className="font-mono font-bold text-xs text-white">+91 {num}</div>
                        </div>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-500/40">
                          {isLoading ? 'Calling...' : 'Twilio PSTN'}
                        </span>
                      </div>
                      
                      <div className="mt-1.5 text-[10px] text-emerald-300 flex items-center justify-between w-full">
                        {status ? (
                          <span className="text-emerald-300 font-mono font-bold truncate">
                            ✓ {status.status || 'Queued'} {status.sid ? `(${status.sid.slice(0, 8)}...)` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400 group-hover:text-emerald-200">
                            Click to call physical handset
                          </span>
                        )}
                        <span className="material-symbols-outlined text-xs text-emerald-400">arrow_forward</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Twilio Automated Broadcast Dispatch to All Numbers */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Trigger automated cloud dialing to all 3 phones simultaneously via Twilio carrier line:
              </div>
              <button
                type="button"
                onClick={(e) => handlePhysicalCallDispatch(e)}
                disabled={physicalDispatchLoading}
                className="w-full sm:w-auto shrink-0 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 cursor-pointer"
              >
                {physicalDispatchLoading ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    <span>Handshaking Twilio PSTN...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">phone_forwarded</span>
                    <span>Trigger Twilio Call to All 3 Numbers</span>
                  </>
                )}
              </button>
            </div>

            {/* Dispatch Result Card */}
            {dispatchResult && (
              <div className="mt-2 p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>Twilio Carrier Dispatch: {dispatchResult.message || 'Dispatched'}</span>
                  <span>{dispatchResult.count || 3} Numbers Dialed</span>
                </div>
                {dispatchResult.data?.dispatches?.map((d) => (
                  <div key={d.call_id} className="text-slate-300 border-t border-slate-800 pt-1.5 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{d.phone_number}</span>
                      <span className="text-emerald-300 font-semibold">{d.status}</span>
                    </div>
                    {d.carrier_response?.notice && (
                      <div className="text-slate-400 text-[10px] bg-slate-950 p-2 rounded border border-slate-800">
                        {d.carrier_response.notice}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>USDMA SEOC Emergency Communications Terminal</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              if (e && e.preventDefault) e.preventDefault();
              stopAllAudio();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
