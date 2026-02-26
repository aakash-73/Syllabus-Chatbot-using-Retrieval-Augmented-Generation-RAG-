// StudentList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StudentUpdate from './StudentUpdate';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [studentToEdit, setStudentToEdit] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/students', { withCredentials: true });
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error.response || error);
    }
  };

  const handleDelete = async (studentId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this student?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/students/${studentId}`, { withCredentials: true });
      alert("Student deleted successfully");
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student");
    }
  };

  return (
    <div>
      <h2 className="text-center mt-4 mb-4">Student List</h2>
      <table className="table table-bordered table-hover table-striped">
        <thead className="table-dark">
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.id}>
              <td>{student.first_name}</td>
              <td>{student.last_name}</td>
              <td>{student.email}</td>
              <td>
                <button
                  onClick={() => setStudentToEdit(student)}
                  className="btn btn-warning btn-sm me-3"
                >
                  Update
                </button>
                <button
                  onClick={() => handleDelete(student.id)}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {studentToEdit && (
        <StudentUpdate
          studentId={studentToEdit.id}
          initialData={studentToEdit}
          onUpdateSuccess={() => {
            fetchStudents();
            setStudentToEdit(null);
          }}
          onCancel={() => setStudentToEdit(null)}
        />
      )}
    </div>
  );
};

export default StudentList;
