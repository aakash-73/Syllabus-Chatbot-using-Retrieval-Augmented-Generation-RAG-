from datetime import timedelta
from flask import Flask, request, jsonify, make_response # type: ignore
from flask_cors import CORS, cross_origin # type: ignore
from controller.studentuser_controller import studentuser_controller
from controller.professoruser_controller import professoruser_controller
from controller.chatbot_controller import chatbot_controller
from controller.registration_request_controller import registration_request_controller
from config import Config
from controller import auth_controller, syllabus_controller
from groq import Groq
import logging
from dotenv import load_dotenv
load_dotenv()


app = Flask(__name__)
app.config.from_object(Config)
app.secret_key = '199d3cc197e2211649ac7c405c23d53cdf94ba9442ca726f'

CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

app.permanent_session_lifetime = timedelta(days=1)

logging.basicConfig(level=logging.DEBUG)

def check_groq_connection():
    """Function to check connection to Groq AI."""
    try:
        groq_client = Groq(api_key="YOUR_SECONDARY_API_KEY")
        groq_client.health_check()  # Example health-check method
        logging.debug("[DEBUG] Groq AI connection successful.")
        return True
    except Exception as e:
        logging.error(f"[ERROR] Groq AI connection failed: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for API and Groq AI connection."""
    groq_ai_status = check_groq_connection()

    status = {
        "status": "ok",
        "message": "API is running",
        "groq_ai_connection": "successful" if groq_ai_status else "failed"
    }
    return jsonify(status), 200 if groq_ai_status else 500

@app.route('/')
def home():
    """Home endpoint."""
    logging.debug("[DEBUG] Home endpoint called.")
    return "Welcome to the Syllabus Chatbot API!"

app.add_url_rule('/register', 'register', auth_controller.register, methods=['POST'])
app.add_url_rule('/login', 'login', auth_controller.login, methods=['POST'])

app.add_url_rule('/add_syllabus', 'add_syllabus', syllabus_controller.add_syllabus, methods=['POST'])
app.add_url_rule('/syllabi', 'get_professor_syllabi', syllabus_controller.get_professor_syllabi, methods=['GET'])
app.add_url_rule('/syllabi/all', 'get_syllabi', syllabus_controller.get_syllabi, methods=['GET'])
app.add_url_rule('/get_pdf/<pdf_id>', 'get_pdf_file', syllabus_controller.get_pdf_file, methods=['GET'])
app.add_url_rule('/syllabus/<pdf_id>', 'get_single_syllabus', syllabus_controller.get_single_syllabus, methods=['GET'])
app.add_url_rule('/update_syllabus/<pdf_id>', 'update_syllabus', syllabus_controller.update_syllabus, methods=['PUT'])
app.add_url_rule('/delete_syllabus/<pdf_id>', 'delete_syllabus', syllabus_controller.delete_syllabus, methods=['DELETE'])
app.add_url_rule('/extract_pdf_content/<pdf_id>', 'extract_pdf_content', syllabus_controller.extract_pdf_content, methods=['GET'])

app.register_blueprint(registration_request_controller, url_prefix='/registration_requests')

app.register_blueprint(studentuser_controller, url_prefix='/students')
app.register_blueprint(professoruser_controller, url_prefix='/professors')
app.register_blueprint(chatbot_controller, url_prefix='/chatbot')

@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        logging.debug("[DEBUG] Handling OPTIONS preflight request.")
        response = make_response()
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response, 200

@app.errorhandler(500)
def internal_server_error(e):
    logging.error(f"[ERROR] Internal server error: {e}")
    return jsonify({"error": "An unexpected internal server error occurred."}), 500

@app.errorhandler(404)
def not_found_error(e):
    logging.warning(f"[WARNING] Resource not found: {e}")
    return jsonify({"error": "The requested resource was not found."}), 404

if __name__ == "__main__":
    logging.info("[INFO] Starting Flask server on http://localhost:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)
