import React, { useRef, useState } from "react";
import axios from "axios";

const UploadSyllabus = ({ syllabus, handleChange, resetForm, onUploadSuccess }) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(URL.createObjectURL(file));
    } else {
      setPdfFile(null);
      alert("Please upload a valid PDF file.");
    }
  };

  const handlePreview = (e) => {
    e.preventDefault();
    if (!fileInputRef.current || fileInputRef.current.files.length === 0) {
      alert("Please select a PDF file to upload.");
      return;
    }
    setShowPreview(true);
  };

  const resetFields = () => {
    setShowPreview(false);
    setPdfFile(null);
    setErrorMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (typeof resetForm === "function") {
      resetForm();
    }
  };

  const handleCancel = () => {
    resetFields();
  };

  const handleConfirmUpload = () => {
    setLoading(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("course_id", syllabus.course_id);
    formData.append("course_name", syllabus.course_name);
    formData.append("department_id", syllabus.department_id);
    formData.append("department_name", syllabus.department_name);
    formData.append("syllabus_description", syllabus.syllabus_description);
    formData.append("syllabus_pdf", fileInputRef.current.files[0]);

    axios
      .post("http://localhost:5000/add_syllabus", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      })
      .then((response) => {
        alert(response.data.message);
        resetFields();
        if (typeof onUploadSuccess === "function") onUploadSuccess();
      })
      .catch((error) => {
        setErrorMessage(error.response?.data?.error || "Failed to upload syllabus");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <form onSubmit={handlePreview} className="mb-4">
      <table className="table table-bordered">
        <thead>
          <tr>
            <th colSpan="2" className="text-center">Upload Syllabus</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Course ID</td>
            <td>
              <input
                type="text"
                name="course_id"
                className="form-control"
                placeholder="Course ID"
                value={syllabus.course_id || ""}
                onChange={handleChange}
                required
              />
            </td>
          </tr>
          <tr>
            <td>Course Name</td>
            <td>
              <input
                type="text"
                name="course_name"
                className="form-control"
                placeholder="Course Name"
                value={syllabus.course_name || ""}
                onChange={handleChange}
                required
              />
            </td>
          </tr>
          <tr>
            <td>Department ID</td>
            <td>
              <input
                type="text"
                name="department_id"
                className="form-control"
                placeholder="Department ID"
                value={syllabus.department_id || ""}
                onChange={handleChange}
                required
              />
            </td>
          </tr>
          <tr>
            <td>Department Name</td>
            <td>
              <input
                type="text"
                name="department_name"
                className="form-control"
                placeholder="Department Name"
                value={syllabus.department_name || ""}
                onChange={handleChange}
                required
              />
            </td>
          </tr>
          <tr>
            <td>Title and Syllabus Description</td>
            <td>
              <textarea
                name="syllabus_description"
                className="form-control"
                placeholder="Title and Syllabus Description"
                value={syllabus.syllabus_description || ""}
                onChange={handleChange}
                required
              />
            </td>
          </tr>
          <tr>
            <td>Upload Syllabus PDF</td>
            <td>
              <input
                type="file"
                name="syllabus_pdf"
                className="form-control"
                ref={fileInputRef}
                onChange={handleFileChange}
                required
              />
            </td>
          </tr>
        </tbody>
      </table>

      {errorMessage && <p className="text-danger text-center">{errorMessage}</p>}

      <div className="text-center">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Uploading..." : "Upload Syllabus"}
        </button>
      </div>

      {showPreview && (
        <div style={styles.modalOverlay}>
          <div style={styles.floatingTab}>
            <div style={styles.modalHeader}>
              <h5 style={styles.modalTitle}>Preview Syllabus</h5>
              <button style={styles.close} onClick={handleCancel}>
                &times;
              </button>
            </div>
            <div style={styles.modalBody}>
              <p>
                <strong>Course ID:</strong> {syllabus.course_id}
              </p>
              <p>
                <strong>Course Name:</strong> {syllabus.course_name}
              </p>
              <p>
                <strong>Department ID:</strong> {syllabus.department_id}
              </p>
              <p>
                <strong>Department Name:</strong> {syllabus.department_name}
              </p>
              <p>
                <strong>Description:</strong> {syllabus.syllabus_description}
              </p>

              {pdfFile && (
                <div className="text-center">
                  <embed src={pdfFile} width="650" height="400" type="application/pdf" />
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={handleConfirmUpload} className="btn btn-success me-2" disabled={loading}>
                {loading ? "Uploading..." : "Confirm Upload"}
              </button>
              <button onClick={handleCancel} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  floatingTab: {
    backgroundColor: "#fff",
    borderRadius: "20px",
    width: "95%",
    maxWidth: "1000px",
    height: "90%",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    padding: "15px",
    borderBottom: "1px solid #ddd",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: "1.2rem",
    margin: 0,
  },
  close: {
    background: "none",
    border: "none",
    fontSize: "1.8rem",
    cursor: "pointer",
    color: "#333",
  },
  modalBody: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  modalFooter: {
    padding: "20px",
    borderTop: "1px solid #ddd",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
};

export default UploadSyllabus;
