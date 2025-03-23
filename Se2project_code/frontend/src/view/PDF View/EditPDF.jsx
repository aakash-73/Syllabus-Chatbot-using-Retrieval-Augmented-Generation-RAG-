// EditPDF.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const EditPDF = ({ pdfId, handleClose, onUpdateSuccess }) => {
  const [syllabus, setSyllabus] = useState(null);
  const fileInputRef = useRef(null);
  const [newFilePreview, setNewFilePreview] = useState(null);

  useEffect(() => {
    const fetchSyllabus = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/syllabus/${pdfId}`, { withCredentials: true });
        setSyllabus(response.data);
        console.log("Syllabus fetched for editing:", response.data);
      } catch (error) {
        console.error("Error fetching syllabus data:", error);
      }
    };

    if (pdfId) fetchSyllabus();
  }, [pdfId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSyllabus({ ...syllabus, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setNewFilePreview(URL.createObjectURL(file));
    } else {
      setNewFilePreview(null);
      alert("Please upload a valid PDF file.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('course_id', syllabus.course_id);
    formData.append('course_name', syllabus.course_name);
    formData.append('department_id', syllabus.department_id);
    formData.append('department_name', syllabus.department_name);
    formData.append('syllabus_description', syllabus.syllabus_description);

    if (fileInputRef.current.files[0]) {
      formData.append('syllabus_pdf', fileInputRef.current.files[0]);
    } else {
      formData.append('syllabus_pdf', syllabus.syllabus_pdf);
    }

    try {
      await axios.put(`http://localhost:5000/update_syllabus/${pdfId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      alert('Syllabus updated successfully!');
      if (typeof onUpdateSuccess === "function") onUpdateSuccess();  
      if (typeof handleClose === "function") handleClose();
    } catch (error) {
      console.error("Error updating syllabus:", error);
      alert('Failed to update syllabus.');
    }
  };

  if (!syllabus) return null;

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Syllabus</h5>
            <button type="button" className="close" onClick={handleClose}>&times;</button>
          </div>
          <form onSubmit={handleUpdate}>
            <div className="modal-body">
              <input
                type="text"
                name="course_id"
                value={syllabus.course_id || ''}
                onChange={handleChange}
                placeholder="Course ID"
                className="form-control mb-2"
              />
              <input
                type="text"
                name="course_name"
                value={syllabus.course_name || ''}
                onChange={handleChange}
                placeholder="Course Name"
                className="form-control mb-2"
              />
              <input
                type="text"
                name="department_id"
                value={syllabus.department_id || ''}
                onChange={handleChange}
                placeholder="Department ID"
                className="form-control mb-2"
              />
              <input
                type="text"
                name="department_name"
                value={syllabus.department_name || ''}
                onChange={handleChange}
                placeholder="Department Name"
                className="form-control mb-2"
              />
              <textarea
                name="syllabus_description"
                value={syllabus.syllabus_description || ''}
                onChange={handleChange}
                placeholder="Title and Syllabus Description"
                className="form-control mb-2"
              />

              {newFilePreview ? (
                <div className="mb-3">
                  <label>New PDF Preview:</label>
                  <embed src={newFilePreview} width="100%" height="400px" type="application/pdf" />
                </div>
              ) : (
                syllabus.syllabus_pdf && (
                  <div className="mb-3">
                    <label>Current PDF Preview:</label>
                    <embed
                      src={`http://localhost:5000/get_pdf/${syllabus.syllabus_pdf}`}
                      width="100%"
                      height="400px"
                      type="application/pdf"
                    />
                  </div>
                )
              )}

              <div className="mb-3">
                <label>Upload New PDF (optional):</label>
                <input
                  type="file"
                  name="syllabus_pdf"
                  ref={fileInputRef}
                  className="form-control mb-2"
                  onChange={handleFileChange}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary">Update</button>
              <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPDF;
