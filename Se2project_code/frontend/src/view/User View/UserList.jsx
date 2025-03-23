// UserList.js
import React, { useState, useEffect } from 'react';
import StudentList from './StudentList';
import ProfessorList from './ProfessorList';

const UserList = ({ onReturn, handleSignOut }) => {
  const [view, setView] = useState(localStorage.getItem('userListView') || null);

  useEffect(() => {
    if (view) {
      localStorage.setItem('userListView', view);
    } else {
      localStorage.removeItem('userListView');
    }
  }, [view]);

  return (
    <div style={styles.container}>
      {view === null ? (
        <>
          <div style={styles.buttonGroup}>
            <button onClick={() => setView('students')} style={styles.button} className="btn btn-primary">
              Students
            </button>
            <button onClick={() => setView('professors')} style={styles.button} className="btn btn-secondary">
              Professors
            </button>
          </div>
          <button onClick={handleSignOut} className="btn btn-danger" style={styles.signOutButton}>
            Sign Out
          </button>
        </>
      ) : view === 'students' ? (
        <StudentList />
      ) : view === 'professors' ? (
        <ProfessorList />
      ) : null}
      {view !== null && (
        <button onClick={() => setView(null)} style={styles.returnButton} className="btn btn-outline-secondary mt-4">
          Return
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    textAlign: 'center',
    zIndex: 1,
  },
  buttonGroup: {
    display: 'flex',
    gap: '20px',
    marginTop: '20px',
    justifyContent: 'center',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
  },
  signOutButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
  },
  returnButton: {
    marginTop: '20px',
  },
};

export default UserList;
