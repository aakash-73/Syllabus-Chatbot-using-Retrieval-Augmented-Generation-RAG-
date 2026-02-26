# professoruser_controller.py
from flask import Blueprint, jsonify, request
from model.user import User 

professoruser_controller = Blueprint('professoruser_controller', __name__, url_prefix='/professors')

@professoruser_controller.route('/', methods=['GET'])
def get_professors():
    try:
        professors = User.objects(user_type="professor")
        professor_list = [
            {
                "id": str(professor.id),
                "first_name": professor.first_name,
                "last_name": professor.last_name,
                "email": professor.email
            }
            for professor in professors
        ]
        return jsonify(professor_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@professoruser_controller.route('/<professor_id>', methods=['GET'])
def get_professor(professor_id):
    try:
        professor = User.objects(id=professor_id).first()
        if not professor:
            return jsonify({"error": "Professor not found"}), 404
        professor_data = {
            "id": str(professor.id),
            "first_name": professor.first_name,
            "last_name": professor.last_name,
            "email": professor.email,
            "user_type": professor.user_type 
        }
        return jsonify(professor_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@professoruser_controller.route('/<professor_id>', methods=['PUT'])
def update_professor(professor_id):
    data = request.json
    try:
        professor = User.objects(id=professor_id, user_type="professor").first()
        if not professor:
            return jsonify({"error": "Professor not found"}), 404

        if 'first_name' in data:
            professor.first_name = data['first_name']
        if 'last_name' in data:
            professor.last_name = data['last_name']
        if 'email' in data:
            professor.email = data['email']
        
        professor.save()
        return jsonify({"message": "Professor updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@professoruser_controller.route('/<professor_id>', methods=['DELETE'])
def delete_professor(professor_id):
    try:
        professor = User.objects(id=professor_id, user_type="professor").first()
        if not professor:
            return jsonify({"error": "Professor not found"}), 404

        professor.delete()
        return jsonify({"message": "Professor deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
