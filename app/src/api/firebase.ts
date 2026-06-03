const firebaseConfig = {
  apiKey: "AIzaSyCMHDZ0ZktkfJEeI3DWNrCCNHAJYzqQEQk",
  authDomain: "hokkaido-trip-c1907.firebaseapp.com",
  projectId: "hokkaido-trip-c1907",
  storageBucket: "hokkaido-trip-c1907.firebasestorage.app",
  messagingSenderId: "661163052092",
  appId: "1:661163052092:web:3200441657bc02a52e4739",
};

export type FirebaseUser = import("firebase/auth").User;

type FirebaseServices = {
  auth: import("firebase/auth").Auth;
  db: import("firebase/firestore").Firestore;
  GoogleAuthProvider: typeof import("firebase/auth").GoogleAuthProvider;
  onAuthStateChanged: typeof import("firebase/auth").onAuthStateChanged;
  signInWithPopup: typeof import("firebase/auth").signInWithPopup;
  signOut: typeof import("firebase/auth").signOut;
  collection: typeof import("firebase/firestore").collection;
  doc: typeof import("firebase/firestore").doc;
  getDoc: typeof import("firebase/firestore").getDoc;
  getDocs: typeof import("firebase/firestore").getDocs;
  limit: typeof import("firebase/firestore").limit;
  orderBy: typeof import("firebase/firestore").orderBy;
  query: typeof import("firebase/firestore").query;
  serverTimestamp: typeof import("firebase/firestore").serverTimestamp;
  setDoc: typeof import("firebase/firestore").setDoc;
};

let servicesPromise: Promise<FirebaseServices> | null = null;

export function getFirebaseServices() {
  servicesPromise ||= Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
  ]).then(([appModule, authModule, firestoreModule]) => {
    const firebaseApp = appModule.getApps().length
      ? appModule.getApp()
      : appModule.initializeApp(firebaseConfig);

    return {
      auth: authModule.getAuth(firebaseApp),
      db: firestoreModule.getFirestore(firebaseApp),
      GoogleAuthProvider: authModule.GoogleAuthProvider,
      onAuthStateChanged: authModule.onAuthStateChanged,
      signInWithPopup: authModule.signInWithPopup,
      signOut: authModule.signOut,
      collection: firestoreModule.collection,
      doc: firestoreModule.doc,
      getDoc: firestoreModule.getDoc,
      getDocs: firestoreModule.getDocs,
      limit: firestoreModule.limit,
      orderBy: firestoreModule.orderBy,
      query: firestoreModule.query,
      serverTimestamp: firestoreModule.serverTimestamp,
      setDoc: firestoreModule.setDoc,
    };
  });

  return servicesPromise;
}
