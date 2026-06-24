// src/cloudinary/upload.js

const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const AUDIO_PRESET = import.meta.env.VITE_CLOUDINARY_AUDIO_PRESET; // 'songsupload'
const IMAGE_PRESET = import.meta.env.VITE_CLOUDINARY_IMAGE_PRESET; // 'songsupload'

/**
 * Validate media duration client-side.
 * Rejects clips shorter than 5 s or longer than 180 s. Enforces 100MB limit.
 */
export async function validateMediaDuration(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 100 * 1024 * 1024) {
      return reject(new Error('File exceeds the 100MB limit.'));
    }

    const isVideo = file.type.startsWith('video/');
    const mediaElement = document.createElement(isVideo ? 'video' : 'audio');
    
    mediaElement.preload = 'metadata';
    mediaElement.onloadedmetadata = () => {
      URL.revokeObjectURL(mediaElement.src);
      const duration = mediaElement.duration;
      if (duration < 5) {
        reject(new Error(`${isVideo ? 'Video' : 'Audio'} must be at least 5 seconds long.`));
      } else if (duration > 180) { 
        reject(new Error(`File is ${Math.round(duration)}s — max allowed is 180 seconds.`));
      } else {
        resolve(duration);
      }
    };
    mediaElement.onerror = () => {
      URL.revokeObjectURL(mediaElement.src);
      reject(new Error('Could not read media file. Please check the format.'));
    };
    mediaElement.src = URL.createObjectURL(file);
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

/**
 * Generic upload function for any media type (video, audio, image)
 * Returns the secure URL of the uploaded file
 */
export async function uploadToCloudinary(file, resourceType = 'auto', onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  
  // Use appropriate preset based on resource type
  let preset = IMAGE_PRESET;
  let endpoint = 'image';
  
  if (resourceType === 'video' || file.type.startsWith('video/')) {
    preset = AUDIO_PRESET; // Reuse audio preset for videos
    endpoint = 'video';
  } else if (resourceType === 'audio' || file.type.startsWith('audio/')) {
    preset = AUDIO_PRESET;
    endpoint = 'video'; // Cloudinary uses video endpoint for audio
  }
  
  formData.append('upload_preset', preset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url);
      } else {
        const err = JSON.parse(xhr.responseText);
        reject(new Error(err?.error?.message || 'Upload failed. Please try again.'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.send(formData);
  });
}
