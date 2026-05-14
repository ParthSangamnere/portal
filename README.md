# 🌌 Portal: Instant Device-to-Device Sharing

[![Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge&logo=render)](https://portal-share.onrender.com)
[![Tech](https://img.shields.io/badge/Stack-React_%7C_Node_%7C_Socket.io-blueviolet?style=for-the-badge)](https://socket.io)
[![Speed](https://img.shields.io/badge/Performance-High_Fidelity-FFD700?style=for-the-badge)](https://vitejs.dev)

**Portal** is a high-fidelity, real-time file and text sharing application designed to make moving data between devices as seamless as breathing. No accounts, no logins, no friction—just a room code and instant sync.

---

## ✨ Key Features

- **🚀 Optimistic Uploads:** WhatsApp-style file handling. See your file card immediately with real-time XHR progress rings (0-100%).
- **🎬 Smart Video Previews:** Auto-generates high-quality thumbnails for shared MP4 files using hidden canvas extraction.
- **📱 Mobile-First Design:** Zero "rubber-banding" or mobile browser bouncing. Fixed headers and smooth, locked-body scrolling.
- **💬 Intelligent Chat Bubbles:** Right-aligned "You" bubbles vs. Left-aligned others, with distinct device identification.
- **🔒 Room-Based Isolation:** Temporary, memorable room codes (e.g., `amber-knight-92`) that expire after 24 hours of inactivity.
- **⚡ Real-Time Sync:** Powered by Socket.io for sub-millisecond data propagation across all connected devices.
- **🌑 Premium Aesthetics:** Sleek dark-mode interface with glassmorphism, smooth transitions, and modern typography.

---

## 🛠️ Technology Stack

- **Frontend:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling:** Vanilla CSS (Modern CSS Variables & Flexbox/Grid)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Backend:** [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
- **Real-Time:** [Socket.io](https://socket.io/)
- **File Handling:** [Multer](https://github.com/expressjs/multer) (In-memory buffering)
- **Deployment:** [Render](https://render.com/)

---

## 🏗️ How it Works

1. **Room Creation:** When you enter a code, the server creates an in-memory instance of a room.
2. **Device Identity:** Your browser automatically detects your device type (Phone, Tablet, or PC) and assigns a unique name.
3. **Data Propagation:** 
   - **Text:** Emitted via Socket.io for instant delivery.
   - **Files:** Sent via XHR POST to a dedicated `/api/upload` endpoint to enable precise progress tracking, then broadcasted via Sockets.
4. **Cleanup:** A background process runs every 10 minutes to prune idle rooms, keeping the server lightweight and secure.

---

## 🚀 Local Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/ParthSangamnere/portal.git
   cd portal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   # Start the frontend (Vite)
   npm run dev
   
   # Start the backend (in a separate terminal)
   node server/index.js
   ```

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ for a seamless sharing experience.
</p>
