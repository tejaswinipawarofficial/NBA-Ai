from utils.document_loader import load_all_pdfs

docs = load_all_pdfs()

print(f"Loaded {len(docs)} pages")

for doc in docs:
    print(f"{doc['source']} - Page {doc['page']}")