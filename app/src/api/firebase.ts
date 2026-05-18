import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCMHDZ0ZktkfJEeI3DWNrCCNHAJYzqQEQk",
  authDomain: "hokkaido-trip-c1907.firebaseapp.com",
  projectId: "hokkaido-trip-c1907",
  storageBucket: "hokkaido-trip-c1907.firebasestorage.app",
  messagingSenderId: "661163052092",
  appId: "1:661163052092:web:3200441657bc02a52e4739",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
