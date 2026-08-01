import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// Firebase configuration using project ID: blockchain-career
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyFakeKeyPlaceholderBlockchainCareer",
  authDomain: "blockchain-career.firebaseapp.com",
  projectId: "blockchain-career",
  storageBucket: "blockchain-career.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:fakeappidplaceholder"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Prevent popup immediately closing issues by setting custom parameters if needed
provider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, provider, signInWithPopup, signOut };
