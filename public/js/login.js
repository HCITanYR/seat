console.log('imported this script yay');

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

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
auth.languageCode = 'en';
const user = auth.currentUser;

let provider = new GoogleAuthProvider();

console.log('stuff works');
if (window.location.pathname === "/") {
    document.getElementById('login').addEventListener('click', GoogleLogin);
}

function GoogleLogin() {
    console.log('Logging in');
    signInWithPopup(auth, provider).then(result => {
        if (result.credential) {
            var credential = result.credential;
            var token = credential.accessToken;
        }
        const user = result.user;
        console.log(user);
        window.location.href = "../home.html";
    }).catch((error) => {
        console.log(error);
    });
}

function updateProfile(user) {
    const username = user.displayName;
    const email = user.email;
    const profile = user.photoURL;
    console.log(username, email, profile);

    document.getElementById("title").textContent = "Logged in as";
    document.getElementById("username").textContent = username;
    document.getElementById("email").textContent = email;
    document.getElementById("profile").src = profile;
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("logged in");
        console.log(window.location.pathname);
        if (window.location.pathname === "/") {
            console.log("redirecting to home page");
            window.location.href = "../home.html";
        }
        if (window.location.pathname.endsWith("home.html")) {
            console.log("displaying home page");
            updateProfile(user);
        }
    } else {
        console.log("not logged in");
        if (window.location.pathname !== "/") {
            console.log("redirecting to login page");
            window.location.href = "../";
        } 
        if (window.location.pathname === "/") {
            console.log("displaying login page");
            document.getElementById("loginpage").style.display = "block";
        }
    }
});