import axios from 'axios';
import { getLanguage } from '@/locales/activeLanguage';

// For backend endpoints that don't require a session (forgot-password/OTP flow).
// Unlike axiosAuth, this never attaches an Authorization header or attempts a
// token refresh on 401.
const axiosPublic = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API,
  // Browser-only client: read once per page load, and a language switch
  // reloads the page, so this stays the viewer's language.
  headers: { 'Accept-Language': getLanguage() },
});

export default axiosPublic;
