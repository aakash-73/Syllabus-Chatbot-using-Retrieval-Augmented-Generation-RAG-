// DeletePDF.js
import React from 'react';
import axios from 'axios';

const DeletePDF = ({ pdfId, handleClose, onDeleteSuccess }) => {
  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/delete_syllabus/${pdfId}`, { withCredentials: true });
      alert('Syllabus deleted successfully!');
      onDeleteSuccess();  
      handleClose();     
    } catch (error) {
      console.error("Error deleting syllabus:", error);
      alert('Failed to delete syllabus.');
    }
  };

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Confirm Delete</h5>
            <button type="button" className="close" onClick={handleClose}>&times;</button>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to delete this syllabus and its associated PDF?</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletePDF;
