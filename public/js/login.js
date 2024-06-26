import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithRedirect, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getUid, setUid } from './uid.js';
import { loadDesigns, getDesigns } from './firestore.js';

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

if (window.location.pathname.endsWith('/')){
    document.getElementById('login').addEventListener('click', GoogleLogin);
    document.getElementById('logout').addEventListener('click', (e) => {
        console.log('Logging out');
        e.preventDefault();
        signOut(auth).then(() => {
            var redirectUrl = sessionStorage.getItem('redirectUrl');
            if (redirectUrl) {
                // Clear the stored URL
                sessionStorage.removeItem('redirectUrl');
            }
            window.location.href = '/';
        }
        ).catch((error) => {
            console.log(error);
        });
    });
}

function GoogleLogin() {
    console.log('Logging in');
    signInWithRedirect(auth, provider).then(result => {
        if (result.credential) {
            var credential = result.credential;
            var token = credential.accessToken;
        }
        const user = result.user;
        setUid(user.uid);
    }).catch((error) => {
        console.log(error);
    });
}

function updateProfile(user) {
    const username = user.displayName;
    const email = user.email;
    const profile = user.photoURL;
    console.log(username, email, profile);
    console.log(getUid());
    document.getElementById("user-name").textContent = username;
}

onAuthStateChanged(auth, (user) => {
    loginCheck(user);
});

async function loginCheck(user){
    if (user) {
        console.log(user.uid);
        if (window.location.pathname.endsWith('/')){
            var redirectUrl = sessionStorage.getItem('redirectUrl');
            if (redirectUrl) {
                // Clear the stored URL
                sessionStorage.removeItem('redirectUrl');
                // Redirect back to the stored URL
                window.location.href = redirectUrl;
            } else {
                console.log(window.location.pathname);
                document.getElementById("homepage").style.display = "block";
                document.getElementById("loginpage").style.display = "none";
                updateProfile(user)
                loadDesigns();
            }
        } else if (window.location.pathname.endsWith('/edit.html')){
            setUid(user.uid);
            const urlParams = new URLSearchParams(window.location.search);
            const design = urlParams.get('d');
            if (!design) {
                window.location.href = '/';
            }
        }
    } else {
        console.log("not logged in");
        if (window.location.pathname.endsWith('/')) {
            document.getElementById("homepage").style.display = "none";
            document.getElementById("loginpage").style.display = "block";
        } else {
            // Capture the current URL before redirecting to login
            sessionStorage.setItem('redirectUrl', window.location.href);
            window.location.href = '../';
        }
    }
}