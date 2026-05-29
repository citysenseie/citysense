import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, GeoPoint, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDfydHxczoAw-xs8Rc2fP0KsarPB3DmVSE",
  authDomain: "citysense-3e7a4.firebaseapp.com",
  projectId: "citysense-3e7a4",
  storageBucket: "citysense-3e7a4.firebasestorage.app",
  messagingSenderId: "653017701073",
  appId: "1:653017701073:web:9101c90467e4bddf7843f0"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { collection, addDoc, getDocs, query, orderBy, serverTimestamp, GeoPoint, Timestamp };
