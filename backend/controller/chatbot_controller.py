import os
import logging
import numpy as np
from flask import Blueprint, request, jsonify
from groq import Groq
from config import db  # Ensure db is correctly set up in config
from langchain_huggingface import HuggingFaceEmbeddings

# Flask Blueprint for chatbot routes
chatbot_controller = Blueprint('chatbot_controller', __name__)

# Validate and set OpenAI API key
PRIMARY_API_KEY = os.getenv("PRIMARY_API_KEY")
if not PRIMARY_API_KEY:
    raise Exception("PRIMARY_API_KEY environment variable is not set.")
primary_client = Groq(api_key=PRIMARY_API_KEY)

# Groq Client Setup
SECONDARY_API_KEY = os.getenv("SECONDARY_API_KEY")
client = Groq(api_key=SECONDARY_API_KEY)

# MongoDB Collection Setup
collection = db["pdf_embeddings"] if db is not None else None

# Embedding Model Initialization
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
            logging.error(f"[ERROR] Failed to add document: {e}", exc_info=True)

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
            if norm_vec1 == 0 or norm_vec2 == 0:
                logging.warning("[WARNING] Zero norm vector detected in cosine similarity.")
                return 0.0
            return dot_product / (norm_vec1 * norm_vec2)
        except Exception as e:
            logging.error(f"[ERROR] Cosine similarity calculation failed: {e}", exc_info=True)
            return 0.0


# Initialize vector store
if collection is not None:
    vector_store = CustomMongoDBVectorStore(collection=collection, embedding_function=embedding_model)
else:
    raise Exception("MongoDB connection failed, 'pdf_embeddings' collection not found.")


# Conversation memory class
class ConversationMemory:
    def __init__(self):
        self.messages = []

    def add_message(self, role, message):
        self.messages.append({"role": role, "message": message})

    def get_context(self):
        return " ".join([msg["message"] for msg in self.messages])


memory = ConversationMemory()


def call_primary_api(prompt):
    """Call OpenAI API as the primary API (new SDK)."""
    try:
        logging.info("[INFO] Attempting to call OpenAI primary API.")
        response = primary_client.chat.completions.create(
            model="llama-3.1-8b-instant",   # pick the model you actually have access to
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=512,
            temperature=1.0,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"[ERROR] Exception during OpenAI API call: {e}", exc_info=True)
        raise


def call_groq_api(chat_history):
    """Call the Groq AI API."""
    try:
        logging.info("[INFO] Attempting to call the Groq AI API.")
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=chat_history,
            max_tokens=512,
            temperature=1.2
        )
        logging.info("[INFO] Groq API response received successfully.")
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"[ERROR] Exception during Groq API call: {e}", exc_info=True)
        raise


@chatbot_controller.route('/chat_with_pdf', methods=['POST'])
def chat_with_pdf():
    """Route to handle chat with PDF content."""
    try:
        data = request.json
        user_message = data.get("message")
        pdf_content = data.get("pdfContent")

        if not user_message or not pdf_content:
            logging.error("[ERROR] Missing required parameters.")
            return jsonify({"error": "Missing required parameters (message and pdfContent)."}), 400

        prompt = f"PDF Content:\n{pdf_content}\nUser Message: {user_message}"

        # Attempt to call primary API
        try:
            logging.info("[INFO] Using primary API for response.")
            primary_response = call_primary_api(prompt)
            return jsonify({"response": primary_response}), 200
        except Exception:
            logging.warning("[WARNING] Primary API failed. Switching to Groq AI.")
            user_confirmation = data.get("switchToGroq", True)
            if not user_confirmation:
                return jsonify({"error": "Primary API failed, and user declined to switch to Groq AI."}), 400

            # Build conversation history for Groq API
            system_prompt = {
                "role": "system",
                "content": (
                    "You are a helpful assistant. If the user greets you (e.g., 'Hello'), reply politely without summarizing or referencing the document. "
                    "For all other queries, provide concise and relevant answers."
                )
            }

            chat_history = [system_prompt]
            chat_history.append({"role": "user", "content": prompt})

            # Call Groq API
            groq_response = call_groq_api(chat_history)
            return jsonify({"response": groq_response}), 200

    except Exception as e:
        logging.error(f"[ERROR] Exception in /chat_with_pdf: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred."}), 500


@chatbot_controller.route('/add_pdf_embeddings', methods=['POST'])
def add_pdf_embeddings():
    """Route to add PDF embeddings to MongoDB."""
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
