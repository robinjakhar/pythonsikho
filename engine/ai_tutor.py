import os
import sys
import json
import urllib.request
import ssl
import re

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
CANDIDATE_MODELS = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-flash-latest"]

NON_PYTHON_REFUSAL_MSG = (
    "⚠️ **पाइथन सीखो गाइडलाइन्स**:\n\n"
    "नमस्ते! मैं रोहित सर का समर्पित **Python AI Tutor** हूँ। मैं केवल और केवल **Python प्रोग्रामिंग, कोडिंग सिंटैक्स, लॉजिक, डेटा टाइप्स, ऑपरेटर्स, लूप्स, फंक्शंस, एरर डिबगिंग** और आपके क्लासरूम असाइनमेंट्स से जुड़े सवालों के ही उत्तर देता हूँ।\n\n"
    "👉 कृपया Python से संबंधित कोई भी कोडिंग प्रश्न पूछें! 🐍"
)

# Common non-coding / off-topic keywords
OFF_TOPIC_KEYWORDS = [
    "cricket", "match", "ipl", "bollywood", "movie", "film", "actor", "actress", 
    "song", "gana", "politics", "modi", "rahul gandhi", "election", "weather", 
    "mausam", "recipe", "khana", "biryani", "roti", "chai", "joke", "chutkula",
    "love", "girlfriend", "boyfriend", "pyaar", "shadi", "dance", "game"
]

PYTHON_KEYWORDS = [
    "python", "code", "coding", "program", "programming", "variable", "variable", "print",
    "def", "function", "fn", "loop", "for", "while", "if", "elif", "else", "operator",
    "list", "tuple", "dict", "dictionary", "set", "string", "str", "int", "float",
    "bool", "class", "object", "oops", "error", "exception", "try", "except", "syntax",
    "import", "module", "package", "range", "break", "continue", "pass", "lambda",
    "args", "kwargs", "return", "type", "casting", "input", "output", "format",
    "index", "slice", "recursion", "scope", "global", "local", "kya hota hai",
    "kaise kare", "samjhao", "btao", "batao", "sikhao", "run", "terminal"
]

def is_obviously_off_topic(query):
    """
    Checks if a query is clearly unrelated to Python or programming.
    """
    q = query.lower().strip()
    
    # If contains obvious non-tech keyword and no python keywords
    has_off_topic = any(k in q for k in OFF_TOPIC_KEYWORDS)
    has_python_context = any(k in q for k in PYTHON_KEYWORDS)
    
    if has_off_topic and not has_python_context:
        return True
    return False

def call_gemini_with_history(messages_history, current_code="", chapter_title=""):
    """
    Calls Gemini API with multi-turn conversation history and strict Python domain policy.
    """
    system_instruction = (
        "You are 'Rohit Sir AI Coding Tutor', the official live Python mentor for 'Python Sikho' by Chief Mentor Rohit Sir (Samyak Computer Classes, Kuchaman City - 📞 9509934266).\n\n"
        "STRICT SCOPE POLICY:\n"
        "1. You must ONLY answer questions directly related to Python programming, coding, Python concepts (variables, data types, operators, conditionals, loops, strings, functions, OOPs, modules, exceptions, assignments, errors, and logic).\n"
        "2. If the user asks about ANYTHING unrelated to Python programming (such as politics, movies, weather, history, recipes, general non-coding chitchat, other unrelated subjects, etc.), you MUST politely and strictly decline with:\n"
        "'⚠️ **पाइथन सीखो गाइडलाइन्स**: मैं रोहित सर का समर्पित Python AI Tutor हूँ। मैं केवल और केवल Python प्रोग्रामिंग, कोडिंग, लॉजिक, डेटा टाइप्स, एरर्स और आपके कोडिंग असाइनमेंट्स से जुड़े सवालों के ही उत्तर देता हूँ। कृपया Python से संबंधित कोई भी सवाल पूछें! 🐍'\n"
        "3. Always respond in direct, encouraging, clear Hindi / Hinglish.\n"
        "4. Provide clean, well-formatted runnable Python code snippets.\n"
        "5. Do NOT include unnecessary conversational fluff; get straight to the code and concept explanation.\n"
        "6. If the student asks about an error in their code or asks follow-up questions ('aur samjhao', 'isme kya hoga'), explain the exact line with the fix."
    )

    contents = []
    
    context_prefix = ""
    if chapter_title:
        context_prefix += f"[Current Chapter: {chapter_title}] "
    if current_code and current_code.strip():
        context_prefix += f"[Student Sandbox Code: {current_code[:300]}] "

    for msg in messages_history:
        role = "user" if msg.get("sender") == "user" else "model"
        text = msg.get("text", "").strip()
        if text:
            contents.append({
                "role": role,
                "parts": [{"text": text}]
            })

    if not contents:
        return None

    # Inject context into last user message
    if context_prefix:
        contents[-1]["parts"][0]["text"] = f"{context_prefix}\n{contents[-1]['parts'][0]['text']}"

    payload = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.5,
            "maxOutputTokens": 1000
        }
    }

    ctx = ssl.create_default_context()
    
    for model_name in CANDIDATE_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, context=ctx, timeout=15) as response:
                data = json.loads(response.read().decode('utf-8'))
                candidates = data.get('candidates', [])
                if candidates:
                    reply_text = candidates[0]['content']['parts'][0]['text']
                    if reply_text and len(reply_text.strip()) > 0:
                        return reply_text
        except Exception as e:
            print(f"[!] Gemini model {model_name} error: {e}")
            continue

    return None

def offline_fallback_smart(user_query):
    """
    Intelligent offline fallback engine covering core Python concepts up to functions.
    """
    q = user_query.lower()

    if is_obviously_off_topic(q):
        return NON_PYTHON_REFUSAL_MSG

    # 1. Variables
    if any(k in q for k in ["variable", "variables", "naming", "assign"]):
        return (
            "🏷️ **Python Variables (वेरिएबल्स):**\n\n"
            "Variables डेटा वैल्यूज को मेमोरी में स्टोर करने वाले कंटेनर होते हैं।\n\n"
            "**नियम (Naming Rules):**\n"
            "* 1. नाम हमेशा अक्षर (A-Z, a-z) या अंडरस्कोर `_` से शुरू होना चाहिए।\n"
            "* 2. कभी भी नंबर (digit) से शुरू नहीं हो सकता (`1name` ❌ गलत, `name1` ✅ सही)।\n"
            "* 3. स्पेशल कैरेक्टर्स (`@`, `$`, `%`, `-`) और स्पेस मान्य नहीं हैं।\n"
            "* 4. Python के Keywords (जैसे `if`, `for`, `def`) का नाम नहीं रख सकते।\n\n"
            "```python\n"
            "# Multiple Assignment & Swapping\n"
            "a, b = 10, 20\n"
            "a, b = b, a  # Swapping values\n"
            "print('a:', a, 'b:', b) # a: 20, b: 10\n"
            "```"
        )

    # 2. Data Types
    if any(k in q for k in ["data type", "datatype", "data types", "datatypes", "type", "types"]):
        return (
            "📦 **Python के 4 मुख्य (Fundamental) Data Types:**\n\n"
            "1. **`int` (Integer):** बिना दशमलव वाली पूर्ण संख्याएँ (जैसे `10`, `-25`, `100`)\n"
            "2. **`float` (Floating Point):** दशमलव वाली संख्याएँ (जैसे `3.14`, `98.5`)\n"
            "3. **`str` (String):** टेक्स्ट या कैरेक्टर्स, सिंगल `'` या डबल `\"` कोट्स में।\n"
            "4. **`bool` (Boolean):** केवल दो मान: `True` या `False`\n\n"
            "```python\n"
            "name = 'Virendra'\n"
            "age = 20\n"
            "marks = 88.5\n"
            "is_passed = True\n\n"
            "print(type(name))   # <class 'str'>\n"
            "print(type(marks))  # <class 'float'>\n"
            "```"
        )

    # 3. Operators
    if any(k in q for k in ["operator", "operators", "arithmetic", "modulus", "floor", "power"]):
        return (
            "🔢 **Python Operators:**\n\n"
            "* **`+` (Add):** `10 + 5 = 15`\n"
            "* **`-` (Subtract):** `10 - 5 = 5`\n"
            "* **`*` (Multiply):** `10 * 5 = 50`\n"
            "* **`/` (Division):** `10 / 4 = 2.5` (हमेशा float देता है)\n"
            "* **`//` (Floor Division):** `10 // 4 = 2` (दशमलव भाग हटा देता है)\n"
            "* **`%` (Modulus):** `10 % 3 = 1` (शेषफल)\n"
            "* **`**` (Power):** `2 ** 3 = 8` (2 की घात 3)\n\n"
            "```python\n"
            "a, b = 15, 4\n"
            "print('Floor Division:', a // b)  # 3\n"
            "print('Remainder:', a % b)        # 3\n"
            "print('Power:', a ** 2)           # 225\n"
            "```"
        )

    # 4. If-Else Conditionals
    if any(k in q for k in ["if", "elif", "else", "condition", "conditional"]):
        return (
            "🔀 **Python If-Elif-Else Conditions:**\n\n"
            "```python\n"
            "marks = 85\n\n"
            "if marks >= 90:\n"
            "    print('Grade: A+')\n"
            "elif marks >= 75:\n"
            "    print('Grade: A')\n"
            "elif marks >= 50:\n"
            "    print('Grade: B')\n"
            "else:\n"
            "    print('Grade: C (Needs Improvement)')\n"
            "```"
        )

    # 5. Loops
    if any(k in q for k in ["loop", "for", "while", "range", "break", "continue", "pass"]):
        return (
            "🔁 **Python Loops & Iterations:**\n\n"
            "* **For Loop with `range(start, stop, step)`:**\n"
            "```python\n"
            "for i in range(1, 6):\n"
            "    print('Count:', i)\n"
            "```\n\n"
            "* **While Loop:**\n"
            "```python\n"
            "n = 3\n"
            "while n > 0:\n"
            "    print(n)\n"
            "    n -= 1\n"
            "```\n\n"
            "* **`break`:** लूप को तुरंत समाप्त करता है।\n"
            "* **`continue`:** वर्तमान राउंड को छोड़कर अगले राउंड पर जाता है।"
        )

    # 6. Functions
    if any(k in q for k in ["function", "functions", "def", "lambda", "return", "parameter", "argument", "scope"]):
        return (
            "🧱 **Python Functions (`def`):**\n\n"
            "Functions कोड को दोबारा इस्तेमाल (Reusability) करने के लिए बनाए जाते हैं।\n\n"
            "```python\n"
            "# 1. Function Definition with Return\n"
            "def calculate_total(sub1, sub2, sub3):\n"
            "    total = sub1 + sub2 + sub3\n"
            "    percentage = (total / 300) * 100\n"
            "    return total, percentage\n\n"
            "tot, pct = calculate_total(90, 85, 95)\n"
            "print(f'Total: {tot}, Percentage: {pct:.1f}%')\n\n"
            "# 2. Lambda Function (One-liner)\n"
            "square = lambda x: x ** 2\n"
            "print('Square of 7:', square(7))  # 49\n"
            "```"
        )

    return (
        f"💡 **Rohit Sir AI Tutor:**\n\n"
        f"आपके Python सवाल *'{user_query}'* के लिए:\n"
        f"Python में कोड को बेहतर ढंग से समझने के लिए **Step 6 (Practice Sandbox)** में कोड चलाकर देखें।\n"
        f"मुझसे Python के किसी भी विषय (जैसे *Variables, Operators, Loops, Strings, Functions, Errors*) के बारे में पूछें, मैं तुरंत कोड सहित समझाऊँगा! 🐍"
    )

def answer_student_doubt(user_query, current_code="", chapter_title="", conversation_history=None):
    """
    Main entry point with strict Python domain enforcement.
    """
    if not user_query or not user_query.strip():
        return "नमस्ते! 🐍 कृपया अपना पाइथन से जुड़ा सवाल यहाँ लिखें।"

    cleaned_query = user_query.strip()

    # Pre-check obvious non-programming off-topic queries
    if is_obviously_off_topic(cleaned_query):
        return NON_PYTHON_REFUSAL_MSG

    history = []
    if conversation_history and isinstance(conversation_history, list):
        history = conversation_history
    else:
        history = [{"sender": "user", "text": cleaned_query}]

    # 1. Try Live Gemini API with strict system prompt
    gemini_reply = call_gemini_with_history(history, current_code, chapter_title)
    if gemini_reply and len(gemini_reply.strip()) > 0:
        return gemini_reply

    # 2. Smart Offline Fallback
    return offline_fallback_smart(cleaned_query)

if __name__ == "__main__":
    # Test strictness
    print("[1] Off-topic test:")
    print(answer_student_doubt("aaj ka mausam kaisa hai aur cricket match kon jeeta?"))
    print("\n[2] Python topic test:")
    print(answer_student_doubt("Python me operators kitne types ke hote hai code ke sath btao"))
