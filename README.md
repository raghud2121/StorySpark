# StorySpark ⚡

StorySpark is a collaborative, event-driven web application that enables real-time storytelling with Artificial Intelligence. Users can start a narrative, and the integrated Google Gemini AI contextually generates the next plot points, instantly pushing updates to all connected clients via WebSockets.

This project was built to demonstrate proficiency in event-driven architecture, full-stack MERN development, containerization, and the integration of Generative AI in a production-like environment.

### **Features**

* **Real-Time Collaboration:** Utilizes `Socket.io` to push story updates instantly to all users without requiring page refreshes (Event-Driven Architecture).
* **AI-Powered Story Generation:** Integrates the **Google Gemini SDK** to generate creative, context-aware text based on user prompts.
* **Containerized Environment:** Fully dockerized application (Client, Server, Database) ensuring strictly consistent development and deployment environments.
* **Secure Authentication:** Implements stateless JWT authentication with bcrypt password hashing to protect user sessions and private routes.
* **Interactive Timeline:** A modern, glassmorphism-inspired UI that visualizes the story's evolution with distinct indicators for User vs. AI contributions.

---

### **Tech Stack & Architecture**

#### **Backend**
* **Runtime:** Node.js & Express.js
* **Real-Time Engine:** Socket.io (WebSockets)
* **AI Model:** Google Gemini (Generative AI SDK)
* **Database:** MongoDB (Mongoose Schema Design)
* **Authentication:** JSON Web Tokens (JWT) & Bcrypt

#### **Frontend**
* **Framework:** React (Vite)
* **State Management:** React Hooks (`useState`, `useEffect`)
* **Real-Time Client:** `socket.io-client`
* **Styling:** Modern CSS-in-JS with responsive Glassmorphism design.

#### **DevOps & Infrastructure**
* **Containerization:** Docker & Docker Compose
* **Networking:** Internal bridge network between Frontend, Backend, and Database containers.

---

### **How To Run Locally**

**Prerequisites:**
* Docker & Docker Compose (Recommended)
* **OR** Node.js & MongoDB installed locally
* A free API key from [Google AI Studio](https://aistudio.google.com/)

#### **Option 1: The Docker Way (Recommended)**

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/yourusername/storyspark.git](https://github.com/yourusername/storyspark.git)
    cd storyspark
    ```

2.  **Configure Environment Variables**
    Create a `.env` file in the `server` directory:
    ```env
    PORT=5000
    MONGO_URI=mongodb://mongo:27017/storyspark
    JWT_SECRET=your_secret_key_here
    GEMINI_API_KEY=your_google_gemini_key_here
    ```

3.  **Run with Docker Compose**
    ```bash
    docker-compose up --build
    ```
    The app will be accessible at `http://localhost:5173`.

#### **Option 2: The Manual Way**

1.  **Setup the Backend:**
    ```bash
    cd server
    npm install
    # Update .env MONGO_URI to your local mongodb connection string
    npm start
    ```
    *Server runs on http://localhost:5000*

2.  **Setup the Frontend:**
    Open a new terminal window.
    ```bash
    cd client
    npm install
    npm run dev
    ```
    *Frontend runs on http://localhost:5173*
