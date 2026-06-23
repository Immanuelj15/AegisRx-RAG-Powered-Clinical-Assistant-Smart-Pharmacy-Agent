import os
import csv
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import chromadb
from sentence_transformers import SentenceTransformer

app = Flask(__name__)
CORS(app)

# Load the SentenceTransformer model
print("Loading sentence-transformers/all-MiniLM-L6-v2 model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded successfully.")

# Setup ChromaDB persistent client
# Use absolute path to ensure accuracy
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'chromadb')
os.makedirs(DB_PATH, exist_ok=True)

chroma_client = chromadb.PersistentClient(path=DB_PATH)
collection_name = "medicines"

def get_or_create_collection():
    try:
        return chroma_client.get_or_create_collection(name=collection_name)
    except Exception as e:
        print(f"Error getting collection: {e}")
        # Recreate if corrupted
        return chroma_client.create_collection(name=collection_name)

collection = get_or_create_collection()

@app.route('/api/rag/ingest', methods=['POST'])
def ingest_csv():
    try:
        data = request.get_json() or {}
        csv_path = data.get('csv_path')
        
        if not csv_path:
            # Fallback to default csv path
            csv_path = os.path.join(BASE_DIR, 'csv', 'medicines.csv')
        
        if not os.path.exists(csv_path):
            return jsonify({"success": False, "error": f"CSV file not found at {csv_path}"}), 400
            
        print(f"Starting ingestion from: {csv_path}")
        
        # Read and parse CSV
        medicines = []
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                medicines.append(row)
                
        if not medicines:
            return jsonify({"success": False, "error": "CSV file is empty"}), 400
            
        # Recreate collection to wipe old index
        global collection
        try:
            chroma_client.delete_collection(name=collection_name)
        except Exception as e:
            print(f"Collection delete warning: {e}")
        collection = chroma_client.create_collection(name=collection_name)
        
        # Prepare data for ChromaDB
        documents = []
        embeddings = []
        metadatas = []
        ids = []
        
        for idx, med in enumerate(medicines):
            med_id = med.get('Medicine_ID') or f"MED{idx+1:03d}"
            name = med.get('Medicine_Name') or ""
            generic = med.get('Generic_Name') or ""
            brand = med.get('Brand') or ""
            strength = med.get('Strength') or ""
            use_case = med.get('Use_Case') or ""
            dosage = med.get('Dosage') or ""
            side_effects = med.get('SideEffects') or ""
            warnings = med.get('Warnings') or ""
            category = med.get('Category') or ""
            price = med.get('Price') or "0.0"
            stock = med.get('Stock') or "0"
            alt = med.get('Alternative') or ""
            
            # Construct a descriptive text block for embeddings
            doc_text = (
                f"Medicine: {name} ({brand}). Generic name: {generic}. Strength: {strength}. "
                f"Category: {category}. Primary Use Case: {use_case}. Recommended Dosage: {dosage}. "
                f"Alternatives: {alt}. Side effects: {side_effects}. Warnings: {warnings}. "
                f"Manufacturer: {med.get('Manufacturer', '')}. Price: ${price}. Stock status: {stock} units available."
            )
            
            # Generate local embedding
            embedding = model.encode(doc_text).tolist()
            
            # Prepare metadata (flat dict string/number/bool for Chroma)
            metadata = {
                "medicine_id": med_id,
                "name": name,
                "brand": brand,
                "generic_name": generic,
                "strength": strength,
                "category": category,
                "use_case": use_case,
                "alternative": alt,
                "stock": int(stock) if stock.isdigit() else 0,
                "price": float(price) if price.replace('.', '', 1).isdigit() else 0.0,
                "dosage": dosage,
                "warnings": warnings,
                "side_effects": side_effects,
                "morning": med.get('Morning', '0'),
                "afternoon": med.get('Afternoon', '0'),
                "night": med.get('Night', '0'),
                "before_food": med.get('BeforeFood', 'false').lower() == 'true',
                "after_food": med.get('AfterFood', 'false').lower() == 'true',
                "expiry": med.get('Expiry', '')
            }
            
            documents.append(doc_text)
            embeddings.append(embedding)
            metadatas.append(metadata)
            ids.append(med_id)
            
        # Add to ChromaDB in batches if needed, but since it's small we add at once
        collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )
        
        print(f"Successfully ingested {len(ids)} medicines.")
        return jsonify({
            "success": True, 
            "count": len(ids), 
            "message": f"Successfully ingested {len(ids)} medicines into ChromaDB."
        })
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/rag/query', methods=['POST'])
def query_rag():
    try:
        data = request.get_json() or {}
        query_text = data.get('query')
        top_k = int(data.get('top_k', 3))
        
        if not query_text:
            return jsonify({"success": False, "error": "Query parameter is required"}), 400
            
        print(f"Querying vector store for: {query_text} (Top K: {top_k})")
        
        # Check if collection is empty
        count = collection.count()
        if count == 0:
            return jsonify({
                "success": True,
                "results": [],
                "message": "Vector database is empty. Please run ingestion first."
            })
            
        # Generate query embedding
        query_embedding = model.encode(query_text).tolist()
        
        # Query ChromaDB
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        
        # Parse and format results
        formatted_results = []
        if results and 'ids' in results and len(results['ids']) > 0:
            ids = results['ids'][0]
            distances = results['distances'][0] if 'distances' in results else [0.0] * len(ids)
            metadatas = results['metadatas'][0] if 'metadatas' in results else [{}] * len(ids)
            documents = results['documents'][0] if 'documents' in results else [""] * len(ids)
            
            for i in range(len(ids)):
                formatted_results.append({
                    "id": ids[i],
                    "document": documents[i],
                    "metadata": metadatas[i],
                    "distance": distances[i],
                    "similarity": round(1.0 - (distances[i] / 2.0), 4) # Normalize cosine distance to similarity
                })
                
        return jsonify({
            "success": True,
            "results": formatted_results
        })
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/rag/health', methods=['GET'])
def health_check():
    try:
        count = collection.count()
        return jsonify({
            "success": True, 
            "status": "healthy", 
            "items_in_db": count,
            "model": "all-MiniLM-L6-v2"
        })
    except Exception as e:
        return jsonify({"success": False, "status": "unhealthy", "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"RAG Service running on http://127.0.0.1:{port}")
    app.run(host='127.0.0.1', port=port, debug=False)
