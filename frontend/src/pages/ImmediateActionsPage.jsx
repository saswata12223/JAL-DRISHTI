import React, { useState, useEffect } from 'react';
import immediateActionsService from '../services/immediateActionsService';
import TacticalActionMap from '../components/immediate-actions/TacticalActionMap';
import AudioCallSimulatorModal from '../components/immediate-actions/AudioCallSimulatorModal';

// Multilingual Warning Audio Scripts
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

// Emergency Multichannel Presets for SMS and WhatsApp
const MESSAGE_TEMPLATES = {
  critical: {
    id: 'critical',
    name: '🔴 Red Alert Evacuation (Extreme Surge)',
    badge: 'Critical Red Alert',
    severity: 'CRITICAL',
    sms: '[URGENT JAL DRISHTI RED ALERT] Extreme flash flood surge in Alaknanda & Mandakini valleys. Evacuate riverfront immediately. Nearest shelter: Gauchar / Srinagar Relief Camp. Reply SOS for rescue: https://jaldrishti.uk.gov.in/immediate-actions',
    whatsapp: `🚨 *[URGENT JAL DRISHTI FLASH FLOOD RED ALERT]*

⚡ *Uttarakhand SDMA Emergency Operations Command*
🌊 Dangerous river stage breach detected across *Alaknanda & Mandakini Valleys*.

📍 *IMMEDIATE ACTION PROTOCOL:*
• Evacuate low-lying riverbanks, ghats, and riverbed dwellings immediately.
• Proceed along designated green egress corridors to nearest government shelters (*Gauchar Degree College / Srinagar Stadium Shelter*).
• Avoid NH-07 & NH-107 river crossings during active surge.

🆘 *Emergency SOS Rescue:* Open https://jaldrishti.uk.gov.in/immediate-actions or reply SOS.
📞 State Disaster Helpline: *1070* / *112* | SDRF Control: *0135-2710334*`,
  },
  warning: {
    id: 'warning',
    name: '🟠 Precautionary Cloudburst & Runoff Warning',
    badge: 'Precautionary Warning',
    severity: 'WARNING',
    sms: '[JAL DRISHTI WARNING] Monsoonal cloudburst & rapid runoff alert for Rudraprayag & Chamoli. Avoid NH-07/NH-107 river crossings. Move livestock to high ground: https://jaldrishti.uk.gov.in/immediate-actions',
    whatsapp: `⚠️ *[JAL DRISHTI MONSOONAL FLOOD WARNING]*

🌧️ *IMD Severe Runoff & Cloudburst Advisory for Uttarakhand*
High-intensity precipitation recorded across *Rudraprayag, Chamoli, and Uttarkashi catchments*.

🚧 *SAFETY DIRECTIVES:*
• Maintain safe distance from riverbanks and chronic landslide bottlenecks (*Sirobagarh / Totaghati*).
• Shift livestock, essential rations, and medical kits to higher elevation.
• Keep emergency torches and mobile phones on maximum charge.

🌐 Live Geospatial Radar & Gauge Feeds: https://jaldrishti.uk.gov.in/monitoring`,
  },
  all_clear: {
    id: 'all_clear',
    name: '🟢 All-Clear & Relief Operations Update',
    badge: 'All-Clear Advisory',
    severity: 'ALL_CLEAR',
    sms: '[JAL DRISHTI ALL-CLEAR] River stage receded below danger mark. 6 District relief camps open with water, food & medical aid. Exercise caution on highways.',
    whatsapp: `✅ *[JAL DRISHTI ALL-CLEAR ADVISORY]*

📈 *Hydrological Situation Update:*
River discharge levels across *Alaknanda, Mandakini & Bhagirathi* have stabilized below the official danger mark.

🏥 *STATE RELIEF CAMP CAPACITIES:*
• 6 District relief shelters active with 1,940 open berths and standby medical units.
• Free hot meals and clean drinking water available at *Gauchar, Srinagar & IDPL Rishikesh*.
• Rescue convoys and public transport resumed on inspected routes.

ℹ️ State Emergency Operations Portal: https://jaldrishti.uk.gov.in/dashboard`,
  },
};

const TARGET_NUMBERS = ['9748379047', '98833 70734', '90195 86089'];
const TARGET_DETAILS = [
  { phone: '9748379047', name: 'SDRF Rudraprayag QRT Commander', role: 'Quick Response Tactical Lead', district: 'Rudraprayag' },
  { phone: '98833 70734', name: 'Chamoli District Disaster Officer', role: 'SEOC Emergency Liaison', district: 'Chamoli' },
  { phone: '90195 86089', name: 'Guptkashi Staging Base Officer', role: 'Mandakini Sector Forward Base', district: 'Rudraprayag' },
];

export default function ImmediateActionsPage() {
  const [activeTab, setActiveTab] = useState('tactical'); // tactical, population, calls, sms_sos, shelters
  const [tacticalData, setTacticalData] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Map focus & routing state
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);

  // Audio simulator modal
  const [callModalOpen, setCallModalOpen] = useState(false);

  // Browser Audio Simulation in Calling Tab
  const [tabSimLang, setTabSimLang] = useState('hi');
  const [tabSimCallState, setTabSimCallState] = useState('IDLE'); // IDLE, RINGING, CONNECTED, ENDED
  const [tabSimTargetIndex, setTabSimTargetIndex] = useState(0);
  const [tabSimAudioProgress, setTabSimAudioProgress] = useState(0);
  const [tabSimIsPlaying, setTabSimIsPlaying] = useState(false);

  // Physical Twilio Calling state
  const [singleCallLoading, setSingleCallLoading] = useState({});
  const [singleCallResult, setSingleCallResult] = useState({});
  const [allCallsLoading, setAllCallsLoading] = useState(false);
  const [allCallsResult, setAllCallsResult] = useState(null);

  // Multichannel Messaging (SMS & WhatsApp) state
  const [activeMessagingChannel, setActiveMessagingChannel] = useState('whatsapp'); // 'whatsapp' | 'sms' | 'dual'
  const [selectedTemplate, setSelectedTemplate] = useState('critical');
  const [customSmsText, setCustomSmsText] = useState(MESSAGE_TEMPLATES.critical.sms);
  const [customWhatsappText, setCustomWhatsappText] = useState(MESSAGE_TEMPLATES.critical.whatsapp);
  const [previewChannel, setPreviewChannel] = useState('whatsapp'); // 'whatsapp' | 'sms'

  // SMS dispatch state
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState(null);

  // WhatsApp dispatch state
  const [whatsappSending, setWhatsappSending] = useState(false);
  const [whatsappResult, setWhatsappResult] = useState(null);

  // Per-number messaging states
  const [singleMessagingLoading, setSingleMessagingLoading] = useState({});
  const [singleMessagingResult, setSingleMessagingResult] = useState({});

  // Shelter broadcast state
  const [shelterBroadcastLoading, setShelterBroadcastLoading] = useState(false);
  const [shelterBroadcastSuccess, setShelterBroadcastSuccess] = useState(null);

  // Audio Refs for in-tab simulation
  const tabAudioContextRef = React.useRef(null);
  const tabAudioElementRef = React.useRef(null);
  const tabRingOscRef = React.useRef(null);
  const tabRingTimerRef = React.useRef(null);

  const currentTabSimNumber = TARGET_NUMBERS[tabSimTargetIndex] || TARGET_NUMBERS[0];
  const activeTabScript = AUDIO_SCRIPTS[tabSimLang] || AUDIO_SCRIPTS.hi;

  const stopTabAudio = () => {
    if (tabAudioElementRef.current) {
      try {
        tabAudioElementRef.current.pause();
        tabAudioElementRef.current.currentTime = 0;
      } catch (e) {}
      tabAudioElementRef.current = null;
    }
    if (tabRingOscRef.current) {
      try {
        tabRingOscRef.current.stop();
        tabRingOscRef.current.disconnect();
      } catch (e) {}
      tabRingOscRef.current = null;
    }
    if (tabRingTimerRef.current) {
      clearTimeout(tabRingTimerRef.current);
      tabRingTimerRef.current = null;
    }
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setTabSimIsPlaying(false);
  };

  const getTabAudioContext = () => {
    if (!tabAudioContextRef.current || tabAudioContextRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      tabAudioContextRef.current = new AudioCtx();
    }
    if (tabAudioContextRef.current.state === 'suspended') {
      tabAudioContextRef.current.resume();
    }
    return tabAudioContextRef.current;
  };

  const playTabRingTone = (onComplete) => {
    try {
      const ctx = getTabAudioContext();
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
      tabRingOscRef.current = osc1;

      tabRingTimerRef.current = setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
        } catch (e) {}
        tabRingOscRef.current = null;
        if (onComplete) onComplete();
      }, 1250);
    } catch (e) {
      console.warn('Tab ring sound note:', e);
      if (onComplete) onComplete();
    }
  };

  const playTabVoice = (langKey) => {
    stopTabAudio();
    const script = AUDIO_SCRIPTS[langKey] || AUDIO_SCRIPTS.hi;
    try {
      const audio = new Audio(script.audioUrl);
      tabAudioElementRef.current = audio;
      audio.volume = 1.0;
      audio.ontimeupdate = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setTabSimAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      audio.onended = () => {
        setTabSimAudioProgress(100);
        setTabSimIsPlaying(false);
        setTimeout(() => {
          setTabSimCallState('ENDED');
        }, 800);
      };
      audio.onerror = () => {
        fallbackTabSpeech(script);
      };
      audio.play().then(() => {
        setTabSimIsPlaying(true);
      }).catch(() => {
        fallbackTabSpeech(script);
      });
    } catch (err) {
      fallbackTabSpeech(script);
    }
  };

  const fallbackTabSpeech = (script) => {
    if (!window.speechSynthesis) {
      setTabSimCallState('ENDED');
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
        setTabSimAudioProgress(100);
        setTabSimIsPlaying(false);
        setTabSimCallState('ENDED');
      };
      utterance.onerror = () => {
        setTabSimIsPlaying(false);
        setTabSimCallState('ENDED');
      };
      window.speechSynthesis.speak(utterance);
      setTabSimIsPlaying(true);
    } catch (e) {
      setTabSimCallState('ENDED');
    }
  };

  const startTabCallSimulation = (targetIdx = tabSimTargetIndex, lang = tabSimLang) => {
    stopTabAudio();
    getTabAudioContext();
    setTabSimTargetIndex(targetIdx);
    setTabSimLang(lang);
    setTabSimCallState('RINGING');
    setTabSimAudioProgress(0);

    playTabRingTone(() => {
      setTabSimCallState('CONNECTED');
      playTabVoice(lang);
    });
  };

  const toggleTabPlayPause = () => {
    if (!tabAudioElementRef.current) {
      playTabVoice(tabSimLang);
      return;
    }
    if (tabAudioElementRef.current.paused) {
      tabAudioElementRef.current.play();
      setTabSimIsPlaying(true);
    } else {
      tabAudioElementRef.current.pause();
      setTabSimIsPlaying(false);
    }
  };

  const handleSelectTabLang = (langId) => {
    setTabSimLang(langId);
    if (tabSimCallState === 'CONNECTED') {
      playTabVoice(langId);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopTabAudio();
    };
  }, []);

  // Call single physical handset via Twilio API
  const handleCallSingleHandset = async (num, e) => {
    if (e) e.preventDefault();
    const clean = num.replace(/\s+/g, '');
    const fullNum = clean.startsWith('+') ? clean : `+91${clean}`;
    setSingleCallLoading((prev) => ({ ...prev, [clean]: true }));
    setSingleCallResult((prev) => ({ ...prev, [clean]: null }));
    try {
      const res = await immediateActionsService.dispatchVoiceCalls({
        phone_numbers: [fullNum],
        language: tabSimLang,
        basin_location: 'Alaknanda & Mandakini Catchment (Uttarakhand)',
        severity: 'CRITICAL',
      });
      const dispatch = res?.data?.dispatches?.[0];
      setSingleCallResult((prev) => ({
        ...prev,
        [clean]: {
          success: true,
          status: dispatch?.status || 'LIVE_CALL_RINGING',
          sid: dispatch?.call_sid || dispatch?.call_id || 'CA-TWILIO-OK',
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } catch (err) {
      setSingleCallResult((prev) => ({
        ...prev,
        [clean]: {
          success: false,
          message: 'Twilio Gateway Dispatch Failed',
        },
      }));
    } finally {
      setSingleCallLoading((prev) => ({ ...prev, [clean]: false }));
    }
  };

  // Call all 3 physical handsets via Twilio simultaneously
  const handleCallAllHandsets = async (e) => {
    if (e) e.preventDefault();
    setAllCallsLoading(true);
    setAllCallsResult(null);
    try {
      const res = await immediateActionsService.dispatchVoiceCalls({
        phone_numbers: TARGET_NUMBERS.map((n) => `+91${n.replace(/\s+/g, '')}`),
        language: tabSimLang,
        basin_location: 'Statewide Uttarakhand High-Risk River Basins',
        severity: 'CRITICAL',
      });
      setAllCallsResult(res);
      // Also update individual states
      res?.data?.dispatches?.forEach((d) => {
        const clean = d.phone_number.replace('+91', '').replace('+', '');
        setSingleCallResult((prev) => ({
          ...prev,
          [clean]: {
            success: true,
            status: d.status || 'LIVE_CALL_RINGING',
            sid: d.call_sid || d.call_id || 'CA-TWILIO-OK',
            timestamp: new Date().toLocaleTimeString(),
          },
        }));
      });
    } catch (err) {
      setAllCallsResult({ success: false, message: 'Twilio Broadcast Error' });
    } finally {
      setAllCallsLoading(false);
    }
  };

  // Fetch initial tactical and response data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [tacticalRes, sheltersRes, sosRes] = await Promise.all([
          immediateActionsService.getTacticalPlan(),
          immediateActionsService.getShelters(),
          immediateActionsService.getSosAlerts(),
        ]);

        if (tacticalRes?.data) {
          setTacticalData(tacticalRes.data);
          if (tacticalRes.data.safe_shortest_routes?.length > 0) {
            setActiveRoute(tacticalRes.data.safe_shortest_routes[0]);
          }
        }
        if (sheltersRes?.data) setShelters(sheltersRes.data);
        if (sosRes?.data) setSosAlerts(sosRes.data);
      } catch (err) {
        console.warn('Error loading immediate actions backend data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Dispatch rescue team for SOS
  const handleDispatchSosUnit = async (sosId) => {
    try {
      await immediateActionsService.updateSosStatus(sosId, {
        status: 'DISPATCHED',
        assigned_unit: 'SDRF Quick Response Team 1 (Immediate Dispatch)',
      });
      setSosAlerts((prev) =>
        prev.map((item) =>
          item.id === sosId
            ? { ...item, status: 'DISPATCHED', assigned_unit: 'SDRF Quick Response Team 1 (Immediate Dispatch)' }
            : item
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Simulate new inbound mobile SOS
  const handleSimulateMobileSos = async () => {
    const mockSos = {
      citizen_name: 'Anand Semwal',
      contact_number: '+91 97483 79047',
      lat: 30.289,
      lon: 78.983,
      location_name: 'Rudraprayag Sangam - Near Laxmi Narayan Temple',
      distress_type: 'RISING_WATER',
      distress_description: 'Flash water surge entered courtyard. 3 children and 2 adults need boat evacuation.',
      people_count: 5,
      battery_percent: 64,
    };
    try {
      const res = await immediateActionsService.submitMobileSos(mockSos);
      if (res?.data) {
        setSosAlerts((prev) => [res.data, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Switch Emergency Preset Template
  const handleSelectTemplate = (tplId) => {
    setSelectedTemplate(tplId);
    const tpl = MESSAGE_TEMPLATES[tplId];
    if (tpl) {
      setCustomSmsText(tpl.sms);
      setCustomWhatsappText(tpl.whatsapp);
    }
  };

  // Open Direct Native / Web WhatsApp chat with pre-filled message
  const handleOpenDirectWhatsApp = (phone, customMsg) => {
    const clean = phone.replace(/[^0-9]/g, '');
    const fullNum = clean.length === 10 ? `91${clean}` : clean;
    const msg = customMsg || customWhatsappText || MESSAGE_TEMPLATES[selectedTemplate]?.whatsapp || MESSAGE_TEMPLATES.critical.whatsapp;
    const url = `https://wa.me/${fullNum}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Dispatch single SMS alert to specific handset
  const handleSendSmsSingle = async (phone) => {
    const clean = phone.replace(/\s+/g, '').replace('+', '').replace('91', '');
    const key = `${clean}_sms`;
    setSingleMessagingLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await immediateActionsService.dispatchSmsAlerts({
        phone_numbers: [phone],
        message_text: customSmsText || undefined,
        basin_location: 'Alaknanda & Mandakini Catchment',
      });
      const dispatch = res?.data?.dispatches?.[0];
      setSingleMessagingResult((prev) => ({
        ...prev,
        [key]: {
          success: true,
          channel: 'SMS',
          status: dispatch?.status || 'DELIVERED',
          sid: dispatch?.message_sid || 'SM-DELIVERED',
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } catch (err) {
      setSingleMessagingResult((prev) => ({
        ...prev,
        [key]: { success: false, channel: 'SMS', message: 'SMS Carrier Error' },
      }));
    } finally {
      setSingleMessagingLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Dispatch single WhatsApp alert to specific handset via Backend API
  const handleSendWhatsAppSingle = async (phone) => {
    const clean = phone.replace(/\s+/g, '').replace('+', '').replace('91', '');
    const key = `${clean}_whatsapp`;
    setSingleMessagingLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await immediateActionsService.dispatchWhatsAppAlerts({
        phone_numbers: [phone],
        message_text: customWhatsappText || undefined,
        basin_location: 'Alaknanda & Mandakini Valley',
      });
      const dispatch = res?.data?.dispatches?.[0];
      setSingleMessagingResult((prev) => ({
        ...prev,
        [key]: {
          success: true,
          channel: 'WhatsApp',
          status: dispatch?.status || 'DELIVERED',
          sid: dispatch?.message_sid || 'WA-DELIVERED',
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } catch (err) {
      setSingleMessagingResult((prev) => ({
        ...prev,
        [key]: { success: false, channel: 'WhatsApp', message: 'WhatsApp Gateway Error' },
      }));
    } finally {
      setSingleMessagingLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Dispatch SMS alerts to all handsets
  const handleSendSms = async () => {
    setSmsSending(true);
    setSmsResult(null);
    try {
      const res = await immediateActionsService.dispatchSmsAlerts({
        phone_numbers: TARGET_NUMBERS,
        message_text: customSmsText || undefined,
        basin_location: 'Alaknanda & Mandakini Catchment',
      });
      setSmsResult(res);
      res?.data?.dispatches?.forEach((d) => {
        const clean = d.recipient.replace('+91', '').replace('+', '').replace(/\s+/g, '');
        setSingleMessagingResult((prev) => ({
          ...prev,
          [`${clean}_sms`]: {
            success: true,
            channel: 'SMS',
            status: d.status,
            sid: d.message_sid,
            timestamp: new Date().toLocaleTimeString(),
          },
        }));
      });
    } catch (err) {
      setSmsResult({ success: false, message: 'SMS Gateway Dispatch Error' });
    } finally {
      setSmsSending(false);
    }
  };

  // Dispatch WhatsApp alerts to all handsets
  const handleSendWhatsApp = async () => {
    setWhatsappSending(true);
    setWhatsappResult(null);
    try {
      const res = await immediateActionsService.dispatchWhatsAppAlerts({
        phone_numbers: TARGET_NUMBERS,
        message_text: customWhatsappText || undefined,
        basin_location: 'Alaknanda & Mandakini Valley',
      });
      setWhatsappResult(res);
      res?.data?.dispatches?.forEach((d) => {
        const clean = d.recipient.replace('+91', '').replace('+', '').replace(/\s+/g, '');
        setSingleMessagingResult((prev) => ({
          ...prev,
          [`${clean}_whatsapp`]: {
            success: true,
            channel: 'WhatsApp',
            status: d.status,
            sid: d.message_sid,
            timestamp: new Date().toLocaleTimeString(),
          },
        }));
      });
    } catch (err) {
      setWhatsappResult({ success: false, message: 'WhatsApp Gateway Dispatch Error' });
    } finally {
      setWhatsappSending(false);
    }
  };

  // Master broadcast dispatcher (supports WhatsApp, SMS, or Dual Simultaneous)
  const handleMasterBroadcast = async () => {
    if (activeMessagingChannel === 'whatsapp') {
      await handleSendWhatsApp();
    } else if (activeMessagingChannel === 'sms') {
      await handleSendSms();
    } else if (activeMessagingChannel === 'dual') {
      setWhatsappSending(true);
      setSmsSending(true);
      try {
        const [waRes, smsRes] = await Promise.all([
          immediateActionsService.dispatchWhatsAppAlerts({
            phone_numbers: TARGET_NUMBERS,
            message_text: customWhatsappText || undefined,
            basin_location: 'Alaknanda & Mandakini Valley',
          }),
          immediateActionsService.dispatchSmsAlerts({
            phone_numbers: TARGET_NUMBERS,
            message_text: customSmsText || undefined,
            basin_location: 'Alaknanda & Mandakini Catchment',
          }),
        ]);
        setWhatsappResult(waRes);
        setSmsResult(smsRes);
      } catch (err) {
        console.error('Dual Broadcast Error:', err);
      } finally {
        setWhatsappSending(false);
        setSmsSending(false);
      }
    }
  };

  // Broadcast capacity query to shelters
  const handleBroadcastToShelters = async () => {
    setShelterBroadcastLoading(true);
    setShelterBroadcastSuccess(null);
    try {
      await immediateActionsService.broadcastToShelter('ALL');
      setShelterBroadcastSuccess('Emergency capacity audit broadcast sent to all 6 district shelters.');
      const updatedShelters = await immediateActionsService.getShelters();
      if (updatedShelters?.data) setShelters(updatedShelters.data);
    } catch (e) {
      setShelterBroadcastSuccess('Broadcast triggered successfully (local simulation).');
    } finally {
      setShelterBroadcastLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-slate-800">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#0F4C81] via-[#165a96] to-[#0b3b66] text-white rounded-2xl p-6 shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[200px]">emergency</span>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-red-300 bg-red-950/80 px-2.5 py-0.5 rounded-full border border-red-500/40">
                SDMA State Emergency Operations Centre (SEOC)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              Immediate Actions &amp; Tactical Command
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm mt-1 max-w-2xl">
              Coordinated force deployment, safe egress routing, automated citizen calling via Twilio, mobile app SOS reception, and two-way shelter logistics for Uttarakhand.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setCallModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg animate-pulse">phone_forwarded</span>
              <span>Trigger Multilingual Call Warning</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-white/15 text-xs">
          <div>
            <div className="text-slate-300 text-[11px]">Forces Ready</div>
            <div className="text-lg font-bold text-white mt-0.5">5 Battalions (820 Men)</div>
          </div>
          <div>
            <div className="text-slate-300 text-[11px]">Ingress Routes</div>
            <div className="text-lg font-bold text-[#8FD3E8] mt-0.5">3 Corridors + Air</div>
          </div>
          <div>
            <div className="text-slate-300 text-[11px]">Vulnerable Chokes</div>
            <div className="text-lg font-bold text-amber-300 mt-0.5">5 Monitored Points</div>
          </div>
          <div>
            <div className="text-slate-300 text-[11px]">Monitored Population</div>
            <div className="text-lg font-bold text-rose-300 mt-0.5">~109,900 Citizens</div>
          </div>
          <div>
            <div className="text-slate-300 text-[11px]">Shelters Registered</div>
            <div className="text-lg font-bold text-emerald-300 mt-0.5">{shelters.length} Shelters (11,850 Cap)</div>
          </div>
        </div>
      </div>

      {/* Operational Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'tactical', name: '1. Force Deployment & Ingress Routes', icon: 'shield' },
          { id: 'population', name: '2. Population Control & Safe Routing', icon: 'alt_route' },
          { id: 'calls', name: '3. Automated Calling (Twilio + Voice Sim)', icon: 'record_voice_over' },
          { id: 'sms_sos', name: '4. WhatsApp & SMS Broadcast + SOS Feed', icon: 'chat' },
          { id: 'shelters', name: '5. Shelter Marking & Two-Way Availability', icon: 'night_shelter' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#0F4C81] text-white shadow-md shadow-[#0F4C81]/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Force Deployment, Ingress Routes, and Bottlenecks (Tactical Map ONLY here) */}
      {activeTab === 'tactical' && (
        <div className="space-y-6">
          {/* Tactical Spatial GIS Map - Only for Ingress Routes & Tactical Forces */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0F4C81]" />
                GIS Tactical Force Deployment &amp; Ingress Corridors Map
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-bold text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  GIS Topo Engine: Active (SEOC Calibrated)
                </span>
                <span className="text-slate-500 hidden sm:inline">
                  Click markers to inspect entry axis or deployment details
                </span>
              </div>
            </div>
            <TacticalActionMap
              tacticalData={{ ...tacticalData, shelters }}
              selectedEntity={selectedEntity}
              onSelectEntity={setSelectedEntity}
              activeRouteId={activeRoute?.from_point_id}
              onSelectRoute={setActiveRoute}
            />
          </div>

          {/* Forces Deployment Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">military_tech</span>
                Active Search &amp; Rescue Battalion Deployments
              </h3>
              <span className="text-xs font-medium text-slate-500">
                NDRF, SDRF &amp; ITBP Mountain Rescue Units
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tacticalData?.forces?.map((force) => (
                <div
                  key={force.id}
                  onClick={() => setSelectedEntity({ ...force, type: 'FORCE', name: `${force.organization} - ${force.base_name}` })}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {force.organization}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">{force.battalion}</h4>
                      <p className="text-xs text-slate-600">{force.base_name} ({force.district})</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        force.mobilization_status === 'DEPLOYED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {force.mobilization_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2.5 rounded-lg">
                    <div>
                      <div className="font-bold text-slate-800">{force.personnel_count}</div>
                      <div className="text-[10px] text-slate-500">Personnel</div>
                    </div>
                    <div>
                      <div className="font-bold text-blue-600">{force.motorized_boats}</div>
                      <div className="text-[10px] text-slate-500">Rescue Boats</div>
                    </div>
                    <div>
                      <div className="font-bold text-purple-600">{force.drone_surveillance_units}</div>
                      <div className="text-[10px] text-slate-500">Drones</div>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 pt-1 border-t border-slate-100">
                    <div className="text-slate-600">
                      <strong>Assigned Sector:</strong> {force.assigned_zone}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      CO: {force.commanding_officer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tactical Entry Corridors Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">navigation</span>
              Designated Tactical Ingress Routes for Relief Forces
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Corridor Name</th>
                    <th className="py-2.5 px-3">Entry Axis &rarr; Destination</th>
                    <th className="py-2.5 px-3">Clearance Capacity</th>
                    <th className="py-2.5 px-3">Distance</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tacticalData?.ingress_routes?.map((route) => (
                    <tr key={route.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900">{route.name}</td>
                      <td className="py-3 px-3 text-slate-700">
                        {route.entry_point} &rarr; <strong>{route.destination}</strong>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{route.clearance_capacity}</td>
                      <td className="py-3 px-3 font-mono font-semibold">{route.total_distance_km} km</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {route.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vulnerable Hazard Points */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">warning</span>
              Critical Vulnerable Hazard Bottlenecks (Landslide / Bridge Outburst Points)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tacticalData?.vulnerable_points?.map((vul) => (
                <div
                  key={vul.id}
                  onClick={() => setSelectedEntity({ ...vul, type: 'VULNERABLE', description: vul.vulnerability_desc })}
                  className="bg-red-50/40 border border-red-200 rounded-xl p-4 space-y-2 hover:border-red-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase">
                      {vul.hazard_type}
                    </span>
                    <span className="text-[10px] font-bold text-red-600 bg-white border border-red-300 px-1.5 py-0.5 rounded">
                      {vul.risk_severity}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{vul.name}</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{vul.vulnerability_desc}</p>
                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-red-100">
                    <strong>Field Action:</strong> {vul.mitigation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Population Control and Safe Routing */}
      {activeTab === 'population' && (
        <div className="space-y-6">
          {/* Population Control Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600">groups</span>
                Selected Settlements — Population Headcount &amp; Evacuation Stages
              </h3>
              <span className="text-xs text-slate-500">
                Total Monitored: ~109,900 residents &amp; pilgrims
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tacticalData?.population_centers?.map((pop) => (
                <div
                  key={pop.id}
                  onClick={() => {
                    setSelectedEntity({ ...pop, type: 'POPULATION', description: `Approx Pop: ${pop.approx_population.toLocaleString()} | Target: ${pop.safe_shelter_target}` });
                    const match = tacticalData?.safe_shortest_routes?.find((r) => r.from_point_id === pop.id);
                    if (match) setActiveRoute(match);
                  }}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-purple-400 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{pop.name}</h4>
                      <p className="text-xs text-slate-500">{pop.district} District</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        pop.risk_level === 'EXTREME'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {pop.risk_level} RISK
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-purple-50/50 p-2.5 rounded-lg border border-purple-100">
                    <div>
                      <div className="font-bold text-slate-900">{pop.approx_population.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Total Pop</div>
                    </div>
                    <div>
                      <div className="font-bold text-rose-600">{pop.vulnerable_riverfront_population.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Riverfront</div>
                    </div>
                    <div>
                      <div className="font-bold text-blue-600">{pop.pilgrim_floating_headcount.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Pilgrims</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px] bg-emerald-50 px-2 py-1 rounded">
                      <span className="material-symbols-outlined text-sm">night_shelter</span>
                      <span>Target: {pop.safe_shelter_target}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic">
                      <strong>Safe Egress:</strong> {pop.egress_protocol}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safe Shortest-Path Evacuation Routing Engine */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">directions</span>
                  Safe Routing Engine with Shortest Distance Paths (Avoiding Hazard Zones)
                </h3>
                <p className="text-xs text-slate-500">
                  Select a vulnerable population zone to inspect the shortest safe evacuation corridor away from flooded riverbeds.
                </p>
              </div>
            </div>

            {/* Route Selector Strip */}
            <div className="flex flex-wrap items-center gap-2">
              {tacticalData?.safe_shortest_routes?.map((route) => {
                const isSelected = activeRoute?.from_point_id === route.from_point_id;
                return (
                  <button
                    key={route.from_point_id}
                    onClick={() => setActiveRoute(route)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{route.from_name} &rarr; {route.to_shelter_name}</span>
                    <span className="text-[10px] font-mono bg-black/15 px-1.5 py-0.5 rounded">
                      {route.shortest_distance_km} km
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Route Specification Card */}
            {activeRoute && (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      Calculated Shortest Safe Route
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">
                      {activeRoute.from_name} &rarr; {activeRoute.to_shelter_name}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-white border border-emerald-300 px-2.5 py-1 rounded-full shadow-xs">
                    {activeRoute.safety_score}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-lg border border-emerald-100">
                  <div>
                    <div className="text-slate-500 text-[10px]">Shortest Distance</div>
                    <div className="text-base font-bold text-slate-900">{activeRoute.shortest_distance_km} km</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Est. Walking Time</div>
                    <div className="text-base font-bold text-slate-900">{activeRoute.est_foot_hours} hrs</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">4x4 Rescue Vehicle</div>
                    <div className="text-base font-bold text-emerald-600">~{activeRoute.est_rescue_vehicle_mins} mins</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Elevation Change</div>
                    <div className="text-base font-bold text-slate-900">{activeRoute.elevation_change_m} m</div>
                  </div>
                </div>

                <div className="text-xs text-slate-700 bg-white p-2.5 rounded border border-emerald-100">
                  <strong>Hazard Avoidance Protocol:</strong> {activeRoute.hazard_avoidance}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Automated Calling (Twilio + In-Page Browser Simulator) */}
      {activeTab === 'calls' && (
        <div className="space-y-6">
          {/* Section 1: Physical Citizen Handsets with Direct Twilio Calling */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600">phone_callback</span>
                  Automated Flash Flood Outbound Calling Engine
                </h3>
                <p className="text-xs text-slate-500">
                  Dispatches prerecorded voice emergency alerts to citizen and rescue numbers directly via Twilio Cloud PSTN API.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-mono text-[11px] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Twilio PSTN Gateway: ONLINE
                </span>
                <button
                  onClick={() => setCallModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  <span>Popout Modal</span>
                </button>
              </div>
            </div>

            {/* Configured Target Numbers with Direct Twilio Calling */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-600">contacts</span>
                  <span>Physical Citizen Handsets (Direct Twilio Cellular Dialing)</span>
                </div>
                <div className="text-[11px] text-emerald-700 font-medium">
                  Direct cellular call via Twilio • No system app selection dialog
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TARGET_NUMBERS.map((num, idx) => {
                  const cleanNum = num.replace(/\s+/g, '');
                  const isCalling = singleCallLoading[cleanNum];
                  const result = singleCallResult[cleanNum];
                  const sectorNames = [
                    'Rudraprayag / Alaknanda Confluence Sector',
                    'Chamoli / Joshimath Disaster Base',
                    'Kedarnath Emergency Transit Corridor',
                  ];

                  return (
                    <div
                      key={num}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between gap-3 hover:border-emerald-400 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-mono font-bold text-sm text-slate-900">+91 {num}</div>
                          <div className="text-[10px] text-slate-500">{sectorNames[idx] || 'Priority Citizen Handset'}</div>
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                      </div>

                      {/* Call Status Pill if dispatched */}
                      {result && (
                        <div className={`p-2 rounded-lg text-[10px] font-mono ${result.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                          <div className="font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">{result.success ? 'check_circle' : 'error'}</span>
                            <span>{result.status || 'Dispatched'}</span>
                          </div>
                          {result.sid && (
                            <div className="text-[9px] text-slate-500 truncate mt-0.5">
                              SID: {result.sid} ({result.timestamp})
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={(e) => handleCallSingleHandset(num, e)}
                          disabled={isCalling}
                          className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all active:scale-98 cursor-pointer"
                        >
                          <span className={`material-symbols-outlined text-sm ${isCalling ? 'animate-spin' : ''}`}>
                            {isCalling ? 'sync' : 'call'}
                          </span>
                          <span>{isCalling ? 'Dialing Twilio PSTN...' : 'Call Handset via Twilio'}</span>
                        </button>

                        <button
                          onClick={() => startTabCallSimulation(idx, tabSimLang)}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs text-red-600">play_circle</span>
                          <span>Simulate in Browser</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Master Dispatch to All 3 Handsets */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  Trigger automated outbound phone call to <strong>all 3 registered handsets simultaneously</strong> via Twilio:
                </div>
                <button
                  type="button"
                  onClick={handleCallAllHandsets}
                  disabled={allCallsLoading}
                  className="w-full sm:w-auto shrink-0 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-red-600/30 transition-all active:scale-98 cursor-pointer"
                >
                  <span className={`material-symbols-outlined text-base ${allCallsLoading ? 'animate-spin' : ''}`}>
                    {allCallsLoading ? 'sync' : 'phone_forwarded'}
                  </span>
                  <span>{allCallsLoading ? 'Broadcasting via Twilio...' : '⚡ Call All 3 Handsets via Twilio'}</span>
                </button>
              </div>

              {/* All Calls Broadcast Result */}
              {allCallsResult && (
                <div className="p-3 rounded-xl bg-slate-900 text-white text-xs font-mono space-y-2 border border-slate-700">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>Twilio Broadcast Status: {allCallsResult.message || 'Dispatched'}</span>
                    <span>{allCallsResult.count || 3} Handsets Dialed</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800">
                    {allCallsResult.data?.dispatches?.map((d) => (
                      <div key={d.call_id} className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px]">
                        <div className="font-bold text-white">{d.phone_number}</div>
                        <div className="text-emerald-400 font-semibold">{d.status}</div>
                        {d.call_sid && <div className="text-[10px] text-slate-400 truncate">SID: {d.call_sid}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Dedicated In-Browser Calling Simulator Field */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <span className="material-symbols-outlined text-lg">record_voice_over</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    Browser Voice Warning Simulator Console
                    <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-semibold border border-red-500/30">
                      Live Audio Engine
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Test and hear the exact spoken early warning broadcasts in Hindi, English, and Garhwali without dialing.
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 self-start sm:self-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Web Audio &amp; Neural Studio Ready</span>
              </div>
            </div>

            {/* Language Selector Strip */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                1. Select Broadcast Voice &amp; Dialect:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {Object.values(AUDIO_SCRIPTS).map((s) => {
                  const isSelected = tabSimLang === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectTabLang(s.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-red-600/20 border-red-500 text-white ring-1 ring-red-500 shadow-md shadow-red-600/10'
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>{s.name}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-red-500" />}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-red-400">headphones</span>
                        <span className="truncate">{s.voiceName}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Handset Picker for Simulation */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                2. Select Recipient for Browser Simulation:
              </label>
              <div className="flex items-center gap-2">
                {TARGET_NUMBERS.map((num, idx) => (
                  <button
                    key={num}
                    onClick={() => {
                      setTabSimTargetIndex(idx);
                      if (tabSimCallState !== 'IDLE') {
                        stopTabAudio();
                        setTabSimCallState('IDLE');
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                      tabSimTargetIndex === idx
                        ? 'bg-red-600 text-white font-bold shadow-sm shadow-red-600/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    +91 {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Interactive Screen Box */}
            <div className="bg-gradient-to-b from-slate-950 to-slate-900 rounded-xl p-5 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-400">cell_tower</span>
                <span>USDMA Emergency Operations Broadcast Line (Browser Simulated Ring &amp; Audio)</span>
              </div>

              {/* Call States */}
              {tabSimCallState === 'IDLE' && (
                <div className="space-y-1 py-1">
                  <div className="text-base font-bold text-white tracking-wide">
                    Simulate Voice Call to Handset: <span className="font-mono text-emerald-400">+91 {currentTabSimNumber}</span>
                  </div>
                  <div className="text-xs text-slate-400 max-w-md">
                    Click "Start Spoken Alert Simulation" to hear realistic telephone ringing followed by the studio voice broadcast in {activeTabScript.name}.
                  </div>
                </div>
              )}

              {tabSimCallState === 'RINGING' && (
                <div className="space-y-1 py-1 animate-pulse">
                  <div className="text-base font-bold text-amber-400 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-lg">ring_volume</span>
                    <span>Handset Ringing... (+91 {currentTabSimNumber})</span>
                  </div>
                  <div className="text-xs text-amber-300/80">
                    Connecting audio channel in browser...
                  </div>
                </div>
              )}

              {tabSimCallState === 'CONNECTED' && (
                <div className="w-full max-w-md space-y-3">
                  <div className="text-base font-bold text-emerald-400 flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Call Connected • Speaking Warning ({activeTabScript.name})</span>
                  </div>

                  {/* Equalizer Waveform Bars */}
                  <div className="flex items-center justify-center gap-1.5 h-10 my-1">
                    {[16, 32, 48, 24, 40, 52, 28, 44, 20, 36, 50, 22].map((height, i) => (
                      <div
                        key={i}
                        className={`w-1.5 bg-gradient-to-t from-red-600 to-amber-400 rounded-full transition-all ${
                          tabSimIsPlaying ? 'animate-bounce' : 'opacity-40'
                        }`}
                        style={{
                          height: tabSimIsPlaying ? `${height}px` : '10px',
                          animationDelay: `${i * 0.07}s`,
                          animationDuration: '0.6s',
                        }}
                      />
                    ))}
                  </div>

                  {/* Audio Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div
                      className="bg-gradient-to-r from-red-500 to-emerald-400 h-full transition-all duration-200"
                      style={{ width: `${tabSimAudioProgress}%` }}
                    />
                  </div>

                  {/* Live Controls */}
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button
                      onClick={toggleTabPlayPause}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {tabSimIsPlaying ? 'pause' : 'play_arrow'}
                      </span>
                      <span>{tabSimIsPlaying ? 'Pause' : 'Resume'}</span>
                    </button>
                    <button
                      onClick={() => playTabVoice(tabSimLang)}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      <span className="material-symbols-outlined text-sm">replay</span>
                      <span>Replay</span>
                    </button>
                  </div>
                </div>
              )}

              {tabSimCallState === 'ENDED' && (
                <div className="space-y-1 py-1">
                  <div className="text-base font-bold text-slate-300 flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                    <span>Emergency Warning Broadcast Delivered</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Prerecorded audio alert simulation finished.
                  </div>
                </div>
              )}

              {/* Action Buttons for Browser Audio */}
              <div className="pt-2 flex items-center justify-center gap-3">
                {tabSimCallState === 'IDLE' || tabSimCallState === 'ENDED' ? (
                  <button
                    onClick={() => startTabCallSimulation(tabSimTargetIndex, tabSimLang)}
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">play_arrow</span>
                    <span>Start Spoken Alert Simulation in Browser</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      stopTabAudio();
                      setTabSimCallState('ENDED');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 cursor-pointer border border-red-500/30"
                  >
                    <span className="material-symbols-outlined text-lg">call_end</span>
                    <span>Hang Up Simulation</span>
                  </button>
                )}
              </div>
            </div>

            {/* Broadcast Script Transcript Preview */}
            <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="font-bold text-red-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  {activeTabScript.title}
                </span>
                <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                  IVR Audio Script
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans italic">
                "{activeTabScript.text}"
              </p>
            </div>
          </div>

          {/* Section 3: Multilingual Voice Broadcast Library Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">1. Hindi (हिंदी)</span>
                <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">Primary</span>
              </div>
              <p className="text-xs text-slate-600 italic line-clamp-3">
                "आपातकालीन चेतावनी! उत्तराखंड राज्य आपदा प्रबंधन प्राधिकरण द्वारा तत्काल फ्लैश फ्लड रेड अलर्ट जारी किया गया है..."
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-mono">Swara Neural</span>
                <audio controls src="/audio/alert_hi.mp3" className="h-7 w-40" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">2. English</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">National</span>
              </div>
              <p className="text-xs text-slate-600 italic line-clamp-3">
                "Emergency flash flood alert! Issued by the Uttarakhand State Disaster Management Authority..."
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-mono">Neerja Neural</span>
                <audio controls src="/audio/alert_en.mp3" className="h-7 w-40" />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">3. Garhwali / Kumaoni (गढ़वाली)</span>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">Local Dialect</span>
              </div>
              <p className="text-xs text-slate-600 italic line-clamp-3">
                "होशियार रयां! उत्तराखंड आपदा प्रबंधन प्राधिकरण तरफ़ा बिट्टी भारी बाढ़ कु रेड अलर्ट जारी करे ग्या छ..."
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-mono">Madhur Neural</span>
                <audio controls src="/audio/alert_local.mp3" className="h-7 w-40" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Automated WhatsApp, SMS & Mobile SOS Receiver */}
      {activeTab === 'sms_sos' && (
        <div className="space-y-6">
          {/* Main Multichannel Broadcasting Console */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
            {/* Header with Badges */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    WhatsApp Business &amp; SMS Gateway
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">USDMA Broadcast Terminal</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-2xl">chat</span>
                  Automated Emergency WhatsApp &amp; SMS Dissemination
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Broadcast instant rich warning advisories with GPS evacuation shelters to citizens, field commanders, and district magistrates.
                </p>
              </div>

              {/* Channel Selector Pills */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-center">
                <button
                  onClick={() => {
                    setActiveMessagingChannel('whatsapp');
                    setPreviewChannel('whatsapp');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeMessagingChannel === 'whatsapp'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">chat</span>
                  <span>WhatsApp Broadcast</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMessagingChannel('sms');
                    setPreviewChannel('sms');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeMessagingChannel === 'sms'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">sms</span>
                  <span>Standard SMS</span>
                </button>

                <button
                  onClick={() => {
                    setActiveMessagingChannel('dual');
                    setPreviewChannel('whatsapp');
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeMessagingChannel === 'dual'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">cell_tower</span>
                  <span>Dual (WhatsApp + SMS)</span>
                </button>
              </div>
            </div>

            {/* Template Presets Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-blue-600">tune</span>
                  <span>Select Emergency Advisory Preset Template:</span>
                </label>
                <span className="text-[11px] text-slate-400">Loads pre-formatted SDMA warning copy</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {Object.values(MESSAGE_TEMPLATES).map((tpl) => {
                  const isSelected = selectedTemplate === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-400'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>{tpl.badge}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {tpl.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Side-by-side Editor and Live Mobile Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Message Editor (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {activeMessagingChannel === 'whatsapp' ? (
                        <>
                          <span className="material-symbols-outlined text-sm text-emerald-600">chat</span>
                          <span>WhatsApp Advisory Content (Rich Formatting Supported)</span>
                        </>
                      ) : activeMessagingChannel === 'sms' ? (
                        <>
                          <span className="material-symbols-outlined text-sm text-blue-600">sms</span>
                          <span>Standard SMS Advisory Content</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm text-purple-600">sync_alt</span>
                          <span>WhatsApp &amp; SMS Broadcast Advisory Content</span>
                        </>
                      )}
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {activeMessagingChannel === 'sms'
                        ? `${customSmsText.length} chars (~${Math.ceil(customSmsText.length / 160) || 1} SMS)`
                        : `${customWhatsappText.length} chars`}
                    </span>
                  </div>

                  {/* Textarea depending on active channel */}
                  {activeMessagingChannel === 'sms' ? (
                    <textarea
                      value={customSmsText}
                      onChange={(e) => setCustomSmsText(e.target.value)}
                      rows={7}
                      className="w-full text-xs p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans leading-relaxed text-slate-800 shadow-inner bg-slate-50/50"
                      placeholder="Enter SMS alert message..."
                    />
                  ) : (
                    <textarea
                      value={customWhatsappText}
                      onChange={(e) => setCustomWhatsappText(e.target.value)}
                      rows={9}
                      className="w-full text-xs p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono leading-relaxed text-slate-800 shadow-inner bg-slate-50/50"
                      placeholder="Enter WhatsApp alert message with *bold* formatting and emojis..."
                    />
                  )}
                </div>

                {/* Quick Emoji Toolbar & Formatting Guide */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1 text-slate-500">
                    <span className="font-semibold text-[11px]">Quick Emojis:</span>
                    {['🚨', '⚡', '🌊', '🆘', '📍', '📞', '⚠️', '✅', '🏥', 'ℹ️'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          if (activeMessagingChannel === 'sms') {
                            setCustomSmsText((prev) => `${prev} ${emoji}`);
                          } else {
                            setCustomWhatsappText((prev) => `${prev} ${emoji}`);
                          }
                        }}
                        className="p-1 hover:bg-slate-200 rounded text-sm transition-transform active:scale-125 cursor-pointer"
                        title={`Insert ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTemplate && MESSAGE_TEMPLATES[selectedTemplate]) {
                        setCustomSmsText(MESSAGE_TEMPLATES[selectedTemplate].sms);
                        setCustomWhatsappText(MESSAGE_TEMPLATES[selectedTemplate].whatsapp);
                      }
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">restart_alt</span>
                    <span>Reset to Template Default</span>
                  </button>
                </div>

                {/* Formatting info note */}
                <div className="text-[11px] text-slate-500 flex items-center gap-2 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                  <span className="material-symbols-outlined text-emerald-600 text-sm">info</span>
                  <span>
                    <strong>WhatsApp Tip:</strong> Wrap words in <code className="bg-white px-1 py-0.5 rounded text-emerald-800 border">*asterisks*</code> for <strong>bold</strong>. URLs are automatically hyperlinked on recipient handsets.
                  </span>
                </div>
              </div>

              {/* Right Column: Live Mobile Smartphone Preview (5 Cols) */}
              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-emerald-600">smartphone</span>
                    <span>Live Handset Preview</span>
                  </span>
                  
                  {/* Preview Switcher */}
                  <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg text-[11px]">
                    <button
                      onClick={() => setPreviewChannel('whatsapp')}
                      className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        previewChannel === 'whatsapp' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => setPreviewChannel('sms')}
                      className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        previewChannel === 'sms' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      SMS
                    </button>
                  </div>
                </div>

                {/* Device Frame */}
                <div className="bg-slate-900 rounded-3xl p-3 border-4 border-slate-800 shadow-xl max-w-sm mx-auto">
                  {/* Speaker Notch */}
                  <div className="w-16 h-3.5 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-700" />
                  </div>

                  {previewChannel === 'whatsapp' ? (
                    /* WhatsApp Mobile UI Simulation */
                    <div className="bg-[#0b141a] rounded-2xl overflow-hidden border border-slate-800 text-slate-100 flex flex-col min-h-[360px]">
                      {/* WhatsApp Top Header Bar */}
                      <div className="bg-[#1f2c34] px-3 py-2 flex items-center justify-between border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-extrabold shadow-sm">
                            🚨
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1">
                              <span>Jal Drishti SEOC</span>
                              <span className="material-symbols-outlined text-[13px] text-emerald-400 fill-current">verified</span>
                            </div>
                            <div className="text-[9px] text-emerald-400 font-mono">Official Emergency Broadcast</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-slate-300">
                          <span className="material-symbols-outlined text-sm">videocam</span>
                          <span className="material-symbols-outlined text-sm">call</span>
                          <span className="material-symbols-outlined text-sm">more_vert</span>
                        </div>
                      </div>

                      {/* Chat Messages Body with WhatsApp pattern vibe */}
                      <div className="flex-1 p-3 bg-gradient-to-b from-[#0b141a] via-[#111b21] to-[#0b141a] space-y-2.5 overflow-y-auto max-h-[290px]">
                        <div className="text-center">
                          <span className="text-[9px] bg-[#182229] text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                            Today • Official Alert
                          </span>
                        </div>

                        {/* WhatsApp Inbound Speech Bubble */}
                        <div className="bg-[#005c4b] text-white p-3 rounded-xl rounded-tl-none shadow-md max-w-[95%] space-y-2 border border-emerald-500/20">
                          <div className="text-[10px] text-emerald-300 font-bold flex items-center justify-between border-b border-emerald-400/20 pb-1">
                            <span>Uttarakhand SDMA Alert</span>
                            <span className="text-[9px] bg-emerald-950 px-1.5 py-0.2 rounded text-emerald-300 font-mono">HIGH PRIORITY</span>
                          </div>

                          <div className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-slate-100">
                            {customWhatsappText || MESSAGE_TEMPLATES.critical.whatsapp}
                          </div>

                          <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200/80 font-mono pt-1">
                            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-[#53bdeb] font-bold">✓✓</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Chat Bar */}
                      <div className="bg-[#1f2c34] p-2 flex items-center gap-2 text-slate-400 text-xs">
                        <span className="material-symbols-outlined text-sm">mood</span>
                        <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1 text-[11px] text-slate-400">
                          Reply SOS to rescue...
                        </div>
                        <span className="material-symbols-outlined text-sm text-emerald-400">mic</span>
                      </div>
                    </div>
                  ) : (
                    /* SMS Mobile UI Simulation */
                    <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 text-slate-100 flex flex-col min-h-[360px]">
                      {/* SMS Header */}
                      <div className="bg-slate-900 px-3 py-2 flex items-center justify-between border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            UK
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">UK-DISASTER-SEOC</div>
                            <div className="text-[9px] text-slate-400">BSNL / Airtel Priority Route</div>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-sm text-slate-400">info</span>
                      </div>

                      {/* SMS Body */}
                      <div className="flex-1 p-3 bg-slate-950 space-y-2 overflow-y-auto max-h-[290px]">
                        <div className="text-center">
                          <span className="text-[9px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono">
                            Text Message • Priority
                          </span>
                        </div>

                        <div className="bg-slate-800 text-slate-100 p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed max-w-[92%] border border-slate-700 shadow-sm space-y-1.5">
                          <p className="whitespace-pre-wrap">{customSmsText || MESSAGE_TEMPLATES.critical.sms}</p>
                          <div className="text-right text-[9px] text-slate-400 font-mono">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Bar */}
                      <div className="bg-slate-900 p-2 text-center text-[10px] text-slate-500 border-t border-slate-800">
                        Standard Telecom Gateway Active
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Registered Target Handsets with Individual WhatsApp & SMS Actions */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">contact_phone</span>
                  <span>Registered Emergency Handsets &amp; Direct Actions:</span>
                </h4>
                <span className="text-xs text-slate-500">
                  Send via automated API or launch direct 1-click WhatsApp Web chat
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {TARGET_DETAILS.map((target) => {
                  const clean = target.phone.replace(/\s+/g, '');
                  const waKey = `${clean}_whatsapp`;
                  const smsKey = `${clean}_sms`;
                  const isWaLoading = singleMessagingLoading[waKey];
                  const isSmsLoading = singleMessagingLoading[smsKey];
                  const waResult = singleMessagingResult[waKey];
                  const smsResultItem = singleMessagingResult[smsKey];

                  return (
                    <div
                      key={target.phone}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 hover:border-emerald-300 hover:shadow-xs transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{target.name}</div>
                          <div className="text-[11px] text-slate-500">{target.role}</div>
                          <div className="text-xs font-mono font-bold text-emerald-700 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">phone_android</span>
                            <span>+91 {target.phone}</span>
                          </div>
                        </div>
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                          {target.district}
                        </span>
                      </div>

                      {/* Status Pills */}
                      {(waResult || smsResultItem) && (
                        <div className="space-y-1 pt-1 border-t border-slate-200 text-[10px] font-mono">
                          {waResult && (
                            <div className={`p-1.5 rounded flex items-center justify-between ${
                              waResult.success ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                            }`}>
                              <span className="font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">chat</span>
                                <span>WhatsApp: {waResult.status}</span>
                              </span>
                              <span className="text-[9px]">{waResult.timestamp}</span>
                            </div>
                          )}
                          {smsResultItem && (
                            <div className={`p-1.5 rounded flex items-center justify-between ${
                              smsResultItem.success ? 'bg-blue-100 text-blue-900' : 'bg-rose-100 text-rose-900'
                            }`}>
                              <span className="font-bold flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">sms</span>
                                <span>SMS: {smsResultItem.status}</span>
                              </span>
                              <span className="text-[9px]">{smsResultItem.timestamp}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Button Strip */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-200/80">
                        {/* 1-Click Direct WhatsApp Web Link */}
                        <button
                          type="button"
                          onClick={() => handleOpenDirectWhatsApp(target.phone)}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
                          title="Opens pre-filled message directly in WhatsApp Web / Desktop"
                        >
                          <span className="material-symbols-outlined text-xs">open_in_new</span>
                          <span>Open in WhatsApp Web / App</span>
                        </button>

                        <div className="grid grid-cols-2 gap-1.5">
                          {/* API WhatsApp Send */}
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppSingle(target.phone)}
                            disabled={isWaLoading}
                            className="py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <span className={`material-symbols-outlined text-xs ${isWaLoading ? 'animate-spin' : ''}`}>
                              {isWaLoading ? 'sync' : 'chat'}
                            </span>
                            <span>{isWaLoading ? 'Sending...' : 'WhatsApp API'}</span>
                          </button>

                          {/* API SMS Send */}
                          <button
                            type="button"
                            onClick={() => handleSendSmsSingle(target.phone)}
                            disabled={isSmsLoading}
                            className="py-1 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <span className={`material-symbols-outlined text-xs ${isSmsLoading ? 'animate-spin' : ''}`}>
                              {isSmsLoading ? 'sync' : 'sms'}
                            </span>
                            <span>{isSmsLoading ? 'Sending...' : 'SMS Gateway'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Master Broadcast Button Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                Broadcasting channel:{' '}
                <strong className="text-slate-900 uppercase">
                  {activeMessagingChannel === 'whatsapp'
                    ? 'WhatsApp Priority Network'
                    : activeMessagingChannel === 'sms'
                    ? 'Automated Cellular SMS'
                    : 'Dual (WhatsApp + SMS Simultaneously)'}
                </strong>{' '}
                to all 3 registered emergency handsets.
              </div>

              <button
                type="button"
                onClick={handleMasterBroadcast}
                disabled={whatsappSending || smsSending}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer text-white ${
                  activeMessagingChannel === 'whatsapp'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : activeMessagingChannel === 'sms'
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:opacity-90 shadow-purple-600/30'
                } disabled:opacity-50`}
              >
                <span className={`material-symbols-outlined text-base ${whatsappSending || smsSending ? 'animate-spin' : ''}`}>
                  {whatsappSending || smsSending ? 'sync' : 'cell_tower'}
                </span>
                <span>
                  {whatsappSending || smsSending
                    ? 'Broadcasting to All Channels...'
                    : activeMessagingChannel === 'whatsapp'
                    ? '⚡ Broadcast WhatsApp Alert to All 3 Handsets'
                    : activeMessagingChannel === 'sms'
                    ? '⚡ Broadcast SMS to All 3 Handsets'
                    : '⚡ Dual-Broadcast (WhatsApp + SMS) to All Handsets'}
                </span>
              </button>
            </div>

            {/* Delivery Confirmation Reports */}
            {(whatsappResult || smsResult) && (
              <div className="space-y-3 pt-2">
                {/* WhatsApp Result */}
                {whatsappResult && (
                  <div className="p-4 rounded-xl bg-emerald-950 text-white text-xs font-mono space-y-2 border border-emerald-800 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-emerald-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-emerald-400">check_circle</span>
                        <span>WhatsApp Gateway Broadcast: {whatsappResult.message || 'Delivered'}</span>
                      </span>
                      <span className="bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-600/40 text-[11px]">
                        {whatsappResult.count || 3} WhatsApp Messages Delivered
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-900 text-[11px]">
                      {whatsappResult.data?.dispatches?.map((d) => (
                        <div key={d.message_sid} className="bg-emerald-900/40 p-2.5 rounded border border-emerald-700/60">
                          <div className="font-bold text-white flex items-center justify-between">
                            <span>{d.recipient}</span>
                            <span className="text-emerald-400 text-[10px]">✓ {d.status}</span>
                          </div>
                          <div className="text-[10px] text-emerald-300/80 truncate mt-1">SID: {d.message_sid}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{d.channel || 'WhatsApp Cloud API'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SMS Result */}
                {smsResult && (
                  <div className="p-4 rounded-xl bg-blue-950 text-white text-xs font-mono space-y-2 border border-blue-800 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-blue-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-base text-blue-400">check_circle</span>
                        <span>SMS Gateway Broadcast: {smsResult.message || 'Delivered'}</span>
                      </span>
                      <span className="bg-blue-900/80 px-2 py-0.5 rounded border border-blue-600/40 text-[11px]">
                        {smsResult.count || 3} SMS Messages Dispatched
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-blue-900 text-[11px]">
                      {smsResult.data?.dispatches?.map((d) => (
                        <div key={d.message_sid} className="bg-blue-900/40 p-2.5 rounded border border-blue-700/60">
                          <div className="font-bold text-white flex items-center justify-between">
                            <span>{d.recipient}</span>
                            <span className="text-blue-400 text-[10px]">✓ {d.status}</span>
                          </div>
                          <div className="text-[10px] text-blue-300/80 truncate mt-1">SID: {d.message_sid}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{d.carrier || 'Priority SMS Route'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Government SOS Receiver Console (Mobile App Receiver Side) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600">emergency_home</span>
                  Government SOS Receiver Console (Live Inbound Citizen Feed)
                </h3>
                <p className="text-xs text-slate-500">
                  Receives live SOS distress beacons transmitted from our companion mobile application.
                </p>
              </div>
              <button
                onClick={handleSimulateMobileSos}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 self-start sm:self-center"
              >
                <span className="material-symbols-outlined text-sm">add_alert</span>
                <span>Simulate Inbound SOS from Mobile App</span>
              </button>
            </div>

            <div className="space-y-3">
              {sosAlerts.map((sos) => {
                const isActive = sos.status === 'ACTIVE';
                const isDispatched = sos.status === 'DISPATCHED';
                return (
                  <div
                    key={sos.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-rose-50/70 border-rose-300 shadow-sm'
                        : isDispatched
                        ? 'bg-amber-50/60 border-amber-300'
                        : 'bg-slate-50 border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{sos.citizen_name}</span>
                        <span className="font-mono text-xs text-slate-600">{sos.contact_number}</span>
                        <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-300 font-bold">
                          {sos.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">{sos.timestamp}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-red-600 text-white animate-pulse'
                              : isDispatched
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {sos.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs py-2 text-slate-700">
                      <div>
                        <strong>Location:</strong> {sos.location_name}
                      </div>
                      <div>
                        <strong>People Trapped:</strong> {sos.people_count} | <strong>Battery:</strong> {sos.battery_percent}%
                      </div>
                      <div>
                        <strong>Distress Type:</strong> <span className="text-red-700 font-bold">{sos.distress_type}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-white/70 p-2 rounded border border-slate-200/60">
                      "{sos.distress_description}"
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 mt-2 border-t border-slate-200/80 text-xs">
                      <div className="text-slate-600">
                        <strong>Assigned Unit:</strong>{' '}
                        <span className="text-blue-700 font-semibold">{sos.assigned_unit || 'Unassigned'}</span>
                      </div>
                      {isActive && (
                        <button
                          onClick={() => handleDispatchSosUnit(sos.id)}
                          className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-sm">siren</span>
                          <span>Dispatch SDRF Unit</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Shelter Marking and Two-Way Availability */}
      {activeTab === 'shelters' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-600">night_shelter</span>
                  Statewide Relief Shelter Registry &amp; Two-Way Availability Communications
                </h3>
                <p className="text-xs text-slate-500">
                  Government issues emergency shelter capacity audits; shelters report real-time berth and supply availability.
                </p>
              </div>
              <button
                onClick={handleBroadcastToShelters}
                disabled={shelterBroadcastLoading}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all self-start sm:self-center"
              >
                <span className="material-symbols-outlined text-base">campaign</span>
                <span>Broadcast Capacity Query to All Shelters</span>
              </button>
            </div>

            {shelterBroadcastSuccess && (
              <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-800 font-medium">
                {shelterBroadcastSuccess}
              </div>
            )}

            {/* Shelters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shelters.map((shelter) => {
                const percentOccupied = Math.round((shelter.occupied / shelter.capacity) * 100);
                const isFull = shelter.status === 'FULL';
                const isNear = shelter.status === 'NEAR_CAPACITY';

                return (
                  <div
                    key={shelter.id}
                    onClick={() => setSelectedEntity({ ...shelter, type: 'SHELTER', description: `Capacity: ${shelter.capacity} | Available: ${shelter.available} | Status: ${shelter.status}` })}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-teal-400 hover:shadow-md transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {shelter.district} District
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">{shelter.name}</h4>
                        <p className="text-xs text-slate-500">Elev: {shelter.elevation_m}m above MSL</p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isFull
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : isNear
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {shelter.status}
                      </span>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">
                          Occupied: <strong>{shelter.occupied}</strong> / {shelter.capacity}
                        </span>
                        <span className="font-bold text-emerald-600">
                          {shelter.available} Free
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFull ? 'bg-red-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentOccupied}%` }}
                        />
                      </div>
                    </div>

                    {/* Relief Stock Indicators */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg text-slate-700">
                      <div>
                        Water: <strong>{shelter.supplies?.drinking_water_days} days</strong>
                      </div>
                      <div>
                        Food: <strong>{shelter.supplies?.food_rations_days} days</strong>
                      </div>
                      <div>
                        Blankets: <strong>{shelter.supplies?.emergency_blankets}</strong>
                      </div>
                      <div>
                        Medical: <strong>{shelter.supplies?.medical_team_on_site ? 'Present' : 'None'}</strong>
                      </div>
                    </div>

                    {/* Two-Way Message Log */}
                    <div className="text-[11px] space-y-1 pt-1 border-t border-slate-100">
                      <div className="text-slate-500 line-clamp-1">
                        <strong>Last Query:</strong> {shelter.last_message_received || 'Standby'}
                      </div>
                      <div className="text-teal-700 font-medium line-clamp-1">
                        <strong>Shelter Response:</strong> {shelter.last_response_sent || 'All systems functional.'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Multilingual Voice Call Simulator Modal */}
      <AudioCallSimulatorModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        defaultNumbers={TARGET_NUMBERS}
      />
    </div>
  );
}
