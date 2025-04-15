// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "quiztalworld.firebaseapp.com",
    projectId: "quiztalworld",
    storageBucket: "quiztalworld.firebasestorage.app",
    messagingSenderId: "1071410127634",
    appId: "1:1071410127634:web:659490631d27599e86c9cb",
    measurementId: "G-T61DV55X67"
};

const app = initializeApp(firebaseConfig);
export { app };

export const auth = getAuth(app);
export const db = getFirestore(app);
