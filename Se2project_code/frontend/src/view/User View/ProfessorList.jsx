// ProfessorList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ProfessorUpdate from './ProfessorUpdate';  

const ProfessorList = () => {
  const [professors, setProfessors] = useState([]);
  const [professorToEdit, setProfessorToEdit] = useState(null);

  useEffect(() => {
    fetchProfessors();
  }, []);

  const fetchProfessors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/professors', { withCredentials: true });
      setProfessors(response.data);
    } catch (error) {
      console.error("Error fetching professors:", error.response || error);
    }
  };

  const handleDelete = async (professorId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this professor?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/professors/${professorId}`, { withCredentials: true });
      alert("Professor deleted successfully");
      fetchProfessors();
    } catch (error) {
      console.error("Error deleting professor:", error);
      alert("Failed to delete professor");
    }
  };

  return (
    <div>
      <h2>Professor List</h2>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {professors.map(professor => (
            <tr key={professor.id}>
              <td>{professor.first_name}</td>
              <td>{professor.last_name}</td>
              <td>{professor.email}</td>
              <td>
                <button
                  onClick={() => setProfessorToEdit(professor)}
                  className="btn btn-warning btn-sm"
                  style={{ marginRight: '20px' }}
                >
                  Update
                </button>
                <button
                  onClick={() => handleDelete(professor.id)}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {professorToEdit && (
        <ProfessorUpdate
          professorId={professorToEdit.id}
          initialData={professorToEdit}
          onUpdateSuccess={() => {
            fetchProfessors();
            setProfessorToEdit(null);
          }}
          onCancel={() => setProfessorToEdit(null)}
        />
      )}
    </div>
  );
};

export default ProfessorList;
