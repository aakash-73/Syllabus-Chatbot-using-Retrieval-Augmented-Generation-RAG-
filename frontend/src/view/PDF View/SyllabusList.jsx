// SyllabusList.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PdfViewer from './PdfViewer';
import EditPDF from './EditPDF';
import DeletePDF from './DeletePDF';

const SyllabusList = () => {
  const [syllabi, setSyllabi] = useState([]);
  const [filteredSyllabi, setFilteredSyllabi] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [pdfToEdit, setPdfToEdit] = useState(null);
  const [pdfToDelete, setPdfToDelete] = useState(null);

  useEffect(() => {
    const fetchSyllabi = async () => {
      try {
        const response = await axios.get('http://localhost:5000/syllabi', { withCredentials: true });
        console.log("Fetched syllabi data:", response.data);
        setSyllabi(response.data);
        setFilteredSyllabi(response.data);
      } catch (error) {
        console.error("Error fetching syllabi data:", error);
      }
    };

    fetchSyllabi();
  }, []);

  const handleSearch = () => {
    const filtered = syllabi.filter((item) => 
      item.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.course_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSyllabi(filtered);
  };

  const handleViewPdf = (pdfId) => {
    setSelectedPdf(pdfId);
  };

  const handleEdit = (pdfId) => {
    setPdfToEdit(pdfId);
  };

  const handleDelete = (pdfId) => {
    setPdfToDelete(pdfId);
  };

  const refreshSyllabusList = async () => {
    try {
      const response = await axios.get('http://localhost:5000/syllabi', { withCredentials: true });
      setSyllabi(response.data);
      setFilteredSyllabi(response.data);
    } catch (error) {
      console.error("Error refreshing syllabi data:", error);
    }
  };

  const groupSyllabiByCourseName = (syllabiList) => {
    return syllabiList.reduce((acc, syllabus) => {
      const courseName = syllabus.course_name;
      if (!acc[courseName]) acc[courseName] = [];
      acc[courseName].push(syllabus);
      return acc;
    }, {});
  };

  const groupedSyllabi = groupSyllabiByCourseName(filteredSyllabi);

  return (
    <div>
      <h2 className="mt-4">Uploaded Syllabi</h2>

      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search by Course ID, Course Name, Department Name, or Department ID"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="btn btn-primary mt-2" onClick={handleSearch}>
          Search
        </button>
      </div>

      {Object.keys(groupedSyllabi).length === 0 ? (
        <p>No syllabi found.</p>
      ) : (
        Object.entries(groupedSyllabi).map(([courseName, syllabi]) => (
          <div key={courseName} className="mb-5">
            <h3>{courseName}</h3>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Course ID</th>
                  <th>Department ID</th>
                  <th>Department Name</th>
                  <th>Professor</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {syllabi.map((item) => (
                  <tr key={item.course_id}>
                    <td>{item.course_id}</td>
                    <td>{item.department_id}</td>
                    <td>{item.department_name}</td>
                    <td>{item.professor}</td>
                    <td>{item.syllabus_description}</td>
                    <td>
                      <button
                        className="btn btn-primary me-2"
                        onClick={() => handleViewPdf(item.syllabus_pdf)}
                      >
                        View PDF
                      </button>
                      <button
                        className="btn btn-warning me-2"
                        onClick={() => handleEdit(item.syllabus_pdf)}
                      >
                        Update
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(item.syllabus_pdf)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {selectedPdf && <PdfViewer pdfId={selectedPdf} handleClose={() => setSelectedPdf(null)} />}

      {pdfToEdit && (
        <EditPDF
          pdfId={pdfToEdit}
          handleClose={() => {
            setPdfToEdit(null);
            refreshSyllabusList();
          }}
        />
      )}

      {pdfToDelete && (
        <DeletePDF
          pdfId={pdfToDelete}
          handleClose={() => setPdfToDelete(null)}
          onDeleteSuccess={() => {
            setPdfToDelete(null);
            refreshSyllabusList();
          }}
        />
      )}
    </div>
  );
};

export default SyllabusList;
