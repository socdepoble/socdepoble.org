import os
import sys

try:
    import PyPDF2
    def extract_text(pdf_path):
        text = ""
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                t = page.extract_text()
                if t: text += t + "\n"
        return text
except ImportError:
    try:
        import pypdf
        def extract_text(pdf_path):
            text = ""
            with open(pdf_path, 'rb') as f:
                reader = pypdf.PdfReader(f)
                for page in reader.pages:
                    t = page.extract_text()
                    if t: text += t + "\n"
            return text
    except ImportError:
        import fitz
        def extract_text(pdf_path):
            text = ""
            doc = fitz.open(pdf_path)
            for page in doc:
                text += page.get_text() + "\n"
            return text

input_dir = "/Users/javillinares/Desktop/A presentar "
output_dir = "/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/textos_subvencio"

os.makedirs(output_dir, exist_ok=True)

for filename in os.listdir(input_dir):
    if filename.lower().endswith('.pdf'):
        pdf_path = os.path.join(input_dir, filename)
        out_path = os.path.join(output_dir, filename + ".txt")
        print(f"Extracting {filename}...")
        try:
            text = extract_text(pdf_path)
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(text)
            print(f"Saved {out_path}")
        except Exception as e:
            print(f"Failed {filename}: {e}")
