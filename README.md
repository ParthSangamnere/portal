# <p align="center">🌌 Portal</p>

<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Outfit&size=24&pause=1000&color=6C5CE7&center=true&vCenter=true&width=500&lines=Instant+Device-to-Device+Sharing;Zero+Configuration+Required;Optimistic+File+Handling;Real-time+Room+Sync" alt="Typing SVG" />
</p>

<p align="center">
  <a href="https://portal-share.onrender.com"><strong>Explore the Live App »</strong></a>
  <br />
  <br />
  <a href="#✨-key-features">Features</a> ·
  <a href="#🏗️-architecture">Architecture</a> ·
  <a href="#🚀-local-setup">Setup</a> ·
  <a href="https://github.com/ParthSangamnere/portal/issues">Report Bug</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Live-success?style=for-the-badge&logo=render&logoColor=white" />
  <img src="https://img.shields.io/badge/Stack-React_%7C_Node_%7C_Socket.io-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-gray?style=for-the-badge" />
</p>

---

### 💡 The Problem
Sharing a quick text snippet or a photo between a Windows PC and an Android phone usually involves:
- 📧 Emailing yourself (Slow)
- 💬 Messaging yourself on WhatsApp (Clunky)
- ☁️ Uploading to Drive (Too many steps)

### 🚀 The Solution: Portal
**Portal** eliminates the friction. Open a room on both devices, and you have a shared clipboard and file drop that feels like it's part of your OS. **No accounts. No logins. Just instant sync.**

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **🚀 Optimistic Uploads** | Instant UI feedback with WhatsApp-style circular progress rings (0-100%). |
| **🎬 Video Previews** | Automatically extracts frames from `.mp4` files for a polished thumbnail view. |
| **📱 Mobile-First UX** | Zero "rubber-banding" or browser jumping. Touch-optimized and scroll-locked. |
| **⚡ Ultra-Low Latency** | Sub-millisecond data propagation via persistent WebSocket tunnels. |
| **🔒 Ephemeral Rooms** | Memorable room codes that auto-expire after 24 hours of inactivity. |

---

## 🛠️ Technology Stack

<p align="left">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
</p>

---

## 🏗️ Architecture

Portal is built on a **Shared-State Architecture**. 

1. **The Server** acts as a stateless orchestrator, managing in-memory rooms and broadcasting events.
2. **The Client** maintains a local "ghost" state for optimistic actions (like uploads) and reconciles it once the server broadcasts the source of truth.
3. **Storage:** We use **Zero-Persistence** (In-Memory). Files are buffered in RAM and never touch the disk, ensuring maximum privacy and speed.

## 🗺️ Roadmap

- [x] Optimistic File Uploads
- [x] Video Thumbnail Previews
- [x] Mobile-First Scroll Locking
- [ ] End-to-End Encryption (E2EE) for Rooms
- [ ] QR Code Scanner Integration for Instant Join
- [ ] Progressive Web App (PWA) Installability
- [ ] Cloudinary Integration for Persistent Storage (Optional)

---

## 🚀 Local Setup

```bash
# Clone the repository
git clone https://github.com/ParthSangamnere/portal.git

# Install dependencies
npm install

# Start the engine
npm run dev & node server/index.js
```

---

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.

<p align="center">
  <br />
  Built by <strong>Parth Sangamnere</strong>
  <br />
  <em>Bringing simplicity back to file sharing.</em>
</p>
