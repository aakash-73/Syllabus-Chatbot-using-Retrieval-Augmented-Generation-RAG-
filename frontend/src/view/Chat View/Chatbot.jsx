import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chatbot = ({ pdfId, pdfContent, onClose, syllabus }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [currentBotMessage, setCurrentBotMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLoadingDots, setShowLoadingDots] = useState(false);
  const [hasDisplayedWelcome, setHasDisplayedWelcome] = useState(false);
  const [typingIntervalId, setTypingIntervalId] = useState(null);
  const chatBodyRef = useRef(null); // Ref for scrolling to bottom
  const [editingMessage, setEditingMessage] = useState(null);
  const [editingText, setEditingText] = useState(''); // New state for editable text
  const [hoveredMessageIndex, setHoveredMessageIndex] = useState(null); // New state to track hovered message

  useEffect(() => {
    if (!hasDisplayedWelcome) {
      const welcomeMessage = 'Hello! I am here to help you with your syllabus. Ask me anything!';
      setShowLoadingDots(true);

      setTimeout(() => {
        setShowLoadingDots(false);
        simulateTyping(welcomeMessage, 'bot', true, () => {
          setHasDisplayedWelcome(true);
        });
      }, 1000);
    }
  }, [hasDisplayedWelcome]);


  // Handle key press for Enter, Shift + Enter, and Escape
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          // Shift + Enter: Allow new line in input
          setUserInput((prevInput) => prevInput +"");
        } else {
          // Enter: Send message or save edited message
          handleSendMessage();
        }
      } else if (e.key === 'Escape') {
        // Escape: Cancel editing
        if (editingMessage !== null) {
          https://chatgpt.com/c/67df2ea7-6f78-800e-bd45-46c473c6574f
          cancelEditingMessage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [editingMessage, userInput]);

  useEffect(() => {
    // Scroll to the bottom whenever a new message is added
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, currentBotMessage]);

  const simulateTyping = (text, sender, addToMessages = true, onComplete = null) => {
    let tempMessage = '';
    let index = 0;

    const intervalId = setInterval(() => {
      if (index < text.length) {
        tempMessage += text[index];
        setCurrentBotMessage(tempMessage);
        index++;
      } else {
        clearInterval(intervalId);
        setTypingIntervalId(null); // Clear interval ID
        setCurrentBotMessage('');

        if (addToMessages) {
          setMessages((prevMessages) => {
            const exists = prevMessages.some(
              (msg) => msg.sender === sender && msg.text === text
            );
            if (!exists) {
              return [...prevMessages, { sender, text: tempMessage }];
            }
            return prevMessages;
          });
        }

        if (onComplete) {
          onComplete();
        }

        setLoading(false);
      }
    }, 0.0001);

    setTypingIntervalId(intervalId); // Store the interval ID
  };

  const stopTyping = () => {
    if (typingIntervalId) {
      clearInterval(typingIntervalId); // Stop the typing interval
      setTypingIntervalId(null);

      if (currentBotMessage) {
        // Finalize the partially typed message
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: currentBotMessage },
        ]);
        setCurrentBotMessage('');
      }

      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (typingIntervalId) {
      stopTyping(); // Stop typing if the button is clicked while typing
      return;
    }

    if (userInput.trim()) {
      const newMessages = [...messages, { sender: 'user', text: userInput }];
      setMessages(newMessages);
      setUserInput('');
      setLoading(true);
      setError(null);
      setCurrentBotMessage('');
      setShowLoadingDots(true);
      try {
        const payload = { message: userInput, pdfId, pdfContent };

        const response = await axios.post(
          'http://localhost:5000/chatbot/chat_with_pdf_embeddings',
          payload,
          {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.status === 200) {
          const botResponse = response.data.response || 'No response from the bot.';

          setTimeout(() => {
            setShowLoadingDots(false);
            simulateTyping(botResponse, 'bot');
          }, 1000);
        } else {
          setError(response.data.error || 'Failed to get a valid response.');
          alert('Failed to get a valid response from the chatbot. Please try again.');
          setLoading(false);
          setShowLoadingDots(false);
        }
      } catch (error) {
        console.error('[ERROR] Network error:', error.response?.data || error.message);
        if (error.response?.status === 404) {
          setError('Endpoint not found (404). Please check the backend route.');
        } else if (error.code === 'ERR_NETWORK') {
          setError('Network error. Please check your internet connection.');
        } else {
          setError('An unexpected error occurred.');
        }
        alert('An error occurred. Please try again.');
        setLoading(false);
        setShowLoadingDots(false);
      }
    }
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleEditMessage = (index) => {
    const messageToEdit = messages[index];
    setEditingMessage(index);
    setEditingText(messageToEdit.text); // Initialize editable text state
  };

  const saveEditedMessage = async () => {
    if (editingMessage !== null) {
      const updatedMessages = [...messages];
      updatedMessages[editingMessage] = { sender: 'user', text: editingText };

      // Remove all messages below the edited message
      const truncatedMessages = updatedMessages.slice(0, editingMessage + 1);
      setMessages(truncatedMessages);

      // Send the updated question to the chatbot and display its response
      const payload = { message: editingText, pdfId, pdfContent };
      setLoading(true);
      setShowLoadingDots(true); // Show loading dots for the new response
      try {
        const response = await axios.post(
          'http://localhost:5000/chatbot/chat_with_pdf_embeddings',
          payload,
          {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.status === 200) {
          const botResponse = response.data.response || 'No response from the bot.';

          setTimeout(() => {
            setShowLoadingDots(false);
            simulateTyping(botResponse, 'bot'); // Use typing simulation for the new response
          }, 1000);
        } else {
          setError(response.data.error || 'Failed to get a valid response.');
          alert('Failed to get a valid response from the chatbot. Please try again.');
        }
      } catch (error) {
        console.error('[ERROR] Network error:', error.response?.data || error.message);
        alert('An error occurred while fetching the response. Please try again.');
      } finally {
        setLoading(false);
      }

      setEditingMessage(null); // Reset editing state
      setEditingText(''); // Clear editing text state
    }
  };

  const cancelEditingMessage = () => {
    setEditingMessage(null); // Reset editing state
    setEditingText(''); // Clear editing text state
  };

  const handleEditingTextChange = (e) => {
    setEditingText(e.target.value);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.chatContainer}>
        <style>
          {`
          @keyframes jump {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          `}
        </style>
        <div style={styles.header}>
          <h5 style={styles.title}>
            Chat with PDF: {syllabus?.syllabus_description || 'Untitled'}
          </h5>
          <button style={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>
        <div style={styles.chatBody} ref={chatBodyRef}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                ...styles.message,
                ...(msg.sender === 'user' ? styles.userMessage : styles.botMessage),
                position: 'relative',
              }}
              onMouseEnter={() => msg.sender === 'user' && setHoveredMessageIndex(index)}
              onMouseLeave={() => setHoveredMessageIndex(null)}
            >
              {msg.sender === 'user' && editingMessage === index ? (
                <div>
                  <textarea
                    type="text"
                    value={editingText}
                    onChange={handleEditingTextChange}
                    style={styles.editInput}
                  />
                  <button
                    style={styles.checkButton}
                    onClick={saveEditedMessage}
                    title="Save"
                  >
                    ✔
                  </button>
                  <button
                    style={styles.cancelButton}
                    onClick={cancelEditingMessage}
                    title="Cancel"
                  >
                    ❌
                  </button>
                </div>
              ) : (
                <span>{msg.text}</span>
              )}
              {msg.sender === 'user' && hoveredMessageIndex === index && (
                <button
                  style={{
                    ...styles.editButton,
                    visibility: hoveredMessageIndex === index ? 'visible' : 'hidden',
                  }}
                  onClick={() => handleEditMessage(index)}
                >
                  ✏️
                </button>
              )}
            </div>
          ))}
          {showLoadingDots && (
            <div style={styles.loadingDotsContainer}>
              <span style={{ ...styles.dot, animationDelay: '0s' }}></span>
              <span style={{ ...styles.dot, animationDelay: '0.2s' }}></span>
              <span style={{ ...styles.dot, animationDelay: '0.4s' }}></span>
            </div>
          )}
          {currentBotMessage && (
            <div style={styles.botMessage}>{currentBotMessage}</div>
          )}
          {error && <div style={styles.errorMessage}>{error}</div>}
        </div>
        <div style={styles.inputContainer}>
          <textarea
            type="text"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Type a message..."
            style={styles.input}
            disabled={loading && !typingIntervalId}
          />
          <button
            onClick={handleSendMessage}
            style={styles.sendButton}
            disabled={loading && !typingIntervalId}
          >
            {typingIntervalId ? '⏹' : 'Send'}
          </button>
        </div>
      </div>
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
  chatContainer: {
    backgroundColor: '#fff',
    width: '95%',
    maxWidth: '1000px',
    height: '90%',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    padding: '25px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #ddd',
    paddingBottom: '20px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '2rem',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '2.5rem',
    cursor: 'pointer',
    color: '#333',
  },
  chatBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '15px 20px',
    borderRadius: '25px',
    maxWidth: '75%',
    textAlign: 'justify',
    fontSize: '1.2rem',
    position: 'relative',
    transition: 'transform 0.2s ease-in-out',
    ':hover': {
      transform: 'translateX(-10px)',
    },
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e0e0',
    color: '#333',
    padding: '15px 20px',
    borderRadius: '25px',
    maxWidth: '75%',
    textAlign: 'justify',
    fontSize: '1.2rem',
  },
  editButton: {
    position: 'absolute',
    top: '50%',
    left: '-60px',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#333',
  },
  checkButton: {
    marginLeft: '10px',
    padding: '5px 10px',
    fontSize: '1rem',
    borderRadius: '5px',
    backgroundColor: 'green',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
  editInput: {
    fontSize: '1.2rem',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    width: '100%',
    minHeight: '40px', // Set a minimum height
    maxHeight: '200px', // Optional: Limit the maximum height of the textarea
  },
  loadingDotsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '5px',
    height: '30px',
  },
  dot: {
    width: '10px',
    height: '10px',
    backgroundColor: '#007bff',
    borderRadius: '50%',
    animation: 'jump 1s infinite',
    animationTimingFunction: 'ease-in-out',
  },
  errorMessage: {
    alignSelf: 'center',
    color: '#d9534f',
    fontStyle: 'italic',
    fontSize: '1.1rem',
  },
  inputContainer: {
    display: 'flex',
    marginTop: '20px',
    borderTop: '1px solid #ddd',
    paddingTop: '20px',
  },
  input: {
    flex: 1,
    padding: '20px',
    fontSize: '1.2rem',
    borderRadius: '15px',
    border: '1px solid #ddd',
    marginRight: '20px',
  },
  sendButton: {
    padding: '10px 20px',
    fontSize: '1.2rem',
    borderRadius: '15px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease-in-out',
    ':hover': {
      backgroundColor: '#0056b3',
    },
  },
  cancelButton: {
    color: 'red',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: '1.5rem',
    marginLeft: '5px',
  },
};

export default Chatbot;

