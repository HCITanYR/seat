console.log('imported this script yay')

import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js';
import {getAuth, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

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

  
function updateProfile(user){
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
        if (window.location.pathname === "/"){
            console.log("redirecting to home page");
            window.location.href = "../home.html";
        }
        if (window.location.pathname.endsWith("home.html")){
            console.log("displaying home page");
            updateProfile(user);
        }
    } else {
        console.log("not logged in");
        if (window.location.pathname !== "/"){
            console.log("redirecting to login page");
            window.location.href = "../";
        } else {
            console.log("displaying login page");
            document.getElementById("loginpage").style.display = "block";
        }
    }
});