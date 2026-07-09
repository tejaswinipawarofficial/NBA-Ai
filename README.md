# NBA Accreditation Assistant 🚀

An AI-powered production-style agent designed to assist engineering faculty across India with the complex and time-consuming National Board of Accreditation (NBA) processes. 

This project was built as the **Final Capstone Project (Project 2)** during my 4-week **IBM Remote Internship** program in collaboration with **Edunet Foundation** and **AICTE**.

---

## ⚠️ Important Note: IBM Cloud API Key & Execution

> **Note:** This project was natively integrated with services hosted on the **IBM Cloud Lite Plan** provided during the IBM-AICTE internship. Because the internship duration has concluded, the original **IBM Cloud API Keys and Project Credentials have expired**. 
> 
> If you clone or download this repository, the application will **not work out-of-the-box** unless you provide your own active IBM Cloud credentials. To run the project locally, please follow the setup instructions below and substitute your own active `WATSONX_APIKEY` and `PROJECT_ID` inside the configuration files.

---

## 📌 Problem Statement & Core Challenge

Preparing for annual NBA accreditation traditionally takes engineering institutions months of tedious, manual paperwork. Faculty members often find themselves buried deep within extensive manuals, confusing compliance criteria, and intricate formatting rules. 

**The Solution:** The **NBA Accreditation Assistant** leverages a state-of-the-art **Retrieval-Augmented Generation (RAG)** pipeline to eliminate manual overhead, ensure absolute data consistency, minimize hallucination risks, and supercharge accreditation readiness.

---

## 🌟 Core Features

*   **RAG-Powered Chat Assistant:** Faculty can query the agent in plain English regarding Self-Assessment Report (SAR) preparation, eligibility parameters, or complex evaluation metrics. Every answer is strictly grounded in and cited from the official *NBA General Manual* database.
*   **NBA Criteria Dashboard:** Visually tracks all 8 core NBA criteria across the entire 870-mark spectrum. It offers institutions a real-time, criterion-by-criterion breakdown against the critical 600-mark accreditation threshold.
*   **Automated CO-PO Mapper:** Automates the tedious task of Course Outcome (CO) to Program Outcome (PO) matrix mapping. It generates mapping strengths and provides AI-driven Continuous Quality Improvement (CQI) recommendations in seconds instead of days.

---

## 🛠️ Technology Stack

*   **LLM Core:** IBM watsonx.ai (`IBM Granite` Language Models)
*   **Architecture:** Retrieval-Augmented Generation (RAG Pipeline)
*   **Knowledge Base Grounding:** Vector Embeddings generated from the Official NBA General Manual
*   **Backend framework:** Python / Flask (`app.py`, `agent_config.py`)
*   **Frontend UI:** Built and streamlined with assistance via IBM BOB UI platforms 
*   **Deployment Assets:** Dockerized (`Dockerfile`, `Procfile`)

---

## 📁 Repository Structure

Based on the source directory tree, the project is configured as follows:
*   `/knowledge_base` — Document repository containing official NBA manuals and source references.
*   `/vector_store` — Embedded database indexes utilized by the RAG model for context lookup.
*   `/static` & `/templates` — Frontend user interface elements, styling, and script assets.
*   `/utils` — Core Python helper scripts managing the RAG pipeline processing.
*   `app.py` — Main Flask application entry point serving the web interface and API routing.
*   `agent_config.py` — Orchestration script holding configuration maps for the Granite LLM.
*   `.env.example` — Template configuration file for setting up local environment variables.

---

## ⚙️ Local Setup Instructions

To explore or run this codebase locally using your own IBM Cloud developer keys:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/mohdmahedi/NBA-Accreditation-Assistant.git](https://github.com/mohdmahedi/NBA-Accreditation-Assistant.git)
   cd NBA-Accreditation-Assistant

pip install -r requirements.txt

Install dependencies:

Bash
pip install -r requirements.txt
Configure Environment Variables:

Rename the .env.example file to .env.

Open the .env file and input your active IBM Watsonx credentials:

Code snippet
IBM_CLOUD_API_KEY=your_active_ibm_api_key_here
WATSONX_PROJECT_ID=your_watsonx_project_id_here
Launch the Application:

Bash
python app.py
Open your browser and navigate to http://127.0.0.1:5000 to interact with the system interface.'''





   
