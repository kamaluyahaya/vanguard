// lib/firebaseClient.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!, // must be present
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const auth = getAuth();
const provider = new GoogleAuthProvider();

// FORCE account chooser
provider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGooglePopup(): Promise<{ user: User; idToken: string }> {
  // optional: ensure no stale session is silently used
  // await auth.signOut(); // uncomment if you want to always sign out first

  const res = await signInWithPopup(auth, provider);
  const idToken = await res.user.getIdToken();
  return { user: res.user, idToken };
}
