// StudentUpdate.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentUpdate = ({ studentId, onUpdateSuccess, onCancel }) => {
  const [student, setStudent] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/students/${studentId}`, { withCredentials: true });
        setStudent(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching student data:", error);
        setError("Failed to load student data.");
        setLoading(false);
      }
    };

    if (studentId) fetchStudent();
  }, [studentId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudent((prevStudent) => ({ ...prevStudent, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');

    try {
      await axios.put(`http://localhost:5000/students/${studentId}`, student, { withCredentials: true });
      alert("Student updated successfully!");
      onUpdateSuccess();
    } catch (error) {
      console.error("Error updating student:", error);
      setError("Failed to update student.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Update Student</h5>
            <button type="button" className="close" onClick={onCancel}>&times;</button>
          </div>
          <div className="modal-body">
            {error && <p className="text-danger">{error}</p>}
            {loading ? (
              <p>Loading student details...</p>
            ) : (
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={student.first_name}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={student.last_name}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={student.email}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary" disabled={updating}>
                    {updating ? 'Updating...' : 'Update'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentUpdate;
