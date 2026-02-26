import io
from pdfminer.high_level import extract_text
from flask import jsonify, request, send_file, session
from pypdf import PdfReader
from config import db, fs
import fitz
from bson import ObjectId
from model.syllabus import Syllabus
from sentence_transformers import SentenceTransformer
from embedding_utils import generate_embeddings
from controller.chatbot_controller import CustomMongoDBVectorStore, embedding_model, collection
import logging
import numpy as np

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

embeddings_collection = db["embeddings"]

vector_store = CustomMongoDBVectorStore(collection=collection, embedding_function=embedding_model)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'pdf'


def add_syllabus():
    """Add a new syllabus and store the PDF file in GridFS."""
    try:
        username = session.get('username')
        if not username:
            return jsonify({"error": "User is not logged in"}), 401

        course_id = request.form.get('course_id')
        course_name = request.form.get('course_name')
        department_id = request.form.get('department_id')
        department_name = request.form.get('department_name')
        syllabus_description = request.form.get('syllabus_description')
        file = request.files.get('syllabus_pdf')

        if not all([course_id, course_name, department_id, department_name, syllabus_description, file]):
            return jsonify({"error": "All fields are required."}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid file type. Only PDF files are allowed."}), 400

        pdf_file_id = fs.put(file, filename=file.filename, content_type='application/pdf')

        syllabus = Syllabus(
            course_id=course_id,
            course_name=course_name,
            department_id=department_id,
            department_name=department_name,
            syllabus_description=syllabus_description,
            syllabus_pdf=str(pdf_file_id),
            uploaded_by=username
        )
        syllabus.save()

        return jsonify({
            "message": "Syllabus added successfully!",
            "pdf_file_id": str(pdf_file_id),
            "course_id": course_id,
            "course_name": course_name
        }), 201

    except gridfs.errors.GridFSError as gridfs_error:
        print(f"[ERROR] GridFS error: {str(gridfs_error)}")
        return jsonify({"error": "Failed to store the file. Please try again later."}), 500

    except Exception as e:
        print(f"[ERROR] Unexpected error in add_syllabus: {str(e)}")
        return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500


def get_professor_syllabi():
    """Retrieve syllabi uploaded by a specific professor."""
    username = session.get('username')
    if not username:
        return jsonify({"error": "User is not logged in"}), 401

    try:
        syllabi = Syllabus.objects(uploaded_by=username)
        syllabus_list = [{
            "course_id": s.course_id,
            "course_name": s.course_name,
            "department_id": s.department_id,
            "department_name": s.department_name,
            "professor": s.uploaded_by,
            "syllabus_description": s.syllabus_description,
            "syllabus_pdf": s.syllabus_pdf
        } for s in syllabi]

        return jsonify(syllabus_list), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve syllabi: {str(e)}"}), 500

def get_syllabi():
    """Retrieve all syllabi for students."""
    try:
        syllabi = Syllabus.objects()
        syllabus_list = [{
            "course_id": s.course_id,
            "course_name": s.course_name,
            "department_id": s.department_id,
            "department_name": s.department_name,
            "professor": s.uploaded_by,
            "syllabus_description": s.syllabus_description,
            "syllabus_pdf": s.syllabus_pdf
        } for s in syllabi]

        return jsonify(syllabus_list), 200

    except Exception as e:
        return jsonify({"error": f"Failed to retrieve syllabi: {str(e)}"}), 500

def get_pdf_file(pdf_id):
    """Retrieve a PDF file from GridFS by its ID."""
    try:
        file_data = fs.get(ObjectId(pdf_id))
        return send_file(
            io.BytesIO(file_data.read()),
            mimetype='application/pdf',
            as_attachment=False,
            download_name=file_data.filename
        )
    except Exception as e:
        return jsonify({"error": f"PDF file not found: {str(e)}"}), 404
    
def get_single_syllabus(pdf_id):
    """Retrieve a single syllabus by its PDF ID."""
    try:
        if not ObjectId.is_valid(pdf_id):
            return jsonify({"error": "Invalid syllabus ID"}), 400

        syllabus = Syllabus.objects(syllabus_pdf=pdf_id).first()  
        if not syllabus:
            return jsonify({"error": "Syllabus not found"}), 404

        syllabus_data = {
            "id": str(syllabus.id),
            "course_id": syllabus.course_id,
            "course_name": syllabus.course_name,
            "department_id": syllabus.department_id,
            "department_name": syllabus.department_name,
            "syllabus_description": syllabus.syllabus_description,
            "syllabus_pdf": syllabus.syllabus_pdf,
            "uploaded_by": syllabus.uploaded_by
        }
        return jsonify(syllabus_data), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve syllabus: {str(e)}"}), 500

def update_syllabus(pdf_id):
    """Update a syllabus and optionally replace its PDF."""
    if 'username' not in session:
        return jsonify({"error": "User is not logged in"}), 401

    try:
        syllabus = Syllabus.objects(syllabus_pdf=pdf_id).first()
        if not syllabus:
            return jsonify({"error": "Syllabus not found"}), 404

        syllabus.course_id = request.form.get('course_id', syllabus.course_id)
        syllabus.course_name = request.form.get('course_name', syllabus.course_name)
        syllabus.department_id = request.form.get('department_id', syllabus.department_id)
        syllabus.department_name = request.form.get('department_name', syllabus.department_name)
        syllabus.syllabus_description = request.form.get('syllabus_description', syllabus.syllabus_description)

        new_file = request.files.get('syllabus_pdf')
        if new_file and allowed_file(new_file.filename):
            fs.delete(ObjectId(pdf_id))
            new_pdf_id = fs.put(new_file, filename=new_file.filename, content_type='application/pdf')
            syllabus.syllabus_pdf = str(new_pdf_id)

        syllabus.save()
        return jsonify({"message": "Syllabus updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to update syllabus: {str(e)}"}), 500

def delete_syllabus(pdf_id):
    """Delete a syllabus and its associated PDF from the database."""
    if 'username' not in session:
        return jsonify({"error": "User is not logged in"}), 401

    try:
        syllabus = Syllabus.objects(syllabus_pdf=pdf_id).first()
        if not syllabus:
            return jsonify({"error": "Syllabus not found"}), 404

        fs.delete(ObjectId(pdf_id))
        syllabus.delete()
        return jsonify({"message": "Syllabus deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to delete syllabus: {str(e)}"}), 500
    
def store_embeddings(pdf_id, sentences, embeddings):
    """Store embeddings in MongoDB."""
    for i, embedding in enumerate(embeddings):
        embeddings_collection.insert_one({
            "pdf_id": pdf_id,
            "sentence": sentences[i],
            "embedding": embedding.tolist()
        })
    print("[INFO] Embeddings stored successfully.")

def extract_pdf_content(pdf_id):
    """Extract text content from the PDF file."""
    try:
        print(f"[DEBUG] Received request to extract content for PDF ID: {pdf_id}")

        if not ObjectId.is_valid(pdf_id):
            print("[ERROR] Invalid PDF ID.")
            return jsonify({"error": "Invalid PDF ID."}), 400

        try:
            file_data = fs.get(ObjectId(pdf_id))
            print("[DEBUG] Successfully retrieved PDF file from GridFS.")
        except Exception as e:
            print(f"[ERROR] Error fetching PDF from GridFS: {e}")
            return jsonify({"error": f"Failed to fetch PDF from database: {str(e)}"}), 500

        if not file_data:
            print("[ERROR] PDF file not found.")
            return jsonify({"error": "PDF file not found."}), 404

        pdf_stream = io.BytesIO(file_data.read())
        print("[DEBUG] PDF file loaded into memory.")

        try:
            document = fitz.open(stream=pdf_stream, filetype="pdf")
            text_content = ""

            for page_num in range(len(document)):
                page = document.load_page(page_num)
                page_text = page.get_text()
                if page_text:
                    text_content += page_text
                    print(f"[DEBUG] Extracted text from page {page_num + 1}.")

            document.close()

            if not text_content.strip():
                print("[ERROR] No readable text found in the PDF file.")
                return jsonify({"error": "No readable text found in the PDF file."}), 400

            print("[DEBUG] PDF content extraction successful.")
            return jsonify({"content": text_content}), 200

        except Exception as extraction_error:
            print(f"[ERROR] PDF extraction error using PyMuPDF: {extraction_error}")
            return jsonify({"error": "Failed to extract PDF content."}), 500

    except Exception as e:
        print(f"[ERROR] Unexpected error in extract_pdf_content: {e}")
        return jsonify({"error": "An unexpected error occurred while processing the PDF content."}), 500
    
def similarity_search(pdf_id, user_query, top_k=5):
    """Perform similarity search on stored embeddings."""
    try:
        print(f"[DEBUG] Performing similarity search for PDF ID: {pdf_id}")

        query_embedding = embedding_model.encode(user_query, convert_to_numpy=True)

        embeddings = list(embeddings_collection.find({"pdf_id": pdf_id}))
        scores = []

        for item in embeddings:
            sentence_embedding = np.array(item["embedding"])
            score = np.dot(query_embedding, sentence_embedding) / (np.linalg.norm(query_embedding) * np.linalg.norm(sentence_embedding))
            scores.append((item["sentence"], score))

        top_sentences = sorted(scores, key=lambda x: x[1], reverse=True)[:top_k]
        context = "\n".join([s[0] for s in top_sentences])

        return context

    except Exception as e:
        print(f"[ERROR] Similarity search failed: {e}")
        return None
