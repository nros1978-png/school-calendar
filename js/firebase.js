import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { CONFIG } from './config.js';

const app = initializeApp(CONFIG.firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
