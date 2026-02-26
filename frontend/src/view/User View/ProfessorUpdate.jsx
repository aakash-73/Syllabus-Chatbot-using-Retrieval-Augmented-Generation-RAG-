// ProfessorUpdate.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProfessorUpdate = ({ professorId, onUpdateSuccess, onCancel }) => {
  const [professor, setProfessor] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfessor = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/professors/${professorId}`, { withCredentials: true });
        setProfessor(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching professor data:", error);
        setError("Failed to load professor data.");
        setLoading(false);
      }
    };

    if (professorId) fetchProfessor();
  }, [professorId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfessor((prevProfessor) => ({ ...prevProfessor, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');

    try {
      await axios.put(`http://localhost:5000/professors/${professorId}`, professor, { withCredentials: true });
      alert("Professor updated successfully!");
      onUpdateSuccess();
      console.error("Error updating professor:", error);
      setError("Failed to update professor.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Update Professor</h5>
            <button type="button" className="close" onClick={onCancel}>&times;</button>
          </div>
          <div className="modal-body">
            {error && <p className="text-danger">{error}</p>}
            {loading ? (
              <p>Loading professor details...</p>
            ) : (
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={professor.first_name}
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
                    value={professor.last_name}
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
                    value={professor.email}
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

export default ProfessorUpdate;
