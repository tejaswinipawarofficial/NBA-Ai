from pathlib import Path
import pdfplumber

def load_all_pdfs(folder="knowledge_base"):
    documents = []

    folder = Path(folder)

    for pdf_file in folder.glob("*.pdf"):
        with pdfplumber.open(pdf_file) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                text = page.extract_text()

                if text:
                    documents.append({
                        "text": text,
                        "source": pdf_file.name,
                        "page": page_num
                    })

    return documents