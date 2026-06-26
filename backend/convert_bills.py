import fitz  # PyMuPDF
import os

PDF_FOLDER = "bills_pdf"
JPG_FOLDER = "bills_jpg"

os.makedirs(JPG_FOLDER, exist_ok=True)

converted = 0
for filename in os.listdir(PDF_FOLDER):
    if filename.lower().endswith(".pdf"):
        pdf_path = os.path.join(PDF_FOLDER, filename)
        doc = fitz.open(pdf_path)
        
        # Only take page 1 (index 0) — that's all we need
        page = doc[0]
        mat = fitz.Matrix(2, 2)  # 2x zoom for better quality
        pix = page.get_pixmap(matrix=mat)
        
        output_name = f"{filename[:-4]}.jpg"
        output_path = os.path.join(JPG_FOLDER, output_name)
        pix.save(output_path)
        converted += 1
        print(f"✅ Converted: {output_name}")

print(f"\nDone! {converted} bills converted to JPG in '{JPG_FOLDER}' folder.")