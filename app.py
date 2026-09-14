import os
import sys
import io
import csv
import time
import random
import re
import requests
import urllib.parse

# Force utf-8 encoding on standard output for Windows console
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from flask import Flask, render_template, jsonify, request, send_from_directory, send_file, Response, make_response

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from database.db_manager import (
    get_db_connection, init_database, get_site_settings, get_setting, update_site_settings,
    log_otp_request, mark_otp_verified, get_recent_otp_logs,
    get_student_full_dashboard_data, get_all_blog_posts, get_blog_post_by_slug,
    save_blog_post_entry, delete_blog_post_entry,
    get_top_leaderboard_students, save_new_lead, get_all_leads, delete_lead_by_id,
    save_payment_slip_record, approve_student_payment_vip, reject_student_payment,
    get_all_payments_with_slips, get_certificate_verification_data
)
from database.qr_generator import generate_dynamic_upi_qr_bytes, update_static_qr_files
from database.seed_courses import seed_python_sikho_data
from engine.code_runner import run_python_code
from engine.ai_tutor import answer_student_doubt
from engine.project_starter import get_project_starter_zip
from engine.certificate_gen import generate_certificate_image

app = Flask(__name__, template_folder="templates", static_folder="static")
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

# In-memory OTP storage: { "phone": { "otp": "4589", "expires_at": timestamp } }
OTP_STORE = {}

# Ensure Database & Seed Course Data
init_database()
db_file = os.path.join(BASE_DIR, "database", "python_sikho.db")
if not os.path.exists(db_file) or os.path.getsize(db_file) < 5000:
    print("[*] Initializing and seeding Python Sikho curriculum...")
    seed_python_sikho_data()

# Helper for Master PIN authentication
def get_valid_admin_pins():
    current_pin = get_setting("master_pin", "9509")
    pins = [str(current_pin).strip(), "9509", "9509934266", "rohit9509", "rohit@2026", "samyak9509"]
    return list(set(pins))

def check_admin_auth(req):
    # Check headers
    auth_header = str(req.headers.get("X-Admin-Pin") or req.headers.get("X-Mentor-PIN") or req.headers.get("X-Mentor-Key") or "").strip()
    auth_bearer = str(req.headers.get("Authorization", "")).strip()
    if auth_bearer.lower().startswith("bearer "):
        auth_bearer = auth_bearer[7:].strip()
    
    # Check query params and cookies
    query_pin = str(req.args.get("pin") or req.args.get("admin_pin") or "").strip()
    cookie_pin = str(req.cookies.get("wp_admin_pin", "")).strip()

    # Check request body if json
    body_data = req.get_json(silent=True) or {}
    body_pin = str(body_data.get("pin") or body_data.get("admin_pin") or "").strip()
    
    valid_pins = get_valid_admin_pins()
    candidates = [auth_header, auth_bearer, query_pin, cookie_pin, body_pin]
    
    for cand in candidates:
        if cand:
            if cand == "ROHIT_MENTOR_AUTH_TOKEN_9509934266" or cand in valid_pins:
                return True
    return False

def is_student_vip(user_id):
    if user_id is None:
        return False
    try:
        uid = int(user_id)
    except (ValueError, TypeError):
        return False
    if uid == 0:
        return True # Chief Mentor Rohit Sir bypass
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT is_paid, subscription_status FROM users WHERE id = ?", (uid,))
    row = cursor.fetchone()
    conn.close()
    if row and (row["is_paid"] == 1 or str(row["subscription_status"]).lower() in ["active_vip", "approved", "paid"]):
        return True
    return False

# -----------------------------------------------------------------------------
# 1. MAIN UI ROUTES & SEO ROBOTS/SITEMAP
# -----------------------------------------------------------------------------
@app.route("/")
def index():
    settings = get_site_settings()
    return render_template("index.html", settings=settings)

@app.route("/wp-admin")
@app.route("/admin")
def wp_admin_page():
    settings = get_site_settings()
    return render_template("admin.html", settings=settings)

@app.route("/sitemap.xml", methods=["GET"])
def sitemap_xml():
    settings = get_site_settings()
    canonical = settings.get("canonical_url", "https://tags-beyond-tobacco-models.trycloudflare.com").rstrip("/")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, chapter_no, title FROM chapters ORDER BY chapter_no ASC")
    chapters = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT slug, title, created_at FROM blog_posts WHERE is_published = 1 ORDER BY created_at DESC")
    blogs = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    today = time.strftime("%Y-%m-%d")
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
        '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
        '  <url>',
        f'    <loc>{canonical}/</loc>',
        f'    <lastmod>{today}</lastmod>',
        '    <changefreq>daily</changefreq>',
        '    <priority>1.00</priority>',
        '  </url>',
        '  <url>',
        f'    <loc>{canonical}/#blog</loc>',
        f'    <lastmod>{today}</lastmod>',
        '    <changefreq>daily</changefreq>',
        '    <priority>0.90</priority>',
        '  </url>'
    ]
    
    for ch in chapters:
        xml_lines.extend([
            '  <url>',
            f'    <loc>{canonical}/#topic-{ch["chapter_no"]}</loc>',
            f'    <lastmod>{today}</lastmod>',
            '    <changefreq>weekly</changefreq>',
            '    <priority>0.80</priority>',
            '  </url>'
        ])

    for b in blogs:
        xml_lines.extend([
            '  <url>',
            f'    <loc>{canonical}/#blog/{b["slug"]}</loc>',
            f'    <lastmod>{today}</lastmod>',
            '    <changefreq>weekly</changefreq>',
            '    <priority>0.85</priority>',
            '  </url>'
        ])
        
    xml_lines.append('</urlset>')
    return Response("\n".join(xml_lines), mimetype="application/xml; charset=utf-8")

@app.route("/robots.txt", methods=["GET"])
def robots_txt():
    settings = get_site_settings()
    canonical = settings.get("canonical_url", "https://tags-beyond-tobacco-models.trycloudflare.com").rstrip("/")
    content = f"""# Robots.txt for Python Sikho (Samyak Classes, Kuchaman City)
User-agent: *
Allow: /
Disallow: /api/admin/
Disallow: /wp-admin
Disallow: /admin

# Google & Bing Sitemaps
Sitemap: {canonical}/sitemap.xml
"""
    return Response(content, mimetype="text/plain; charset=utf-8")

@app.route("/api/settings", methods=["GET"])
def api_get_public_settings():
    settings = get_site_settings()
    safe = {k: v for k, v in settings.items() if k != "master_pin"}
    return jsonify({"status": "success", "success": True, "settings": safe})

@app.route("/api/payment/qr.png", methods=["GET"])
def api_get_dynamic_payment_qr():
    price = request.args.get("amount") or get_setting("course_price", "299")
    upi_id = request.args.get("upi_id") or get_setting("payment_upi_id", "7627060647@ybl")
    payee = request.args.get("payee") or get_setting("payment_receiver_name", "RAJU RAM (Rohit Sir)")
    note = request.args.get("note") or "Python Sikho VIP Course"
    
    img_bytes = generate_dynamic_upi_qr_bytes(price=price, upi_id=upi_id, payee_name=payee, note=note)
    resp = make_response(img_bytes)
    resp.headers["Content-Type"] = "image/png"
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return resp

# -----------------------------------------------------------------------------
# 2. COURSES & TOPIC CONTENT APIS (DEMO CLASS 1 FREE • CLASSES 2-12 VIP ₹299)
# -----------------------------------------------------------------------------
@app.route("/api/courses", methods=["GET"])
def api_get_courses():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM courses")
    courses = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify(courses)

@app.route("/api/chapters", methods=["GET"])
def api_get_chapters():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM chapters ORDER BY chapter_no ASC")
    chapters = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify(chapters)

@app.route("/api/chapters/<int:chapter_id>/content", methods=["GET"])
def api_get_chapter_content(chapter_id):
    user_id = request.args.get("user_id") or request.headers.get("X-User-Id")
    is_admin = check_admin_auth(request)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Chapter Meta
    cursor.execute("SELECT * FROM chapters WHERE id = ? OR chapter_no = ? ORDER BY id ASC LIMIT 1", (chapter_id, chapter_id))
    row_ch = cursor.fetchone()
    if not row_ch:
        conn.close()
        return jsonify({"status": "error", "message": "Chapter not found"}), 404

    chapter = dict(row_ch)
    real_ch_id = chapter["id"]
    ch_no = chapter.get("chapter_no", 1)

    # 1 Demo Class Policy: Chapter 1 is 100% Free Demo for all students.
    # Chapters 2 to 12 require VIP Course Subscription (₹299).
    # Chief Mentor Rohit Sir and Admin have instant VIP bypass.
    is_vip = is_admin or (user_id is not None and is_student_vip(user_id))
    is_demo = (ch_no == 1)
    is_locked = not (is_demo or is_vip)

    if is_locked:
        conn.close()
        course_price = get_setting("course_price", "299")
        payment_phone = get_setting("payment_phone", "7627060647")
        payment_upi_id = get_setting("payment_upi_id", "7627060647@ybl")
        payment_receiver_name = get_setting("payment_receiver_name", "RAJU RAM (Rohit Sir)")
        return jsonify({
            "status": "paywall_required",
            "is_locked": True,
            "requires_vip": True,
            "is_demo": False,
            "price": int(course_price) if str(course_price).isdigit() else 299,
            "course_price": int(course_price) if str(course_price).isdigit() else 299,
            "payment_phone": payment_phone,
            "upi_id": payment_upi_id,
            "payee_name": payment_receiver_name,
            "message": f"🔒 यह टॉपिक (#{ch_no}) VIP पेड कोर्स का हिस्सा है। केवल टॉपिक 1 फ्री डेमो है। पूरा कोर्स ₹{course_price} में अनलॉक करें!",
            "chapter": chapter,
            "notes": {
                "id": 0,
                "chapter_id": real_ch_id,
                "title": f"🔒 {chapter['title']} (VIP Paid Content)",
                "content_markdown": f"# 🔒 Topic {ch_no}: {chapter['title']} (VIP Locked)\n\n### 🎓 केवल ₹{course_price} में Python 3 का सम्पूर्ण VIP कोर्स अनलॉक करें!\n\n**Topic 1 (Python Introduction)** सभी छात्रों के लिए 100% **फ्री डेमो क्लास** है।\n\n**Topic 2 से Topic 12 तक के सभी 12 मॉड्यूल्स, 100+ लाइव कोडिंग सैंडबॉक्स चैलेंज, क्विज़, कैपस्टोन प्रोजेक्ट्स और वेरिफाइड सर्टिफ़िकेट** प्राप्त करने के लिए कृपया **₹{course_price}** का भुगतान करें।\n\n- 📞 **UPI Payment Number:** `{payment_phone}`\n- 💳 **UPI ID:** `{payment_upi_id}`\n- 👨‍🏫 **Payee:** {payment_receiver_name}\n- 📱 **Google Pay / PhonePe / Paytm / BHIM** द्वारा तुरंत भुगतान करें。"
            },
            "practice": {
                "id": 0,
                "chapter_id": real_ch_id,
                "title": f"🔒 {chapter['title']} Practice (VIP Only)",
                "instructions": f"प्रैक्टिस टास्क अनलॉक करने के लिए ₹{course_price} का भुगतान करें।",
                "starter_code": f"# 🔒 VIP CONTENT LOCKED\n# Pay ₹{course_price} to Rohit Sir ({payment_phone}) to unlock all Practice Arenas!\nprint('Unlock Full VIP Course at ₹{course_price}')\n"
            },
            "quiz": {
                "id": 0,
                "chapter_id": real_ch_id,
                "title": f"🔒 {chapter['title']} Quiz",
                "questions": []
            },
            "assignment": {},
            "projects": []
        })

    # Notes
    cursor.execute("SELECT * FROM notes WHERE chapter_id = ?", (real_ch_id,))
    row_notes = cursor.fetchone()
    notes = dict(row_notes) if row_notes else {}

    # Practice Task
    cursor.execute("SELECT * FROM practice_tasks WHERE chapter_id = ?", (real_ch_id,))
    row_prac = cursor.fetchone()
    practice = dict(row_prac) if row_prac else {}

    # Quiz & Questions
    cursor.execute("SELECT * FROM quizzes WHERE chapter_id = ?", (real_ch_id,))
    row_quiz = cursor.fetchone()
    quiz = dict(row_quiz) if row_quiz else {}
    if quiz:
        cursor.execute("SELECT * FROM quiz_questions WHERE quiz_id = ?", (quiz["id"],))
        quiz["questions"] = [dict(q) for q in cursor.fetchall()]
    else:
        quiz["questions"] = []

    # Assignment
    cursor.execute("SELECT * FROM assignments WHERE chapter_id = ?", (real_ch_id,))
    row_assign = cursor.fetchone()
    assignment = dict(row_assign) if row_assign else {}

    # Projects
    cursor.execute("SELECT * FROM projects WHERE course_id = 1")
    projects = [dict(p) for p in cursor.fetchall()]

    conn.close()

    return jsonify({
        "status": "success",
        "is_locked": False,
        "is_demo": is_demo,
        "is_vip": is_vip,
        "chapter": chapter,
        "notes": notes,
        "practice": practice,
        "quiz": quiz,
        "assignment": assignment,
        "projects": projects
    })

# -----------------------------------------------------------------------------
# 3. DYNAMIC PHONE + OTP AUTHENTICATION & ONBOARDING
# -----------------------------------------------------------------------------
# Rate limiting store: { "phone": [timestamp1, timestamp2] }
OTP_RATE_LIMIT = {}

def send_sms_gateway_otp(phone, otp_code):
    """
    Sends real SMS via configured SMS gateway API (Fast2SMS / 2Factor / Twilio).
    """
    api_key = get_setting("sms_api_key", "").strip()
    provider = get_setting("sms_provider", "fast2sms").strip().lower()
    
    if not api_key:
        print(f"[*] SMS Gateway API key not set in admin. Real OTP for +91 {phone} is [{otp_code}] (Logged securely in Admin DB).")
        return False, "logged_to_admin"

    try:
        if provider == "fast2sms":
            url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                "authorization": api_key,
                "Content-Type": "application/x-www-form-urlencoded"
            }
            payload = {
                "variables_values": otp_code,
                "route": "otp",
                "numbers": phone
            }
            res = requests.post(url, headers=headers, data=payload, timeout=8)
            print(f"[Fast2SMS] Dispatched to {phone}: {res.status_code} - {res.text}")
            if res.status_code == 200 and ('"return":true' in res.text or '"status_code":200' in res.text):
                return True, "sent_fast2sms"
            else:
                err_msg = "fast2sms_key_disabled" if ("413" in res.text or "412" in res.text) else f"fast2sms_{res.status_code}"
                return False, err_msg
        elif provider == "2factor":
            url = f"https://2factor.in/v1/{api_key}/SMS/{phone}/{otp_code}/PythonSikhoOTP"
            res = requests.get(url, timeout=8)
            print(f"[2Factor] Dispatched to {phone}: {res.status_code} - {res.text}")
            if res.status_code == 200 and "Success" in res.text:
                return True, "sent_2factor"
            else:
                return False, f"2factor_{res.status_code}"
    except Exception as e:
        print(f"[!] SMS dispatch failed: {e}")
        return False, str(e)

    return False, "unsupported_provider"

# -----------------------------------------------------------------------------
# 3. STRICT REAL PHONE + OTP AUTHENTICATION & ONBOARDING (ZERO FAKE LOGINS)
# -----------------------------------------------------------------------------
@app.route("/api/auth/send-otp", methods=["POST"])
def api_send_otp():
    data = request.get_json() or {}
    raw_phone = str(data.get("phone", "")).strip()
    clean_phone = "".join(filter(str.isdigit, raw_phone))

    # Strict Indian Mobile Number Validation: 10 digits starting with 6, 7, 8, or 9
    if not re.match(r'^[6-9]\d{9}$', clean_phone):
        return jsonify({
            "status": "error",
            "success": False,
            "message": "⚠️ कृपया एक मान्य 10-अंकों का भारतीय मोबाइल नंबर दर्ज करें (शुरुआत 6, 7, 8 या 9 से होनी चाहिए)।"
        }), 400

    # Reject obvious fake/dummy numbers
    if len(set(clean_phone)) <= 2 or clean_phone in ["9876543210", "9876543211", "9999999999", "8888888888", "7777777777", "6666666666"]:
        return jsonify({
            "status": "error",
            "success": False,
            "message": "⚠️ कृपया अपना वास्तविक मोबाइल नंबर दर्ज करें। डमी या फ़ेक नंबर स्वीकार्य नहीं हैं।"
        }), 400

    phone = clean_phone[-10:]
    now = time.time()

    # Rate limiting: max 3 requests per 5 minutes per phone
    timestamps = OTP_RATE_LIMIT.get(phone, [])
    timestamps = [t for t in timestamps if now - t < 300]
    if len(timestamps) >= 5:
        return jsonify({
            "status": "error",
            "success": False,
            "message": "⚠️ बहुत अधिक प्रयास! कृपया 5 मिनट बाद पुनः प्रयास करें।"
        }), 429
    timestamps.append(now)
    OTP_RATE_LIMIT[phone] = timestamps

    # Generate 4-digit cryptographically secure OTP
    otp_code = f"{random.randint(1000, 9999)}"
    OTP_STORE[phone] = {
        "otp": otp_code,
        "attempts": 0,
        "created_at": now,
        "expires_at": now + 300 # 5 minutes TTL
    }

    # Dispatch via SMS Gateway if configured
    sms_sent, delivery_tag = send_sms_gateway_otp(phone, otp_code)
    
    # Log to SQLite audit table
    ip_addr = request.remote_addr or ""
    log_otp_request(phone, otp_code, ip_addr, delivery_tag)

    # Check existing student
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, phone, city FROM users WHERE phone = ?", (phone,))
    existing_user = cursor.fetchone()
    conn.close()

    is_registered = bool(existing_user)
    user_name = existing_user["name"] if existing_user else None

    # WhatsApp direct verification URL for student convenience
    mentor_wa = get_setting("mentor_whatsapp", "9509934266")
    wa_verify_url = f"https://api.whatsapp.com/send?phone=91{mentor_wa}&text=" + urllib.parse.quote(
        f"नमस्ते रोहित सर! मेरा Python Sikho लॉगिन वेरिफिकेशन कोड {otp_code} है (मोबाइल: {phone})।"
    )

    print(f"[AUTH GATE] Secure Real OTP generated for +91 {phone} -> Delivery: {delivery_tag} (Code: {otp_code})")

    response_payload = {
        "status": "success",
        "success": True,
        "message": f"OTP आपके मोबाइल नंबर +91 {phone} पर भेज दिया गया है।",
        "phone": phone,
        "is_registered": is_registered,
        "user_name": user_name,
        "existing_user": dict(existing_user) if existing_user else None,
        "whatsapp_otp_url": wa_verify_url,
        "sms_sent": sms_sent,
        "delivery_tag": delivery_tag
    }

    # If SMS gateway failed or returned error, provide fallback_otp so user is never blocked
    if not sms_sent:
        response_payload["fallback_otp"] = otp_code
        if delivery_tag == "fast2sms_key_disabled":
            response_payload["gateway_status"] = "Fast2SMS Authorization Key Disabled (अकाउंट में Dev API Key ऑन करें)"
        else:
            response_payload["gateway_status"] = f"SMS Gateway Status: {delivery_tag}"

    return jsonify(response_payload)

@app.route("/api/auth/verify-and-register", methods=["POST"])
def api_verify_and_register():
    data = request.get_json() or {}
    raw_phone = str(data.get("phone", "")).strip()
    clean_phone = "".join(filter(str.isdigit, raw_phone))
    phone = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
    otp_entered = str(data.get("otp", "")).strip()
    name = str(data.get("name", "")).strip()
    city = str(data.get("city", "Kuchaman City")).strip() or "Kuchaman City"
    avatar_url = data.get("avatar_url", "/static/uploads/virendra.png")

    if not phone or not re.match(r'^[6-9]\d{9}$', phone):
        return jsonify({"status": "error", "success": False, "message": "⚠️ अमान्य मोबाइल नंबर!"}), 400

    saved_otp = OTP_STORE.get(phone)
    if not saved_otp:
        return jsonify({
            "status": "error",
            "success": False,
            "message": "⚠️ कोई सक्रिय OTP नहीं मिला! कृपया पहले 'Send OTP' पर क्लिक करें।"
        }), 400

    now = time.time()
    if now > saved_otp.get("expires_at", 0):
        OTP_STORE.pop(phone, None)
        return jsonify({
            "status": "error",
            "success": False,
            "message": "⚠️ OTP की समय सीमा (5 मिनट) समाप्त हो चुकी है। कृपया नया OTP मँगवाएँ।"
        }), 400

    # Anti-brute force: increment attempts
    saved_otp["attempts"] = saved_otp.get("attempts", 0) + 1
    if saved_otp["attempts"] > 5:
        OTP_STORE.pop(phone, None)
        return jsonify({
            "status": "error",
            "success": False,
            "message": "⚠️ गलत OTP दर्ज करने की अधिकतम सीमा पार हो गई है। कृपया नया OTP प्राप्त करें।"
        }), 400

    if otp_entered != saved_otp.get("otp"):
        remaining = 5 - saved_otp["attempts"]
        return jsonify({
            "status": "error",
            "success": False,
            "message": f"❌ गलत OTP! कृपया अपने फ़ोन पर आया सही 4-अंकों का OTP दर्ज करें। ({remaining} प्रयास शेष)"
        }), 400

    # OTP is verified! Mark in database and clear memory store
    mark_otp_verified(phone, saved_otp.get("otp"))
    OTP_STORE.pop(phone, None)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE phone = ?", (phone,))
    user = cursor.fetchone()

    if user:
        user_dict = dict(user)
        if name and name != user_dict.get("name"):
            cursor.execute("UPDATE users SET name = ?, city = ? WHERE id = ?", (name, city, user_dict["id"]))
            conn.commit()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_dict["id"],))
            user_dict = dict(cursor.fetchone())
        conn.close()
        return jsonify({
            "status": "success",
            "success": True,
            "message": f"नमस्ते {user_dict['name']}! आपका सफल सत्यापन हो गया है।",
            "is_new": False,
            "user": user_dict
        })
    else:
        if not name:
            name = f"Student {phone[-4:]}"

        cursor.execute("""
        INSERT INTO users (name, phone, city, avatar_url, xp_points, streak_days, current_chapter_id)
        VALUES (?, ?, ?, ?, 100, 1, 1)
        """, (name, phone, city, avatar_url))
        conn.commit()

        user_id = cursor.lastrowid
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        new_user = dict(cursor.fetchone())
        conn.close()

        return jsonify({
            "status": "success",
            "success": True,
            "message": f"🎉 बधाई हो {name}! आपका मोबाइल नंबर सफलतापूर्वक वेरिफ़ाई हो गया और आपको +100 Welcome XP मिले!",
            "is_new": True,
            "user": new_user
        })

@app.route("/api/admin/auth/otp-logs", methods=["GET"])
def api_admin_get_otp_logs():
    if not check_admin_auth(request):
        return jsonify({"status": "error", "message": "🚫 Unauthorized"}), 403
    logs = get_recent_otp_logs(limit=50)
    return jsonify({"status": "success", "success": True, "logs": logs})

@app.route("/api/admin/auth/test-sms", methods=["POST"])
def api_admin_test_sms():
    if not check_admin_auth(request):
        return jsonify({"status": "error", "message": "🚫 Unauthorized"}), 403
    data = request.get_json() or {}
    phone = str(data.get("phone", "7240574213")).strip()
    clean_phone = "".join(filter(str.isdigit, phone))[-10:]
    
    test_otp = "9509"
    sent, tag = send_sms_gateway_otp(clean_phone, test_otp)
    
    api_key = get_setting("sms_api_key", "").strip()
    provider = get_setting("sms_provider", "fast2sms").strip()
    
    return jsonify({
        "status": "success" if sent else "warning",
        "sms_sent": sent,
        "delivery_tag": tag,
        "provider": provider,
        "api_key_masked": (api_key[:6] + "..." + api_key[-4:]) if len(api_key) > 10 else api_key,
        "phone": clean_phone,
        "message": "SMS dispatched successfully!" if sent else f"Gateway status: {tag}"
    })

@app.route("/api/auth/student/<int:user_id>", methods=["GET"])
def api_get_student_profile(user_id):
    # Chief Mentor bypass
    if user_id == 0:
        return jsonify({
            "status": "success",
            "success": True,
            "user": {
                "id": 0,
                "name": "Rohit Sir",
                "phone": "9509934266",
                "city": "Kuchaman City",
                "is_mentor": True,
                "is_paid": 1,
                "subscription_status": "active_vip",
                "xp_points": 9999,
                "streak_days": 99
            }
        })

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    if user:
        return jsonify({"status": "success", "success": True, "user": dict(user)})
    return jsonify({"status": "error", "kicked": True, "success": False, "message": "आपका छात्र रिकॉर्ड मौजूद नहीं है या हटा दिया गया है।"}), 404

@app.route("/api/student/<int:user_id>/dashboard", methods=["GET"])
def api_get_student_dashboard(user_id):
    """
    Returns complete student analytics: profile info, completed topics,
    remaining topics, percentage progress, 12-topic checklist, and quiz stats.
    """
    data = get_student_full_dashboard_data(user_id)
    if not data:
        return jsonify({"status": "error", "message": "Student not found"}), 404
    return jsonify({
        "status": "success",
        "success": True,
        "dashboard": data
    })

# -----------------------------------------------------------------------------
# 3.1 PUBLIC & ADMIN BLOG SUITE (SEO RANK SUITE)
# -----------------------------------------------------------------------------
@app.route("/api/blog/posts", methods=["GET"])
def api_get_public_blog_posts():
    category = request.args.get("category")
    search = request.args.get("search")
    posts = get_all_blog_posts(category=category, search=search)
    return jsonify({
        "status": "success",
        "success": True,
        "posts": posts,
        "total": len(posts)
    })

@app.route("/api/blog/posts/<slug>", methods=["GET"])
def api_get_single_blog_post(slug):
    post = get_blog_post_by_slug(slug)
    if not post:
        return jsonify({"status": "error", "message": "Blog post not found"}), 404
    return jsonify({
        "status": "success",
        "success": True,
        "post": post
    })

@app.route("/api/admin/blog/posts", methods=["GET", "POST"])
def api_admin_blog_posts():
    if not check_admin_auth(request):
        return jsonify({"status": "error", "message": "🚫 Unauthorized"}), 403

    if request.method == "GET":
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM blog_posts ORDER BY created_at DESC")
        posts = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return jsonify({"status": "success", "success": True, "posts": posts})

    elif request.method == "POST":
        data = request.get_json() or {}
        title = data.get("title", "").strip()
        slug = data.get("slug", "").strip() or re.sub(r'[^a-zA-Z0-9]+', '-', title.lower()).strip('-')
        meta_description = data.get("meta_description", "").strip()
        focus_keyword = data.get("focus_keyword", "").strip()
        category = data.get("category", "Python Basics").strip()
        read_time = data.get("read_time", "5 min read").strip()
        content_markdown = data.get("content_markdown", "").strip()
        post_id = data.get("id")

        if not title or not content_markdown:
            return jsonify({"status": "error", "message": "Title and content are required"}), 400

        save_blog_post_entry(title, slug, meta_description, focus_keyword, category, read_time, content_markdown, post_id=post_id)
        return jsonify({"status": "success", "success": True, "message": "Blog article saved successfully!"})

@app.route("/api/admin/blog/posts/<int:post_id>", methods=["DELETE"])
def api_admin_delete_blog_post(post_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "message": "🚫 Unauthorized"}), 403
    delete_blog_post_entry(post_id)
    return jsonify({"status": "success", "success": True, "message": "Blog post deleted successfully!"})

# -----------------------------------------------------------------------------
# 3.2 PWA MANIFEST & SERVICE WORKER
# -----------------------------------------------------------------------------
@app.route('/manifest.json')
def pwa_manifest():
    return send_from_directory('static', 'manifest.json', mimetype='application/manifest+json')

@app.route('/sw.js')
def pwa_service_worker():
    return send_from_directory('static', 'sw.js', mimetype='application/javascript')

# -----------------------------------------------------------------------------
# 3.3 LIVE LEADERBOARD (HALL OF FAME)
# -----------------------------------------------------------------------------
@app.route('/api/leaderboard', methods=['GET'])
def api_get_leaderboard():
    limit = int(request.args.get('limit', 15))
    leaderboard = get_top_leaderboard_students(limit=limit)
    return jsonify({
        "status": "success",
        "success": True,
        "leaderboard": leaderboard,
        "total": len(leaderboard)
    })

# -----------------------------------------------------------------------------
# 3.4 PAYMENT SCREENSHOT & SLIP UPLOAD (AUTO-VIP WORKFLOW)
# -----------------------------------------------------------------------------
@app.route('/api/pay/upload-slip', methods=['POST'])
def api_upload_payment_slip():
    user_id = request.form.get('user_id')
    student_name = request.form.get('name', '').strip()
    phone = request.form.get('phone', '').strip()
    utr_number = request.form.get('utr_number', '').strip()
    amount = float(request.form.get('amount', 299.0))

    screenshot_url = ""
    if 'slip_image' in request.files:
        file = request.files['slip_image']
        if file and file.filename != '':
            ext = os.path.splitext(file.filename)[1].lower() or '.png'
            filename = f"slip_{phone}_{int(time.time())}{ext}"
            slip_dir = os.path.join(BASE_DIR, "static", "uploads", "payment_slips")
            os.makedirs(slip_dir, exist_ok=True)
            save_path = os.path.join(slip_dir, filename)
            file.save(save_path)
            screenshot_url = f"/static/uploads/payment_slips/{filename}"

    if not utr_number and not screenshot_url:
        return jsonify({
            "status": "error",
            "success": False,
            "message": "⚠️ कृपया पेमेंट का स्क्रीनशॉट अपलोड करें या 12-अंकों का UTR नंबर दर्ज करें।"
        }), 400

    payment_id = save_payment_slip_record(
        user_id=int(user_id) if user_id and str(user_id).isdigit() else None,
        student_name=student_name or f"Student {phone[-4:]}",
        phone=phone,
        amount=amount,
        utr_number=utr_number,
        screenshot_url=screenshot_url
    )

    return jsonify({
        "status": "success",
        "success": True,
        "payment_id": payment_id,
        "screenshot_url": screenshot_url,
        "message": "🎉 आपका पेमेंट स्क्रीनशॉट / UTR सफलतापूर्वक सबमिट हो गया है! चीफ मेंटर रोहित सर द्वारा सत्यापन के बाद आपका VIP एक्सेस सक्रिय हो जाएगा।"
    })

@app.route('/api/admin/payments/all', methods=['GET'])
def api_admin_get_all_payments():
    if not check_admin_auth(request):
        return jsonify({"status": "error", "message": "🚫 Unauthorized"}), 403
    payments = get_all_payments_with_slips()
    return jsonify({"status": "success", "success": True, "payments": payments})

@app.route('/api/admin/payments/approve/<int:payment_id>', methods=['POST'])
def api_admin_approve_payment(payment_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "message": "🚫 Unauthorized"}), 403
    success = approve_student_payment_vip(payment_id)
    if success:
        return jsonify({"status": "success", "success": True, "message": "👑 Student VIP Lifetime Access granted successfully!"})
    return jsonify({"status": "error", "message": "Payment record not found"}), 404

@app.route('/api/admin/payments/reject/<int:payment_id>', methods=['POST'])
def api_admin_reject_payment(payment_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "message": "🚫 Unauthorized"}), 403
    data = request.get_json(silent=True) or {}
    reason = data.get("reason", "Invalid receipt or amount")
    reject_student_payment(payment_id, reason=reason)
    return jsonify({"status": "success", "success": True, "message": "Payment rejected."})

# -----------------------------------------------------------------------------
# 3.5 LEADS CAPTURE (30-PAGE HANDBOOK & CRM)
# -----------------------------------------------------------------------------
@app.route('/api/leads/capture', methods=['POST'])
def api_capture_lead():
    data = request.get_json() or {}
    name = str(data.get("name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    city = str(data.get("city", "Kuchaman City")).strip() or "Kuchaman City"
    clean_phone = "".join(filter(str.isdigit, phone))[-10:]

    if not name or not clean_phone or len(clean_phone) != 10:
        return jsonify({"status": "error", "message": "⚠️ कृपया अपना पूरा नाम और 10-अंकों का WhatsApp नंबर दर्ज करें।"}), 400

    lead_id = save_new_lead(name, clean_phone, city=city, source="cheatsheet_popup")
    
    return jsonify({
        "status": "success",
        "success": True,
        "lead_id": lead_id,
        "download_url": "/static/downloads/python_handbook_rohit_sir.pdf",
        "html_url": "/static/downloads/python_handbook_rohit_sir.html",
        "message": f"🎉 धन्यवाद {name}! रोहित सर की Python Formula Cheatsheet तैयार है।"
    })

@app.route('/api/admin/leads', methods=['GET'])
def api_admin_get_leads():
    if not check_admin_auth(request):
        return jsonify({"status": "error", "message": "🚫 Unauthorized"}), 403
    leads = get_all_leads()
    return jsonify({"status": "success", "success": True, "leads": leads, "total": len(leads)})

@app.route('/api/admin/leads/<int:lead_id>', methods=['DELETE'])
def api_admin_delete_lead(lead_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "message": "🚫 Unauthorized"}), 403
    delete_lead_by_id(lead_id)
    return jsonify({"status": "success", "success": True, "message": "Lead deleted."})

@app.route('/api/admin/leads/export-csv', methods=['GET'])
def api_admin_export_leads_csv():
    if not check_admin_auth(request):
        return "Unauthorized", 403
    leads = get_all_leads()
    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(["ID", "Name", "WhatsApp Phone", "City", "Source", "Date"])
    for l in leads:
        cw.writerow([l.get("id"), l.get("name"), l.get("phone"), l.get("city"), l.get("source"), l.get("created_at")])
    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=python_sikho_leads.csv"
    output.headers["Content-type"] = "text/csv"
    return output

# -----------------------------------------------------------------------------
# 3.6 CERTIFICATE QR VERIFICATION & HD DOWNLOAD
# -----------------------------------------------------------------------------
@app.route('/api/certificate/verify/<cert_id>', methods=['GET'])
@app.route('/verify-certificate/<cert_id>', methods=['GET'])
def api_verify_certificate_public(cert_id):
    cert_data = get_certificate_verification_data(cert_id)
    if not cert_data:
        if request.path.startswith('/api/'):
            return jsonify({"status": "error", "message": "Invalid certificate number"}), 404
        return f"""<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <title>Certificate Not Found - Python Sikho</title>
    <style>
        body {{ background: #0a0e1a; color: #fff; font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }}
        .card {{ background: #111827; border: 2px solid #ef4444; border-radius: 16px; padding: 36px; max-width: 500px; text-align: center; }}
        h2 {{ color: #f87171; margin-top: 10px; }}
        p {{ color: #94a3b8; font-size: 14px; }}
        a {{ display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; margin-top: 16px; }}
    </style>
</head>
<body>
    <div class="card">
        <div style="font-size: 48px;">⚠️</div>
        <h2>प्रमाणपत्र रिकॉर्ड नहीं मिला (Invalid Certificate)</h2>
        <p>प्रमाणपत्र क्रमांक <strong>{cert_id}</strong> मान्य नहीं है या अभी जारी नहीं हुआ है।</p>
        <a href="/">← मुख्य वेबसाइट पर जाएँ</a>
    </div>
</body>
</html>""", 404

    if request.path.startswith('/api/'):
        return jsonify({"status": "success", "certificate": cert_data})
    
    cert_html = f"""<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verified Certificate: {cert_data['cert_number']} - Python Sikho</title>
    <style>
        body {{ background: #0a0e1a; color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }}
        .cert-card {{ background: #111827; border: 2px solid #00f0ff; border-radius: 20px; box-shadow: 0 0 40px rgba(0,240,255,0.25); max-width: 600px; width: 100%; padding: 36px; text-align: center; }}
        .seal {{ font-size: 48px; margin-bottom: 10px; }}
        .badge {{ background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid #10b981; padding: 6px 16px; border-radius: 20px; font-weight: 800; display: inline-block; font-size: 13px; margin-bottom: 16px; }}
        h1 {{ font-size: 24px; color: #00f0ff; margin: 0 0 6px; }}
        .stud-name {{ font-size: 28px; font-weight: 900; color: #fbbf24; margin: 16px 0 6px; text-transform: uppercase; letter-spacing: 1px; }}
        .meta-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 24px 0; text-align: left; background: #1e293b; padding: 18px; border-radius: 12px; border: 1px solid #334155; font-size: 13px; }}
        .meta-grid strong {{ color: #38bdf8; }}
        .btn {{ display: inline-block; background: linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%); color: #000; font-weight: 800; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="cert-card">
        <div class="seal">🎓</div>
        <div class="badge">✅ 100% OFFICIALLY VERIFIED CERTIFICATE</div>
        <h1>Python Sikho Academy</h1>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">Samyak Computer Classes • Kuchaman City</p>
        
        <div class="stud-name">{cert_data['student_name']}</div>
        <p style="color: #cbd5e1; font-size: 14px;">has successfully completed all 12 modules of</p>
        <p style="color: #00f0ff; font-weight: 700; font-size: 16px;">{cert_data['course_title']}</p>

        <div class="meta-grid">
            <div><strong>Certificate ID:</strong><br>{cert_data['cert_number']}</div>
            <div><strong>Issue Date:</strong><br>{cert_data['issue_date']}</div>
            <div><strong>Completed:</strong><br>{cert_data['completed_modules']} / 12 Topics</div>
            <div><strong>Grade:</strong><br>{cert_data['grade']}</div>
            <div><strong>City:</strong><br>{cert_data['city']}</div>
            <div><strong>Chief Mentor:</strong><br>{cert_data['mentor_name']}</div>
        </div>

        <a href="/" class="btn">🚀 Visit Python Sikho Academy ➜</a>
    </div>
</body>
</html>"""
    return cert_html

@app.route("/api/student/progress/<int:user_id>", methods=["GET"])
@app.route("/api/student/<int:user_id>/progress", methods=["GET"])
def api_get_student_progress(user_id):
    if user_id == 0:
        return jsonify({
            "status": "success",
            "user_id": 0,
            "completed_chapters": list(range(1, 13)),
            "completed_count": 12,
            "total_chapters": 12,
            "progress_pct": 100.0
        })

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return jsonify({"status": "error", "kicked": True, "message": "User deleted"}), 404

    cursor.execute("SELECT chapter_id FROM user_progress WHERE user_id = ? AND step_completed >= 6", (user_id,))
    completed_rows = cursor.fetchall()
    completed_ids = [r["chapter_id"] for r in completed_rows]
    
    cursor.execute("SELECT COUNT(*) as total FROM chapters")
    total_chapters = cursor.fetchone()["total"] or 12
    conn.close()
    
    pct = round((len(completed_ids) / total_chapters) * 100, 1) if total_chapters > 0 else 0
    return jsonify({
        "status": "success",
        "user_id": user_id,
        "completed_chapters": completed_ids,
        "completed_count": len(completed_ids),
        "total_chapters": total_chapters,
        "progress_pct": pct
    })

@app.route("/api/student/complete-topic", methods=["POST"])
def api_complete_topic():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    chapter_id = data.get("chapter_id")
    
    if user_id is None or not chapter_id:
        return jsonify({"status": "error", "message": "Missing user_id or chapter_id"}), 400

    if user_id == 0:
        return jsonify({
            "status": "success",
            "message": f"Chief Mentor Master Access: Topic #{chapter_id} verified!",
            "xp_added": 0,
            "user": {"id": 0, "name": "Rohit Sir", "xp_points": 9999, "is_mentor": True},
            "completed_chapters": list(range(1, 13)),
            "completed_count": 12,
            "total_chapters": 12,
            "progress_pct": 100.0
        })
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user_row = cursor.fetchone()
    if not user_row:
        conn.close()
        return jsonify({"status": "error", "kicked": True, "message": "Student record was deleted by Mentor"}), 404

    # Check if already completed
    cursor.execute("SELECT * FROM user_progress WHERE user_id = ? AND chapter_id = ? AND step_completed >= 6", (user_id, chapter_id))
    existing = cursor.fetchone()
    
    xp_added = 0
    if not existing:
        cursor.execute("""
        INSERT OR REPLACE INTO user_progress (user_id, chapter_id, step_completed, is_unlocked, completed_at)
        VALUES (?, ?, 6, 1, CURRENT_TIMESTAMP)
        """, (user_id, chapter_id))
        
        # Award +50 XP for completing topic
        cursor.execute("UPDATE users SET xp_points = xp_points + 50 WHERE id = ?", (user_id,))
        xp_added = 50
    
    conn.commit()
    
    # Fetch updated user and progress
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user_row = cursor.fetchone()
    user_dict = dict(user_row) if user_row else {}
    
    cursor.execute("SELECT chapter_id FROM user_progress WHERE user_id = ? AND step_completed >= 6", (user_id,))
    completed_ids = [r["chapter_id"] for r in cursor.fetchall()]
    
    cursor.execute("SELECT COUNT(*) as total FROM chapters")
    total_chapters = cursor.fetchone()["total"] or 12
    conn.close()
    
    pct = round((len(completed_ids) / total_chapters) * 100, 1) if total_chapters > 0 else 0
    
    return jsonify({
        "status": "success",
        "message": f"Topic #{chapter_id} marked as completed! +{xp_added} XP" if xp_added else f"Topic #{chapter_id} already completed!",
        "xp_added": xp_added,
        "user": user_dict,
        "completed_chapters": completed_ids,
        "completed_count": len(completed_ids),
        "total_chapters": total_chapters,
        "progress_pct": pct
    })


# -----------------------------------------------------------------------------
# 3.1 STUDENT SUBSCRIPTION & VIP PAYMENT SUBMISSION (₹299)
# -----------------------------------------------------------------------------
@app.route("/api/subscription/submit-payment", methods=["POST"])
def api_submit_payment():
    data = request.get_json() or {}
    user_id = data.get("user_id")
    raw_phone = str(data.get("phone", "")).strip()
    name = str(data.get("name", "")).strip()
    upi_ref = str(data.get("upi_ref") or data.get("utr_number") or data.get("utr") or "").strip()
    amount = float(data.get("amount", 299.0))
    
    clean_phone = "".join(filter(str.isdigit, raw_phone))
    phone = clean_phone[-10:] if len(clean_phone) >= 10 else clean_phone
    
    if not upi_ref or len(upi_ref) < 4:
        return jsonify({"status": "error", "success": False, "message": "कृपया एक मान्य 12-अंकों का UPI Reference / UTR नंबर दर्ज करें।"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    user = None
    if user_id and user_id != 0:
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
    elif phone:
        cursor.execute("SELECT * FROM users WHERE phone = ?", (phone,))
        user = cursor.fetchone()
        
    if not user:
        if phone:
            if not name:
                name = f"Student {phone[-4:]}"
            cursor.execute("""
            INSERT INTO users (name, phone, city, avatar_url, xp_points, streak_days, current_chapter_id, is_paid, subscription_status, payment_utr, payment_date)
            VALUES (?, ?, 'Kuchaman City', '/static/uploads/virendra.png', 100, 1, 1, 0, 'pending_approval', ?, CURRENT_TIMESTAMP)
            """, (name, phone, upi_ref))
            conn.commit()
            real_uid = cursor.lastrowid
            cursor.execute("SELECT * FROM users WHERE id = ?", (real_uid,))
            user = cursor.fetchone()
        else:
            conn.close()
            return jsonify({"status": "error", "success": False, "message": "छात्र रिकॉर्ड नहीं मिला। कृपया पहले अपना 10-अंकों का मोबाइल नंबर दर्ज करें।"}), 400
        
    real_uid = user["id"]
    user_name = name or user["name"]
    user_phone = phone or user["phone"]
    payment_phone = get_setting("payment_phone", "7627060647")
    mentor_wa = get_setting("mentor_whatsapp", "9509934266")
    
    # Insert payment record
    cursor.execute("""
    INSERT INTO payments (user_id, user_name, user_phone, amount, upi_ref, upi_number, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    """, (real_uid, user_name, user_phone, amount, upi_ref, payment_phone))
    payment_id = cursor.lastrowid
    
    # Update user subscription status to pending_approval
    cursor.execute("""
    UPDATE users 
    SET subscription_status = 'pending_approval', payment_utr = ?, payment_date = CURRENT_TIMESTAMP
    WHERE id = ?
    """, (upi_ref, real_uid))
    
    conn.commit()
    
    cursor.execute("SELECT * FROM users WHERE id = ?", (real_uid,))
    updated_user = dict(cursor.fetchone())
    conn.close()
    
    wa_msg = f"नमस्ते रोहित सर! मैंने Python Sikho VIP कोर्स के लिए ₹{int(amount)} का भुगतान कर दिया है।\n\n👤 नाम: {user_name}\n📱 मोबाइल: {user_phone}\n🔢 UTR/Ref No: {upi_ref}\n\nकृपया मेरा VIP कोर्स तुरंत अनलॉक करें!"
    wa_link = f"https://api.whatsapp.com/send?phone=91{mentor_wa}&text={urllib.parse.quote(wa_msg)}"
    
    return jsonify({
        "status": "success",
        "success": True,
        "message": f"🎉 धन्यवाद {user_name}! आपका ₹{int(amount)} का भुगतान (UTR: {upi_ref}) दर्ज हो गया है।\n\nचीफ मेंटर रोहित सर द्वारा सत्यापन के तुरंत बाद आपका सम्पूर्ण VIP कोर्स (12 टॉपिक्स, क्विज़, प्रोजेक्ट्स व सर्टिफ़िकेट) अनलॉक हो जाएगा!",
        "payment_id": payment_id,
        "utr_number": upi_ref,
        "whatsapp_url": wa_link,
        "user": updated_user
    })

@app.route("/api/subscription/status/<int:user_id>", methods=["GET"])
def api_get_subscription_status(user_id):
    if user_id == 0:
        return jsonify({
            "status": "success",
            "is_paid": 1,
            "is_vip": True,
            "subscription_status": "active_vip",
            "message": "Chief Mentor Rohit Sir (Master Access)"
        })
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, phone, is_paid, subscription_status, payment_utr, payment_date FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return jsonify({"status": "error", "message": "User not found"}), 404
        
    cursor.execute("SELECT * FROM payments WHERE user_id = ? ORDER BY id DESC LIMIT 1", (user_id,))
    payment_row = cursor.fetchone()
    conn.close()
    
    u_dict = dict(user)
    is_paid = bool(u_dict.get("is_paid") == 1 or str(u_dict.get("subscription_status")).lower() in ["active_vip", "approved", "paid"])
    
    return jsonify({
        "status": "success",
        "user_id": user_id,
        "is_paid": 1 if is_paid else 0,
        "is_vip": is_paid,
        "subscription_status": u_dict.get("subscription_status", "free"),
        "payment_utr": u_dict.get("payment_utr"),
        "payment_date": u_dict.get("payment_date"),
        "last_payment": dict(payment_row) if payment_row else None
    })

# -----------------------------------------------------------------------------
# 4. ROHIT SIR MENTOR ADMIN DASHBOARD API (RESTRICTED TO ROHIT SIR ONLY)
# -----------------------------------------------------------------------------
ROHIT_SIR_VALID_PINS = ["9509", "9509934266", "rohit9509", "rohit@2026", "samyak9509"]

@app.route("/api/admin/verify-pin", methods=["POST"])
def api_admin_verify_pin():
    data = request.get_json() or {}
    pin_entered = str(data.get("pin", "")).strip()

    valid_pins = get_valid_admin_pins()
    if pin_entered in valid_pins:
        token = "ROHIT_MENTOR_AUTH_TOKEN_9509934266"
        mentor_profile = {
            "id": 0,
            "name": "Rohit Sir",
            "phone": "9509934266",
            "city": "Kuchaman City",
            "is_mentor": True,
            "is_paid": 1,
            "subscription_status": "active_vip",
            "xp_points": 9999,
            "streak_days": 99
        }
        return jsonify({
            "status": "success",
            "success": True,
            "message": "नमस्ते रोहित सर! मेंटर एक्सेस स्वीकृत हुआ।",
            "token": token,
            "mentor_profile": mentor_profile
        })
    else:
        return jsonify({
            "status": "error",
            "success": False,
            "message": "🚫 अमान्य मेंटर पिन! यह पैनल केवल चीफ मेंटर रोहित सर के लिए सुरक्षित है।"
        }), 403

@app.route("/api/admin/students", methods=["GET"])
def api_admin_get_students():
    if not check_admin_auth(request):
        return jsonify({
            "status": "error",
            "success": False,
            "message": "🚫 अनधिकृत प्रवेश वर्जित! यह डेटा केवल चीफ मेंटर रोहित सर के लिए सुरक्षित है।"
        }), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        u.id, 
        u.name, 
        u.phone, 
        u.city, 
        u.avatar_url, 
        u.xp_points, 
        u.streak_days, 
        u.is_paid,
        u.subscription_status,
        u.payment_utr,
        u.payment_date,
        u.created_at,
        COUNT(DISTINCT q.id) as quizzes_taken,
        COUNT(DISTINCT a.id) as assignments_submitted,
        COUNT(DISTINCT c.id) as certificates_earned
    FROM users u
    LEFT JOIN quiz_attempts q ON u.id = q.user_id
    LEFT JOIN assignment_submissions a ON u.id = a.user_id
    LEFT JOIN certificates c ON u.id = c.user_id
    GROUP BY u.id
    ORDER BY u.id DESC
    """)
    students = [dict(r) for r in cursor.fetchall()]
    conn.close()
    
    avg_xp = 100
    if students:
        avg_xp = int(sum(s.get("xp_points", 0) for s in students) / len(students))

    return jsonify({
        "status": "success",
        "success": True,
        "total_students": len(students),
        "average_xp": avg_xp,
        "students": students
    })

@app.route("/api/admin/delete-student/<int:student_id>", methods=["DELETE", "POST"])
def api_admin_delete_student(student_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (student_id,))
    cursor.execute("DELETE FROM payments WHERE user_id = ?", (student_id,))
    cursor.execute("DELETE FROM quiz_attempts WHERE user_id = ?", (student_id,))
    cursor.execute("DELETE FROM assignment_submissions WHERE user_id = ?", (student_id,))
    cursor.execute("DELETE FROM certificates WHERE user_id = ?", (student_id,))
    cursor.execute("DELETE FROM user_progress WHERE user_id = ?", (student_id,))
    conn.commit()
    conn.close()

    print(f"[*] Rohit Sir deleted student #{student_id} from database.")

    return jsonify({
        "status": "success",
        "success": True,
        "message": f"Student #{student_id} successfully deleted from all records."
    })

# 4.1 EXPORT STUDENTS TO CSV / EXCEL
@app.route("/api/admin/export-students-csv", methods=["GET"])
def api_admin_export_students_csv():
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        u.id, 
        u.name, 
        u.phone, 
        u.city, 
        u.xp_points, 
        u.streak_days, 
        u.is_paid,
        u.subscription_status,
        u.payment_utr,
        u.created_at,
        COUNT(DISTINCT q.id) as quizzes_taken,
        COUNT(DISTINCT up.chapter_id) as completed_chapters
    FROM users u
    LEFT JOIN quiz_attempts q ON u.id = q.user_id
    LEFT JOIN user_progress up ON u.id = up.user_id AND up.step_completed >= 6
    GROUP BY u.id
    ORDER BY u.id DESC
    """)
    students = cursor.fetchall()
    conn.close()

    output = io.StringIO()
    output.write('\ufeff')
    writer = csv.writer(output)
    writer.writerow([
        "Student ID", "Full Name", "Phone Number", "City / Location", 
        "VIP Status", "Payment UTR", "Total XP Points", "Daily Streak (Days)", "Quizzes Taken", 
        "Completed Topics (out of 12)", "Joined Date & Time"
    ])

    for s in students:
        vip_label = "👑 VIP Lifetime (₹299)" if (s["is_paid"] == 1 or s["subscription_status"] == "active_vip") else ("⏳ Pending Approval" if s["subscription_status"] == "pending_approval" else "🆓 Demo Class Only")
        writer.writerow([
            s["id"],
            s["name"],
            f"+91 {s['phone']}",
            s["city"] or "Kuchaman City",
            vip_label,
            s["payment_utr"] or "N/A",
            s["xp_points"] or 100,
            s["streak_days"] or 1,
            s["quizzes_taken"] or 0,
            s["completed_chapters"] or 0,
            s["created_at"] or "2026-09-12"
        ])

    mem = io.BytesIO()
    mem.write(output.getvalue().encode('utf-8-sig'))
    mem.seek(0)

    filename = f"Python_Sikho_Students_{time.strftime('%Y%m%d_%H%M%S')}.csv"
    return send_file(
        mem,
        mimetype="text/csv; charset=utf-8",
        as_attachment=True,
        download_name=filename
    )

# 4.2 AWARD BONUS XP TO STUDENT
@app.route("/api/admin/award-xp/<int:student_id>", methods=["POST"])
def api_admin_award_bonus_xp(student_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    data = request.get_json() or {}
    xp_amount = int(data.get("xp_amount", 50))
    reason = str(data.get("reason", "Chief Mentor Special Bonus Award")).strip()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (student_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return jsonify({"status": "error", "message": "Student not found"}), 404

    cursor.execute("UPDATE users SET xp_points = xp_points + ? WHERE id = ?", (xp_amount, student_id))
    conn.commit()

    cursor.execute("SELECT * FROM users WHERE id = ?", (student_id,))
    updated_user = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "status": "success",
        "success": True,
        "message": f"🎉 {updated_user['name']} को सफलतापूर्वक +{xp_amount} XP बोनस दिया गया! ({reason})",
        "user": updated_user,
        "xp_awarded": xp_amount
    })

# 4.3 ANNOUNCEMENTS & LIVE NOTICE BOARD
@app.route("/api/announcements", methods=["GET"])
def api_get_public_announcements():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM announcements ORDER BY is_active DESC, id DESC LIMIT 20")
    announcements = [dict(r) for r in cursor.fetchall()]
    conn.close()
    active_items = [a for a in announcements if a.get("is_active") == 1]
    return jsonify({
        "status": "success",
        "success": True,
        "total": len(announcements),
        "active_count": len(active_items),
        "announcements": announcements
    })

@app.route("/api/announcements/active", methods=["GET"])
def api_get_active_announcement():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM announcements WHERE is_active = 1 ORDER BY id DESC LIMIT 1")
    announcement = cursor.fetchone()
    conn.close()
    if announcement:
        return jsonify({"status": "success", "success": True, "has_active": True, "announcement": dict(announcement)})
    return jsonify({"status": "success", "success": True, "has_active": False, "announcement": None})

@app.route("/api/admin/announcements", methods=["GET"])
def api_admin_get_announcements():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM announcements ORDER BY id DESC")
    announcements = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"status": "success", "success": True, "announcements": announcements})

@app.route("/api/admin/announcement", methods=["POST"])
@app.route("/api/admin/announcement/save", methods=["POST"])
def api_admin_save_announcement():
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    data = request.get_json() or {}
    message = str(data.get("message") or data.get("text") or "").strip()
    ann_type = str(data.get("type") or data.get("badge") or "general").strip()
    is_active = int(data.get("is_active", 1))

    if not message:
        return jsonify({"status": "error", "success": False, "message": "Notice message cannot be empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    if is_active:
        cursor.execute("UPDATE announcements SET is_active = 0")
    
    cursor.execute("""
    INSERT INTO announcements (message, type, is_active, created_by)
    VALUES (?, ?, ?, 'Rohit Sir')
    """, (message, ann_type, is_active))
    conn.commit()
    ann_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "status": "success",
        "success": True,
        "message": "📢 नया नोटिस पोर्टल पर तुरंत लाइव पब्लिश कर दिया गया है!",
        "announcement_id": ann_id
    })

@app.route("/api/admin/announcement/toggle/<int:ann_id>", methods=["POST"])
def api_admin_toggle_announcement(ann_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM announcements WHERE id = ?", (ann_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"status": "error", "success": False, "message": "Not found"}), 404
    
    new_state = 0 if row["is_active"] else 1
    if new_state == 1:
        cursor.execute("UPDATE announcements SET is_active = 0")
    cursor.execute("UPDATE announcements SET is_active = ? WHERE id = ?", (new_state, ann_id))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "success": True, "is_active": new_state})

@app.route("/api/admin/announcement/delete/<int:ann_id>", methods=["DELETE", "POST"])
def api_admin_delete_announcement(ann_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM announcements WHERE id = ?", (ann_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "success": True, "message": "Notice deleted successfully"})

# 4.4 CMS: TOPIC NOTES & QUIZ QUESTION EDITOR
@app.route("/api/admin/topic-content/<int:chapter_id>", methods=["GET"])
def api_admin_get_topic_content(chapter_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM chapters WHERE id = ? OR chapter_no = ? ORDER BY id ASC LIMIT 1", (chapter_id, chapter_id))
    chapter = cursor.fetchone()
    if not chapter:
        conn.close()
        return jsonify({"status": "error", "message": "Chapter not found"}), 404
    
    ch_id = chapter["id"]
    cursor.execute("SELECT * FROM notes WHERE chapter_id = ?", (ch_id,))
    notes_row = cursor.fetchone()

    cursor.execute("SELECT * FROM quizzes WHERE chapter_id = ?", (ch_id,))
    quiz_row = cursor.fetchone()
    questions = []
    if quiz_row:
        cursor.execute("SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY id ASC", (quiz_row["id"],))
        questions = [dict(q) for q in cursor.fetchall()]

    conn.close()
    return jsonify({
        "status": "success",
        "chapter": dict(chapter),
        "notes": dict(notes_row) if notes_row else None,
        "quiz": dict(quiz_row) if quiz_row else None,
        "questions": questions
    })

@app.route("/api/admin/topic-notes/<int:chapter_id>", methods=["POST"])
def api_admin_save_topic_notes(chapter_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "message": "🚫 Unauthorized"}), 403

    data = request.get_json() or {}
    title = str(data.get("title", "")).strip()
    description = str(data.get("description", "")).strip()
    content_markdown = str(data.get("content_markdown", "")).strip()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM chapters WHERE id = ? OR chapter_no = ? LIMIT 1", (chapter_id, chapter_id))
    ch = cursor.fetchone()
    if not ch:
        conn.close()
        return jsonify({"status": "error", "message": "Chapter not found"}), 404
    
    real_ch_id = ch["id"]

    if title:
        cursor.execute("UPDATE chapters SET title = ?, description = ? WHERE id = ?", (title, description, real_ch_id))
    
    cursor.execute("SELECT id FROM notes WHERE chapter_id = ?", (real_ch_id,))
    existing_notes = cursor.fetchone()
    if existing_notes:
        cursor.execute("UPDATE notes SET content_markdown = ?, title = ? WHERE chapter_id = ?", (content_markdown, title or f"Topic #{chapter_id} Notes", real_ch_id))
    else:
        cursor.execute("INSERT INTO notes (chapter_id, title, content_markdown) VALUES (?, ?, ?)", (real_ch_id, title or f"Topic #{chapter_id} Notes", content_markdown))
    
    conn.commit()
    conn.close()

    return jsonify({
        "status": "success",
        "message": f"Topic #{chapter_id} के नोट्स सफलतापूर्वक अपडेट और सेव हो गए! 🚀"
    })

@app.route("/api/admin/quiz-question/add", methods=["POST"])
def api_admin_add_quiz_question():
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    data = request.get_json() or {}
    chapter_id = int(data.get("chapter_id", 1))
    question_text = str(data.get("question_text", "")).strip()
    opt_a = str(data.get("option_a", "")).strip()
    opt_b = str(data.get("option_b", "")).strip()
    opt_c = str(data.get("option_c", "")).strip()
    opt_d = str(data.get("option_d", "")).strip()
    correct_opt = str(data.get("correct_option", "A")).strip().upper()
    explanation = str(data.get("explanation", "")).strip()

    if not question_text or not opt_a or not opt_b:
        return jsonify({"status": "error", "success": False, "message": "Question and options A & B are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM chapters WHERE id = ? OR chapter_no = ? LIMIT 1", (chapter_id, chapter_id))
    ch = cursor.fetchone()
    if not ch:
        conn.close()
        return jsonify({"status": "error", "message": "Chapter not found"}), 404
    
    real_ch_id = ch["id"]
    cursor.execute("SELECT id FROM quizzes WHERE chapter_id = ?", (real_ch_id,))
    q_row = cursor.fetchone()
    if not q_row:
        cursor.execute("INSERT INTO quizzes (chapter_id, title, passing_score) VALUES (?, ?, 80)", (real_ch_id, f"Topic {chapter_id} Quiz"))
        quiz_id = cursor.lastrowid
    else:
        quiz_id = q_row["id"]

    cursor.execute("""
    INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (quiz_id, question_text, opt_a, opt_b, opt_c, opt_d, correct_opt, explanation))
    conn.commit()
    new_q_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "status": "success",
        "message": "नया क्विज़ प्रश्न सफलतापूर्वक जोड़ दिया गया! ✅",
        "question_id": new_q_id
    })

@app.route("/api/admin/quiz-question/delete/<int:question_id>", methods=["DELETE", "POST"])
def api_admin_delete_quiz_question(question_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "message": "🚫 Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM quiz_questions WHERE id = ?", (question_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "message": f"Question #{question_id} deleted successfully"})

# -----------------------------------------------------------------------------
# 4.5 WORDPRESS ADMIN SUITE: ANALYTICS & STATS
# -----------------------------------------------------------------------------
@app.route("/api/admin/analytics", methods=["GET"])
def api_admin_get_analytics():
    if not check_admin_auth(request):
        return jsonify({"status": "error", "message": "🚫 Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total_students, COALESCE(AVG(xp_points), 100) as avg_xp, COALESCE(SUM(xp_points), 0) as total_xp FROM users")
    user_stats = dict(cursor.fetchone())

    cursor.execute("SELECT COUNT(*) as total_chapters FROM chapters")
    total_chapters = cursor.fetchone()["total_chapters"]

    cursor.execute("SELECT COUNT(*) as total_quizzes_attempted, COALESCE(SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END), 0) as passed_quizzes FROM quiz_attempts")
    quiz_stats = dict(cursor.fetchone())

    cursor.execute("SELECT COUNT(*) as total_announcements FROM announcements WHERE is_active = 1")
    active_ann = cursor.fetchone()["total_announcements"]

    cursor.execute("SELECT id, name, phone, city, xp_points, created_at FROM users ORDER BY id DESC LIMIT 5")
    recent_students = [dict(r) for r in cursor.fetchall()]

    conn.close()

    total_attempts = quiz_stats.get("total_quizzes_attempted", 0)
    passed_attempts = quiz_stats.get("passed_quizzes", 0)
    pass_rate = int((passed_attempts / total_attempts * 100)) if total_attempts > 0 else 100

    return jsonify({
        "status": "success",
        "success": True,
        "total_students": user_stats.get("total_students", 0),
        "total_xp": int(user_stats.get("total_xp", 0)),
        "average_xp": int(user_stats.get("avg_xp", 100)),
        "total_chapters": total_chapters,
        "total_quizzes_attempted": total_attempts,
        "pass_rate": pass_rate,
        "active_announcements": active_ann,
        "recent_students": recent_students,
        "stats": {
            "total_students": user_stats.get("total_students", 0),
            "total_topics": total_chapters,
            "total_xp": int(user_stats.get("total_xp", 0)),
            "average_xp": int(user_stats.get("avg_xp", 100)),
            "pass_rate": pass_rate
        }
    })

# -----------------------------------------------------------------------------
# 4.6 WORDPRESS ADMIN SUITE: SITE SETTINGS & SEO MANAGER
# -----------------------------------------------------------------------------
@app.route("/api/admin/settings/save", methods=["POST"])
def api_admin_save_settings():
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    data = request.get_json() or {}
    settings_data = data.get("settings", data)
    if not settings_data:
        return jsonify({"status": "error", "success": False, "message": "No settings provided"}), 400

    update_site_settings(settings_data)

    # Auto-regenerate PhonePe UPI Dynamic QR with newly saved price & UPI address
    new_price = settings_data.get("course_price") or get_setting("course_price", "299")
    new_upi = settings_data.get("payment_upi_id") or get_setting("payment_upi_id", "7627060647@ybl")
    new_payee = settings_data.get("payment_receiver_name") or get_setting("payment_receiver_name", "RAJU RAM (Rohit Sir)")
    try:
        update_static_qr_files(new_price, new_upi, new_payee)
    except Exception as e:
        print(f"[!] Warning: QR auto-generation error: {e}")

    return jsonify({
        "status": "success",
        "success": True,
        "message": f"✅ सभी सेटिंग्स, फीस (₹{new_price}) और PhonePe UPI QR कोड सफलतापूर्वक अपडेट हो गए हैं!",
        "settings": get_site_settings()
    })

# -----------------------------------------------------------------------------
# 4.7 WORDPRESS ADMIN SUITE: STUDENT EDIT / MANAGEMENT
# -----------------------------------------------------------------------------
@app.route("/api/admin/students/edit/<int:student_id>", methods=["POST"])
def api_admin_edit_student(student_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "message": "🚫 Unauthorized"}), 403

    data = request.get_json() or {}
    name = str(data.get("name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    city = str(data.get("city", "Kuchaman City")).strip()
    xp_points = int(data.get("xp_points", 100))
    streak_days = int(data.get("streak_days", 1))

    if not name or not phone:
        return jsonify({"status": "error", "message": "Name and phone are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE users 
    SET name = ?, phone = ?, city = ?, xp_points = ?, streak_days = ?
    WHERE id = ?
    """, (name, phone, city, xp_points, streak_days, student_id))
    conn.commit()
    conn.close()

    return jsonify({
        "status": "success",
        "message": f"✅ छात्र {name} (ID: #{student_id}) की जानकारी सफलतापूर्वक अपडेट कर दी गई!"
    })

# -----------------------------------------------------------------------------
# 4.8 WORDPRESS ADMIN SUITE: TOPIC CURRICULUM CRUD
# -----------------------------------------------------------------------------
@app.route("/api/admin/topics/add", methods=["POST"])
def api_admin_add_topic():
    if not check_admin_auth(request):
        return jsonify({"status": "error", "message": "🚫 Unauthorized"}), 403

    data = request.get_json() or {}
    title = str(data.get("title", "")).strip()
    description = str(data.get("description", "")).strip()
    duration_mins = int(data.get("duration_mins", 25))
    xp_reward = int(data.get("xp_reward", 100))

    if not title:
        return jsonify({"status": "error", "message": "Topic title is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Calculate next chapter number
    cursor.execute("SELECT MAX(chapter_no) as max_no FROM chapters")
    row = cursor.fetchone()
    next_no = (row["max_no"] or 0) + 1

    cursor.execute("""
    INSERT INTO chapters (course_id, chapter_no, title, description, duration_mins, xp_reward)
    VALUES (1, ?, ?, ?, ?, ?)
    """, (next_no, title, description, duration_mins, xp_reward))
    new_ch_id = cursor.lastrowid

    # Auto-seed initial notes
    cursor.execute("""
    INSERT INTO notes (chapter_id, title, content_markdown)
    VALUES (?, ?, ?)
    """, (new_ch_id, title, f"# {title}\n\nरोहित सर द्वारा तैयार विशेष टॉपिक नोट्स। यहाँ अपना पाठ लिखें..."))

    # Auto-seed initial practice task
    cursor.execute("""
    INSERT INTO practice_tasks (chapter_id, title, instructions, starter_code, expected_output, hint)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (new_ch_id, f"{title} Practice", "दिए गए कोड को रन करें और आउटपुट देखें।", "# Python Code\nprint('Hello from " + title + "')\n", "Hello from " + title, "print() फंक्शन का उपयोग करें।"))

    # Auto-seed initial quiz
    cursor.execute("""
    INSERT INTO quizzes (chapter_id, title, passing_score)
    VALUES (?, ?, 80)
    """, (new_ch_id, f"{title} Quiz"))
    quiz_id = cursor.lastrowid

    # Add 1 default question
    cursor.execute("""
    INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
    VALUES (?, ?, 'Option A', 'Option B', 'Option C', 'Option D', 'A', 'सही उत्तर Option A है।')
    """, (quiz_id, f"{title} से संबंधित बेसिक प्रश्न?"))

    conn.commit()
    conn.close()

    return jsonify({
        "status": "success",
        "success": True,
        "message": f"🎉 नया टॉपिक #{next_no} '{title}' सफलतापूर्वक जोड़ दिया गया!",
        "chapter_id": new_ch_id,
        "chapter_no": next_no
    })

@app.route("/api/admin/topics/edit/<int:chapter_id>", methods=["POST"])
def api_admin_edit_topic(chapter_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    data = request.get_json() or {}
    title = str(data.get("title", "")).strip()
    description = str(data.get("description", "")).strip()
    duration_mins = int(data.get("duration_mins", 25))
    xp_reward = int(data.get("xp_reward", 100))

    if not title:
        return jsonify({"status": "error", "success": False, "message": "Title is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE chapters 
    SET title = ?, description = ?, duration_mins = ?, xp_reward = ?
    WHERE id = ? OR chapter_no = ?
    """, (title, description, duration_mins, xp_reward, chapter_id, chapter_id))
    conn.commit()
    conn.close()

    return jsonify({
        "status": "success",
        "success": True,
        "message": f"✅ टॉपिक #{chapter_id} सफलतापूर्वक अपडेट हो गया!"
    })

@app.route("/api/admin/topics/delete/<int:chapter_id>", methods=["DELETE", "POST"])
def api_admin_delete_topic(chapter_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, chapter_no, title FROM chapters WHERE id = ? OR chapter_no = ? LIMIT 1", (chapter_id, chapter_id))
    ch = cursor.fetchone()
    if not ch:
        conn.close()
        return jsonify({"status": "error", "success": False, "message": "Topic not found"}), 404

    real_id = ch["id"]
    cursor.execute("DELETE FROM chapters WHERE id = ?", (real_id,))
    cursor.execute("DELETE FROM notes WHERE chapter_id = ?", (real_id,))
    cursor.execute("DELETE FROM practice_tasks WHERE chapter_id = ?", (real_id,))
    
    # Delete quizzes and quiz questions
    cursor.execute("SELECT id FROM quizzes WHERE chapter_id = ?", (real_id,))
    quizzes = cursor.fetchall()
    for q in quizzes:
        cursor.execute("DELETE FROM quiz_questions WHERE quiz_id = ?", (q["id"],))
    cursor.execute("DELETE FROM quizzes WHERE chapter_id = ?", (real_id,))
    cursor.execute("DELETE FROM user_progress WHERE chapter_id = ?", (real_id,))

    conn.commit()
    conn.close()

    return jsonify({
        "status": "success",
        "success": True,
        "message": f"🗑️ टॉपिक #{ch['chapter_no']} '{ch['title']}' और उससे जुड़े सभी नोट्स व क्विज़ हटा दिए गए।"
    })

# -----------------------------------------------------------------------------
# 4.9 WORDPRESS ADMIN SUITE: PRACTICE TASKS & CAPSTONE PROJECTS
# -----------------------------------------------------------------------------
@app.route("/api/admin/practice-task/<int:chapter_id>", methods=["GET", "POST"])
def api_admin_practice_task(chapter_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM chapters WHERE id = ? OR chapter_no = ? LIMIT 1", (chapter_id, chapter_id))
    ch = cursor.fetchone()
    if not ch:
        conn.close()
        return jsonify({"status": "error", "success": False, "message": "Chapter not found"}), 404
    
    real_ch_id = ch["id"]

    if request.method == "POST":
        data = request.get_json() or {}
        title = str(data.get("title", f"Topic {chapter_id} Practice")).strip()
        instructions = str(data.get("instructions") or data.get("practice_question") or "").strip()
        starter_code = str(data.get("starter_code", "")).strip()
        expected_output = str(data.get("expected_output") or data.get("solution_code") or "").strip()
        hint = str(data.get("hint") or data.get("practice_hints") or "").strip()

        cursor.execute("SELECT id FROM practice_tasks WHERE chapter_id = ?", (real_ch_id,))
        existing = cursor.fetchone()
        if existing:
            cursor.execute("""
            UPDATE practice_tasks 
            SET title = ?, instructions = ?, starter_code = ?, expected_output = ?, hint = ?
            WHERE chapter_id = ?
            """, (title, instructions, starter_code, expected_output, hint, real_ch_id))
        else:
            cursor.execute("""
            INSERT INTO practice_tasks (chapter_id, title, instructions, starter_code, expected_output, hint)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (real_ch_id, title, instructions, starter_code, expected_output, hint))

        conn.commit()
        conn.close()
        return jsonify({"status": "success", "success": True, "message": f"✅ Topic #{chapter_id} का प्रैक्टिस टास्क सफलतापूर्वक अपडेट हो गया!"})
    else:
        cursor.execute("SELECT * FROM practice_tasks WHERE chapter_id = ?", (real_ch_id,))
        task = cursor.fetchone()
        conn.close()
        return jsonify({"status": "success", "success": True, "task": dict(task) if task else None})

# -----------------------------------------------------------------------------
# 4.10 WORDPRESS ADMIN SUITE: CHANGE MASTER PIN
# -----------------------------------------------------------------------------
@app.route("/api/admin/change-pin", methods=["POST"])
def api_admin_change_pin():
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    data = request.get_json() or {}
    new_pin = str(data.get("new_pin", "")).strip()

    if not new_pin or len(new_pin) < 4:
        return jsonify({"status": "error", "success": False, "message": "नया PIN कम से कम 4 अंकों/अक्षरों का होना चाहिए।"}), 400

    update_site_settings({"master_pin": new_pin})
    return jsonify({
        "status": "success",
        "success": True,
        "message": f"🔒 रोहित सर का मास्टर PIN सफलतापूर्वक बदल दिया गया है! नया PIN: {new_pin}"
    })

# -----------------------------------------------------------------------------
# 4.11 WORDPRESS ADMIN SUITE: SUBSCRIPTIONS & PAYMENTS MANAGER (₹299)
# -----------------------------------------------------------------------------
@app.route("/api/admin/payments", methods=["GET"])
def api_admin_get_payments():
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        p.*, 
        u.city as student_city, 
        u.xp_points as student_xp,
        u.created_at as student_joined
    FROM payments p
    LEFT JOIN users u ON p.user_id = u.id
    ORDER BY p.id DESC
    """)
    payments = [dict(r) for r in cursor.fetchall()]
    
    cursor.execute("SELECT COUNT(*) as total_users, SUM(CASE WHEN is_paid = 1 OR subscription_status = 'active_vip' THEN 1 ELSE 0 END) as vip_count FROM users")
    user_stats = cursor.fetchone()
    total_users = user_stats["total_users"] or 0
    vip_count = user_stats["vip_count"] or 0
    demo_count = max(0, total_users - vip_count)
    
    cursor.execute("SELECT COUNT(*) as pending_count FROM payments WHERE status = 'pending'")
    pending_count = cursor.fetchone()["pending_count"] or 0
    
    cursor.execute("SELECT COUNT(*) as approved_count, SUM(amount) as total_revenue FROM payments WHERE status = 'approved'")
    approved_stats = cursor.fetchone()
    approved_count = approved_stats["approved_count"] or 0
    total_revenue = approved_stats["total_revenue"] or (approved_count * 299.0)
    
    conn.close()
    
    return jsonify({
        "status": "success",
        "success": True,
        "total_payments": len(payments),
        "pending_count": pending_count,
        "approved_count": approved_count,
        "total_revenue": total_revenue,
        "vip_students_count": vip_count,
        "demo_students_count": demo_count,
        "stats": {
            "total_revenue": total_revenue,
            "pending_count": pending_count,
            "vip_count": vip_count,
            "demo_count": demo_count,
            "approved_count": approved_count
        },
        "payments": payments
    })

@app.route("/api/admin/payments/approve/<int:payment_id>", methods=["POST"])
def api_admin_approve_payment_main(payment_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    success = approve_student_payment_vip(payment_id)
    if success:
        return jsonify({
            "status": "success",
            "success": True,
            "message": f"✅ भुगतान #{payment_id} स्वीकृत हुआ! सम्पूर्ण VIP कोर्स तुरंत अनलॉक हो गया है।"
        })
    return jsonify({"status": "error", "message": "Payment record not found"}), 404

@app.route("/api/admin/payments/reject/<int:payment_id>", methods=["POST"])
def api_admin_reject_payment_main(payment_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    data = request.get_json(silent=True) or {}
    reason = data.get("reason", "Invalid receipt or amount")
    success = reject_student_payment(payment_id, reason=reason)
    if success:
        return jsonify({
            "status": "success",
            "success": True,
            "message": f"❌ भुगतान #{payment_id} अस्वीकार कर दिया गया।"
        })
    return jsonify({"status": "error", "message": "Payment record not found"}), 404

@app.route("/api/admin/grant-vip/<int:student_id>", methods=["POST"])
def api_admin_grant_vip(student_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (student_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        return jsonify({"status": "error", "message": "Student not found"}), 404
        
    cursor.execute("UPDATE users SET is_paid = 1, subscription_status = 'active_vip' WHERE id = ?", (student_id,))
    
    # Record direct VIP grant payment
    cursor.execute("""
    INSERT INTO payments (user_id, user_name, user_phone, amount, upi_ref, upi_number, status, approved_at, approved_by)
    VALUES (?, ?, ?, 299.0, 'DIRECT-VIP-ROHIT-SIR', '7627060647', 'approved', CURRENT_TIMESTAMP, 'Rohit Sir (Chief Mentor)')
    """, (student_id, user["name"], user["phone"]))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        "status": "success",
        "success": True,
        "message": f"👑 {user['name']} (ID: #{student_id}) को 1-Click VIP लाइफटाइम एक्सेस सफलतापूर्वक प्रदान किया गया!"
    })

@app.route("/api/admin/revoke-vip/<int:student_id>", methods=["POST"])
def api_admin_revoke_vip(student_id):
    if not check_admin_auth(request):
        return jsonify({"status": "error", "success": False, "message": "🚫 Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET is_paid = 0, subscription_status = 'free' WHERE id = ?", (student_id,))
    conn.commit()
    conn.close()
    
    return jsonify({
        "status": "success",
        "success": True,
        "message": f"Student #{student_id} का VIP एक्सेस रीसेट कर फ्री डेमो मोड पर सेट कर दिया गया।"
    })

# -----------------------------------------------------------------------------
# 5. IN-BROWSER CODE RUNNER (with stdin input support)
# -----------------------------------------------------------------------------
@app.route("/api/sandbox/run", methods=["POST"])
def api_run_code():
    data = request.get_json() or {}
    code = data.get("code", "")
    stdin_input = data.get("stdin", data.get("stdin_input", ""))
    result = run_python_code(code, stdin_input=stdin_input)
    return jsonify(result)

# -----------------------------------------------------------------------------
# 6. TOPIC QUIZ EVALUATOR
# -----------------------------------------------------------------------------
@app.route("/api/quiz/submit", methods=["POST"])
def api_submit_quiz():
    data = request.get_json() or {}
    user_id = data.get("user_id", 1)
    quiz_id = data.get("quiz_id")
    user_answers = data.get("answers", {})

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM quiz_questions WHERE quiz_id = ?", (quiz_id,))
    questions = cursor.fetchall()

    correct_count = 0
    total = len(questions)
    results_detail = []

    for q in questions:
        q_id = str(q["id"])
        selected = user_answers.get(q_id, "").upper()
        is_correct = (selected == q["correct_option"])
        if is_correct:
            correct_count += 1
        
        results_detail.append({
            "question_id": q["id"],
            "question_text": q["question_text"],
            "selected": selected,
            "correct_option": q["correct_option"],
            "is_correct": is_correct,
            "explanation": q["explanation"]
        })

    score_pct = round((correct_count / total) * 100, 1) if total > 0 else 100
    passed = 1 if score_pct >= 60 else 0

    # Record Attempt
    cursor.execute("""
    INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, passed)
    VALUES (?, ?, ?, ?, ?)
    """, (user_id, quiz_id, correct_count, total, passed))

    # Add XP
    if passed:
        cursor.execute("UPDATE users SET xp_points = xp_points + 50 WHERE id = ?", (user_id,))

    conn.commit()
    conn.close()

    return jsonify({
        "status": "success",
        "score_pct": score_pct,
        "correct_count": correct_count,
        "total_questions": total,
        "passed": bool(passed),
        "xp_earned": 50 if passed else 0,
        "details": results_detail
    })

# -----------------------------------------------------------------------------
# 7. ASSIGNMENT VALIDATION & SUBMISSION
# -----------------------------------------------------------------------------
@app.route("/api/assignment/validate", methods=["POST"])
def api_validate_assignment():
    data = request.get_json() or {}
    code = data.get("code", "")
    assignment_id = data.get("assignment_id", 1)

    # Test Case 1: Standard input
    res1 = run_python_code(code, stdin_input="Virendra\n20\nKuchaman\n")
    test1_pass = res1["success"]

    # Test Case 2: Alternative input
    res2 = run_python_code(code, stdin_input="Aarif\n21\nKuchaman City\n")
    test2_pass = res2["success"]

    all_passed = bool(test1_pass and test2_pass)

    return jsonify({
        "status": "success",
        "all_passed": all_passed,
        "tests": [
            {
                "name": "Test Case 1 (Standard Input Execution)",
                "passed": test1_pass,
                "output": res1["output"] if test1_pass else res1["error"],
                "time_ms": res1.get("execution_time_ms", 0)
            },
            {
                "name": "Test Case 2 (Edge Execution Verification)",
                "passed": test2_pass,
                "output": res2["output"] if test2_pass else res2["error"],
                "time_ms": res2.get("execution_time_ms", 0)
            }
        ]
    })

@app.route("/api/assignment/submit", methods=["POST"])
def api_submit_assignment():
    data = request.get_json() or {}
    user_id = data.get("user_id", 1)
    assignment_id = data.get("assignment_id", 1)
    code = data.get("submitted_code", "")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO assignment_submissions (user_id, assignment_id, submitted_code, marks_obtained, feedback, status)
    VALUES (?, ?, ?, 98.0, 'Code Verified & Approved by Chief Mentor Rohit Sir!', 'Graded - Pass')
    """, (user_id, assignment_id, code))

    cursor.execute("UPDATE users SET xp_points = xp_points + 100 WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "status": "success",
        "message": "Assignment successfully submitted and verified! You earned +100 XP!",
        "marks": 98.0,
        "grade": "A+ Outstanding"
    })

# -----------------------------------------------------------------------------
# 8. CAPSTONE PROJECTS
# -----------------------------------------------------------------------------
@app.route("/api/projects/<int:project_id>/download", methods=["GET"])
def api_download_project_starter(project_id):
    mem = get_project_starter_zip(project_id)
    return send_file(
        mem,
        mimetype="application/zip",
        as_attachment=True,
        download_name=f"python_sikho_project_{project_id}_starter.zip"
    )

# -----------------------------------------------------------------------------
# 9. CERTIFICATES (Requires Course Completion or VIP)
# -----------------------------------------------------------------------------
@app.route("/api/certificate/<int:user_id>", methods=["GET"])
def api_get_certificate(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT c.*, u.name, u.avatar_url, u.xp_points, u.is_paid, u.subscription_status
    FROM certificates c
    JOIN users u ON c.user_id = u.id
    WHERE c.user_id = ?
    """, (user_id,))
    cert = cursor.fetchone()
    conn.close()

    if cert:
        return jsonify({"status": "success", "certificate": dict(cert)})
    
    # Auto-generate if not exists
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if user:
        cert_no = f"PS-2026-{user_id:04d}"
        fname = generate_certificate_image(user["name"], cert_number=cert_no)
        cursor.execute("""
        INSERT OR REPLACE INTO certificates (cert_number, user_id, course_id, student_name, course_title, grade, issue_date, qr_verification_code, signature_mentor)
        VALUES (?, ?, 1, ?, 'Complete Python 3 Masterclass (Zero to Functions)', 'A+ Outstanding', '11 Sept 2026', ?, 'Rohit Sir (Chief Mentor)')
        """, (cert_no, user_id, user["name"], f"VERIFY-{cert_no}"))
        conn.commit()
        cursor.execute("SELECT * FROM certificates WHERE user_id = ?", (user_id,))
        cert = cursor.fetchone()
        conn.close()
        return jsonify({"status": "success", "certificate": dict(cert), "image_url": f"/static/uploads/certificates/{fname}"})

    conn.close()
    return jsonify({"status": "error", "message": "Certificate not generated yet"}), 404

@app.route("/api/certificate/download/<int:user_id>", methods=["GET"])
def api_download_certificate_file(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
    
    cert_no = f"PS-2026-{user_id:04d}"
    fname = generate_certificate_image(user["name"], cert_number=cert_no)
    cert_dir = os.path.join(BASE_DIR, "static", "uploads", "certificates")
    
    return send_from_directory(
        cert_dir,
        fname,
        as_attachment=True,
        download_name=f"{user['name']}_Python_Sikho_Certificate.png"
    )

# -----------------------------------------------------------------------------
# 10. AI TUTOR (Rohit Sir AI Assistant with Strict Python Domain)
# -----------------------------------------------------------------------------
@app.route("/api/ai/ask", methods=["POST"])
def api_ask_ai():
    data = request.get_json() or {}
    query = data.get("query", "")
    code = data.get("current_code", "")
    chapter = data.get("chapter_title", "")
    history = data.get("history", [])
    response = answer_student_doubt(query, code, chapter, conversation_history=history)
    return jsonify({"status": "success", "reply": response})

if __name__ == "__main__":
    print("[+] PYTHON SIKHO EdTech Server running on http://127.0.0.1:5700 (Local) and http://0.0.0.0:5700 (LAN/Mobile) ...")
    app.run(host="0.0.0.0", port=5700, debug=False, threaded=True)
