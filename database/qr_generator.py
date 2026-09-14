import qrcode
from PIL import Image, ImageDraw, ImageFont
import os
import io
import urllib.parse

def generate_dynamic_upi_qr_bytes(price="299", upi_id="7627060647@ybl", payee_name="RAJU RAM (Rohit Sir)", note="Python Sikho VIP Course"):
    """
    Generates a high-definition branded UPI QR code with auto-filled amount in PNG format bytes.
    """
    price_clean = str(price).strip().replace("₹", "").replace(",", "")
    if not price_clean.isdigit():
        price_clean = "299"
        
    upi_id_clean = str(upi_id).strip() or "7627060647@ybl"
    payee_clean = str(payee_name).strip() or "RAJU RAM"
    note_clean = str(note).strip() or "Python Sikho VIP Course"

    # Construct the exact NPCI standard UPI URI
    # pa = VPA, pn = Payee Name, am = Amount, cu = Currency, tn = Transaction Note
    upi_uri = f"upi://pay?pa={upi_id_clean}&pn={urllib.parse.quote(payee_clean)}&am={price_clean}&cu=INR&tn={urllib.parse.quote(note_clean)}"

    # Generate QR Code with standard 4-module quiet zone for instant scanner acquisition
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=12,
        border=4,
    )
    qr.add_data(upi_uri)
    qr.make(fit=True)

    qr_img = qr.make_image(fill_color="#000000", back_color="#ffffff").convert("RGBA")
    qr_w, qr_h = qr_img.size

    # Card layout with branded header and pre-filled amount footer
    pad_x = 30
    header_h = 75
    footer_h = 70
    card_w = qr_w + (pad_x * 2)
    card_h = qr_h + header_h + footer_h

    card = Image.new("RGBA", (card_w, card_h), (255, 255, 255, 255))
    draw = ImageDraw.Draw(card)

    # PhonePe / UPI Theme Purple Header (#5f259f)
    draw.rectangle([(0, 0), (card_w, header_h)], fill=(95, 37, 159, 255))

    # Font setup
    try:
        font_header = ImageFont.truetype("arialbd.ttf", 24)
        font_sub = ImageFont.truetype("arial.ttf", 15)
        font_amount_big = ImageFont.truetype("arialbd.ttf", 22)
    except Exception:
        font_header = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_amount_big = ImageFont.load_default()

    # Header text
    draw.text((card_w / 2, 26), "PhonePe  /  GPay  /  Paytm", fill=(255, 255, 255, 255), anchor="mm", font=font_header)
    draw.text((card_w / 2, 54), f"Payee: {payee_clean} | {upi_id_clean}", fill=(235, 215, 255, 255), anchor="mm", font=font_sub)

    # Paste QR Code in center
    card.paste(qr_img, (pad_x, header_h), qr_img)

    # Bottom Pill: Pre-Filled Amount ₹{price_clean}
    footer_box_top = card_h - footer_h + 10
    footer_box_bottom = card_h - 15
    draw.rectangle([(20, footer_box_top), (card_w - 20, footer_box_bottom)], fill=(240, 253, 244, 255), outline=(22, 163, 74, 255), width=2)
    draw.text((card_w / 2, footer_box_top + 23), f"SCAN & PAY RS. {price_clean} (AUTO-FILLED)", fill=(21, 128, 61, 255), anchor="mm", font=font_amount_big)

    buf = io.BytesIO()
    card.save(buf, format="PNG")
    buf.seek(0)
    return buf.getvalue()

def update_static_qr_files(price="299", upi_id="7627060647@ybl", payee_name="RAJU RAM (Rohit Sir)"):
    """
    Updates disk PNG files so static file serving also reflects the new price.
    """
    img_bytes = generate_dynamic_upi_qr_bytes(price, upi_id, payee_name)
    paths = [
        r"C:\Users\rahul\Desktop\PYTHON_SIKHO\static\uploads\payment_qr_299.png",
        r"C:\Users\rahul\Desktop\PYTHON_SIKHO\static\uploads\phonepe_qr.png",
        r"C:\Users\rahul\Desktop\PYTHON_SIKHO\static\uploads\dynamic_qr.png",
        r"C:\Users\rahul\.gemini\antigravity\brain\7e08c877-201f-4c21-9b33-8ac5c38a195d\scratch\python_sikho\static\uploads\payment_qr_299.png",
        r"C:\Users\rahul\.gemini\antigravity\brain\7e08c877-201f-4c21-9b33-8ac5c38a195d\scratch\python_sikho\static\uploads\phonepe_qr.png",
        r"C:\Users\rahul\.gemini\antigravity\brain\7e08c877-201f-4c21-9b33-8ac5c38a195d\scratch\python_sikho\static\uploads\dynamic_qr.png"
    ]
    for p in paths:
        try:
            os.makedirs(os.path.dirname(p), exist_ok=True)
            with open(p, "wb") as f:
                f.write(img_bytes)
        except Exception as e:
            print(f"Error saving to {p}: {e}")
    return True
