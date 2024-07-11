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
    document.getElementById("user-name").textContent = username;
}

onAuthStateChanged(auth, (user) => {
    loginCheck(user);
});

async function loginCheck(user){
    if (user) {
        if (window.location.pathname.endsWith('/')){
            var redirectUrl = sessionStorage.getItem('redirectUrl');
            if (redirectUrl) {
                // Clear the stored URL
                sessionStorage.removeItem('redirectUrl');
                // Redirect back to the stored URL
                window.location.href = redirectUrl;
            } else {
                document.getElementById("homepage").style.display = "";
                slideIn('homepage', 500);
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
        if (window.location.pathname.endsWith('/')) {
            document.getElementById("homepage").style.display = "none";
            document.getElementById("loginpage").style.display = "";
        } else {
            // Capture the current URL before redirecting to login
            sessionStorage.setItem('redirectUrl', window.location.href);
            window.location.href = '../';
        }
    }
}

function slideIn(elementId, duration) {
    let element = document.getElementById(elementId);
    element.style.opacity = 0; // Ensure the element is initially hidden
    element.style.position = 'relative'; // Ensure the element's position can be manipulated
    element.style.bottom = '-100px'; // Start position off-screen

    let start = +new Date();
    let tick = function() {
        let now = +new Date();
        let timeProgress = (now - start) / duration;
        if (timeProgress > 1) timeProgress = 1; // Clamp timeProgress to 1

        // Apply quadratic easing
        let progress = timeProgress < 0.5 ? 2 * timeProgress * timeProgress : -1 + (4 - 2 * timeProgress) * timeProgress;

        element.style.opacity = progress;
        element.style.bottom = (-100 * (1 - progress)) + 'px'; // Calculate new position based on easing

        if (timeProgress < 1) {
            (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
        }
    };
    tick();
}