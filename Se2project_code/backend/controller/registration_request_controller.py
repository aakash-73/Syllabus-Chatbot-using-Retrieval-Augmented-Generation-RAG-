from flask import Blueprint, jsonify, request
from model.user import User

registration_request_controller = Blueprint('registration_request_controller', __name__)

@registration_request_controller.route('', methods=['GET'])
def get_requests():
    try:
        requests = User.objects(status="pending")
        request_list = [
            {
                "id": str(req.id),
                "first_name": req.first_name,
                "last_name": req.last_name,
                "email": req.email,
                "user_type": req.user_type
            }
            for req in requests
        ]
        return jsonify(request_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@registration_request_controller.route('/<request_id>/accept', methods=['POST'])
def accept_request(request_id):
    try:
        user = User.objects(id=request_id, status="pending").first()
        if not user:
            return jsonify({"error": "Request not found"}), 404
        user.update(status="approved")
        return jsonify({"message": "Request accepted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@registration_request_controller.route('/<request_id>/reject', methods=['DELETE'])
def reject_request(request_id):
    try:
        user = User.objects(id=request_id, status="pending").first()
        if not user:
            return jsonify({"error": "Request not found"}), 404
        user.delete()
        return jsonify({"message": "Request rejected"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
