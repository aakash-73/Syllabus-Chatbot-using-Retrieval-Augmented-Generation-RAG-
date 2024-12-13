from flask import Blueprint, request, jsonify
from langchain_huggingface import HuggingFaceEmbeddings  # Updated import
from config import db
import numpy as np
import requests
import logging

chatbot_controller = Blueprint('chatbot_controller', __name__)

collection = db["pdf_embeddings"] if db is not None else None

embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

class CustomMongoDBVectorStore:
    def __init__(self, collection, embedding_function):
        self.collection = collection
        self.embedding_function = embedding_function

    def add_document(self, pdf_id, pdf_content):
        try:
            embedding = self.embedding_function.embed_documents([pdf_content])[0]
            vector_data = {
                "pdf_id": pdf_id,
                "embedding": embedding.tolist(),
                "content": pdf_content
            }
            self.collection.insert_one(vector_data)
            logging.info(f"[INFO] Document added successfully with PDF ID: {pdf_id}")
        except Exception as e:
            logging.error(f"[ERROR] Failed to add document: {e}")

    def search(self, query, top_k=5):
        try:
            query_embedding = self.embedding_function.embed_query(query)
            query_vector = np.array(query_embedding)

            results = []
            for doc in self.collection.find():
                doc_embedding = np.array(doc["embedding"])
                similarity = self._cosine_similarity(query_vector, doc_embedding)
                results.append((doc["content"], similarity))

            if not results:
                logging.warning("[WARNING] No documents found in the vector store.")
                return []

            results.sort(key=lambda x: x[1], reverse=True)
            return [content for content, _ in results[:top_k]]
        except Exception as e:
            logging.error(f"[ERROR] Vector store search failed: {e}", exc_info=True)
            return []

    def _cosine_similarity(self, vec1, vec2):
        try:
            dot_product = np.dot(vec1, vec2)
            norm_vec1 = np.linalg.norm(vec1)
            norm_vec2 = np.linalg.norm(vec2)
            return dot_product / (norm_vec1 * norm_vec2)
        except Exception as e:
            logging.error(f"[ERROR] Cosine similarity calculation failed: {e}")
            return 0.0

if collection is not None:
    vector_store = CustomMongoDBVectorStore(collection=collection, embedding_function=embedding_model)
else:
    raise Exception("MongoDB connection failed, 'pdf_embeddings' collection not found.")

class ConversationMemory:
    def __init__(self):
        self.messages = []

    def add_message(self, role, message):
        self.messages.append({"role": role, "message": message})

    def get_context(self):
        return " ".join([msg["message"] for msg in self.messages])

memory = ConversationMemory()
@chatbot_controller.route('/chat_with_pdf', methods=['POST'])
def chat_with_pdf():
    try:
        data = request.json
        user_message = data.get("message")
        pdf_content = data.get("pdfContent")

        if not user_message or not pdf_content:
            logging.error("[ERROR] Missing required parameters.")
            return jsonify({"error": "Missing required parameters (message and pdfContent)."}), 400

        prompt = f"PDF Content:\n{pdf_content}\n\nUser Message: {user_message}"

        api_url = "http://csai01:8000/generate/"
        payload = {
            "prompt": prompt,
            "max_tokens": 512
        }

        response = requests.post(api_url, json=payload)
        if response.status_code == 200:
            response_json = response.json()
            bot_response = response_json.get('response', {}).get('content', "I'm not sure about that. Could you rephrase?")
        else:
            logging.error(f"[ERROR] API call failed with status code {response.status_code}: {response.text}")
            return jsonify({"error": "Failed to generate response using the external API."}), 500
        print(bot_response)
        return jsonify({"response": bot_response}), 200

    except Exception as e:
        logging.error(f"[ERROR] Exception in /chat_with_pdf: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred."}), 500

@chatbot_controller.route('/add_pdf_embeddings', methods=['POST'])
def add_pdf_embeddings():
    try:
        data = request.json
        pdf_content = data.get("pdfContent")
        pdf_id = data.get("pdfId")

        if not pdf_content or not pdf_id:
            logging.error("[ERROR] Invalid input data for embedding.")
            return jsonify({"error": "Invalid input. Please provide PDF content and PDF ID."}), 400

        vector_store.add_document(pdf_id, pdf_content)
        logging.info(f"[INFO] PDF content embeddings added successfully for PDF ID: {pdf_id}")
        return jsonify({"message": "PDF content embeddings added successfully."}), 200

    except Exception as e:
        logging.error(f"[ERROR] Exception in /add_pdf_embeddings: {e}", exc_info=True)
        return jsonify({"error": "Failed to add PDF embeddings."}), 500

@chatbot_controller.route('/list_pdf_embeddings', methods=['GET'])
def list_pdf_embeddings():
    """List all PDF embeddings stored in MongoDB."""
    try:
        documents = list(collection.find({}, {"pdf_id": 1, "content": 1}))
        return jsonify({"documents": documents}), 200
    except Exception as e:
        logging.error(f"[ERROR] Failed to list PDF embeddings: {e}", exc_info=True)
        return jsonify({"error": "Failed to list PDF embeddings."}), 500