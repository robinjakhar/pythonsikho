import os
import io
import zipfile

def get_project_starter_zip(project_id):
    """
    Generates a starter project ZIP archive in memory for student download.
    """
    mem_file = io.BytesIO()
    
    with zipfile.ZipFile(mem_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        if project_id == 1:
            # WhatsApp Automated Reporting System
            readme = """# WhatsApp Automated Reporting System
Chief Mentor: Rohit Sir (Samyak Computer Classes, Kuchaman City)

## Description:
An automated Python system to dispatch formatted WhatsApp reports to parents & students.

## How to run:
1. Run `python app.py`
2. Open http://localhost:5000 in your browser.
"""
            app_py = """# WhatsApp Reporting Engine
import urllib.parse

def generate_report(student_name, score, grade, mentor="Rohit Sir"):
    msg = f"नमस्ते! Samyak Computer Classes से {student_name} का स्कोर: {score}% (Grade: {grade}) | Mentor: {mentor}"
    encoded = urllib.parse.quote(msg)
    return f"https://api.whatsapp.com/send?phone=91XXXXXXXXXX&text={encoded}"

if __name__ == "__main__":
    print(generate_report("Virendra", 95, "A+"))
"""
            zf.writestr("README.md", readme)
            zf.writestr("app.py", app_py)
            zf.writestr("requirements.txt", "flask\nrequests\n")

        elif project_id == 2:
            # Student CRM Dashboard
            readme = """# Student CRM & Academy Analytics Dashboard
Chief Mentor: Rohit Sir (Samyak Computer Classes, Kuchaman City)

## Description:
A lightweight SQLite and Python CRM for student attendance and score tracking.
"""
            crm_py = """import sqlite3

conn = sqlite3.connect("academy_crm.db")
cursor = conn.cursor()
cursor.execute("CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY, name TEXT, score REAL)")
conn.commit()
print("[+] Academy CRM Initialized!")
"""
            zf.writestr("README.md", readme)
            zf.writestr("crm.py", crm_py)
            zf.writestr("requirements.txt", "pandas\nmatplotlib\n")

        else:
            # AI Coding Tutor Project
            readme = """# AI Coding Tutor Starter Project
Chief Mentor: Rohit Sir (Samyak Computer Classes, Kuchaman City)

## Description:
AI Coding Assistant connecting Gemini API with Python Tkinter/Flask.
"""
            ai_py = """# AI Tutor Starter
def ask_tutor(query):
    return f"💡 AI Tutor: Here is the explanation for: {query}"

if __name__ == "__main__":
    print(ask_tutor("What is Python?"))
"""
            zf.writestr("README.md", readme)
            zf.writestr("ai_tutor.py", ai_py)

    mem_file.seek(0)
    return mem_file
