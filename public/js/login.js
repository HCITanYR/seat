
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js';
import {signInWithPopup, getAuth, GoogleAuthProvider} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

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

console.log('stuff works')
document.getElementById('login').addEventListener('click', GoogleLogin)

let provider = new GoogleAuthProvider();


function GoogleLogin(){
    console.log('Logging in')
    signInWithPopup(auth, provider).then(result => {
        if(result.credential){
            var credential = result.credential;
            var token = credential.accessToken;
        }
        const user = result.user;
        console.log(user);
        window.location.href = "../home.html";
    }).catch((error) => {
        console.log(error)
    });
}
