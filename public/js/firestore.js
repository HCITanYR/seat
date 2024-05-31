import { initializeFirestore, CACHE_SIZE_UNLIMITED, doc, setDoc, addDoc, collection } from 'https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js';
import { getUid, setUid } from './uid.js';

var firebaseConfig = {
    apiKey: "AIzaSyA8NyZjvci3P3_M8xFKbg-fm9ytaNpGfmE",
    authDomain: "seat-87c59.firebaseapp.com",
    projectId: "seat-87c59",
    storageBucket: "seat-87c59.appspot.com",
    messagingSenderId: "1061951130301",
    appId: "1:1061951130301:web:5693c4edf70073334085d4",
    measurementId: "G-4996WZXJ2R"
};

const app = initializeApp(firebaseConfig);
const firestore  = initializeFirestore(app, { cacheSizeBytes: CACHE_SIZE_UNLIMITED });


document.getElementById('create').addEventListener('click', add);

async function add(){
    const designsRef = collection(firestore, 'designs');
    const docRef = doc(designsRef, 'someDocument'); // replace 'someDocument' with the ID of the document you want to add the 'john' collection to
    const docData = { field: 'value', anotherField: 'anotherValue' };
    try {
        const johnDocRef = await addDoc(docRef, docData);
        console.log(`Document written with ID: ${docRef.id}`);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}