import React, { useEffect, useState } from 'react';

const PdfViewer = ({ pdfId, handleClose }) => {
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    if (pdfId) {
      setPdfUrl(`http://localhost:5000/get_pdf/${pdfId}`);
    }
  }, [pdfId]);

  if (!pdfId) return null;

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">PDF Viewer</h5>
            <button type="button" className="close" onClick={handleClose}>&times;</button>
          </div>
          <div className="modal-body">
            <iframe src={pdfUrl} width="100%" height="600px" title="PDF Viewer"></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
