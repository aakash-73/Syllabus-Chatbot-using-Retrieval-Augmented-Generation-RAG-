import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RegistrationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/registration_requests')
      .then((response) => {
        setRequests(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setErrorMessage('Failed to fetch registration requests');
        setLoading(false);
      });
  }, []);

  const handleAccept = (id) => {
    axios.post(`http://localhost:5000/registration_requests/${id}/accept`)
      .then(() => {
        alert('Request accepted');
        setRequests(requests.filter((req) => req.id !== id));
      })
      .catch(() => {
        alert('Failed to accept request');
      });
  };

  const handleReject = (id) => {
    axios.delete(`http://localhost:5000/registration_requests/${id}/reject`)
      .then(() => {
        alert('Request rejected');
        setRequests(requests.filter((req) => req.id !== id));
      })
      .catch(() => {
        alert('Failed to reject request');
      });
  };

  if (loading) {
    return <p>Loading registration requests...</p>;
  }

  if (errorMessage) {
    return <p className="text-danger">{errorMessage}</p>;
  }

  return (
    <div className="container mt-4">
      <h2>Registration Requests</h2>
      {requests.length === 0 ? (
        <p>No pending registration requests</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>User Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{`${req.first_name} ${req.last_name}`}</td>
                <td>{req.email}</td>
                <td>{req.user_type}</td>
                <td>
                  <button
                    className="btn btn-success btn-sm me-2"
                    onClick={() => handleAccept(req.id)}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleReject(req.id)}
                  >
                    Decline
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RegistrationRequests;
