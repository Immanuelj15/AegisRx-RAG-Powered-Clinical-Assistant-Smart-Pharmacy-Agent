import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'

const GOOGLE_CLIENT_ID = '944865544097-qotnbsnb07mklrn4j3egp4l2g75oavru.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
)
