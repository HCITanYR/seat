import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js';
import { getAuth } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

var firebaseConfig = {
    apiKey: "AIzaSyA8NyZjvci3P3_M8xFKbg-fm9ytaNpGfmE",
    authDomain: "seat-87c59.firebaseapp.com",
    projectId: "seat-87c59",
    storageBucket: "seat-87c59.appspot.com",
    messagingSenderId: "1061951130301",
    appId: "1:1061951130301:web:5693c4edf70073334085d4",
    measurementId: "G-4996WZXJ2R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let uid = null;

export function setUid(value) {
    console.log('setting uid to ' + value);
    uid = value;
}

export function getUid() {
    const user = auth.currentUser;
    if (user) {
        uid = user.uid;
    }
    return uid;
}