import os
import sys
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CERT_OUTPUT_DIR = os.path.join(BASE_DIR, "static", "uploads", "certificates")
os.makedirs(CERT_OUTPUT_DIR, exist_ok=True)

def generate_certificate_image(student_name, cert_number="PS-2026-0001", issue_date="10 Sept 2026", grade="A+ Outstanding"):
    """
    Generates a high-res (1200x800) Gold-Bordered Certificate of Excellence PNG.
    """
    width, height = 1200, 800
    img = Image.new("RGBA", (width, height), (7, 10, 20, 255))
    draw = ImageDraw.Draw(img)

    # 1. Gold Double Border
    gold_color = (245, 158, 11, 255)
    cyan_color = (0, 240, 255, 255)
    white_color = (248, 250, 252, 255)
    muted_color = (148, 163, 184, 255)

    draw.rectangle([20, 20, width - 20, height - 20], outline=gold_color, width=4)
    draw.rectangle([32, 32, width - 32, height - 32], outline=(0, 240, 255, 120), width=2)

    # 2. Header
    draw.text((width // 2, 80), "SAMYAK COMPUTER CLASSES • KUCHAMAN CITY", fill=cyan_color, anchor="mm")
    draw.text((width // 2, 140), "CERTIFICATE OF EXCELLENCE", fill=gold_color, anchor="mm")
    draw.text((width // 2, 185), "This is proudly presented to", fill=muted_color, anchor="mm")

    # 3. Student Name (Large)
    draw.text((width // 2, 270), student_name.upper(), fill=white_color, anchor="mm")
    draw.line([width // 2 - 250, 310, width // 2 + 250, 310], fill=gold_color, width=3)

    # 4. Body Text
    body_text_1 = "For successfully mastering all 10 modules of Complete Python 3 Masterclass (Zero to Hero),"
    body_text_2 = f"passing all interactive coding assessments, sandbox challenges, and capstone projects with grade {grade}."
    
    draw.text((width // 2, 370), body_text_1, fill=white_color, anchor="mm")
    draw.text((width // 2, 410), body_text_2, fill=muted_color, anchor="mm")

    # 5. Footer Signatures & Seals
    draw.line([120, 640, 380, 640], fill=cyan_color, width=2)
    draw.text((250, 615), "Rohit Sir", fill=cyan_color, anchor="mm")
    draw.text((250, 665), "Rohit Sir (Chief Mentor)", fill=white_color, anchor="mm")
    draw.text((250, 690), "Samyak Computer Classes", fill=muted_color, anchor="mm")

    # Center Seal
    draw.ellipse([width // 2 - 50, 580, width // 2 + 50, 680], outline=gold_color, width=3, fill=(245, 158, 11, 40))
    draw.text((width // 2, 630), "⭐ VERIFIED ⭐", fill=gold_color, anchor="mm")
    draw.text((width // 2, 700), f"Serial: {cert_number}", fill=cyan_color, anchor="mm")

    # Right Date & QR
    draw.line([width - 380, 640, width - 120, 640], fill=cyan_color, width=2)
    draw.text((width - 250, 615), f"Date: {issue_date}", fill=white_color, anchor="mm")
    draw.text((width - 250, 665), "Verified by Academy", fill=white_color, anchor="mm")
    draw.text((width - 250, 690), "Kuchaman City (📞 9509934266)", fill=muted_color, anchor="mm")

    # Save to static uploads
    filename = f"cert_{cert_number.replace('-', '_')}.png"
    out_path = os.path.join(CERT_OUTPUT_DIR, filename)
    img.save(out_path, "PNG")
    return filename

if __name__ == "__main__":
    f = generate_certificate_image("Virendra", "PS-2026-0001", "10 Sept 2026")
    print(f"[+] Generated Certificate Image: {f}")
