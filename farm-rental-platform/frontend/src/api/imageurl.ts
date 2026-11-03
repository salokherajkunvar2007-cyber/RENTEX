
const BACKEND_URL = 'https://rentex-backend-kqa2.onrender.com';

export const getImageUrl = (photo?: string) => {
  if (!photo) return '';

  if (photo.startsWith('http://') || photo.startsWith('https://')) {
    return photo;
  }

  if (photo.startsWith('/uploads/')) {
    return `${BACKEND_URL}${photo}`;
  }

  return photo;
};