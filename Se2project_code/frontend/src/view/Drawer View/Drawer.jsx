// Drawer.js
import React from 'react';
import './Drawer.css';
import { FaUserCircle } from 'react-icons/fa';

const Drawer = ({ isOpen, onClose, onOptionSelect, email, options }) => {
  return (
    <div className={`drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-header">
        <FaUserCircle size={90} className="profile-icon" />
        <p className="user-email">{email}</p>
        <button onClick={onClose} className="close-button">&times;</button>
      </div>
      <ul className="list-group">
        {options.map((option, index) => (
          <li
            key={index}
            className="list-group-item"
            onClick={() => onOptionSelect(option.value)}
          >
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Drawer;
