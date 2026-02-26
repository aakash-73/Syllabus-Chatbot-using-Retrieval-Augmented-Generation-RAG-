from flask import Blueprint, jsonify, request
from config import db
from model.user import User

studentuser_controller = Blueprint('studentuser_controller', __name__)

@studentuser_controller.route('/', methods=['GET'])
def get_students():
    try:
        students = User.objects(user_type="student")
        student_list = [
            {
                "id": str(student.id),
                "first_name": student.first_name,
                "last_name": student.last_name,
                "email": student.email
            }
            for student in students
        ]
        return jsonify(student_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@studentuser_controller.route('/<student_id>', methods=['GET'])
def get_student(student_id):
    try:
        student = User.objects(id=student_id, user_type="student").first()
        if not student:
            return jsonify({"error": "Student not found"}), 404

        student_data = {
            "id": str(student.id),
            "first_name": student.first_name,
            "last_name": student.last_name,
            "email": student.email
        }
        return jsonify(student_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@studentuser_controller.route('/<student_id>', methods=['PUT'])
def update_student(student_id):
    data = request.json
    try:
        student = User.objects(id=student_id, user_type="student").first()
        if not student:
            return jsonify({"error": "Student not found"}), 404

        student.update(**data)
        return jsonify({"message": "Student updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@studentuser_controller.route('/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    try:
        student = User.objects(id=student_id, user_type="student").first()
        if not student:
            return jsonify({"error": "Student not found"}), 404

        student.delete()
        return jsonify({"message": "Student deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
