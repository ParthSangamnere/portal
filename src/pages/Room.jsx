import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import {
  ArrowLeft, QrCode, Share2, Monitor, Smartphone, Tablet,
  Copy, Pin, Trash2, Download, Send, Paperclip, Upload,
  Link as LinkIcon, FileText, Lock, Eye, EyeOff,
  Image as ImageIcon, Film, Music, FileArchive, File,
  Code, BookOpen, MoreVertical, X, Clipboard,
  PinOff, Users, Eraser, ArrowDown, RefreshCw, AlertCircle
} from 'lucide-react'
import {
  detectDevice, detectContentType, formatFileSize,
  formatTime, isImageFile, copyToClipboard, getFileCategory, detectURLs
} from '../utils/helpers'
import './Room.css'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB

const deviceIcons = {
  phone: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
}

const fileIcons = {
  image: ImageIcon,
  video: Film,
  audio: Music,
  pdf: FileText,
  archive: FileArchive,
  document: BookOpen,
  code: Code,
  spreadsheet: FileText,
  file: File,
}

// ─── Clipboard Item Component ───
function ClipboardItem({ item, isMine, socketId, onCopy, onPin, onDelete }) {
  const [showPassword, setShowPassword] = useState(false)
  const DeviceIcon = deviceIcons[item.senderType] || Monitor

  const handleCopy = () => {
    if (item.type === 'file') return
    copyToClipboard(item.content)
    onCopy()
  }

  const handleDownload = () => {
    if (!item.content) return
    const link = document.createElement('a')
    link.href = item.content
    link.download = item.fileName || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Download started')
  }

  const ProgressRing = ({ progress, status, onRetry }) => {
    const radius = 16
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (progress / 100) * circumference

    return (
      <div className="progress-container">
        {status === 'failed' ? (
          <button className="retry-btn" onClick={(e) => { e.stopPropagation(); onRetry() }} title="Retry upload">
            <RefreshCw size={16} />
          </button>
        ) : (
          <div className="progress-ring-wrapper">
            <svg width="40" height="40">
              <circle
                className="progress-ring-bg"
                cx="20" cy="20" r={radius}
                stroke="rgba(255, 255, 255, 0.1)" strokeWidth="3" fill="transparent"
              />
              <circle
                className="progress-ring-fill"
                cx="20" cy="20" r={radius}
                stroke="var(--accent-2)" strokeWidth="3" fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
        )}
      </div>
    )
  }

  const renderContent = () => {
    if (item.type === 'file') {
      const category = getFileCategory(item.fileType)
      const FileIcon = fileIcons[category] || File

      return (
        <>
          <div className="clip-file">
            <div className={`clip-file-icon ${category}`}>
              <FileIcon />
            </div>
            <div className="clip-file-info">
              <div className="clip-file-name">{item.fileName}</div>
              <div className="clip-file-meta">
                {formatFileSize(item.fileSize)}
                {item.status === 'uploading' && <span style={{ marginLeft: '8px', color: 'var(--accent-2)' }}>· Uploading…</span>}
                {item.status === 'failed' && <span style={{ marginLeft: '8px', color: 'var(--danger)' }}>· Failed</span>}
              </div>
            </div>
            {item.status === 'uploading' || item.status === 'failed' ? (
              <ProgressRing 
                progress={item.progress || 0} 
                status={item.status} 
                onRetry={() => item.onRetry?.()} 
              />
            ) : (
              <button className="clip-file-download" onClick={handleDownload} title="Download file">
                <Download />
              </button>
            )}
          </div>
          {isImageFile(item.fileType) && item.content && (
            <div className="clip-image-preview">
              <img src={item.content} alt={item.fileName} loading="lazy" />
            </div>
          )}
        </>
      )
    }

    if (item.type === 'password') {
      return (
        <div className="clip-password">
          <span>{showPassword ? item.content : '•'.repeat(Math.min(item.content.length, 24))}</span>
          <button
            className="clip-action-btn"
            onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword) }}
            title={showPassword ? 'Hide' : 'Show'}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
      )
    }

    if (item.type === 'link') {
      const url = item.content.trim()
      let domain = ''
      try { domain = new URL(url).hostname } catch { domain = url }

      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="clip-link">
          <div className="clip-link-icon">
            <LinkIcon />
          </div>
          <div className="clip-link-info">
            <div className="clip-link-url">{url}</div>
            <div className="clip-link-domain">{domain}</div>
          </div>
        </a>
      )
    }

    // Text — detect inline URLs
    const urls = detectURLs(item.content)
    if (urls.length > 0) {
      const parts = []
      let remaining = item.content
      let key = 0
      for (const url of urls) {
        const idx = remaining.indexOf(url)
        if (idx > 0) {
          parts.push(<span key={key++}>{remaining.substring(0, idx)}</span>)
        }
        parts.push(
          <a key={key++} href={url} target="_blank" rel="noopener noreferrer"
             style={{ color: 'var(--accent-3)', textDecoration: 'underline' }}>
            {url}
          </a>
        )
        remaining = remaining.substring(idx + url.length)
      }
      if (remaining) parts.push(<span key={key++}>{remaining}</span>)
      return <div className="clip-text">{parts}</div>
    }

    return <div className="clip-text">{item.content}</div>
  }

  return (
    <div className={`clip-item ${isMine ? 'is-mine' : 'is-others'} ${item.pinned ? 'pinned' : ''} ${item.status === 'uploading' ? 'is-uploading' : ''}`}>
      <div className="clip-item-header">
        <div className="clip-sender">
          <DeviceIcon />
          <span>{isMine ? 'You' : item.senderName}</span>
          <span className="clip-time">· {formatTime(item.timestamp)}</span>
        </div>
        <div className="clip-actions">
          {item.type !== 'file' && (
            <button className="clip-action-btn" onClick={handleCopy} title="Copy">
              <Copy />
            </button>
          )}
          <button
            className={`clip-action-btn ${item.pinned ? 'active' : ''}`}
            onClick={() => onPin(item.id)}
            title={item.pinned ? 'Unpin' : 'Pin'}
          >
            {item.pinned ? <PinOff /> : <Pin />}
          </button>
          <button className="clip-action-btn" onClick={() => onDelete(item.id)} title="Delete">
            <Trash2 />
          </button>
        </div>
      </div>
      {renderContent()}
    </div>
  )
}


// ─── Main Room Component ───
export default function Room() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const socketRef = useRef(null)
  const feedRef = useRef(null)
  const listEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const [items, setItems] = useState([])
  const [devices, setDevices] = useState([])
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(true)
  const [text, setText] = useState('')
  const [sendType, setSendType] = useState('auto')
  const [showQR, setShowQR] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [socketId, setSocketId] = useState(null)

  // ─── Lock Body Scroll ───
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
    }
  }, [])

  const device = useRef(detectDevice())
  const roomUrl = `${window.location.origin}/room/${roomCode}`

  // ─── Connect socket ───
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      setConnecting(false)
      setSocketId(socket.id)
      socket.emit('join-room', {
        roomCode,
        device: device.current,
      })

      // Save to recent rooms
      try {
        let rooms = JSON.parse(localStorage.getItem('portal-recent-rooms') || '[]')
        rooms = rooms.filter(r => r.code !== roomCode)
        rooms.unshift({ code: roomCode, lastVisited: Date.now() })
        rooms = rooms.slice(0, 10)
        localStorage.setItem('portal-recent-rooms', JSON.stringify(rooms))
      } catch { /* ignore */ }
    })

    socket.on('disconnect', () => {
      setConnected(false)
      setConnecting(true)
    })

    socket.on('room-state', ({ items: existingItems, pinnedIds, devices: roomDevices }) => {
      setItems(existingItems)
      setDevices(roomDevices)
    })

    socket.on('new-item', (item) => {
      // If this is a file we just uploaded optimistically, remove the placeholder
      setItems(prev => {
        const filtered = prev.filter(i => 
          !(i.status === 'uploading' && i.fileName === item.fileName && i.fileSize === item.fileSize) &&
          !(i.status === 'failed' && i.fileName === item.fileName && i.fileSize === item.fileSize)
        )
        return [...filtered, item]
      })

      // Notify if from another device
      if (item.senderId !== socket.id) {
        toast.success(`📋 Received ${item.type === 'file' ? item.fileName : 'text'} from ${item.senderName}`, {
          duration: 4000,
        })
        // Play subtle sound
        try {
          const ctx = new AudioContext()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.setValueAtTime(800, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1)
          gain.gain.setValueAtTime(0.1, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
          osc.start(ctx.currentTime)
          osc.stop(ctx.currentTime + 0.3)
        } catch { /* no audio */ }
      }
    })

    socket.on('device-joined', ({ device: newDevice, devices: roomDevices }) => {
      setDevices(roomDevices)
      toast(`${newDevice.name} joined`, { icon: '📱', duration: 2000 })
    })

    socket.on('device-left', ({ deviceId, devices: roomDevices }) => {
      setDevices(roomDevices)
    })

    socket.on('item-pinned', ({ itemId, pinned }) => {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, pinned } : i))
    })

    socket.on('item-deleted', ({ itemId }) => {
      setItems(prev => prev.filter(i => i.id !== itemId))
    })

    socket.on('history-cleared', () => {
      setItems([])
      toast('History cleared', { icon: '🗑️' })
    })

    return () => {
      socket.disconnect()
    }
  }, [roomCode])

  // ─── Auto-scroll feed ───
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [items])

  // ─── Drag & drop ───
  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault()
      setIsDragging(true)
    }
    const handleDragLeave = (e) => {
      e.preventDefault()
      if (e.relatedTarget === null || !document.contains(e.relatedTarget)) {
        setIsDragging(false)
      }
    }
    const handleDrop = (e) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files?.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    }

    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)
    return () => {
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleDrop)
    }
  }, [connected])

  // ─── Send text ───
  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || !socketRef.current) return

    let type = sendType
    if (type === 'auto') {
      type = detectContentType(trimmed)
    }

    socketRef.current.emit('send-item', {
      roomCode,
      item: { type, content: trimmed },
    })

    setText('')
    setSendType('auto')
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px'
    }
  }, [text, sendType, roomCode])

  // ─── Send files ───
  const uploadFile = useCallback((file, tempId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomCode', roomCode);
    formData.append('senderId', socketId);
    formData.append('senderName', 'You'); // Handled by server but useful for early UI
    formData.append('senderType', detectDevice().type);

    const xhr = new XMLHttpRequest();
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        setItems(prev => prev.map(item => 
          item.id === tempId ? { ...item, progress: percent } : item
        ));
      }
    };

    xhr.onload = () => {
      if (xhr.status !== 200) {
        setItems(prev => prev.map(item => 
          item.id === tempId ? { ...item, status: 'failed' } : item
        ));
        toast.error(`Failed to upload ${file.name}`);
      }
    };

    xhr.onerror = () => {
      setItems(prev => prev.map(item => 
        item.id === tempId ? { ...item, status: 'failed' } : item
      ));
      toast.error(`Error uploading ${file.name}`);
    };

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  }, [roomCode, socketId]);

  const handleFiles = useCallback((files) => {
    if (!socketRef.current || !connected) return

    Array.from(files).forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} is too large (max 25 MB)`)
        return
      }

      const tempId = crypto.randomUUID();
      const optimisticItem = {
        id: tempId,
        type: 'file',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        senderId: socketId,
        senderName: 'You',
        timestamp: Date.now(),
        status: 'uploading',
        progress: 0,
        onRetry: () => {
          setItems(prev => prev.map(i => i.id === tempId ? { ...i, status: 'uploading', progress: 0 } : i));
          uploadFile(file, tempId);
        }
      };

      setItems(prev => [...prev, optimisticItem]);
      uploadFile(file, tempId);
    })
  }, [roomCode, connected, socketId, uploadFile])

  // ─── Handlers ───
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaInput = (e) => {
    setText(e.target.value)
    // Auto-resize
    e.target.style.height = '44px'
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
  }

  const handlePin = (itemId) => {
    socketRef.current?.emit('toggle-pin', { roomCode, itemId })
  }

  const handleDelete = (itemId) => {
    socketRef.current?.emit('delete-item', { roomCode, itemId })
  }

  const handleClearHistory = () => {
    socketRef.current?.emit('clear-history', { roomCode })
    setShowClearConfirm(false)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Portal Room', text: `Join my Portal room: ${roomCode}`, url: roomUrl })
      } catch { /* cancelled */ }
    } else {
      copyToClipboard(roomUrl)
      toast.success('Room link copied!')
    }
  }

  // ─── Scrolling Logic ───
  const scrollToBottom = useCallback(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleFeedScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target
    // Show button if we are scrolled up more than 50px from bottom
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 50)
  }

  // Auto-scroll on new items
  useEffect(() => {
    if (items.length > 0) {
      const isMine = items[items.length - 1].senderId === socketId
      // Scroll if it's my own message, OR if I'm already at the bottom
      if (isMine || !showScrollButton) {
        scrollToBottom()
      }
    }
  }, [items, socketId, scrollToBottom]) // Do not include showScrollButton to prevent unneeded triggering

  // ─── Derive data ───
  const pinnedItems = items.filter(i => i.pinned)
  const unpinnedItems = items.filter(i => !i.pinned)
  const connectionStatus = connected ? 'connected' : connecting ? 'connecting' : 'disconnected'
  const statusText = connected
    ? `${devices.length} device${devices.length !== 1 ? 's' : ''} connected`
    : connecting ? 'Connecting…' : 'Disconnected'

  return (
    <div className="room-page">
      {/* ─── Header ─── */}
      <header className="room-header">
        <div className="room-header-left">
          <button className="room-back-btn" onClick={() => navigate('/')} title="Home">
            <ArrowLeft size={20} />
          </button>
          <img src="/portal-icon.svg" className="room-logo" alt="" />
          <div className="room-info">
            <div className="room-name">{roomCode}</div>
            <div className="room-status-row">
              <span className={`connection-dot ${connectionStatus}`} />
              <span className="room-status-text">{statusText}</span>
            </div>
          </div>
        </div>
        <div className="room-header-right">
          <div className="device-count-badge">
            <Users size={14} />
            {devices.length}
          </div>
          <button className="btn-icon" onClick={() => setShowQR(true)} title="Show QR Code">
            <QrCode size={20} />
          </button>
          <button className="btn-icon" onClick={handleShare} title="Share Room">
            <Share2 size={20} />
          </button>
          <button
            className="btn-icon"
            onClick={() => setShowClearConfirm(true)}
            title="Clear history"
          >
            <Eraser size={20} />
          </button>
        </div>
      </header>

      {/* ─── Clear confirm ─── */}
      {showClearConfirm && (
        <div className="confirm-bar" style={{ margin: '0 20px', marginTop: '8px' }}>
          <span style={{ flex: 1 }}>Clear all shared items?</span>
          <button className="btn btn-sm btn-danger" onClick={handleClearHistory}>Clear All</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setShowClearConfirm(false)}>Cancel</button>
        </div>
      )}

      {/* ─── Pinned Items ─── */}
      {pinnedItems.length > 0 && (
        <div className="pinned-section">
          <div className="pinned-label"><Pin size={12} /> Pinned</div>
          <div className="pinned-items">
            {pinnedItems.map(item => (
              <ClipboardItem
                key={item.id}
                item={item}
                isMine={item.senderId === socketId}
                socketId={socketId}
                onCopy={() => toast.success('Copied to clipboard!')}
                onPin={handlePin}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Feed ─── */}
      <div className="clipboard-feed" ref={feedRef} onScroll={handleFeedScroll}>
        {unpinnedItems.length === 0 && pinnedItems.length === 0 ? (
          <div className="feed-empty">
            <div className="feed-empty-icon">
              <Clipboard />
            </div>
            <h3>Ready to share</h3>
            <p>
              Paste text, drop files, or type anything below. Open{' '}
              <strong>{roomUrl}</strong> on your other device to start sharing.
            </p>
          </div>
        ) : (
          unpinnedItems.map(item => (
            <ClipboardItem
              key={item.id}
              item={item}
              isMine={item.senderId === socketId}
              socketId={socketId}
              onCopy={() => toast.success('Copied to clipboard!')}
              onPin={handlePin}
              onDelete={handleDelete}
            />
          ))
        )}
        <div ref={listEndRef} style={{ height: 1, paddingBottom: '20px' }} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollButton && (
        <button 
          className="scroll-bottom-btn" 
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <ArrowDown size={20} />
        </button>
      )}

      {/* ─── Send Bar ─── */}
      <div className="send-bar">
        <div className="type-selector">
          {['auto', 'text', 'link', 'password'].map(t => (
            <button
              key={t}
              className={`type-chip ${sendType === t ? 'active' : ''}`}
              onClick={() => setSendType(t)}
            >
              {t === 'auto' ? '✨ Auto' : t}
            </button>
          ))}
        </div>
        <div className="send-bar-inner">
          <div className="send-input-wrapper">
            <textarea
              ref={textareaRef}
              className="send-input"
              placeholder={
                sendType === 'password' ? 'Paste your password here…'
                : sendType === 'link' ? 'Paste a URL…'
                : 'Type or paste anything to share…'
              }
              value={text}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="send-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
            >
              <Paperclip />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!text.trim() || !connected}
            title="Send (Enter)"
          >
            <Send />
          </button>
        </div>
      </div>

      {/* ─── Drop Overlay ─── */}
      {isDragging && (
        <div className="drop-overlay">
          <div className="drop-zone">
            <Upload />
            <p>Drop files here</p>
            <span>Max 25 MB per file</span>
          </div>
        </div>
      )}

      {/* ─── QR Modal ─── */}
      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(false)}>
          <div className="modal-card glass-strong" onClick={e => e.stopPropagation()}>
            <h3>Share this room</h3>
            <p>Scan this QR code on your other device or share the room code</p>
            <div className="qr-wrapper">
              <QRCodeSVG
                value={roomUrl}
                size={200}
                level="M"
                bgColor="#ffffff"
                fgColor="#0a0a1a"
              />
            </div>
            <div
              className="room-code-display"
              onClick={() => {
                copyToClipboard(roomCode)
                toast.success('Room code copied!')
              }}
            >
              <span>{roomCode}</span>
              <Copy size={16} />
            </div>
            <div
              className="room-code-display"
              style={{ fontSize: '0.8rem', fontWeight: 500 }}
              onClick={() => {
                copyToClipboard(roomUrl)
                toast.success('Room link copied!')
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {roomUrl}
              </span>
              <Copy size={16} />
            </div>
            <button className="btn btn-secondary modal-close" onClick={() => setShowQR(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
