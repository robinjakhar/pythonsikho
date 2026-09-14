# -*- coding: utf-8 -*-
import sqlite3
import os
import sys

BASE_DIR = r"C:\Users\rahul\Desktop\PYTHON_SIKHO"
sys.path.insert(0, BASE_DIR)

from database.db_manager import get_db_connection, init_database

def seed_python_sikho_data():
    init_database()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear previous curriculum
    cursor.execute("DELETE FROM courses")
    cursor.execute("DELETE FROM chapters")
    cursor.execute("DELETE FROM videos")
    cursor.execute("DELETE FROM notes")
    cursor.execute("DELETE FROM practice_tasks")
    cursor.execute("DELETE FROM quizzes")
    cursor.execute("DELETE FROM quiz_questions")
    cursor.execute("DELETE FROM assignments")
    cursor.execute("DELETE FROM projects")
    cursor.execute("DELETE FROM certificates")

    # 1. SEED MAIN COURSE
    cursor.execute("""
    INSERT INTO courses (id, title, subtitle, description, badge, thumbnail_url, total_chapters, difficulty)
    VALUES (
        1, 
        'Complete Python 3 Masterclass (Zero to Hero)', 
        'पाइथन सीखें आसान हिंदी में — बेसिक से लेकर डेटा टाइप्स, ऑपरेटर्स, कलेक्शन्स, लूप्स और फंक्शंस तक', 
        'Chief Mentor Rohit Sir (Samyak Classes, Kuchaman City) द्वारा निर्मित संपूर्ण पाठ्यक्रम। इसमें 12 विषय-वार अध्याय, हैंड्स-ऑन प्रैक्टिस, टॉपिक क्विज़, असाइनमेंट्स और आधिकारिक सर्टिफ़िकेट शामिल हैं।',
        '⭐ BESTSELLER BATCH (02:00 PM)',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop',
        12,
        'Beginner to Pro'
    )
    """)

    chapters_data = [
        # TOPIC 1
        (
            1, "Topic 1: Introduction to Python (पाइथन का परिचय & सिंटैक्स)",
            "Python क्या है, विशेषताएं, print() फ़ंक्शन, कोट्स (' और \"), कमेंट्स (#) और पहला प्रोग्राम।",
            "https://www.w3schools.com/html/mov_bbb.mp4",
            """# 🐍 Topic 1: Introduction to Python & Syntax

### 📌 1. Python क्या है? (What is Python?)
Python एक **High-Level, Interpreted, Dynamically Typed** और **General-Purpose** प्रोग्रामिंग भाषा है।
* **निर्माता (Creator):** इसे 1991 में **Guido van Rossum** ने नीदरलैंड में बनाया था।
* **नामकरण (Name Origin):** इसका नाम ब्रिटिश कॉमेडी शो *"Monty Python's Flying Circus"* से प्रेरित होकर रखा गया।
* **फ़ाइल एक्सटेंशन:** Python कोड की फ़ाइल का एक्सटेंशन हमेशा `.py` होता है (जैसे `main.py`)।

---

### 📌 2. Python की मुख्य विशेषताएं (Key Features):
1. **Easy to Learn & Read:** इसका सिंटैक्स सामान्य अंग्रेज़ी जैसा सरल और साफ-सुथरा होता है।
2. **Interpreted Language:** कोड लाइन-दर-लाइन रन होता है, जिससे एरर तुरंत पता चलती है।
3. **Cross-Platform:** यह Windows, Mac, Linux सभी पर बिना बदलाव के चलता है।
4. **Huge Standard Library:** इसमें डेटा साइंस, AI, वेब डेवलपमेंट और ऑटोमेशन के लिए लाखों इन-बिल्ट लाइब्रेरीज हैं।
5. **Free & Open Source:** इसे कोई भी मुफ़्त में इस्तेमाल और सीख सकता है।

---

### 📌 3. पहला प्रोग्राम और print() फ़ंक्शन:
Python में स्क्रीन पर कोई भी आउटपुट दिखाने के लिए `print()` फ़ंक्शन का उपयोग किया जाता है।

```python
# 1. सिंगल कोट्स (' ') और डबल कोट्स (" ")
print('नमस्ते भारत!')
print("Chief Mentor: Rohit Sir (📞 9509934266)")

# 2. ट्रिपल कोट्स मल्टी-लाइन आउटपुट के लिए
print('''=== SAMYAK COMPUTER CLASSES ===
स्थान: कुचामन सिटी (Kuchaman City)
बैच समय: 02:00 PM to 03:00 PM''')
```

---

### 📌 4. print() के स्पेशल पैरामीटर्स (sep & end):
* **`sep` (Separator):** दो या दो से अधिक मानों के बीच डिफ़ॉल्ट स्पेस को बदलने के लिए।
* **`end` (End Character):** डिफ़ॉल्ट रूप से `print()` नई लाइन (`\\n`) बनाता है, जिसे बदला जा सकता है।

```python
# sep का उपयोग
print("Python", "DataScience", "AI", sep=" -> ")
# आउटपुट: Python -> DataScience -> AI

# end का उपयोग (एक ही लाइन में आउटपुट)
print("रोहित सर", end=" - ")
print("पाइथन सीखो")
# आउटपुट: रोहित सर - पाइथन सीखो
```

---

### 📌 5. Comments (टिप्पणियाँ):
* **Single-line Comment:** `#` सिंबल से शुरू होता है। इंटरप्रेटर इसे रन नहीं करता।
* **Multi-line Comment:** ट्रिपल कोट्स का उपयोग किया जाता है।
""",
            "Write a Python program to print an Academy Welcome Badge using print(), sep, and end.",
            '# Practice 1: Welcome Badge\nprint("=" * 40)\nprint("SAMYAK", "COMPUTER", "CLASSES", sep=" - ")\nprint("Mentor", "Rohit Sir (9509934266)", sep=": ")\nprint("Batch", "02:00 PM", sep=": ")\nprint("Status: Ready to Code", end=" 🚀\\n")\nprint("=" * 40)',
            "========================================\nSAMYAK - COMPUTER - CLASSES\nMentor: Rohit Sir (9509934266)\nBatch: 02:00 PM\nStatus: Ready to Code 🚀\n========================================",
            "Use print() with sep=' - ' and end=' 🚀\\n'.",
            [
                ("Python भाषा को 1991 में किसने बनाया था?", "James Gosling", "Guido van Rossum", "Dennis Ritchie", "Bjarne Stroustrup", "B", "Python का निर्माण Guido van Rossum ने 1991 में नीदरलैंड में किया था।"),
                ("Python सोर्स कोड फ़ाइल का सही एक्सटेंशन क्या होता है?", ".python", ".py", ".pyt", ".pt", "B", "Python प्रोग्राम्स की फ़ाइल का एक्सटेंशन हमेशा `.py` होता है।"),
                ("Python में सिंगल लाइन कमेंट लिखने के लिए किस सिंबल का उपयोग किया जाता है?", "//", "/*", "#", "--", "C", "Python में `#` का उपयोग सिंगल लाइन कमेंट लिखने के लिए किया जाता है।"),
                ("`print('A', 'B', sep='@')` का सही आउटपुट क्या होगा?", "A B", "A@B", "AB", "A\\nB", "B", "sep='@' दोनों वैल्यूज़ के बीच @ चिह्न लगाता है।"),
                ("Python भाषा Case-Sensitive है या नहीं?", "हाँ, बहुत सख्त (Strict)", "नहीं, बिल्कुल नहीं", "सिर्फ नंबर्स के लिए", "सिर्फ स्ट्रिंग्स के लिए", "A", "Python Case-Sensitive है, यानी `Print()` और `print()` दो अलग चीज़ें हैं।")
            ],
            "Build an Academy Welcome Receipt that prints Academy Name, Student Name, City, and Helpline.",
            '# Assignment 1: Welcome Receipt\nprint("*" * 45)\nprint("   SAMYAK COMPUTER CLASSES, KUCHAMAN CITY")\nprint("*" * 45)\nprint("Student:", "Virendra", sep="      ")\nprint("Course :", "Python 3 Masterclass", sep="      ")\nprint("Mentor :", "Rohit Sir (9509934266)", sep="      ")\nprint("*" * 45)'
        ),

        # TOPIC 2
        (
            2, "Topic 2: Data Types (डेटा टाइप्स - int, float, str, bool, complex)",
            "डेटा टाइप्स क्या हैं? int, float, str, bool, complex, type() फ़ंक्शन और Type Casting।",
            "https://www.w3schools.com/html/mov_bbb.mp4",
            """# 🔢 Topic 2: Data Types (डेटा टाइप्स)

### 📌 1. Data Type क्या होता है?
Data Type यह बताता है कि किसी वेरिएबल में किस प्रकार का मान (Data) स्टोर है और उस पर कौन-से ऑपरेशन्स किए जा सकते हैं।

---

### 📌 2. Python के 5 मुख्य Primitive Data Types:

#### 1. `int` (Integer - पूर्णांक संख्याएं):
बिना दशमलव (Decimal) वाली धनात्मक (Positive), ऋणात्मक (Negative) या शून्य संख्याएं।
```python
age = 21
students_count = 150
temperature = -5
print(age, type(age))  # <class 'int'>
```

#### 2. `float` (Floating-Point - दशमलव संख्याएं):
वे संख्याएं जिनमें दशमलव (point) आता है।
```python
course_fee = 4500.50
pi_value = 3.14159
exp_num = 2.5e3  # Scientific notation (2.5 * 10^3 = 2500.0)
print(course_fee, type(course_fee))  # <class 'float'>
```

#### 3. `str` (String - टेक्स्ट डेटा):
अक्षरों, शब्दों या वाक्यों का समूह जो कोट्स (`' '` या `" "`) में लिखा जाता है।
```python
academy = "Samyak Classes"
city = 'Kuchaman City'
print(academy, type(academy))  # <class 'str'>
print("Length of city:", len(city))
```

#### 4. `bool` (Boolean - तार्किक मान):
केवल दो मान हो सकते हैं: `True` (सत्य) या `False` (असत्य)। (पहला अक्षर हमेशा Capital होता है)।
```python
is_python_fun = True
is_course_hard = False
print(is_python_fun, type(is_python_fun))  # <class 'bool'>
```

#### 5. `complex` (Complex Numbers - सम्मिश्र संख्याएं):
वे संख्याएं जिनमें Real और Imaginary दोनों भाग होते हैं। Python में imaginary भाग के लिए `j` का उपयोग होता है: `a + bj`।
```python
z = 3 + 4j
print(z, type(z))            # <class 'complex'>
print("Real part:", z.real)  # 3.0
print("Imag part:", z.imag)  # 4.0
```

---

### 📌 3. type() और isinstance() फ़ंक्शन:
* `type(variable)`: किसी भी डेटा का प्रकार बताता है।
* `isinstance(variable, type)`: यह जांचता है कि डेटा उस प्रकार का है या नहीं (True/False देता है)।

```python
x = 9509
print(type(x))                  # <class 'int'>
print(isinstance(x, int))       # True
print(isinstance(x, str))       # False
```

---

### 📌 4. Type Conversion / Type Casting:
एक डेटा टाइप को दूसरे डेटा टाइप में बदलना:
* `int("100")` ➜ `100` (String to Integer)
* `float(25)` ➜ `25.0` (Integer to Float)
* `str(9509)` ➜ `"9509"` (Integer to String)
* `bool(1)` ➜ `True`, `bool(0)` ➜ `False`
* `complex(5)` ➜ `(5+0j)`
""",
            "Demonstrate all 5 data types (int, float, str, bool, complex) and print their values with type().",
            '# Practice 2: Data Types\nage = 22\nfees = 4500.75\nname = "Rohit Sir"\nis_active = True\nnum_complex = 2 + 5j\n\nprint("int     :", age, type(age))\nprint("float   :", fees, type(fees))\nprint("str     :", name, type(name))\nprint("bool    :", is_active, type(is_active))\nprint("complex :", num_complex, type(num_complex))',
            "int     : 22 <class 'int'>\nfloat   : 4500.75 <class 'float'>\nstr     : Rohit Sir <class 'str'>\nbool    : True <class 'bool'>\ncomplex : (2+5j) <class 'complex'>",
            "Define 5 variables with int, float, str, bool, complex types and use type() on each.",
            [
                ("Python में `x = 5 + 7j` का डेटा टाइप क्या होगा?", "int", "float", "complex", "tuple", "C", "Python में `a + bj` फॉर्मेट वाली संख्याओं को `complex` डेटा टाइप कहा जाता है।"),
                ("`type(3.14)` का परिणाम क्या आएगा?", "<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'number'>", "B", "दशमलव वाली संख्याओं का डेटा टाइप `float` होता है।"),
                ("`bool(0)` का मान क्या होगा?", "True", "False", "0", "Error", "B", "Python में 0, खाली स्ट्रिंग \"\", None का बुलियन मान `False` होता है।"),
                ("`int('50') + 10` का परिणाम क्या होगा?", "5010", "60", "Error", "'60'", "B", "int('50') इसे नंबर 50 बना देता है, अतः 50 + 10 = 60 होगा।"),
                ("किसी वेरिएबल का डेटा टाइप जांचने के लिए किस इन-बिल्ट फ़ंक्शन का उपयोग होता है?", "datatype()", "typeof()", "type()", "check()", "C", "Python में `type()` फ़ंक्शन का उपयोग डेटा टाइप पता करने के लिए होता है।")
            ],
            "Write a program that takes integer, float, string inputs and casts them correctly with summary printing.",
            '# Assignment 2: Type Casting Engine\ns_id = int("101")\ns_marks = float("88.5")\ns_name = str("Rohit")\ns_passed = bool(1)\n\nprint(f"ID: {s_id} | Name: {s_name} | Marks: {s_marks} | Passed: {s_passed}")'
        ),

        # TOPIC 3
        (
            3, "Topic 3: Variables & Naming Rules (वेरिएबल्स & नेमिंग नियम)",
            "Variable क्या है, Dynamic Typing, PEP 8 Naming Rules, Keywords, Multiple Assignment, Swapping, input()।",
            "https://www.w3schools.com/html/mov_bbb.mp4",
            """# 🏷️ Topic 3: Variables & Naming Rules

### 📌 1. Variable क्या है? (What is a Variable?)
Variable मेमोरी लोकेशन का एक **नाम (Identifier)** होता है जहाँ हम डेटा को स्टोर करते हैं ताकि प्रोग्राम में बाद में इस्तेमाल कर सकें।

```python
mentor = "Rohit Sir"
batch_time = "02:00 PM"
phone = 9509934266
```

---

### 📌 2. Dynamic Typing (डायनामिक टाइपिंग):
C/C++ या Java की तरह Python में वेरिएबल का डेटा टाइप पहले से घोषित (`int a;`) नहीं करना पड़ता। Python वैल्यू के अनुसार अपने आप टाइप तय कर लेती है।

```python
x = 100       # x अब Integer है
x = "Samyak"  # x अब String बन गया
```

---

### 📌 3. Variable Naming Rules (PEP 8 नियम):
Python में वेरिएबल का नाम रखते समय इन नियमों का पालन करना अनिवार्य है:
1. नाम हमेशा **Letter (a-z, A-Z)** या **Underscore (`_`)** से ही शुरू होना चाहिए।
2. नाम **कभी भी अंक (Digit 0-9) से शुरू नहीं हो सकता** (जैसे `1name` अमान्य है, लेकिन `name1` मान्य है)।
3. नाम में केवल **अक्षर, अंक और अंडरस्कोर** (`_`) ही आ सकते हैं (कोई स्पेस या स्पेशल कैरेक्टर जैसे `@`, `$`, `%` मान्य नहीं है)।
4. **Case-Sensitive:** `age`, `Age` और `AGE` तीन अलग-अलग वेरिएबल्स हैं।
5. **Reserved Keywords:** Python के रिज़र्व्ड कीवर्ड्स (जैसे `if`, `for`, `class`, `def`, `while`, `True`) को वेरिएबल नाम नहीं बनाया जा सकता।

```python
# ✅ मान्य वेरिएबल्स (Valid):
student_name = "Virendra"
_total_marks = 480
user2 = "Aarif"

# ❌ अमान्य वेरिएबल्स (Invalid):
# 2user = "Error"      (नंबर से शुरू नहीं हो सकता)
# student-name = "Err" (हाइफ़न मान्य नहीं)
# class = "Python"     (कीवर्ड इस्तेमाल नहीं कर सकते)
```

---

### 📌 4. Multiple Assignment & Variable Swapping:

```python
# एक ही लाइन में कई वेरिएबल्स को अलग मान देना
name, age, city = "Rohit", 28, "Kuchaman"

# एक ही मान कई वेरिएबल्स को देना
x = y = z = 50

# Python में 2 वेरिएबल्स को बिना तीसरे वेरिएबल के Swap (अदला-बदली) करना
a = 10
b = 20
a, b = b, a   # a = 20, b = 10
print("a:", a, "b:", b)
```

---

### 📌 5. User Input `input()` फ़ंक्शन:
यूज़र से कीबोर्ड द्वारा इनपुट लेने के लिए `input()` का उपयोग किया जाता है। `input()` हमेशा **String** रिटर्न करता है, इसलिए नंबर्स के लिए टाइप कास्टिंग जरूरी है:

```python
name = input("अपना नाम दर्ज करें: ")
age = int(input("अपनी उम्र दर्ज करें: "))
print(f"नमस्ते {name}, अगले वर्ष आपकी उम्र {age + 1} होगी।")
```
""",
            "Write a Python program that declares variables, performs multiple assignment, and swaps two numbers without a temporary variable.",
            '# Practice 3: Variables & Swapping\nx, y = 100, 200\nprint(f"Before Swap: x = {x}, y = {y}")\n\n# Swapping in 1 line\nx, y = y, x\nprint(f"After Swap : x = {x}, y = {y}")',
            "Before Swap: x = 100, y = 200\nAfter Swap : x = 200, y = 100",
            "Use multiple assignment `x, y = 100, 200` and swap using `x, y = y, x`.",
            [
                ("निम्न में से कौन-सा एक मान्य (Valid) वेरिएबल नाम है?", "2nd_student", "student_name", "student-name", "class", "B", "`student_name` मान्य है क्योंकि यह अंडरस्कोर का उपयोग करता है और किसी नंबर या कीवर्ड से शुरू नहीं होता।"),
                ("क्या Python में `my_var` और `My_Var` एक ही वेरिएबल हैं?", "हाँ", "नहीं, दोनों अलग हैं", "केवल नंबर्स में", "सिर्फ स्ट्रिंग्स में", "B", "Python Case-Sensitive भाषा है, अतः दोनों अलग वेरिएबल्स हैं।"),
                ("`input()` फ़ंक्शन डिफ़ॉल्ट रूप से किस डेटा टाइप में इनपुट रिटर्न करता है?", "int", "float", "str (String)", "bool", "C", "`input()` हमेशा String (`str`) प्रारूप में ही डेटा लेता है।"),
                ("Python में `a, b = 10, 20; a, b = b, a` के बाद `a` का मान क्या होगा?", "10", "20", "30", "Error", "B", "यह एक ही लाइन में मानों की अदला-बदली (Swapping) कर देता है, अतः `a` का मान 20 होगा।"),
                ("Python में रिज़र्व्ड कीवर्ड्स की सूची देखने के लिए किस मॉड्यूल का उपयोग होता है?", "sys", "os", "keyword", "math", "C", "`import keyword; keyword.kwlist` से सभी कीवर्ड्स की सूची प्राप्त होती है।")
            ],
            "Write a student bio card taking name, roll number, course, and fee using dynamic variables.",
            '# Assignment 3: Student Bio Card\nroll_no, name, city = 101, "Virendra", "Kuchaman City"\nfee = 4500.00\nprint(f"Roll: {roll_no} | Name: {name} | City: {city} | Fee: Rs.{fee}")'
        ),

        # TOPIC 4
        (
            4, "Topic 4: Python Operators (ऑपरेटर्स - सभी 7 श्रेणियां)",
            "Arithmetic, Assignment, Comparison, Logical, Bitwise, Identity (is/is not), Membership (in/not in) ऑपरेटर्स।",
            "https://www.w3schools.com/html/mov_bbb.mp4",
            """# ⚡ Topic 4: Python Operators (सभी 7 प्रकार)

ऑपरेटर्स वे विशेष सिंबल्स होते हैं जो ऑपरेंड्स (Values/Variables) पर गणितीय या तार्किक गणनाएं करते हैं।

---

### 📌 1. Arithmetic Operators (अंकगणितीय ऑपरेटर्स):
गणितीय गणनाओं के लिए:
* `+` (Addition): जोड़ (`10 + 5 = 15`)
* `-` (Subtraction): घटाव (`10 - 5 = 5`)
* `*` (Multiplication): गुणा (`10 * 5 = 50`)
* `/` (Float Division): दशमलव भाग (`10 / 4 = 2.5`)
* `//` (Floor / Integer Division): केवल पूर्णांक भाग (`10 // 4 = 2`)
* `%` (Modulus / Remainder): शेषफल (`10 % 3 = 1`)
* `**` (Exponentiation / Power): घात (`2 ** 3 = 8`)

```python
a = 15
b = 4
print("Float Div :", a / b)   # 3.75
print("Floor Div :", a // b)  # 3
print("Remainder :", a % b)   # 3
print("Power     :", 2 ** 4)  # 16
```

---

### 📌 2. Assignment Operators (असाइनमेंट ऑपरेटर्स):
मान असाइन और अपडेट करने के लिए:
* `=` : `x = 10`
* `+=` : `x += 5` (अर्थात `x = x + 5`)
* `-=` : `x -= 2` (अर्थात `x = x - 2`)
* `*=` : `x *= 3`
* `/=` : `x /= 2`
* `//=` : `x //= 2`
* `%=` : `x %= 3`
* `**=` : `x **= 2`

---

### 📌 3. Comparison / Relational Operators (तुलनात्मक ऑपरेटर्स):
दो मानों की तुलना करके `True` या `False` देते हैं:
* `==` (Equal): `5 == 5` ➜ `True`
* `!=` (Not Equal): `5 != 3` ➜ `True`
* `>` (Greater than): `10 > 5` ➜ `True`
* `<` (Less than): `4 < 2` ➜ `False`
* `>=` (Greater than or Equal): `5 >= 5` ➜ `True`
* `<=` (Less than or Equal): `3 <= 5` ➜ `True`

---

### 📌 4. Logical Operators (तार्किक ऑपरेटर्स):
कंडीशन्स को जोड़ने के लिए:
* **`and`:** यदि **दोनों** कंडीशन्स True हों तभी True देगा (`True and True` ➜ `True`)।
* **`or`:** यदि **कोई भी एक** कंडीशन True हो तो True देगा (`True or False` ➜ `True`)।
* **`not`:** मान को उल्टा (Invert) कर देता है (`not True` ➜ `False`)।

```python
age = 20
has_id = True
if age >= 18 and has_id:
    print("Eligible for Admission at Samyak Classes!")
```

---

### 📌 5. Bitwise Operators (बिटवाइज़ ऑपरेटर्स):
बाइनरी बिट्स (0 और 1) पर काम करते हैं:
* `&` (Bitwise AND): दोनों बिट 1 हों तो 1
* `|` (Bitwise OR): कोई भी बिट 1 हो तो 1
* `^` (Bitwise XOR): अलग-अलग बिट्स होने पर 1
* `~` (Bitwise NOT): बिट्स को उलट देता है (`~x = -(x + 1)`)
* `<<` (Left Shift): बिट्स को बाएं खिसकाना (`x << n` अर्थात `x * 2^n`)
* `>>` (Right Shift): बिट्स को दाएं खिसकाना (`x >> n` अर्थात `x // 2^n`)

```python
# a = 5 (0101), b = 3 (0011)
print(5 & 3)   # 1  (0001)
print(5 | 3)   # 7  (0111)
print(5 ^ 3)   # 6  (0110)
print(5 << 1)  # 10 (5 * 2)
```

---

### 📌 6. Identity Operators (पहचान ऑपरेटर्स):
जांचते हैं कि क्या दोनों वेरिएबल्स मेमोरी में एक ही ऑब्जेक्ट को दर्शाते हैं (`id()` की जांच):
* **`is`:** True देता है यदि दोनों एक ही मेमोरी लोकेशन पर हों।
* **`is not`:** True देता है यदि दोनों अलग-अलग मेमोरी लोकेशन पर हों।

```python
x = [1, 2, 3]
y = [1, 2, 3]
z = x

print(x == y)   # True  (वैल्यू बराबर है)
print(x is y)   # False (मेमोरी लोकेशन अलग है)
print(x is z)   # True  (एक ही ऑब्जेक्ट है)
```

---

### 📌 7. Membership Operators (सदस्यता ऑपरेटर्स):
जांचते हैं कि कोई मान किसी सीक्वेंस (String, List, Tuple, Set) में मौजूद है या नहीं:
* **`in`:** True देता है यदि मान मौजूद हो।
* **`not in`:** True देता है यदि मान मौजूद न हो।

```python
course = "Python Sikho with Rohit Sir"
print("Rohit" in course)      # True
print("Java" not in course)   # True
```
""",
            "Write a Python script demonstrating Floor Division (//), Modulus (%), Power (**), Identity (is), and Membership (in).",
            '# Practice 4: Operators Demo\na = 17\nb = 4\nprint("Floor Division :", a // b)\nprint("Modulus (Rem) :", a % b)\nprint("Exponent (Power):", 2 ** 5)\n\ntechs = ["Python", "AI", "Flask"]\nprint("Membership in :", "Python" in techs)\n\nx = [10]\ny = [10]\nprint("Equality ==   :", x == y)\nprint("Identity is   :", x is y)',
            "Floor Division : 4\nModulus (Rem) : 1\nExponent (Power): 32\nMembership in : True\nEquality ==   : True\nIdentity is   : False",
            "Use //, %, **, in, and is operators with print.",
            [
                ("`19 // 4` का आउटपुट क्या होगा?", "4.75", "4", "3", "5", "B", "`//` Floor Division करता है और केवल पूर्णांक भाग (4) लौटाता है।"),
                ("`2 ** 4` का मान क्या होगा?", "8", "16", "6", "64", "B", "`**` Exponentiation (घात) ऑपरेटर है: 2^4 = 16।"),
                ("`'Rohit' in 'Rohit Sir Kuchaman'` का आउटपुट क्या होगा?", "True", "False", "Error", "None", "A", "`in` Membership ऑपरेटर जांचता है कि सबस्ट्रिंग मौजूद है या नहीं।"),
                ("`x = [1, 2]; y = [1, 2]; print(x is y)` का परिणाम क्या होगा?", "True", "False", "Error", "None", "B", "`is` ऑपरेटर मेमोरी लोकेशन (`id`) की जांच करता है। दो अलग लिस्ट्स के मेमोरी एड्रेस अलग होते हैं।"),
                ("`5 & 3` (Bitwise AND) का मान क्या होगा? (5 = 101, 3 = 011)", "1", "7", "6", "0", "A", "101 & 011 = 001 (बाइनरी 1)।")
            ],
            "Write a simple calculator performing arithmetic and comparison checks.",
            '# Assignment 4: Mini Calculator\nn1, n2 = 25, 7\nprint(f"Add: {n1+n2} | Div: {n1/n2:.2f} | Floor: {n1//n2} | Rem: {n1%n2} | Power: {n1**2}")'
        ),

        # TOPIC 5
        (
            5, "Topic 5: Conditional Statements (कंडीशनल स्टेटमेंट्स - if, else, elif, nested if)",
            "निर्णय लेना, Indentation (4 spaces), if, if-else, if-elif-else ladder, Nested if और Ternary Operator।",
            "https://www.w3schools.com/html/mov_bbb.mp4",
            """# 🔀 Topic 5: Conditional Statements (निर्णय लेना)

कंडीशनल स्टेटमेंट्स का उपयोग किसी शर्त (Condition) के सत्य (`True`) या असत्य (`False`) होने पर अलग-अलग कोड ब्लॉक रन करने के लिए किया जाता है।

---

### 📌 1. Python Indentation (इंडेंटेशन का नियम):
अन्य भाषाओं में कोड ब्लॉक के लिए `{ }` कर्ली ब्रेसेस का उपयोग होता है, लेकिन Python में **4 Spaces (या 1 Tab)** का इंडेंटेशन अनिवार्य होता है। गलत इंडेंटेशन पर `IndentationError` आता है।

---

### 📌 2. if Statement:
जब सिर्फ एक शर्त सही होने पर कोड चलाना हो:
```python
score = 85
if score >= 60:
    print("बधाई हो! आप उत्तीर्ण हुए हैं।")
```

---

### 📌 3. if - else Statement:
जब शर्त सही होने पर एक काम और गलत होने पर दूसरा काम करना हो:
```python
num = 17
if num % 2 == 0:
    print(f"{num} एक सम (Even) संख्या है।")
else:
    print(f"{num} एक विषम (Odd) संख्या है।")
```

---

### 📌 4. if - elif - else Ladder (बहु-विकल्पीय शर्तें):
जब दो से अधिक शर्तों की जांच करनी हो:
```python
marks = 78

if marks >= 90:
    grade = "A+ (Outstanding)"
elif marks >= 75:
    grade = "A (Distinction)"
elif marks >= 60:
    grade = "B (First Class)"
elif marks >= 40:
    grade = "C (Pass)"
else:
    grade = "Fail (Re-appear)"

print(f"Marks: {marks} ➜ Grade: {grade}")
```

---

### 📌 5. Nested if (एक if के अंदर दूसरा if):
जब एक शर्त पूरी होने के बाद ही दूसरी अंदरूनी शर्त की जांच करनी हो:
```python
age = 20
has_voter_id = True

if age >= 18:
    if has_voter_id:
        print("✅ आप मतदान करने के पात्र हैं।")
    else:
        print("⚠️ कृपया पहले अपना वोटर आईडी कार्ड बनवाएं।")
else:
    print("❌ आप अभी 18 वर्ष से कम हैं।")
```

---

### 📌 6. Shorthand if / Ternary Operator (एक लाइन में कंडीशन):
`[value_if_true] if [condition] else [value_if_false]`

```python
age = 19
status = "Adult" if age >= 18 else "Minor"
print(status)  # Adult
```
""",
            "Write a Python program that checks if a number is Positive, Negative, or Zero using if-elif-else.",
            '# Practice 5: Positive / Negative / Zero Checker\nnum = -15\n\nif num > 0:\n    print(f"{num} is Positive (+)")\nelif num < 0:\n    print(f"{num} is Negative (-)")\nelse:\n    print("The number is Zero (0)")',
            "-15 is Negative (-)",
            "Use if num > 0, elif num < 0, else.",
            [
                ("Python में कोड ब्लॉक को परिभाषित करने के लिए किसका उपयोग होता है?", "{ } कर्ली ब्रेसेस", "Indentation (Spaces)", "; सेमीकोलन", "( ) कोष्ठक", "B", "Python में कोड ब्लॉक को इंडेंटेशन (डिफ़ॉल्ट 4 स्पेस) द्वारा दर्शाया जाता है।"),
                ("यदि `x = 10`, तो `print('Big' if x > 20 else 'Small')` क्या प्रिंट करेगा?", "Big", "Small", "Error", "None", "B", "क्योंकि 10 > 20 असत्य (False) है, इसलिए 'Small' प्रिंट होगा।"),
                ("Python में `else if` के स्थान पर किस कीवर्ड का उपयोग किया जाता है?", "elseif", "else-if", "elif", "case", "C", "Python में `else if` के लिए `elif` कीवर्ड का उपयोग किया जाता है।"),
                ("`if 0:` कंडीशन क्या मानी जाएगी?", "True", "False", "Error", "None", "B", "संख्या 0 को Python में बुलियन रूप से `False` माना जाता है।"),
                ("लीप वर्ष (Leap Year) जांचने की सही कंडीशन क्या है?", "year % 4 == 0", "(year % 400 == 0) or (year % 4 == 0 and year % 100 != 0)", "year % 100 == 0", "year % 2 == 0", "B", "लीप वर्ष 400 से विभाज्य हो या 4 से विभाज्य हो पर 100 से नहीं।")
            ],
            "Write an Admission Fee Discount engine based on student percentage (>=90 -> 50% discount, >=75 -> 25% discount, else No discount).",
            '# Assignment 5: Fee Discount Engine\nmarks = 92\nbase_fee = 5000\nif marks >= 90:\n    final_fee = base_fee * 0.5\nelif marks >= 75:\n    final_fee = base_fee * 0.75\nelse:\n    final_fee = base_fee\nprint(f"Base: Rs.{base_fee} | Marks: {marks}% | Final Fee: Rs.{final_fee}")'
        ),

        # TOPIC 6
        (
            6, "Topic 6: Lists (लिस्ट्स - Python Collections Part 1)",
            "List क्या है, विशेषताएँ, Indexing, Slicing, 10+ List Methods (append, pop, insert, sort), और List Comprehension।",
            "https://www.w3schools.com/html/mov_bbb.mp4",
            """# 📋 Topic 6: Python Lists (लिस्ट्स)

### 📌 1. List क्या है?
List कई सारे आइटम्स को एक ही वेरिएबल में स्टोर करने का सबसे लोकप्रिय कलेक्शन है। इसे स्क्वायर ब्रैकेट्स `[ ]` में लिखा जाता है।

* **Ordered (क्रमबद्ध):** आइटम्स का एक निश्चित इंडेक्स क्रम होता है।
* **Mutable (बदलाव योग्य):** लिस्ट बनने के बाद इसमें नए आइटम्स जोड़, बदल या हटा सकते हैं।
* **Allows Duplicates:** इसमें एक ही मान कई बार आ सकता है।
* **Heterogeneous:** एक ही लिस्ट में अलग-अलग डेटा टाइप्स (int, str, float, bool) रखे जा सकते हैं।

```python
student = ["Virendra", 21, 88.5, True, "Kuchaman City"]
print(student, type(student))  # <class 'list'>
```

---

### 📌 2. Indexing और Slicing:
* **Positive Indexing (0 से शुरू):** बाएं से दाएं (`0, 1, 2, ...`)
* **Negative Indexing (-1 से शुरू):** दाएं से बाएं (`..., -3, -2, -1`)
* **Slicing:** `list[start : stop : step]`

```python
langs = ["Python", "Java", "C++", "JavaScript", "Go", "Rust"]

print(langs[0])       # Python (पहला आइटम)
print(langs[-1])      # Rust (अंतिम आइटम)
print(langs[1:4])     # ['Java', 'C++', 'JavaScript']
print(langs[::-1])    # लिस्ट को उलटना (Reverse)
```

---

### 📌 3. List के प्रमुख 10 Methods:
1. `append(x)`: लिस्ट के अंत में आइटम जोड़ना।
2. `insert(i, x)`: किसी खास इंडेक्स पर आइटम डालना।
3. `extend(iterable)`: दूसरी लिस्ट के सभी आइटम्स जोड़ना।
4. `remove(x)`: किसी खास वैल्यू को हटाना।
5. `pop(i)`: इंडेक्स से आइटम हटाना और रिटर्न करना (डिफ़ॉल्ट अंतिम)।
6. `clear()`: पूरी लिस्ट खाली करना।
7. `index(x)`: किसी आइटम का पहला इंडेक्स खोजना।
8. `count(x)`: कोई आइटम कितनी बार आया है गिनना।
9. `sort()`: लिस्ट को बढ़ते क्रम (Ascending) में लगाना (`reverse=True` से घटते क्रम में)।
10. `reverse()`: लिस्ट को उलटना।

```python
nums = [40, 10, 30, 20, 50]
nums.append(60)       # [40, 10, 30, 20, 50, 60]
nums.insert(1, 15)    # इंडेक्स 1 पर 15
nums.sort()           # [10, 15, 20, 30, 40, 50, 60]
last = nums.pop()     # 60 हटा
print(nums)
```

---

### 📌 4. List In-Built Functions:
* `len(list)`: लिस्ट में कुल तत्वों की संख्या
* `min(list)`: सबसे छोटा मान
* `max(list)`: सबसे बड़ा मान
* `sum(list)`: सभी संख्याओं का कुल जोड़

---

### 📌 5. List Comprehension (शॉर्टकट सिंटैक्स):
1 लाइन में नई लिस्ट बनाना: `[expression for item in iterable if condition]`

```python
# 1 से 10 के वर्गों (Squares) की लिस्ट
squares = [x**2 for x in range(1, 11)]
print(squares)  # [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]

# केवल सम संख्याएं (Even numbers)
evens = [x for x in range(1, 21) if x % 2 == 0]
print(evens)
```
""",
            "Create a list of student marks, find total, average, highest, lowest marks, and sort the list.",
            '# Practice 6: Student Marks Analysis\nmarks = [85, 92, 78, 65, 95, 88]\nmarks.append(90)\nmarks.sort()\n\nprint("Sorted Marks :", marks)\nprint("Total Marks  :", sum(marks))\nprint("Average Marks:", round(sum(marks)/len(marks), 2))\nprint("Highest Mark :", max(marks))\nprint("Lowest Mark  :", min(marks))',
            "Sorted Marks : [65, 78, 85, 88, 90, 92, 95]\nTotal Marks  : 593\nAverage Marks: 84.71\nHighest Mark : 95\nLowest Mark  : 65",
            "Use sum(), len(), max(), min(), and marks.sort().",
            [
                ("Python में लिस्ट Mutable (परिवर्तनीय) है या Immutable?", "Mutable (परिवर्तनीय)", "Immutable (अपरिवर्तनीय)", "दोनों", "कोई नहीं", "A", "List एक Mutable डेटा संरचना है, जिसके तत्वों को बदला, जोड़ा या हटाया जा सकता है।"),
                ("`nums = [10, 20, 30]; nums.append(40)` के बाद `len(nums)` क्या होगा?", "3", "4", "5", "Error", "B", "append(40) से लिस्ट में 40 जुड़ जाएगा, अतः कुल लंबाई 4 होगी।"),
                ("`lst = ['A', 'B', 'C', 'D']; print(lst[-1])` क्या प्रिंट करेगा?", "A", "B", "D", "Error", "C", "नेगेटिव इंडेक्सिंग में `-1` हमेशा अंतिम तत्व को दर्शाता है।"),
                ("`nums = [3, 1, 4, 1, 5]; nums.pop()` क्या हटाएगा?", "3", "1", "5", "4", "C", "बिना इंडेक्स के `pop()` हमेशा लिस्ट के अंतिम तत्व (5) को हटाता है।"),
                ("`[x for x in range(5) if x % 2 != 0]` का आउटपुट क्या होगा?", "[0, 2, 4]", "[1, 3]", "[1, 2, 3, 4]", "[0, 1, 2, 3, 4]", "B", "range(5) में विषम संख्याएं केवल [1, 3] हैं।")
            ],
            "Build an inventory manager with add, remove, search, and count items using Python list methods.",
            '# Assignment 6: Inventory Tracker\ninventory = ["Laptop", "Mouse", "Keyboard", "Monitor"]\ninventory.append("Webcam")\ninventory.remove("Mouse")\nprint("Final Inventory:", sorted(inventory))\nprint("Total items:", len(inventory))'
        ),

        # TOPIC 7
        (
            7, "Topic 7: Tuples (टपल्स - Python Collections Part 2)",
            "Tuple क्या है, Immutability (अपरिवर्तनीयता), Single-Element Tuples, Packing & Unpacking, और Methods।",
            "https://www.w3schools.com/html/mov_bbb.mp4",
            """# 🔒 Topic 7: Python Tuples (टपल्स)

### 📌 1. Tuple क्या है?
Tuple भी List की तरह ही डेटा का कलेक्शन है, लेकिन यह **Immutable (अपरिवर्तनीय)** होता है। इसे सामान्य कोष्ठक `( )` में लिखा जाता है।

* **Ordered (क्रमबद्ध):** प्रत्येक आइटम का निश्चित इंडेक्स होता है।
* **Immutable:** एक बार टपल बनने के बाद इसके तत्वों को बदला, जोड़ा या हटाया नहीं जा सकता।
* **Allows Duplicates:** डुप्लिकेट मान हो सकते हैं।
* **Fast & Memory Efficient:** लिस्ट की तुलना में टपल तेज़ और कम मेमोरी लेता है।

```python
coordinates = (27.05, 75.17)  # Kuchaman City GPS Coordinates
print(coordinates, type(coordinates))  # <class 'tuple'>
```

---

### 📌 2. Single-Element Tuple (महत्वपूर्ण नियम):
यदि टपल में केवल 1 ही आइटम हो, तो उसके बाद **अल्पविराम (comma `,`) लगाना अनिवार्य** है। बिना कॉमा के Python इसे सामान्य डेटा टाइप (जैसे int या str) समझ लेता है।

```python
# ❌ यह Tuple नहीं बल्कि Integer है:
not_a_tuple = (50)
print(type(not_a_tuple))  # <class 'int'>

# ✅ यह सही Single Element Tuple है:
valid_tuple = (50,)
print(type(valid_tuple))  # <class 'tuple'>
```

---

### 📌 3. Tuple Packing और Unpacking:
* **Packing:** कई मानों को एक टपल में पैक करना।
* **Unpacking:** टपल के सभी मानों को अलग-अलग वेरिएबल्स में बांटना।

```python
# Packing
student_info = ("Virendra", 101, "Python", "Kuchaman")

# Unpacking
name, roll, course, city = student_info
print(f"Name: {name}, Roll: {roll}, City: {city}")
```

---

### 📌 4. Tuple के Methods:
क्योंकि टपल Immutable है, इसमें केवल 2 ही मेथड्स होते हैं:
1. `count(x)`: कोई मान कितनी बार आया है गिनना।
2. `index(x)`: किसी मान का पहला इंडेक्स खोजना।

```python
nums = (10, 20, 30, 20, 40, 20)
print("Count of 20:", nums.count(20))  # 3
print("Index of 30:", nums.index(30))  # 2
```

---

### 📌 5. List और Tuple में मुख्य अंतर:
| विशेषता | List `[ ]` | Tuple `( )` |
|---|---|---|
| Mutability | Mutable (परिवर्तनीय) | Immutable (अपरिवर्तनीय) |
| सिंटैक्स | `[1, 2, 3]` | `(1, 2, 3)` |
| स्पीड | धीमी | तेज़ (Fast) |
| डेटा सुरक्षा | कम (बदल सकता है) | अधिक (Write-Protected) |
""",
            "Demonstrate single element tuple creation, packing, unpacking, count(), and index().",
            '# Practice 7: Tuple Master\nsingle_t = ("Python",)\nprint("Single Element Tuple:", single_t, type(single_t))\n\n# Packing & Unpacking\npoint = (100, 200, 300)\nx, y, z = point\nprint(f"Unpacked: x={x}, y={y}, z={z}")\n\n# Methods\ndata = (5, 10, 15, 10, 20, 10)\nprint("Count of 10:", data.count(10))\nprint("Index of 15:", data.index(15))',
            "Single Element Tuple: ('Python',) <class 'tuple'>\nUnpacked: x=100, y=200, z=300\nCount of 10: 3\nIndex of 15: 2",
            "Use single_t = ('Python',), tuple unpacking, count(), and index().",
            [
                ("निम्न में से कौन-सा एक सही सिंगल एलिमेंट टपल है?", "`t = (10)`", "`t = (10,)`", "`t = [10]`", "`t = {10}`", "B", "सिंगल एलिमेंट टपल के लिए कोष्ठक के अंदर कॉमा (,) लगाना अनिवार्य होता है।"),
                ("क्या टपल बनने के बाद `t[0] = 99` करके मान बदला जा सकता है?", "हाँ", "नहीं (TypeError आएगा)", "सिर्फ स्ट्रिंग्स में", "सिर्फ नंबर्स में", "B", "टपल Immutable (अपरिवर्तनीय) होता है, इसलिए इसमें आइटम असाइन नहीं कर सकते।"),
                ("टपल में कुल कितने इन-बिल्ट मेथड्स होते हैं?", "2 (`count` और `index`)", "5", "10", "कोई नहीं", "A", "Immutability के कारण टपल में केवल दो मेथड्स `count()` और `index()` होते हैं।"),
                ("`t = (1, 2, 3, 2, 4); print(t.count(2))` का आउटपुट क्या होगा?", "1", "2", "3", "Error", "B", "संख्या 2 टपल में दो बार आई है, अतः `count(2)` का मान 2 होगा।"),
                ("टपल का उपयोग लिस्ट की तुलना में कब करना चाहिए?", "जब डेटा को बार-बार बदलना हो", "जब डेटा को सुरक्षित (Write-Protected) और तेज़ रखना हो", "जब डेटा बहुत बड़ा हो", "कभी नहीं", "B", "डेटा सुरक्षा और तेज़ परफॉर्मेंस के लिए टपल सबसे उपयुक्त है।")
            ],
            "Create a student record tuple, unpack it into variables, and verify its immutability.",
            '# Assignment 7: Student Record Tuple\nrecord = ("Rohit Sir", "Samyak Classes", "Kuchaman City", 9509934266)\ninstructor, academy, location, phone = record\nprint(f"Academy: {academy} | Location: {location} | Phone: {phone}")'
        ),

        # TOPIC 8
        (
            8, "Topic 8: Sets (सेट्स - Python Collections Part 3)",
            "Set क्या है, Unordered & Unique Items, Set Methods (add, remove, discard), और Mathematical Operations (Union, Intersection)।",
            "https://www.w3schools.com/html/mov_bbb.mp4",
            """# 🎯 Topic 8: Python Sets (सेट्स)

### 📌 1. Set क्या है?
Set यूनिक (अद्वितीय) आइटम्स का एक **Unordered (अक्रमबद्ध)** कलेक्शन होता है। इसे कर्ली ब्रेसेस `{ }` में लिखा जाता है।

* **Unique Items (कोई डुप्लिकेट नहीं):** यदि आप डुप्लिकेट मान डालते भी हैं, तो Set उसे अपने आप हटा देता है।
* **Unordered:** इसमें तत्वों का कोई निश्चित इंडेक्स (0, 1, 2) नहीं होता (`s[0]` काम नहीं करेगा)।
* **Mutable:** नए आइटम्स जोड़ या हटा सकते हैं।

```python
# डुप्लिकेट अपने आप हट जाएंगे
roll_numbers = {101, 102, 103, 101, 104, 102}
print(roll_numbers)  # {101, 102, 103, 104}
```

---

### 📌 2. Empty Set बनाना (सावधानी):
* `{}` लिखने से Python इसे **Dictionary** मानता है।
* खाली Set बनाने के लिए हमेशा `set()` फ़ंक्शन का उपयोग किया जाता है।

```python
d = {}        # <class 'dict'>
s = set()     # <class 'set'>
```

---

### 📌 3. Set के मुख्य Methods:
* `add(x)`: एक नया आइटम जोड़ना।
* `update(iterable)`: एक साथ कई आइटम्स जोड़ना।
* `remove(x)`: आइटम हटाना (यदि आइटम न मिले तो `KeyError` एरर देता है)।
* `discard(x)`: आइटम हटाना (यदि आइटम न मिले तो **कोई एरर नहीं** देता - सुरक्षित)।
* `pop()`: कोई भी रैंडम आइटम हटाना।
* `clear()`: पूरा सेट खाली करना।

```python
cities = {"Kuchaman", "Jaipur", "Didwana"}
cities.add("Ajmer")
cities.discard("Nagaur")  # कोई एरर नहीं आएगा भले ही Nagaur सेट में न हो
print(cities)
```

---

### 📌 4. Mathematical Set Operations (गणितीय ऑपरेशन्स):
Set गणित के सेट थ्योरी ऑपरेशन्स के लिए बहुत शक्तिशाली है:

#### 1. Union (`|` या `.union()`): दोनों सेट्स के सभी यूनिक आइटम्स
```python
A = {1, 2, 3, 4}
B = {3, 4, 5, 6}
print(A | B)  # {1, 2, 3, 4, 5, 6}
```

#### 2. Intersection (`&` या `.intersection()`): दोनों सेट्स के कॉमन आइटम्स
```python
print(A & B)  # {3, 4}
```

#### 3. Difference (`-` या `.difference()`): A के वे आइटम्स जो B में नहीं हैं
```python
print(A - B)  # {1, 2}
```

#### 4. Symmetric Difference (`^`): वे आइटम्स जो दोनों में कॉमन नहीं हैं
```python
print(A ^ B)  # {1, 2, 5, 6}
```
""",
            "Write a Python script to demonstrate removal of duplicates from a list using set(), and perform Union and Intersection on two sets.",
            '# Practice 8: Set Operations\nraw_data = ["Python", "Java", "Python", "C++", "Java", "Go"]\nunique_tech = set(raw_data)\nprint("Unique Tech Stack:", sorted(list(unique_tech)))\n\nbatch_A = {"Virendra", "Aarif", "Rahul", "Pooja"}\nbatch_B = {"Rahul", "Pooja", "Vikram", "Sunita"}\n\nprint("Common in both batches (Intersection):", batch_A & batch_B)\nprint("All students in both batches (Union)  :", batch_A | batch_B)',
            "Unique Tech Stack: ['C++', 'Go', 'Java', 'Python']\nCommon in both batches (Intersection): {'Pooja', 'Rahul'}\nAll students in both batches (Union)  : {'Aarif', 'Pooja', 'Rahul', 'Sunita', 'Vikram', 'Virendra'}",
            "Use set(raw_data), batch_A & batch_B, and batch_A | batch_B.",
            [
                ("Python में खाली सेट (Empty Set) बनाने का सही तरीका क्या है?", "`s = {}`", "`s = set()`", "`s = []`", "`s = ()`", "B", "`{}` खाली डिक्शनरी बनाता है, जबकि `set()` खाली सेट बनाता है।"),
                ("`s = {1, 2, 2, 3, 3, 3}; print(len(s))` का परिणाम क्या होगा?", "6", "3", "1", "Error", "B", "Set में केवल अद्वितीय (Unique) मान {1, 2, 3} ही बचते हैं, अतः लंबाई 3 होगी।"),
                ("`remove()` और `discard()` में मुख्य अंतर क्या है?", "`discard()` तेज़ है", "यदि आइटम न मिले तो `remove()` एरर देता है जबकि `discard()` नहीं", "`remove()` दो आइटम्स हटाता है", "कोई अंतर नहीं है", "B", "आइटम न मिलने पर `remove()` KeyError देता है जबकि `discard()` बिना एरर के शांत रहता है।"),
                ("`{1, 2, 3} & {2, 3, 4}` का आउटपुट क्या होगा?", "{1, 2, 3, 4}", "{2, 3}", "{1, 4}", "{}", "B", "`&` Intersection ऑपरेटर केवल कॉमन तत्वों {2, 3} को लौटाता है।"),
                ("क्या सेट में `s[0]` लिखकर इंडेक्स द्वारा आइटम एक्सेस किया जा सकता है?", "हाँ", "नहीं (TypeError: 'set' object is not subscriptable)", "केवल पॉजिटिव इंडेक्स", "केवल नेगेटिव इंडेक्स", "B", "Set Unordered और Unindexed होता है, इसलिए इसमें इंडेक्सिंग काम नहीं करती।")
            ],
            "Write a program that takes two student groups and finds students enrolled in both, only group 1, and total unique students.",
            '# Assignment 8: Group Enrollment Engine\ng1 = {"Aman", "Ravi", "Kiran", "Meena"}\ng2 = {"Ravi", "Meena", "Suresh", "Geeta"}\nprint("Both Groups   :", g1 & g2)\nprint("Only Group 1  :", g1 - g2)\nprint("Total Unique  :", g1 | g2)'
        ),

        # TOPIC 9
        (
            9, "Topic 9: Dictionaries (डिक्शनरी - Key-Value Pairs)",
            "Dictionary क्या है, Key-Value Pairs, Accessing, Modifying, Deleting, 10+ Dict Methods (keys, values, items, get, update) और Looping।",
            "https://www.w3schools.com/html/mov_bbb.mp4",
            """# 📖 Topic 9: Python Dictionaries (डिक्शनरी)

### 📌 1. Dictionary क्या है?
Dictionary डेटा को **Key: Value** जोड़ियों (Pairs) में स्टोर करती है। इसे कर्ली ब्रेसेस `{ }` में लिखा जाता है।

* **Key-Value Pairs:** प्रत्येक मान का एक विशिष्ट नाम (Key) होता है (जैसे `'name': 'Rohit'`)।
* **Ordered:** Python 3.7+ से डिक्शनरी इनसर्शन ऑर्डर बनाए रखती है।
* **Mutable:** इसमें नई कीज़ जोड़ सकते हैं और मौजूदा वैल्यूज बदल सकते हैं।
* **Keys are Unique:** एक डिक्शनरी में दो एक जैसी Keys नहीं हो सकतीं (Keys हमेशा Immutable जैसे str, int होनी चाहिए)।

```python
student = {
    "name": "Virendra",
    "roll_no": 101,
    "course": "Python 3 Masterclass",
    "city": "Kuchaman City",
    "marks": 94.5
}
print(student, type(student))  # <class 'dict'>
```

---

### 📌 2. Values को Access करना:
1. **Square Bracket `dict['key']`:** यदि Key न मिले तो `KeyError` देता है।
2. **`dict.get('key', default_value)`:** सुरक्षित तरीका! यदि Key न मिले तो `None` या डिफ़ॉल्ट मान देता है (कोई एरर नहीं)।

```python
print(student["name"])             # Virendra
print(student.get("phone", "N/A"))  # N/A (बिना किसी क्रैश के)
```

---

### 📌 3. Adding, Updating & Deleting:

```python
# नई Key जोड़ना या अपडेट करना
student["phone"] = "9509934266"
student["marks"] = 96.0

# हटाना
del student["city"]          # city हट गया
removed_val = student.pop("roll_no")  # हटाकर वैल्यू रिटर्न करता है
```

---

### 📌 4. Dictionary के प्रमुख Methods:
* `keys()`: सभी Keys की लिस्ट देता है।
* `values()`: सभी Values की लिस्ट देता है।
* `items()`: सभी `(Key, Value)` टपल्स की लिस्ट देता है।
* `update(other_dict)`: दूसरी डिक्शनरी से कई की-वैल्यूज एक साथ जोड़ना/अपडेट करना।
* `clear()`: पूरी डिक्शनरी खाली करना।

```python
print(student.keys())
print(student.values())
print(student.items())
```

---

### 📌 5. Dictionary पर Loop चलाना:

```python
for key, value in student.items():
    print(f"👉 {key.upper()}: {value}")
```

---

### 📌 6. Dictionary Comprehension:

```python
# 1 से 5 तक की संख्याओं के क्यूब्स (Cubes)
cubes = {x: x**3 for x in range(1, 6)}
print(cubes)  # {1: 1, 2: 8, 3: 27, 4: 64, 5: 125}
```
""",
            "Create a student grade report dictionary, add new subjects, calculate average marks, and iterate through key-value pairs.",
            '# Practice 9: Student Report Dictionary\nreport = {\n    "Maths": 92,\n    "Python": 98,\n    "Physics": 85\n}\n\n# Add new subject\nreport["English"] = 89\n\ntotal_marks = sum(report.values())\navg_marks = total_marks / len(report)\n\nprint("--- Grade Card ---")\nfor subject, score in report.items():\n    print(f"{subject:10}: {score}")\nprint("-" * 18)\nprint(f"Average   : {avg_marks:.2f}")',
            "--- Grade Card ---\nMaths     : 92\nPython    : 98\nPhysics   : 85\nEnglish   : 89\n------------------\nAverage   : 91.00",
            "Use report.items(), sum(report.values()), and len(report).",
            [
                ("डिक्शनरी में `student.get('age', 18)` का क्या फायदा है?", "यह तेज़ चलता है", "यदि 'age' की न हो तो एरर के बजाय डिफ़ॉल्ट 18 लौटाता है", "यह 'age' को हमेशा के लिए 18 बना देता है", "कोई फायदा नहीं", "B", "`get()` मेथड सुरक्षित एक्सेस देता है और की न मिलने पर वैकल्पिक डिफ़ॉल्ट वैल्यू लौटाता है।"),
                ("क्या डिक्शनरी में दो एक जैसी Keys (Duplicate Keys) हो सकती हैं?", "हाँ", "नहीं, दूसरी Key पहली वाली की वैल्यू को ओवरराइट कर देगी", "सिर्फ स्ट्रिंग्स में", "सिर्फ नंबर्स में", "B", "डिक्शनरी में Keys हमेशा यूनिक होती हैं। डुप्लिकेट की लिखने पर पुरानी वैल्यू रिप्लेस हो जाती है।"),
                ("डिक्शनरी की सभी Keys और Values को एक साथ टपल के रूप में प्राप्त करने के लिए किस मेथड का उपयोग होता है?", "dict.keys()", "dict.values()", "dict.items()", "dict.all()", "C", "`dict.items()` सभी `(key, value)` जोड़ों को लौटाता है।"),
                ("`d = {'a': 1, 'b': 2}; del d['a']` के बाद `len(d)` क्या होगा?", "2", "1", "0", "Error", "B", "del से 'a' हट जाएगा, अतः केवल 1 की-वैल्यू पेयर बचेगा।"),
                ("`{x: x*2 for x in range(3)}` का आउटपुट क्या होगा?", "{0: 0, 1: 1, 2: 2}", "{0: 0, 1: 2, 2: 4}", "[0, 2, 4]", "{1: 2, 2: 4, 3: 6}", "B", "range(3) ➜ 0, 1, 2 के लिए {0: 0, 1: 2, 2: 4} बनेगा।")
            ],
            "Build an Academy Staff Directory storing names, designations, and contact details with search capability.",
            '# Assignment 9: Staff Directory\nstaff = {\n    "Rohit Sir": {"role": "Chief Python Mentor", "phone": "9509934266"},\n    "Virendra": {"role": "Lab Assistant", "phone": "9828000000"}\n}\nfor name, info in staff.items():\n    print(f"Mentor: {name} | Role: {info[\'role\']} | Contact: {info[\'phone\']}")'
        ),

        # TOPIC 10
        (
            10, "Topic 10: Loops (लूप्‍स - while, for, range, break, continue, pass)",
            "Iteration क्या है, while loop, for loop, range() function, break, continue, pass, for-else और Star Patterns।",
            "https://www.w3schools.com/html/mov_bbb.mp4",
            """# 🔁 Topic 10: Python Loops (लूप्‍स)

जब किसी कोड ब्लॉक को बार-बार (Repetitively) चलाना हो, तब Loops का उपयोग किया जाता है। Python में 2 मुख्य लूप्स होते हैं: **`while` loop** और **`for` loop**।

---

### 📌 1. while Loop (कंडीशन आधारित लूप):
जब तक दी गई शर्त `True` रहती है, तब तक लूप चलता रहता है:

```python
count = 1
while count <= 5:
    print(f"Step {count}: Python Sikho with Rohit Sir")
    count += 1  # इंक्रीमेंट जरूरी है, नहीं तो इनफिनिट लूप बन जाएगा!
```

---

### 📌 2. for Loop और `range()` फ़ंक्शन:
जब किसी सीक्वेंस (List, String, Range) पर एक-एक करके आगे बढ़ना हो:
* `range(stop)`: 0 से `stop - 1` तक
* `range(start, stop)`: `start` से `stop - 1` तक
* `range(start, stop, step)`: निश्चित कदम (step) के साथ

```python
# 1 से 5 तक
for i in range(1, 6):
    print(f"Number: {i}")

# 2 का पहाड़ा (Table of 2): 2, 4, 6, 8, ... 20
for num in range(2, 21, 2):
    print(num, end=" ")
print()
```

---

### 📌 3. Loop Control Statements:
1. **`break` (लूप तोड़ना):** कंडीशन मिलते ही पूरे लूप को तुरंत रोककर बाहर निकल जाता है।
2. **`continue` (इटरेशन छोड़ना):** वर्तमान चक्कर (iteration) को यहीं छोड़कर अगले चक्कर पर चला जाता है।
3. **`pass` (खाली ब्लॉक):** सिंटैक्स एरर से बचने के लिए खाली प्लेसहोल्डर का काम करता है।

```python
# break का उदाहरण (5 मिलते ही लूप बंद)
for x in range(1, 10):
    if x == 5:
        print("Breaking at 5!")
        break
    print(x, end=" ")
# आउटपुट: 1 2 3 4 Breaking at 5!

# continue का उदाहरण (सिर्फ 3 को छोड़ देगा)
for y in range(1, 6):
    if y == 3:
        continue
    print(y, end=" ")
# आउटपुट: 1 2 4 5
```

---

### 📌 4. Loop with `else` Clause:
Python में लूप के साथ `else` ब्लॉक भी लगाया जा सकता है। यह तभी चलता है जब लूप **बिना किसी `break` के सामान्य रूप से पूरा खत्म** होता है।

```python
# अभाज्य संख्या (Prime Number) की जांच
num = 7
for i in range(2, num):
    if num % i == 0:
        print(f"{num} अभाज्य नहीं है।")
        break
else:
    print(f"{num} एक अभाज्य (Prime) संख्या है!")
```

---

### 📌 5. Nested Loops & Star Pattern Printing:

```python
# Right Triangle Pattern
rows = 5
for i in range(1, rows + 1):
    print("* " * i)
```
""",
            "Write a Python program to calculate the Factorial of a number using while loop and print multiplication table using for loop.",
            '# Practice 10: Loops & Math\n# 1. Factorial using while loop\nn = 5\nfact = 1\ntemp = n\nwhile temp > 0:\n    fact *= temp\n    temp -= 1\nprint(f"Factorial of {n} is: {fact}")\n\n# 2. Multiplication Table of 7\nprint("\\n--- Table of 7 ---")\nfor i in range(1, 11):\n    print(f"7 x {i:2} = {7 * i:2}")',
            "Factorial of 5 is: 120\n\n--- Table of 7 ---\n7 x  1 =  7\n7 x  2 = 14\n7 x  3 = 21\n7 x  4 = 28\n7 x  5 = 35\n7 x  6 = 42\n7 x  7 = 49\n7 x  8 = 56\n7 x  9 = 63\n7 x 10 = 70",
            "Use while loop for factorial and for i in range(1, 11) for table.",
            [
                ("`range(2, 10, 3)` में कौन-सी संख्याएं शामिल होंगी?", "[2, 5, 8]", "[2, 3, 4, 5, 6, 7, 8, 9]", "[3, 6, 9]", "[2, 5, 8, 11]", "A", "start=2, step=3 ➜ 2, 5, 8 (10 से कम)।"),
                ("लूप को बीच में ही पूरी तरह समाप्त करने के लिए किस कीवर्ड का उपयोग होता है?", "continue", "break", "stop", "pass", "B", "`break` स्टेटमेंट लूप के एक्ज़ीक्यूशन को तुरंत समाप्त कर देता है।"),
                ("`continue` कीवर्ड का क्या काम है?", "लूप को हमेशा के लिए बंद करना", "वर्तमान इटरेशन को छोड़कर अगले इटरेशन पर जाना", "प्रोग्राम को रीस्टार्ट करना", "कुछ नहीं", "B", "`continue` वर्तमान चक्कर को छोड़कर लूप के अगले चक्कर पर पहुंच जाता है।"),
                ("Python में `pass` स्टेटमेंट का क्या उद्देश्य है?", "लूप से बाहर निकलना", "खाली कोड ब्लॉक के लिए एक सिंटैक्टिक प्लेसहोल्डर होना", "वेरिएबल को डिलीट करना", "आउटपुट प्रिंट करना", "B", "`pass` एक नल ऑपरेशन (No-Op) है जिसका उपयोग खाली फंक्शन या ब्लॉक में सिंटैक्स एरर से बचने के लिए होता है।"),
                ("`for i in range(3): print(i)` में अंतिम प्रिंट होने वाली संख्या क्या होगी?", "3", "2", "1", "0", "B", "`range(3)` संख्याएं 0, 1, 2 उत्पन्न करता है, अतः अंतिम संख्या 2 होगी।")
            ],
            "Write a program that prints a pyramid star pattern with n rows.",
            '# Assignment 10: Pyramid Pattern\nn = 5\nfor i in range(1, n + 1):\n    spaces = " " * (n - i)\n    stars = "* " * i\n    print(spaces + stars)'
        ),

        # TOPIC 11
        (
            11, "Topic 11: Functions (फ़ंक्शंस - def, return, arguments, lambda)",
            "Functions क्या हैं, Code Reusability, def, return, Positional/Keyword/Default Args, *args, **kwargs, Scope, और Lambda Functions।",
            "https://www.w3schools.com/html/mov_bbb.mp4",
            """# ⚙️ Topic 11: Python Functions (फ़ंक्शंस)

### 📌 1. Function क्या है?
Function कोड का एक संगठित, पुनः प्रयोज्य (Reusable) ब्लॉक होता है जो केवल तभी चलता है जब उसे कॉल किया जाता है।
* **DRY Principle:** Don't Repeat Yourself (कोड को बार-बार लिखने से बचाता है)।
* **Modularity:** बड़े प्रोग्राम को छोटे-छोटे मैनेजेबल भागों में बांटता है।

---

### 📌 2. Defining & Calling a Function:
Python में फ़ंक्शन को `def` कीवर्ड से परिभाषित किया जाता है:

```python
# फ़ंक्शन की परिभाषा
def greet_student(name):
    print(f"नमस्ते {name}! Python Sikho Academy में आपका स्वागत है।")

# फ़ंक्शन को कॉल करना
greet_student("Virendra")
greet_student("Aarif")
```

---

### 📌 3. `return` Statement:
फ़ंक्शन से गणना का परिणाम वापस भेजने के लिए `return` का उपयोग किया जाता है:

```python
def calculate_area(length, width):
    area = length * width
    perimeter = 2 * (length + width)
    return area, perimeter  # कई मान टपल के रूप में वापस आ सकते हैं

a, p = calculate_area(10, 5)
print(f"Area: {a}, Perimeter: {p}")
```

---

### 📌 4. 4 प्रकार के Function Arguments:

#### 1. Positional Arguments (स्थान आधारित):
जिस क्रम में पैरामीटर्स हैं, उसी क्रम में वैल्यूज देना।
```python
def add(a, b): return a + b
```

#### 2. Keyword Arguments (नाम आधारित):
पैरामीटर का नाम लिखकर वैल्यू देना (क्रम की चिंता नहीं)।
```python
def student_card(name, city):
    print(f"Name: {name} | City: {city}")

student_card(city="Kuchaman City", name="Rohit Sir")
```

#### 3. Default Arguments (डिफ़ॉल्ट मान):
यदि कॉलिंग के समय वैल्यू न दी जाए, तो डिफ़ॉल्ट मान उपयोग होगा।
```python
def enroll_batch(student_name, batch_time="02:00 PM"):
    print(f"Student: {student_name} enrolled in {batch_time} batch.")

enroll_batch("Virendra")               # डिफ़ॉल्ट 02:00 PM लेगा
enroll_batch("Rahul", "04:00 PM")     # 04:00 PM लेगा
```

#### 4. Variable-Length Arguments (`*args` और `**kwargs`):
* `*args`: अनिश्चित संख्या में मानों को **Tuple** के रूप में स्वीकार करता है।
* `**kwargs`: अनिश्चित संख्या में की-वैल्यूज को **Dictionary** के रूप में स्वीकार करता है।

```python
# *args का उदाहरण
def sum_all(*numbers):
    return sum(numbers)

print(sum_all(10, 20, 30, 40))  # 100

# **kwargs का उदाहरण
def print_student_info(**details):
    for k, v in details.items():
        print(f"{k}: {v}")

print_student_info(name="Rohit", role="Mentor", city="Kuchaman")
```

---

### 📌 5. Variable Scope (Local vs Global):
* **Local Variable:** जो फ़ंक्शन के अंदर बनता है और केवल अंदर ही मान्य होता है।
* **Global Variable:** जो फ़ंक्शन के बाहर बनता है और पूरे प्रोग्राम में मान्य होता है (`global` कीवर्ड से अंदर बदला जा सकता है)।

---

### 📌 6. Lambda (Anonymous) Functions:
बिना नाम वाला 1-लाइन का छोटा फ़ंक्शन: `lambda arguments: expression`

```python
# साधारण फ़ंक्शन
def square(x): return x ** 2

# Lambda फ़ंक्शन
sq = lambda x: x ** 2
print(sq(6))  # 36

# 2 नंबर्स का जोड़
add = lambda a, b: a + b
print(add(15, 25))  # 40
```
""",
            "Write functions demonstrating default arguments, *args for calculating average, and a lambda function for square.",
            '# Practice 11: Functions Showcase\n# 1. Function with default argument\ndef welcome_msg(name, academy="Samyak Classes"):\n    return f"Welcome {name} to {academy}!"\n\n# 2. *args for Average\ndef calculate_avg(*scores):\n    return round(sum(scores) / len(scores), 2)\n\n# 3. Lambda function\nis_even = lambda n: n % 2 == 0\n\nprint(welcome_msg("Virendra"))\nprint("Class Average:", calculate_avg(85, 90, 78, 92, 88))\nprint("Is 14 Even?   :", is_even(14))\nprint("Is 21 Even?   :", is_even(21))',
            "Welcome Virendra to Samyak Classes!\nClass Average: 86.6\nIs 14 Even?   : True\nIs 21 Even?   : False",
            "Use def welcome_msg(name, academy='Samyak Classes'), def calculate_avg(*scores), and lambda n: n % 2 == 0.",
            [
                ("Python में फ़ंक्शन को किस कीवर्ड द्वारा परिभाषित किया जाता है?", "function", "func", "def", "define", "C", "Python में फ़ंक्शन बनाने के लिए `def` (define) कीवर्ड का उपयोग किया जाता है।"),
                ("`*args` फ़ंक्शन के अंदर किस डेटा प्रकार के रूप में प्राप्त होता है?", "List", "Tuple", "Dict", "Set", "B", "`*args` कई पोजीशनल आर्गुमेंट्स को `Tuple` के रूप में ग्रहण करता है।"),
                ("`**kwargs` फ़ंक्शन के अंदर किस डेटा प्रकार के रूप में प्राप्त होता है?", "List", "Tuple", "Dictionary", "String", "C", "`**kwargs` कीवर्ड आर्गुमेंट्स को `Dictionary` के रूप में ग्रहण करता है।"),
                ("`sq = lambda x: x * 3; print(sq(4))` का परिणाम क्या होगा?", "12", "7", "64", "Error", "A", "Lambda फ़ंक्शन 4 को 3 से गुणा करके 12 लौटाएगा।"),
                ("फ़ंक्शन के अंदर किसी ग्लोबल वेरिएबल को बदलने के लिए किस कीवर्ड का उपयोग किया जाता है?", "local", "global", "static", "var", "B", "फ़ंक्शन के अंदर ग्लोबल स्कोप वाले वेरिएबल को मॉडिफाई करने के लिए `global` कीवर्ड जरूरी है।")
            ],
            "Build an Academy Fee Calculator function that takes base fee, discount percentage, and gst percentage.",
            '# Assignment 11: Fee Calculator\ndef calculate_total_fee(base_fee, discount_pct=10, gst_pct=18):\n    discount_amt = base_fee * (discount_pct / 100)\n    discounted_fee = base_fee - discount_amt\n    gst_amt = discounted_fee * (gst_pct / 100)\n    total = discounted_fee + gst_amt\n    return round(total, 2)\n\nprint("Total Fee Payable: Rs.", calculate_total_fee(5000))'
        ),

        # TOPIC 12
        (
            12, "Topic 12: String Methods & Modern f-strings (स्ट्रिंग मेथड्स & फॉर्मेटिंग)",
            "String Immutability, Indexing, Slicing, 15+ String Methods (.upper, .strip, .replace, .split, .join) और f-strings।",
            "https://www.w3schools.com/html/mov_bbb.mp4",
            """# 🔤 Topic 12: Python Strings & Modern Formatting

### 📌 1. String क्या है और इसकी विशेषताएँ:
String अक्षरों और प्रतीकों का एक क्रम (Sequence) है। Python में स्ट्रिंग्स **Immutable (अपरिवर्तनीय)** होती हैं।

```python
msg = "Python Sikho with Rohit Sir"
print(msg[0])        # P
print(msg[-1])       # r
print(msg[0:6])      # Python
print(msg[::-1])     # riS tihoR htiw ohkiS nohtyP (Reverse)
```

---

### 📌 2. प्रमुख 15 String Methods:

#### 1. Case Conversion Methods:
* `upper()`: सभी अक्षरों को CAPITAL करना
* `lower()`: सभी अक्षरों को small करना
* `title()`: प्रत्येक शब्द का पहला अक्षर Capital करना
* `capitalize()`: केवल वाक्य का पहला अक्षर Capital करना
* `swapcase()`: बड़े को छोटा और छोटे को बड़ा करना

```python
s = "samyak computer classes"
print(s.upper())  # SAMYAK COMPUTER CLASSES
print(s.title())  # Samyak Computer Classes
```

#### 2. Whitespace Cleaning Methods:
* `strip()`: आगे और पीछे के फालतू स्पेस हटाना
* `lstrip()`: बाएं (Left) का स्पेस हटाना
* `rstrip()`: दाएं (Right) का स्पेस हटाना

```python
raw_input = "   9509934266   "
clean_phone = raw_input.strip()
print(clean_phone)  # "9509934266"
```

#### 3. Search & Replace Methods:
* `find(sub)`: सबस्ट्रिंग का इंडेक्स खोजना (न मिलने पर `-1`)
* `count(sub)`: कोई शब्द कितनी बार आया है गिनना
* `replace(old, new)`: पुराने शब्द को नए शब्द से बदलना
* `startswith(prefix)`: क्या स्ट्रिंग इससे शुरू होती है (True/False)
* `endswith(suffix)`: क्या स्ट्रिंग इससे समाप्त होती है (True/False)

```python
text = "Python is powerful and Python is fast."
print(text.count("Python"))            # 2
print(text.replace("fast", "blazing"))  # Python is powerful and Python is blazing.
```

#### 4. Splitting & Joining Methods:
* `split(separator)`: स्ट्रिंग को तोड़कर **List** बनाना
* `join(iterable)`: लिस्ट के सभी शब्दों को जोड़कर **String** बनाना

```python
line = "Python,Java,C++,JavaScript"
tech_list = line.split(",")
print(tech_list)  # ['Python', 'Java', 'C++', 'JavaScript']

joined_str = " | ".join(tech_list)
print(joined_str) # Python | Java | C++ | JavaScript
```

---

### 📌 3. Modern f-strings (फॉर्मेटेड स्ट्रिंग्स):
Python 3.6+ में स्ट्रिंग्स को फॉर्मेट करने का सबसे तेज़ और शक्तिशाली तरीका `f"..."` है:

```python
name = "Rohit Sir"
city = "Kuchaman City"
score = 98.5432

# एक्सप्रेशन्स और राउंडिंग सीधे कर्ली ब्रेसेस में
print(f"Chief Mentor: {name.upper()}")
print(f"Location    : {city}")
print(f"Score       : {score:.2f}% (2 decimal places)")
print(f"Math        : 25 * 4 = {25 * 4}")
```
""",
            "Write a Python script that takes a messy user input string, cleans it with strip(), changes case to Title, splits into list, and joins with separator.",
            '# Practice 12: String Manipulation Master\nraw_text = "   python, data science, artificial intelligence   "\n\n# Clean whitespace\ncleaned = raw_text.strip()\n\n# Split into list\nitems = [item.strip().title() for item in cleaned.split(",")]\nprint("Items List:", items)\n\n# Rejoin with arrow\nresult = " ➜ ".join(items)\nprint("Formatted :", result)',
            "Items List: ['Python', 'Data Science', 'Artificial Intelligence']\nFormatted : Python ➜ Data Science ➜ Artificial Intelligence",
            "Use raw_text.strip(), split(','), and ' ➜ '.join(items).",
            [
                ("`'samyak classes'.title()` का परिणाम क्या होगा?", "SAMYAK CLASSES", "Samyak Classes", "samyak classes", "Samyak classes", "B", "`.title()` प्रत्येक शब्द के पहले अक्षर को Capital बना देता है।"),
                ("`'   rohit sir   '.strip()` क्या करेगा?", "सारे स्पेस हटा देगा", "केवल आगे और पीछे (Leading/Trailing) के स्पेस हटाएगा", "अक्षरों को बड़ा करेगा", "कुछ नहीं", "B", "`.strip()` केवल शुरुआत और अंत के व्हाइटस्पेस को हटाता है।"),
                ("`'apple,banana,mango'.split(',')` क्या रिटर्न करेगा?", "String", "Tuple", "List `['apple', 'banana', 'mango']`", "Set", "C", "`.split(',')` स्ट्रिंग को कॉमा पर तोड़कर एक List लौटाता है।"),
                ("`'Python'.find('Z')` का आउटपुट क्या होगा?", "0", "-1", "Error", "None", "B", "यदि खोजा जाने वाला अक्षर स्ट्रिंग में न मिले तो `.find()` हमेशा -1 लौटाता है।"),
                ("Python में `f'{10.5566:.2f}'` का आउटपुट क्या होगा?", "10.55", "10.56", "10.6", "10", "B", "`.2f` दशमलव के 2 स्थानों तक राउंड ऑफ करता है, अतः 10.56 होगा।")
            ],
            "Build a Student Certificate Card Formatter using f-strings and string methods.",
            '# Assignment 12: Certificate Formatter\nstudent = "virendra singh"\ncourse = "python 3 masterclass"\nscore = 94.678\nprint(f"CERTIFICATE OF EXCELLENCE\\nAwarded to: {student.title()}\\nFor mastering: {course.upper()}\\nWith Score: {score:.1f}%")'
        )
    ]

    # Insert Chapters and related child tables
    for ch_no, title, desc, v_url, notes_md, prac_desc, s_code, sol_code, hint, q_list, a_desc, a_code in chapters_data:
        # Chapter
        cursor.execute("""
        INSERT INTO chapters (id, course_id, chapter_no, title, description)
        VALUES (?, 1, ?, ?, ?)
        """, (ch_no, ch_no, title, desc))

        # Video
        cursor.execute("""
        INSERT INTO videos (chapter_id, title, video_url, duration, summary)
        VALUES (?, ?, ?, '15:00', ?)
        """, (ch_no, title, v_url, desc))

        # Notes
        cursor.execute("""
        INSERT INTO notes (chapter_id, title, content_markdown, key_takeaways)
        VALUES (?, ?, ?, ?)
        """, (ch_no, title, notes_md, desc))

        # Practice
        cursor.execute("""
        INSERT INTO practice_tasks (chapter_id, title, instructions, starter_code, expected_output, hint)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (ch_no, f"Practice {ch_no}", prac_desc, s_code, sol_code, hint))

        # Quiz
        cursor.execute("""
        INSERT INTO quizzes (chapter_id, title, passing_score)
        VALUES (?, ?, 60)
        """, (ch_no, f"{title} - Topic Quiz"))
        
        quiz_id = cursor.lastrowid

        for q_text, op_a, op_b, op_c, op_d, cor_op, expl in q_list:
            cursor.execute("""
            INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (quiz_id, q_text, op_a, op_b, op_c, op_d, cor_op, expl))

        # Assignment
        cursor.execute("""
        INSERT INTO assignments (chapter_id, title, problem_statement, starter_code)
        VALUES (?, ?, ?, ?)
        """, (ch_no, f"Assignment: {title}", a_desc, a_code))

    # 3. SEED 3 REAL-WORLD PROJECTS
    projects_data = [
        (1, 1, "Student Management & Fee Ledger", "SQLite + Python CLI System for Kuchaman Academy", "Python, SQLite", "import sqlite3\n# Student Ledger Starter Code", "https://samyakclasses.in"),
        (2, 1, "Automated WhatsApp / SMS Alert System", "Python Twilio & Automation for Academy notifications", "Python, Twilio, Requests", "import requests\n# Automation Pipeline Starter", "https://samyakclasses.in"),
        (3, 1, "AI-Powered Smart Python Quiz Master", "Google Gemini + Python Tkinter/Web Dynamic Quiz Engine", "Python, Gemini AI, Flask", "import google.generativeai\n# AI Quiz Starter", "https://samyakclasses.in")
    ]

    for p_id, c_id, p_title, p_desc, t_stack, s_templ, d_url in projects_data:
        cursor.execute("""
        INSERT INTO projects (id, course_id, title, description, tech_stack, starter_template, demo_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (p_id, c_id, p_title, p_desc, t_stack, s_templ, d_url))

    conn.commit()
    conn.close()
    print(f"[*] Successfully seeded {len(chapters_data)} comprehensive master topics into Python Sikho DB!")

if __name__ == "__main__":
    seed_python_sikho_data()
