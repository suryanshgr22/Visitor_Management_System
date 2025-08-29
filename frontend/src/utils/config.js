// Environment variables configuration
const config = {
  cloudinary: {
    cloudName: window.ENV?.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dlv0xp55u',
    uploadPreset: window.ENV?.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'visitor_photos'
  },
  api: {
    baseUrl: window.ENV?.REACT_APP_API_URL || 'https://visitor-management-system-backend-2enn.onrender.com'
  }
};

export default config; 
