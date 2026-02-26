# 📘 Syllabus Chatbot using Retrieval-Augmented Generation (RAG)

An AI-powered chatbot that enables students to interact with syllabus PDFs using Natural Language Queries.
The system leverages **Retrieval-Augmented Generation (RAG)** to provide accurate, context-aware responses from uploaded academic documents.

---

## 🚀 Features

* 📄 Upload syllabus PDFs
* 🔍 Convert PDF content into vector embeddings
* 🧠 Context-aware AI responses using RAG pipeline
* 💬 Chat with syllabus using natural language
* 🗃 Store embeddings in MongoDB
* ⚡ Fast inference using Groq LLaMA3 models
* 🔁 API Failover using Primary & Secondary Groq Keys
* 🌐 Full-stack implementation (Flask + React)

---

## 🛠 Tech Stack

| Layer        | Technology Used                   |
| ------------ | --------------------------------- |
| Frontend     | React.js                          |
| Backend      | Flask                             |
| Database     | MongoDB Atlas                     |
| Embeddings   | HuggingFace Sentence Transformers |
| Vector Store | MongoDB                           |
| LLM API      | Groq (LLaMA3)                     |
| PDF Parsing  | PyMuPDF / pdfminer                |

---

## 📁 Project Structure

```
Syllabus-Chatbot-using-Retrieval-Augmented-Generation-RAG-/
│
├── backend/
│   ├── controller/
│   ├── models/
│   ├── config.py
│   ├── app.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── node_modules/
│
└── README.md
```

---

## ⚙️ Prerequisites

Make sure you have the following installed:

* Python (>= 3.10)
* Node.js (>= 18)
* npm
* MongoDB Atlas Account
* Two Groq API Keys (Primary & Secondary)

---

## 🔐 Environment Setup

Create a `.env` file inside the **backend/** directory and add:

```
PRIMARY_API_KEY=your_primary_groq_api_key
SECONDARY_API_KEY=your_secondary_groq_api_key
MONGO_URI=your_mongodb_connection_string
```

---

## ▶️ Backend Setup (Flask)

### Step 1: Navigate to Backend Folder

```
cd backend
```

### Step 2: Create Virtual Environment

```
python -m venv .venv
```

### Step 3: Activate Virtual Environment

#### Windows:

```
.venv\Scripts\activate
```

#### Mac/Linux:

```
source .venv/bin/activate
```

### Step 4: Install Dependencies

```
pip install -r requirements.txt
```

### Step 5: Run Flask Server

```
python app.py
```

Backend will start at:

```
http://localhost:5000
```

---

## 💻 Frontend Setup (React)

Open a new terminal.

### Step 1: Navigate to Frontend Folder

```
cd frontend
```

### Step 2: Install Dependencies

```
npm install
```

### Step 3: Install Required UI Libraries

```
npm install bootstrap @fortawesome/fontawesome-free react-icons
```

### Step 4: Run React App

```
npm start
```

Frontend will start at:

```
http://localhost:3000
```

---

## 🔁 Running the Application

Run both:

| Service  | Command         |
| -------- | --------------- |
| Backend  | `python app.py` |
| Frontend | `npm start`     |

Then open:

```
http://localhost:3000
```

Upload a syllabus PDF and start chatting!

---

## 🧠 How It Works (RAG Pipeline)

1. PDF is uploaded by the user.
2. Text is extracted from the document.
3. Sentence embeddings are generated.
4. Embeddings are stored in MongoDB.
5. User query is embedded and matched.
6. Relevant content is retrieved.
7. Context + Query is sent to Groq LLaMA3.
8. AI-generated response is returned.

---

## 🔁 API Failover Mechanism

The system is configured with:

* **Primary Groq API Key**
* **Secondary Groq API Key**

If the primary API fails due to:

* Rate limits
* Timeout
* Temporary service failure

The request is automatically routed to the **Secondary API Key**, ensuring uninterrupted AI response generation.

---

## 🐞 Common Issues

### 401 Unauthorized Error

Ensure JWT token is passed in request headers.

### 500 Internal Server Error

Check:

* Both PRIMARY_API_KEY and SECONDARY_API_KEY are set correctly
* MongoDB URI is valid

### React-Scripts Not Found

Run:

```
npm install
```

---

## 📌 Future Enhancements

* Multi-PDF support
* User authentication
* Role-based access
* Semantic search optimization
* Deployment with Docker

---

## 📄 License

This project is for academic and research purposes only.

---

## 👨‍💻 Author

Developed by Aakash Reddy Nuthalapati
