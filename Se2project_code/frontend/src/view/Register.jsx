import React, { useState } from 'react';
import axios from 'axios';

function Register({ toggleSignUp, toggleLogin }) {
  const [registerData, setRegisterData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    user_type: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const inputFields = [
    { name: 'first_name', type: 'text', placeholder: 'First Name', required: true },
    { name: 'last_name', type: 'text', placeholder: 'Last Name', required: true },
    { name: 'email', type: 'email', placeholder: 'Email', required: true },
    {
      name: 'password',
      type: passwordVisible ? 'text' : 'password',
      placeholder: 'Password',
      required: true,
      toggleVisibility: () => setPasswordVisible(!passwordVisible),
      isPassword: true,
      visibilityIcon: passwordVisible ? '👁' : '👁️‍🗨️'
    },
    {
      name: 'confirm_password',
      type: confirmPasswordVisible ? 'text' : 'password',
      placeholder: 'Confirm Password',
      required: true,
      toggleVisibility: () => setConfirmPasswordVisible(!confirmPasswordVisible),
      isPassword: true,
      visibilityIcon: confirmPasswordVisible ? '👁' : '👁️‍🗨️'
    },
    {
      name: 'user_type',
      type: 'select',
      placeholder: 'Select User Type',
      required: true,
      options: [
        { value: '', label: 'Select User Type' },
        { value: 'student', label: 'Student' },
        { value: 'professor', label: 'Professor' }
      ]
    }
  ];

  const handleChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const validatePassword = (password) => {
    const lengthRequirement = password.length >= 8;
    const uppercaseRequirement = /[A-Z]/.test(password);
    const specialCharRequirement = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!lengthRequirement) {
      return 'Password must be at least 8 characters long.';
    }
    if (!uppercaseRequirement) {
      return 'Password must contain at least one uppercase letter.';
    }
    if (!specialCharRequirement) {
      return 'Password must contain at least one special character.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const passwordError = validatePassword(registerData.password);
    if (passwordError) {
      setErrorMessage(passwordError);
      setLoading(false);
      return;
    }

    if (registerData.password !== registerData.confirm_password) {
      setErrorMessage('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/register', registerData);

      alert(response.data.message);

      setRegisterData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirm_password: '',
        user_type: ''
      });
      toggleLogin();
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4">
      <h2 className="text-center">Sign Up</h2>
      {errorMessage && (
        <div className="alert alert-danger text-center">
          {errorMessage}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {inputFields.map((field, index) => {
          if (field.type === 'select') {
            return (
              <div className="form-group" key={index}>
                <select
                  name={field.name}
                  className="form-control"
                  value={registerData[field.name]}
                  onChange={handleChange}
                  required={field.required}
                >
                  {field.options.map((option, idx) => (
                    <option key={idx} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          return (
            <div className="form-group position-relative" key={index}>
              <input
                type={field.type}
                name={field.name}
                className="form-control"
                placeholder={field.placeholder}
                value={registerData[field.name]}
                onChange={handleChange}
                required={field.required}
              />
              {field.isPassword && (
                <span
                  className="eye-icon"
                  onClick={field.toggleVisibility}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: 'gray',
                    fontSize: '1.2em',
                  }}
                >
                  {field.visibilityIcon}
                </span>
              )}
            </div>
          );
        })}
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
        <p className="mt-2 text-center">
          Already have an account?{' '}
          <span
            className="text-primary"
            style={{ cursor: 'pointer' }}
            onClick={toggleLogin}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
}

export default Register;
