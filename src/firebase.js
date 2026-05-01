import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue, off } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBHkBEJVUfyHRi5rDfKs91sf9PSLnd0yNQ",
  authDomain: "pokertutor-a75c3.firebaseapp.com",
  databaseURL: "https://pokertutor-a75c3-default-rtdb.firebaseio.com",
  projectId: "pokertutor-a75c3",
  storageBucket: "pokertutor-a75c3.firebasestorage.app",
  messagingSenderId: "326849507024",
  appId: "1:326849507024:web:044d3d6221ac21662478d5",
  measurementId: "G-YPGJ9S8YV5"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, update, onValue, off };
