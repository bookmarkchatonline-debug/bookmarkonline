// src/cloudinary/upload.js

const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const AUDIO_PRESET = import.meta.env.VITE_CLOUDINARY_AUDIO_PRESET; // 'songsupload'
const IMAGE_PRESET = import.meta.env.VITE_CLOUDINARY_IMAGE_PRESET; // 'songsupload'

/**
 * Validate audio duration client-side via Web Audio API.
 * Rejects clips shorter than 5 s or longer than 60 s.
 */
export async function validateAudioDuration(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.decodeAudioData(
        e.target.result,
        (buffer) => {
          audioCtx.close();
          const duration = buffer.duration;
          if (duration < 5) {
            reject(new Error('Audio clip must be at least 5 seconds long.'));
          } else if (duration > 60) {
            reject(new Error(`Audio clip is ${Math.round(duration)}s — max allowed is 60 seconds.`));
          } else {
            resolve(duration);
          }
        },
        () => {
          reject(new Error('Could not decode audio file. Please use MP3, WAV, or AAC.'));
        }
      );
    };
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Upload audio file to Cloudinary using the unsigned 'songsupload' preset.
 * Cloudinary uses resource_type 'video' for audio files.
 * Returns { url, publicId, duration }
 */
export async function uploadAudio(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', AUDIO_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          duration: data.duration,
        });
      } else {
        const err = JSON.parse(xhr.responseText);
        reject(new Error(err?.error?.message || 'Audio upload failed. Please try again.'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during audio upload.'));
    xhr.send(formData);
  });
}

/**
 * Upload cover image to Cloudinary using the unsigned 'songsupload' preset.
 * Returns { url, publicId } — URL is transformed to 400×400 fill.
 */
export async function uploadCoverImage(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', IMAGE_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        // Apply eager transformation: 400×400 square crop, auto quality & format
        const baseUrl = data.secure_url.replace(
          '/upload/',
          '/upload/w_400,h_400,c_fill,q_auto,f_auto/'
        );
        resolve({ url: baseUrl, publicId: data.public_id });
      } else {
        const err = JSON.parse(xhr.responseText);
        reject(new Error(err?.error?.message || 'Image upload failed. Please try again.'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during image upload.'));
    xhr.send(formData);
  });
}
