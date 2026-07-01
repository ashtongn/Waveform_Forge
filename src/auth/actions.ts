import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Create the account, then its /profiles/{uid} document as a pending member.
// The Firestore rules only permit a user to create their OWN profile with
// role 'member' and status 'pending', so this shape is enforced server-side.
export async function signUp(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'profiles', cred.user.uid), {
    email: cred.user.email,
    role: 'member',
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

export async function logIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logOut() {
  await signOut(auth);
}

// A denied user may move their own profile back to 'pending' to re-request
// review. Rules permit this specific denied -> pending self-transition only.
export async function requestReapproval(uid: string) {
  const ref = doc(db, 'profiles', uid);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().status !== 'denied') return;
  await setDoc(ref, { status: 'pending' }, { merge: true });
}
