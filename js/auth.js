// Authentication Module for School Calendar & Gantt Application
// Powered by Firebase Authentication (Google Provider) with real-time state synchronization.

import { auth } from './firebase.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { DB } from './database.js';
import { CONFIG } from './config.js';

const SESSION_KEY = 'school_user_session';
let authChangeListener = null;
const provider = new GoogleAuthProvider();

// Listen to Firebase Auth state changes
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    const email = firebaseUser.email;
    const name = firebaseUser.displayName || '';
    const picture = firebaseUser.photoURL || '';
    
    // Synchronize user role and authorization status with Firestore directly (preventing race condition)
    let dbUser = await DB.getUser(email);
    
    const isSuperAdmin = CONFIG.SUPER_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
    
    try {
      if (isSuperAdmin) {
        if (!dbUser || !dbUser.isAuthorized || dbUser.role !== 'Admin') {
          await DB.addUser(email, true, 'Admin');
          dbUser = { email, isAuthorized: true, role: 'Admin' };
        }
      } else if (!dbUser) {
        // Auto-register new Google sign-ins as unauthorized Teachers
        await DB.addUser(email, false, 'Teacher');
        dbUser = { email, isAuthorized: false, role: 'Teacher' };
      }
    } catch (e) {
      console.warn("Firestore sync failed, falling back to local memory:", e);
      if (isSuperAdmin) {
        dbUser = { email, isAuthorized: true, role: 'Admin' };
      } else {
        dbUser = dbUser || { email, isAuthorized: false, role: 'Teacher' };
      }
    }
    
    const sessionData = {
      email: dbUser.email,
      isAuthorized: dbUser.isAuthorized,
      role: dbUser.role,
      name: name || email.split('@')[0],
      picture: picture || ''
    };
    
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
  
  if (authChangeListener) {
    authChangeListener(Auth.getCurrentUser());
  }
});

export const Auth = {
  /**
   * Returns the currently logged in user session or null
   */
  getCurrentUser() {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (!session) return null;
    try {
      const parsedSession = JSON.parse(session);
      // Ensure role/permissions are always synced with database
      const users = DB.getUsers();
      const dbUser = users.find(u => u.email.toLowerCase() === parsedSession.email.toLowerCase());
      if (dbUser) {
        return {
          ...parsedSession,
          isAuthorized: dbUser.isAuthorized,
          role: dbUser.role
        };
      }
      return parsedSession;
    } catch (e) {
      return null;
    }
  },

  /**
   * Registers a listener callback that triggers when auth status changes
   */
  onAuthChange(callback) {
    authChangeListener = callback;
    // Trigger immediately to initialize app views
    callback(this.getCurrentUser());
  },

  /**
   * Triggers the Google Sign-in popup window
   */
  async login() {
    if (window.location.protocol === 'file:') {
      const email = prompt("התחברות מהירה (סביבת הדמיה מקומית):\n\nהזן כתובת אימייל לדוגמה:\n• nros1978@gmail.com (כניסה כאדמין-על)\n• teacher@school.org (כניסה כמורה מורשה)");
      if (email) {
        this.loginWithMock(email);
      }
      return;
    }
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Firebase Google Sign-In error:', error);
      alert('ההתחברות באמצעות גוגל נכשלה.\n\nקוד שגיאה: ' + error.code + '\nתיאור: ' + error.message);
    }
  },

  loginWithMock(email) {
    const cleanEmail = email.trim().toLowerCase();
    const isSuperAdmin = cleanEmail === 'nros1978@gmail.com' || cleanEmail === 'admin@school.org';
    
    // Check if the user exists in database to get authorization and role, otherwise fallback
    const users = DB.getUsers();
    const dbUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    
    const isAuthorized = dbUser ? dbUser.isAuthorized : (isSuperAdmin || cleanEmail.includes('teacher'));
    const role = dbUser ? dbUser.role : (isSuperAdmin ? 'Admin' : 'Teacher');

    const sessionData = {
      email: cleanEmail,
      isAuthorized,
      role,
      name: cleanEmail.split('@')[0],
      picture: ''
    };
    
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    if (authChangeListener) {
      authChangeListener(this.getCurrentUser());
    }
  },

  /**
   * Logs out the user from Firebase Auth
   */
  async logout() {
    sessionStorage.removeItem(SESSION_KEY);
    if (window.location.protocol === 'file:') {
      if (authChangeListener) {
        authChangeListener(null);
      }
      return;
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Firebase Sign-Out error:', error);
    }
  }
};
