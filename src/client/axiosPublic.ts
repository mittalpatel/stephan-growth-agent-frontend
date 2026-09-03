import axios from 'axios';
import { DEFAULT_LANGUAGE } from '@/config/language';

// For backend endpoints that don't require a session (forgot-password/OTP flow).
// Unlike axiosAuth, this never attaches an Authorization header or attempts a
// token refresh on 401.
const axiosPublic = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API,
  headers: { 'Accept-Language': DEFAULT_LANGUAGE },
});

export default axiosPublic;
