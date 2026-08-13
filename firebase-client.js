import { deleteApp, initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyA1nnlGOWL_k49eBcaxl4W4HckpY80g9Gk",
  authDomain: "innovaesite-4fbff.firebaseapp.com",
  projectId: "innovaesite-4fbff",
  storageBucket: "innovaesite-4fbff.firebasestorage.app",
  messagingSenderId: "648033581007",
  appId: "1:648033581007:web:33413d72bcd2a72357c4ba",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export { app, deleteApp, firebaseConfig };
