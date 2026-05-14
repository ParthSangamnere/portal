// ─── Device Detection Helper ───
export function detectDevice() {
  const ua = navigator.userAgent;
  let type = 'desktop';
  let name = 'Computer';

  if (/android/i.test(ua)) {
    if (/tablet|sm-t|galaxy tab/i.test(ua) || (!/mobile/i.test(ua) && /android/i.test(ua) && window.innerWidth > 600)) {
      type = 'tablet';
      name = 'Android Tablet';
    } else {
      type = 'phone';
      name = 'Android Phone';
    }

    // Try to extract device model
    const match = ua.match(/;\s*([\w\s\-]+)\s*(?:Build|;)/i);
    if (match) {
      name = match[1].trim();
    }
  } else if (/ipad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    type = 'tablet';
    name = 'iPad';
  } else if (/iphone/i.test(ua)) {
    type = 'phone';
    name = 'iPhone';
  } else if (/macintosh/i.test(ua)) {
    name = 'Mac';
  } else if (/windows/i.test(ua)) {
    name = 'Windows PC';
  } else if (/linux/i.test(ua)) {
    name = 'Linux PC';
  }

  return { type, name };
}

// ─── URL Detection ───
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi;

export function detectURLs(text) {
  const matches = text.match(URL_REGEX);
  return matches || [];
}

export function isURL(text) {
  return URL_REGEX.test(text.trim());
}

export function containsURL(text) {
  return URL_REGEX.test(text);
}

// ─── Smart content type detection ───
export function detectContentType(text) {
  const trimmed = text.trim();

  // Pure URL
  if (isURL(trimmed) && trimmed.split('\n').length === 1) {
    return 'link';
  }

  // Has URLs mixed with text
  if (containsURL(trimmed) && trimmed.length > 100) {
    return 'text';
  }

  // Short text that looks like a password
  if (trimmed.length < 100 && /[A-Z]/.test(trimmed) && /[0-9]/.test(trimmed) && /[^A-Za-z0-9]/.test(trimmed)) {
    return 'password';
  }

  return 'text';
}

// ─── Format file size ───
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ─── Format time ───
export function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Is image file ───
export function isImageFile(fileType) {
  return fileType && fileType.startsWith('image/');
}

// ─── Is video file ───
export function isVideoFile(fileType) {
  return fileType && fileType.startsWith('video/');
}

// ─── Copy to clipboard with fallback ───
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-HTTPS
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

// ─── Get file icon based on type ───
export function getFileCategory(fileType) {
  if (!fileType) return 'file';
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('video/')) return 'video';
  if (fileType.startsWith('audio/')) return 'audio';
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z') || fileType.includes('tar')) return 'archive';
  if (fileType.includes('word') || fileType.includes('document')) return 'document';
  if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('csv')) return 'spreadsheet';
  if (fileType.includes('text') || fileType.includes('json') || fileType.includes('xml') || fileType.includes('javascript') || fileType.includes('css') || fileType.includes('html')) return 'code';
  return 'file';
}

// ─── Room code validation ───
export function isValidRoomCode(code) {
  return /^[a-z]+-[a-z]+-\d+$/.test(code);
}
