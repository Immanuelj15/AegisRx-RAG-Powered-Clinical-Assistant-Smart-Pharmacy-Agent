import os
import csv
import json
import math
from collections import Counter
from flask import Flask, request, jsonify
from flask_cors import CORS
import chromadb
from sentence_transformers import SentenceTransformer, CrossEncoder

app = Flask(__name__)
CORS(app)

# Load the SentenceTransformer model
print("Loading sentence-transformers/all-MiniLM-L6-v2 model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded successfully.")

# Load the CrossEncoder model with offline resilience
try:
    print("Loading cross-encoder/ms-marco-MiniLM-L-6-v2 model...")
    reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
    print("Reranker cross-encoder model loaded successfully.")
except Exception as e:
    print(f"Warning: Failed to load Cross-Encoder, proceeding with RRF fallback: {e}")
    reranker = None

# Custom Zero-Dependency BM25 Lexical Scoring Implementation
class SimpleBM25:
    def __init__(self, corpus, k1=1.5, b=0.75):
        self.k1 = k1
        self.b = b
        self.corpus_size = len(corpus)
        self.tokenized_corpus = [self.tokenize(doc) for doc in corpus]
        self.doc_lens = [len(doc) for doc in self.tokenized_corpus]
        self.avg_doc_len = sum(self.doc_lens) / self.corpus_size if self.corpus_size > 0 else 0
        
        self.doc_freqs = []
        nd = {}
        for doc in self.tokenized_corpus:
            frequencies = Counter(doc)
            self.doc_freqs.append(frequencies)
            for term in frequencies:
                nd[term] = nd.get(term, 0) + 1
                
        self.idf = {}
        for term, freq in nd.items():
            # Standard BM25 IDF
            self.idf[term] = math.log((self.corpus_size - freq + 0.5) / (freq + 0.5) + 1.0)
            
    def tokenize(self, text):
        if not text:
            return []
        # simple lowercase tokenization ignoring punctuation
        return [word.strip(",.?!()[]{}:;\"'").lower() for word in text.split() if word]
        
    def get_scores(self, query):
        query_tokens = self.tokenize(query)
        scores = []
        for idx in range(self.corpus_size):
            score = 0.0
            doc_len = self.doc_lens[idx]
            frequencies = self.doc_freqs[idx]
            for term in query_tokens:
                if term in frequencies:
                    freq = frequencies[term]
                    idf = self.idf.get(term, 0)
                    num = freq * (self.k1 + 1)
                    denom = freq + self.k1 * (1 - self.b + self.b * doc_len / self.avg_doc_len)
                    score += idf * (num / denom)
            scores.append(score)
        return scores

# Reciprocal Rank Fusion (RRF) algorithm for merging sparse and dense candidate ranks
def reciprocal_rank_fusion(dense_results, sparse_results, k=60):
    rrf_scores = {}
    
    for rank, item in enumerate(dense_results):
        doc_id = item['id']
        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + 1.0 / (k + (rank + 1))
        
    for rank, item in enumerate(sparse_results):
        doc_id = item['id']
        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + 1.0 / (k + (rank + 1))
        
    # Sort by score descending
    sorted_ids = sorted(rrf_scores.keys(), key=lambda x: rrf_scores[x], reverse=True)
    return sorted_ids, rrf_scores

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
            
        # 1. Sparse Retrieval: Build BM25 index on-the-fly from active Chroma records
        db_data = collection.get()
        sparse_results = []
        if db_data and 'ids' in db_data and len(db_data['ids']) > 0:
            ids = db_data['ids']
            documents = db_data['documents']
            metadatas = db_data['metadatas']
            
            bm25 = SimpleBM25(documents)
            bm25_scores = bm25.get_scores(query_text)
            
            for idx, score in enumerate(bm25_scores):
                if score > 0.05:  # Keep candidates with meaningful keyword matches
                    sparse_results.append({
                        "id": ids[idx],
                        "document": documents[idx],
                        "metadata": metadatas[idx],
                        "score": score
                    })
            # Sort sparse candidates descending by lexical score
            sparse_results.sort(key=lambda x: x['score'], reverse=True)
            
        # 2. Dense Retrieval: Query ChromaDB for top conceptual matches
        dense_results = []
        query_embedding = model.encode(query_text).tolist()
        # Fetch more candidates than requested to form a solid reranking pool
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(20, count)
        )
        
        if results and 'ids' in results and len(results['ids']) > 0:
            d_ids = results['ids'][0]
            d_distances = results['distances'][0] if 'distances' in results else [0.0] * len(d_ids)
            d_metadatas = results['metadatas'][0] if 'metadatas' in results else [{}] * len(d_ids)
            d_documents = results['documents'][0] if 'documents' in results else [""] * len(d_ids)
            
            for i in range(len(d_ids)):
                dense_results.append({
                    "id": d_ids[i],
                    "document": d_documents[i],
                    "metadata": d_metadatas[i],
                    "distance": d_distances[i],
                    "similarity": round(1.0 - (d_distances[i] / 2.0), 4)
                })

        # 3. Merge & Deduplicate Sparse & Dense Candidates
        candidate_dict = {}
        for item in dense_results + sparse_results:
            candidate_dict[item['id']] = item
            
        unique_candidates = list(candidate_dict.values())
        
        # 4. Reranking Pipeline
        final_results = []
        if reranker is not None and len(unique_candidates) > 0:
            print(f"Reranking {len(unique_candidates)} candidates using Cross-Encoder model...")
            # Build query-document pairs
            pairs = [[query_text, item['document']] for item in unique_candidates]
            
            # Predict reranking scores
            rerank_scores = reranker.predict(pairs)
            if not isinstance(rerank_scores, list) and hasattr(rerank_scores, 'tolist'):
                rerank_scores = rerank_scores.tolist()
                
            for idx, score in enumerate(rerank_scores):
                item = unique_candidates[idx]
                # Convert raw logit similarity to clean sigmoid range [0, 1]
                sigmoid_similarity = round(1.0 / (1.0 + math.exp(-score)), 4)
                final_results.append({
                    "id": item['id'],
                    "document": item['document'],
                    "metadata": item['metadata'],
                    "distance": round(score, 4),
                    "similarity": sigmoid_similarity
                })
            # Sort by sigmoid similarity score descending
            final_results.sort(key=lambda x: x['similarity'], reverse=True)
        else:
            # Fallback to Reciprocal Rank Fusion (RRF) if CrossEncoder is offline
            print("Performing Reciprocal Rank Fusion (RRF) candidate merge...")
            rrf_ids, rrf_scores = reciprocal_rank_fusion(dense_results, sparse_results)
            
            for doc_id in rrf_ids:
                item = candidate_dict[doc_id]
                final_results.append({
                    "id": item['id'],
                    "document": item['document'],
                    "metadata": item['metadata'],
                    "distance": round(rrf_scores[doc_id], 6),
                    "similarity": round(item.get('similarity', 0.55), 4)
                })
                
        # Sift results to final top_k limit
        formatted_results = final_results[:top_k]
        
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
