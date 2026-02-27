import io
import re
from flask import jsonify, request, send_file, session
from config import db, fs
import fitz
from bson import ObjectId
from model.syllabus import Syllabus
from sentence_transformers import SentenceTransformer
from controller.chatbot_controller import CustomMongoDBVectorStore
import logging
import gridfs

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

embeddings_collection = db["embeddings"]

vector_store = CustomMongoDBVectorStore(
    collection=embeddings_collection,
    embedding_function=embedding_model
)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'pdf'


def add_syllabus():
    """Add a new syllabus, store the PDF in GridFS, and generate embeddings automatically."""
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

        # ✅ Store PDF in GridFS
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

        try:
            logging.info("[INFO] Generating embeddings for uploaded PDF.")

            # Avoid duplicate embeddings
            existing = embeddings_collection.find_one({"pdf_id": str(pdf_file_id)})
            if not existing:

                file_data = fs.get(ObjectId(pdf_file_id))
                pdf_stream = io.BytesIO(file_data.read())
                document = fitz.open(stream=pdf_stream, filetype="pdf")

                text_content = ""
                for page in document:
                    text_content += page.get_text()

                document.close()

                if text_content.strip():

                    # 🔥 Chunking for better retrieval
                    chunks = [
                        sentence.strip()
                            for sentence in re.split(r'(?<=[.!?])\s+', text_content)
                                if sentence.strip()
                   ]
                    
                    embeddings = embedding_model.encode(chunks)

                    for chunk, embedding in zip(chunks, embeddings):
                        embeddings_collection.insert_one({
                            "pdf_id": str(pdf_file_id),
                            "embedding": embedding,
                            "embedding": embedding.tolist(),
                            "content": chunk
                        })

                    logging.info("[INFO] Embeddings stored successfully.")

                else:
                    logging.warning("[WARNING] No readable text found. Embeddings not created.")

        except Exception as embed_error:
            logging.error(f"[ERROR] Embedding generation failed: {embed_error}", exc_info=True)

        # ==========================================================

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
    
def extract_pdf_content(pdf_id):
    """Extract text content from the PDF file."""
    try:
        if not ObjectId.is_valid(pdf_id):
            return jsonify({"error": "Invalid PDF ID."}), 400

        file_data = fs.get(ObjectId(pdf_id))
        pdf_stream = io.BytesIO(file_data.read())

        document = fitz.open(stream=pdf_stream, filetype="pdf")
        text_content = ""

        for page in document:
            text_content += page.get_text()

        document.close()

        if not text_content.strip():
            return jsonify({"error": "No readable text found in the PDF file."}), 400

        return jsonify({"content": text_content}), 200

    except Exception as e:
        logging.error(f"[ERROR] extract_pdf_content failed: {e}", exc_info=True)
        return jsonify({"error": "Failed to extract PDF content."}), 500


def delete_syllabus(pdf_id):
    if 'username' not in session:
        return jsonify({"error": "User is not logged in"}), 401

    try:
        syllabus = Syllabus.objects(syllabus_pdf=pdf_id).first()
        if not syllabus:
            return jsonify({"error": "Syllabus not found"}), 404

        fs.delete(ObjectId(pdf_id))
        embeddings_collection.delete_many({"pdf_id": pdf_id})  # 🔥 Also delete embeddings
        syllabus.delete()
        return jsonify({"message": "Syllabus deleted successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to delete syllabus: {str(e)}"}), 500