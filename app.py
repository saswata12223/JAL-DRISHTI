from flask import Flask, render_template, jsonify
import serial, threading, re, time, io
from collections import deque
from datetime import datetime
import requests
from PIL import Image, ImageStat, ImageFilter

app = Flask(__name__)
ARDUINO_PORT = "COM8"
BAUD_RATE = 9600
ESP32_IP = "192.168.1.116"
CAPTURE_URL = f"http://{ESP32_IP}/capture"
SOIL_DRY_RAW = 620
SOIL_WET_RAW = 230
history = deque(maxlen=300)
arduino = None
rain_data = {"rain_value":0,"rain_level":"NO DATA","intensity":0,"alert":False,"soil_raw":0,"soil_moisture":0,"arduino_connected":False,"last_update":None}
camera_data = {"connected":False,"brightness":0,"dark_cloud_score":0,"visual_rain_score":0,"camera_score":0,"last_update":None,"frames_analyzed":0}
forecast_data = {"risk":"INSUFFICIENT DATA","probability":0,"eta_min":None,"eta_max":None,"confidence":0,"reason":"Waiting for live sensor and camera history.","components":{"rain":0,"soil":0,"rain_trend":0,"soil_trend":0,"camera":0,"external_water":0}}

def clamp(v, lo=0, hi=100): return max(lo, min(hi, float(v)))
def soil_percent(raw): return 100 if raw <= SOIL_WET_RAW else 0 if raw >= SOIL_DRY_RAW else int(round(clamp((SOIL_DRY_RAW-raw)*100/(SOIL_DRY_RAW-SOIL_WET_RAW))))

def camera_features(data):
    try:
        im=Image.open(io.BytesIO(data)).convert("L").resize((160,120)); stat=ImageStat.Stat(im); px=list(im.getdata())
        brightness=float(stat.mean[0]); dark=sum(p<90 for p in px)/len(px); contrast=float(stat.stddev[0]); edge=float(ImageStat.Stat(im.filter(ImageFilter.FIND_EDGES)).mean[0])
        darkness=clamp((150-brightness)/90*100)
        dark_score=clamp(.70*darkness+.30*dark*100)
        visual=clamp(.55*dark_score+.25*clamp((contrast-25)/45*100)+.20*clamp((edge-10)/35*100))
        return {"brightness":round(brightness,1),"dark_cloud_score":round(dark_score),"visual_rain_score":round(visual),"camera_score":round(visual)}
    except Exception as e:
        print("Camera analysis error:",e); return None

def trend(vals):
    if len(vals) < 5:
        return 0

    # Use recent windows rather than the entire history so the forecast
    # reacts to a genuine change in conditions during a live demo.
    n = min(10, max(5, len(vals)//5))
    a = sum(vals[-2*n:-n]) / n if len(vals) >= 2*n else sum(vals[:n]) / n
    b = sum(vals[-n:]) / n
    return round(clamp((b-a)*3))


def external_water_score(soil_values, current_soil, current_rain):
    """
    Estimate an external-water-intrusion pattern.

    This does NOT identify a dam break specifically. It detects the pattern:
    little/no rainfall + high soil saturation + sustained/increasing wetness.
    """
    if current_rain >= 20 or len(soil_values) < 5:
        return 0, 0

    # Recent rise over approximately the last 5-10 sensor samples.
    n = min(10, max(5, len(soil_values)//5))
    recent_start = soil_values[-n]
    recent_avg = sum(soil_values[-n:]) / n
    rise = max(0, current_soil - recent_start)

    # Score the rate/persistence of wetness separately.
    rise_score = clamp(rise * 3.0)
    persistence = clamp((recent_avg - 35) * 1.8)

    score = 0.45 * current_soil + 0.35 * rise_score + 0.20 * persistence

    # Stronger escalation when soil is very wet and the rise is continuing.
    if current_soil >= 70 and rise >= 8:
        score += 15
    if current_soil >= 85 and rise >= 12:
        score += 15

    score = clamp(score)
    return round(score), round(rise, 1)


def compute_forecast():
    global forecast_data
    if len(history)<5:
        forecast_data={**forecast_data,"risk":"COLLECTING DATA","reason":"Collecting sensor and camera history."}; return
    rows=list(history); rain=[x["rain_intensity"] for x in rows]; soil=[x["soil_moisture"] for x in rows]; cams=[x["camera_score"] for x in rows if x["camera_score"] is not None]
    cr,cs,cc=rain[-1],soil[-1],(cams[-1] if cams else 0); rt,st=trend(rain),trend(soil)

    # Pathway 1: rainfall-driven flooding.
    score=.32*cr+.23*cs+.17*rt+.13*st+.15*cc
    score += 8*(sum(1 for x in rain[-10:] if x>=60)/min(10,len(rain)))

    # Pathway 2: external-water flooding.
    # Example: dam release/break, river overflow, drainage failure.
    # Rain can remain near zero while soil becomes progressively wetter.
    external_water, soil_rise = external_water_score(soil, cs, cr)

    if external_water > 0:
        # Do not let the absence of rain suppress a strong external-water signal.
        score=max(score, external_water)

    probability=int(round(clamp(score)))
    if cr<35 and cs<65 and cc<65 and st<10: probability=min(probability,39)
    risk="CRITICAL" if probability>=80 else "HIGH" if probability>=65 else "MODERATE" if probability>=45 else "LOW"
    worsening=.40*cr+.25*rt+.20*st+.15*cc
    if probability>=80: eta=(15,30)
    elif probability>=65: eta=(25,50)
    elif probability>=45: eta=(45,90)
    else: eta=(None,None)
    if eta[0] is not None:
        mn,mx=eta
        if worsening>=75: mn=max(10,mn-10); mx=max(mn+10,mx-15)
        elif worsening<45: mn+=10; mx+=15
        eta=(mn,mx)
    confidence=int(round(clamp(35+min(len(rows),60)*.6+(15 if cams else 0))))
    if cr < 20 and external_water >= 45:
        reason=(f"Rain is low/absent, but soil saturation is {cs:.0f}% with a "
                f"recent rise of {soil_rise:.0f} points. Possible external water "
                f"intrusion; camera evidence {cc:.0f}%.")
    elif probability>=65:
        reason=(f"Rain intensity {cr:.0f}%, soil saturation {cs:.0f}%, rainfall trend {rt:.0f}%, "
                f"soil trend {st:.0f}%, camera evidence {cc:.0f}%.")
    elif probability>=45:
        reason="Multiple indicators are elevated, but the combined pattern has not reached a high-risk threshold."
    else:
        reason="Current rainfall, soil saturation and camera evidence do not show a strong flood pattern."
    forecast_data={"risk":risk,"probability":probability,"eta_min":eta[0],"eta_max":eta[1],"confidence":confidence,"reason":reason,"components":{"rain":round(cr),"soil":round(cs),"rain_trend":rt,"soil_trend":st,"camera":round(cc),"external_water":round(external_water),"soil_rise":soil_rise}}

def parse_line(line):
    if not re.search(r"RAIN_RAW|SOIL_RAW",line): return
    m=re.search(r"RAIN_RAW=(\d+)",line)
    if m: rain_data["rain_value"]=int(m.group(1))
    m=re.search(r"RAIN_LEVEL=(.*?)\s*\|",line)
    if m: rain_data["rain_level"]=m.group(1).strip()
    m=re.search(r"RAIN_INTENSITY=(\d+)",line)
    if m: rain_data["intensity"]=int(m.group(1))
    m=re.search(r"SOIL_RAW=(\d+)",line)
    if m: rain_data["soil_raw"]=int(m.group(1)); rain_data["soil_moisture"]=soil_percent(rain_data["soil_raw"])
    m=re.search(r"ALERT=(YES|NO)",line)
    if m: rain_data["alert"]=m.group(1)=="YES"
    rain_data["arduino_connected"]=True; rain_data["last_update"]=datetime.now().isoformat(timespec="seconds")
    history.append({"timestamp":time.time(),"rain_raw":rain_data["rain_value"],"rain_intensity":rain_data["intensity"],"soil_raw":rain_data["soil_raw"],"soil_moisture":rain_data["soil_moisture"],"camera_score":camera_data["camera_score"] if camera_data["connected"] else None})
    compute_forecast()

def read_arduino():
    while True:
        try:
            line=arduino.readline().decode("utf-8",errors="ignore").strip()
            if line: print("Arduino:",line); parse_line(line)
        except Exception as e:
            rain_data["arduino_connected"]=False; print("Arduino read error:",e); time.sleep(2)

def camera_loop():
    while True:
        try:
            r=requests.get(CAPTURE_URL,timeout=2)
            if r.ok and r.content:
                f=camera_features(r.content)
                if f:
                    camera_data.update(f); camera_data["connected"]=True; camera_data["last_update"]=datetime.now().isoformat(timespec="seconds"); camera_data["frames_analyzed"]+=1
                    if history: history[-1]["camera_score"]=camera_data["camera_score"]
                    compute_forecast()
            else: camera_data["connected"]=False
        except Exception: camera_data["connected"]=False
        time.sleep(1)

try:
    arduino=serial.Serial(ARDUINO_PORT,BAUD_RATE,timeout=1); rain_data["arduino_connected"]=True; print("Arduino connected on",ARDUINO_PORT)
except Exception as e: print("Arduino connection failed:",e)
if arduino: threading.Thread(target=read_arduino,daemon=True).start()
threading.Thread(target=camera_loop,daemon=True).start()

@app.route("/")
def home(): return render_template("index.html")
@app.route("/sensor")
def sensor(): return jsonify(rain_data)
@app.route("/camera")
def camera(): return jsonify(camera_data)
@app.route("/forecast")
def forecast(): return jsonify(forecast_data)
@app.route("/system")
def system(): return jsonify({"sensor":rain_data,"camera":camera_data,"forecast":forecast_data,"history_points":len(history)})

if __name__=="__main__":
    print("Starting JalDrishti Flood Forecast Server...")
    print("Camera:",CAPTURE_URL)
    print("Soil calibration:",SOIL_WET_RAW,"wet ->",SOIL_DRY_RAW,"dry")
    app.run(host="0.0.0.0",port=5000,debug=True,use_reloader=False)
