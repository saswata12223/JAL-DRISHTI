import asyncio
import os
import edge_tts

AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "public", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

SCRIPTS = {
    "hi": {
        "text": "आपातकालीन चेतावनी! उत्तराखंड राज्य आपदा प्रबंधन प्राधिकरण द्वारा तत्काल फ्लैश फ्लड रेड अलर्ट जारी किया गया है। अलकनंदा एवं मंदाकिनी नदी घाटी में जलस्तर खतरे के निशान को पार कर चुका है। सभी नागरिक नदी तट छोड़कर तुरंत निकटतम ऊंचे स्थानों और राजकीय राहत शिविर की ओर सुरक्षित प्रस्थान करें। एसडीआरएफ और एनडीआरएफ की टीमें तैनात हैं।",
        "voice": "hi-IN-SwaraNeural",
        "rate": "+0%",
        "filename": "alert_hi.mp3"
    },
    "en": {
        "text": "Emergency flash flood alert! Issued by the Uttarakhand State Disaster Management Authority. Dangerous river stage breach detected across the Alaknanda and Mandakini catchments. Immediately evacuate all low-lying riverbanks. Proceed to designated government relief shelters on high ground. NDRF and SDRF rescue battalions are mobilized.",
        "voice": "en-IN-NeerjaNeural",
        "rate": "+0%",
        "filename": "alert_en.mp3"
    },
    "local_uttarakhand": {
        "text": "होशियार रयां! उत्तराखंड आपदा प्रबंधन प्राधिकरण तरफ़ा बिट्टी भारी बाढ़ कु रेड अलर्ट जारी करे ग्या छ। अलकनंदा अर मंदाकिनी गाड़ मां पाणी खतरनाक रूप से बढ़ी ग्ये। सब्बी भाई-बैंण नदी कु किनारा छोड़ी बेर तुरंत ऊंच डांडा, ऊंचे स्थानों अर सरकारी राहत कैंप मां चली जावा। एसडीआरएफ अर एनडीआरएफ का जवान पहुंचणा छन। धैर्य रख्यां, सुरक्षित रयां।",
        "voice": "hi-IN-MadhurNeural",
        "rate": "-5%",
        "filename": "alert_local.mp3"
    }
}

async def generate():
    for key, item in SCRIPTS.items():
        out_path = os.path.join(AUDIO_DIR, item["filename"])
        print(f"Generating {item['filename']} with voice {item['voice']}...")
        communicate = edge_tts.Communicate(item["text"], item["voice"], rate=item["rate"])
        await communicate.save(out_path)
        size = os.path.getsize(out_path)
        print(f"Saved {out_path} ({size} bytes)")

if __name__ == "__main__":
    asyncio.run(generate())
