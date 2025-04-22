from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from transformers import BlipProcessor, BlipForConditionalGeneration, M2M100ForConditionalGeneration, M2M100Tokenizer
from PIL import Image
from fpdf import FPDF
from pymongo import MongoClient
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from threading import Thread
import threading
import time
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
PDF_FOLDER = 'pdfs'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PDF_FOLDER, exist_ok=True)

client = MongoClient("mongodb://localhost:27017/")
db = client["locallensx"]
complaints_col = db["complaints"]
email_logs_col = db["email_logs"]

processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
translator_model = M2M100ForConditionalGeneration.from_pretrained("facebook/m2m100_418M")
translator_tokenizer = M2M100Tokenizer.from_pretrained("facebook/m2m100_418M", use_fast=True)

DEPARTMENT_EMAILS = {
    "garbage": "hdhdhd9269@gmail.com",
    "trash": "dhanushm675@gmail.com",
    "waste": "sivakumarl05042006@gmail.com",
    "road": "sivakumarl05042006@gmail.com",
    "pothole": "sivakumarl05042006@gmail.com",
    "electric": "sivakumarl05042006@gmail.com",
    "wire": "dhanushm675@gmail.com",
    "lamp": "harinideva28@gmail.com",
    "tree": "dhanushm675@gmail.com",
    "sewage": "harinideva28@gmail.com",
    "water": "harinideva28@gmail.com"
}

DEFAULT_DEPT_EMAIL = "harinideva28@gmail.com"
district_collector_email = "district.collector@example.com"

def get_caption_from_image(image_path):
    raw_image = Image.open(image_path).convert('RGB')
    inputs = processor(raw_image, return_tensors="pt")
    out = model.generate(**inputs)
    caption = processor.decode(out[0], skip_special_tokens=True)
    return caption

def translate_caption(text, lang_code):
    translator_tokenizer.src_lang = "en"
    encoded = translator_tokenizer(text, return_tensors="pt")
    generated = translator_model.generate(**encoded, forced_bos_token_id=translator_tokenizer.get_lang_id(lang_code))
    return translator_tokenizer.batch_decode(generated, skip_special_tokens=True)[0]

def identify_department(caption):
    caption_lower = caption.lower()
    for keyword, email in DEPARTMENT_EMAILS.items():
        if keyword in caption_lower:
            return email
    return DEFAULT_DEPT_EMAIL

def send_email_to_department(complaint, dept_email):
    from_email = 'dangerdeva992005@gmail.com'
    password = 'megt ntwc myjb vgsp'

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = dept_email
    msg['Subject'] = f"New Civic Complaint: {complaint['title']}"

    body = f"""
📢 A new civic complaint has been submitted.

📝 Title: {complaint['title']}
📌 Description: {complaint['description']}
📍 Location: Latitude {complaint['lat']}, Longitude {complaint['lng']}
🧠 AI Caption: {complaint['ai_caption_en']}

Please take appropriate action.
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(from_email, password)
        server.sendmail(from_email, dept_email, msg.as_string())
        server.quit()
        print("✅ Department email sent successfully!")
        email_logs_col.insert_one({
            "complaint_title": complaint['title'],
            "to": dept_email,
            "timestamp": datetime.now()
        })
    except Exception as e:
        print(f"❌ Error sending department email: {e}")

def send_escalation_email(complaint):
    from_email = 'dangerdeva992005@gmail.com'
    password = 'megt ntwc myjb vgsp'

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = district_collector_email
    msg['Subject'] = f"Complaint Escalation: {complaint['title']}"

    body = f"""
🚨 Escalated Complaint

The following complaint has not been resolved in 7 days:

📝 Title: {complaint['title']}
📌 Description: {complaint['description']}
📍 Location: Latitude {complaint['lat']}, Longitude {complaint['lng']}
🧠 AI Caption: {complaint['ai_caption_en']}
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(from_email, password)
        server.sendmail(from_email, district_collector_email, msg.as_string())
        server.quit()
        print("📣 Escalation email sent to District Collector.")
    except Exception as e:
        print(f"❌ Error sending escalation email: {e}")

def escalation_worker():
    while True:
        now = datetime.now()
        complaints = complaints_col.find({"escalated": False})
        for c in complaints:
            created = c.get("timestamp")
            if created and (now - created).total_seconds() > 420:
                send_escalation_email(c)
                complaints_col.update_one({"_id": c["_id"]}, {"$set": {"escalated": True}})
        time.sleep(60)

threading.Thread(target=escalation_worker, daemon=True).start()

@app.route('/report', methods=['POST'])
def handle_report():
    title = request.form.get('title')
    description = request.form.get('description')
    lat = request.form.get('lat')
    lng = request.form.get('lng')
    image = request.files['image']

    if not image:
        return jsonify({'error': 'Image missing'}), 400

    filename = secure_filename(image.filename)
    path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    image.save(path)

    caption_en = get_caption_from_image(path)
    issue_type = caption_en.lower().split()[0]
    department_email = identify_department(caption_en)

    caption_ta = translate_caption(caption_en, "ta")
    caption_hi = translate_caption(caption_en, "hi")

    complaint = {
        "title": title,
        "description": description,
        "lat": lat,
        "lng": lng,
        "image": filename,
        "ai_caption_en": caption_en,
        "ai_caption_ta": caption_ta,
        "ai_caption_hi": caption_hi,
        "issue_type": issue_type,
        "ai_caption": caption_en,
        "timestamp": datetime.now(),
        "escalated": False
    }

    complaints_col.insert_one(complaint)
    send_email_to_department(complaint, department_email)
    return jsonify({"message": "Complaint submitted", "caption": caption_en})

@app.route('/complaints', methods=['GET'])
def get_all_complaints():
    complaints = list(complaints_col.find())
    for c in complaints:
        c['_id'] = str(c['_id'])
    return jsonify(complaints)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/generate_pdf', methods=['POST'])
def generate_pdf():
    data = request.get_json()
    title = data['title']
    description = data['description']
    location = data['location']
    ai_caption = data['ai_caption']

    buffer = BytesIO()
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt="LocalLens X Report", ln=True, align='C')
    pdf.ln(10)
    pdf.multi_cell(0, 10, txt=f"Title: {title}")
    pdf.multi_cell(0, 10, txt=f"Description: {description}")
    pdf.multi_cell(0, 10, txt=f"Location: {location['lat']}, {location['lng']}")
    pdf.multi_cell(0, 10, txt=f"AI Caption: {ai_caption}")
    pdf.output(buffer)
    buffer.seek(0)

    return send_file(buffer, as_attachment=True, download_name="LocalLensX_Report.pdf", mimetype="application/pdf")

@app.route('/email_logs', methods=['GET'])
def get_email_logs():
    logs = list(email_logs_col.find().sort("timestamp", -1))
    for log in logs:
        log['_id'] = str(log['_id'])
    return jsonify(logs)

@app.route('/escalations', methods=['GET'])
def view_escalations():
    escalated = list(complaints_col.find({"escalated": True}))
    for e in escalated:
        e['_id'] = str(e['_id'])
    return jsonify(escalated)

if __name__ == '__main__':
    app.run(port=8000, debug=True)
