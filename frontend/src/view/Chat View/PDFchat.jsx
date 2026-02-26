import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Chatbot from './Chatbot';

const PDFchat = ({ username }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [syllabi, setSyllabi] = useState([]);
  const [filteredSyllabi, setFilteredSyllabi] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [pdfContent, setPdfContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showChat, setShowChat] = useState(false);


  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const url = username
          ? `http://localhost:5000/syllabi?username=${username}`
          : 'http://localhost:5000/syllabi/all';
        const response = await axios.get(url, { withCredentials: true });

        if (response.data && Array.isArray(response.data)) {
          const courseNames = [...new Set(response.data.map((syllabus) => syllabus.course_name))];
          setCourses(courseNames);
        } else {
          console.error('Unexpected response data:', response.data);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, [username]);


  const handleCourseSelect = async (e) => {
    const courseName = e.target.value;
    setSelectedCourse(courseName);

    try {
      const response = await axios.get(
        `http://localhost:5000/syllabi${username ? `?username=${username}` : '/all'}`,
        { withCredentials: true }
      );
      if (response.data && Array.isArray(response.data)) {
        const filteredSyllabi = response.data.filter((syllabus) => syllabus.course_name === courseName);
        setSyllabi(filteredSyllabi);
        setFilteredSyllabi(filteredSyllabi); 
      } else {
        console.error('Unexpected response data:', response.data);
      }
    } catch (error) {
      console.error('Error fetching syllabi:', error);
    }
  };


  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = syllabi.filter((syllabus) =>
        syllabus.syllabus_description.toLowerCase().includes(query) ||
        syllabus.course_id.toLowerCase().includes(query) ||
        syllabus.professor.toLowerCase().includes(query) ||
        syllabus.department_name.toLowerCase().includes(query)
    );

    setFilteredSyllabi(filtered);
};

  const handleViewPdf = async (pdfUrl, syllabus) => {
    if (!syllabus || !syllabus.syllabus_pdf) {
      console.error('[ERROR] PDF or syllabus is undefined.');
      alert('Invalid PDF selection. Please try again.');
      return;
    }

    console.log('[DEBUG] Selected PDF ID:', syllabus.syllabus_pdf);
    setPdfFile(`http://localhost:5000/get_pdf/${pdfUrl}`);
    setSelectedPdf(syllabus);
    setShowPreview(true);
    setShowChat(false);

    try {
      console.log(`[DEBUG] Fetching PDF content for ID: ${syllabus.syllabus_pdf}`);
      const response = await axios.get(
        `http://localhost:5000/extract_pdf_content/${syllabus.syllabus_pdf}`,
        { withCredentials: true }
      );

      if (response.status === 200 && response.data.content) {
        console.log('[DEBUG] PDF content successfully extracted.');
        setPdfContent(response.data.content);
      } else {
        console.error('[ERROR] Failed to extract PDF content:', response.data);
        setPdfContent('');
        alert('Failed to load PDF content. Please try again.');
      }
    } catch (error) {
      console.error('[ERROR] Error fetching PDF content:', error.response?.data || error.message);
      setPdfContent('');
      alert('Error loading PDF content. Please check the backend logs for more details.');
    }
  };

  const handleOpenChat = () => {
    if (!pdfContent || pdfContent.trim() === '') {
      alert('PDF content could not be loaded. Please try again.');
      return;
    }
    setShowChat(true);
  };

  return (
    <div>
      <h2 className="mt-4" style={{ textAlign: "center" }}>Select a course and PDF to chat!</h2>

      <div className="mb-4">
        <label>Select Course:</label>
        <select
          className="form-control"
          value={selectedCourse}
          onChange={handleCourseSelect}
        >
          <option value="">Select a course</option>
          {courses.map((course, index) => (
            <option key={`${course}-${index}`} value={course}>
              {course}
            </option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <div className="mb-4">
          <label>Search PDFs:</label>
          <input
            type="text"
            className="form-control"
            placeholder="Search by Id, Professor, Department, and Syllabus Description"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      )}

      {filteredSyllabi.length > 0 && (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Course ID</th>
              <th>Course Name</th>
              <th>Department Name</th>
              <th>Professor</th>
              <th>Description</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSyllabi.map((syllabus, index) => (
              <tr key={syllabus.syllabus_pdf || index}>
                <td>{syllabus.course_id}</td>
                <td>{syllabus.course_name}</td>
                <td>{syllabus.department_name}</td>
                <td>{syllabus.professor}</td>
                <td>{syllabus.syllabus_description}</td>
                <td>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleViewPdf(syllabus.syllabus_pdf, syllabus)}
                  >
                    Select
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showPreview && (
        <div style={styles.modalOverlay}>
          <div style={styles.floatingTab}>
            <div style={styles.modalHeader}>
              <h5 style={styles.modalTitle}>Syllabus PDF</h5>
              <button style={styles.close} onClick={() => setShowPreview(false)}>
                &times;
              </button>
            </div>
            <div style={styles.modalBody}>
              {pdfFile && <embed src={pdfFile} style={styles.pdfEmbed} type="application/pdf" />}
            </div>
            <div style={styles.modalFooter}>
              <button className="btn btn-primary" onClick={handleOpenChat}>
                Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {showChat && (
        <Chatbot
          pdfId={selectedPdf?.syllabus_pdf}
          pdfContent={pdfContent}
          syllabus={selectedPdf}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};


const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  floatingTab: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: '85%',
    maxWidth: '800px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    animation: 'fadeIn 0.3s ease-in-out',
    padding: '20px',
  },
  modalHeader: {
    paddingBottom: '10px',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pdfEmbed: {
    width: '100%',
    height: '400px',
  },
};

export default PDFchat;
