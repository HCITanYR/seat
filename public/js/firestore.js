import { initializeFirestore, CACHE_SIZE_UNLIMITED, doc, setDoc, addDoc, getDoc, collection, updateDoc } from 'https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js';
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


async function setup(){
    const designsRef = collection(firestore, 'designs');
    const docRef = doc(designsRef, getUid());
    const docSnap = await getDoc(docRef);
    const docData = {designs: []};
    if (!docSnap.exists()) {
        try {
            await setDoc(docRef, docData);
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }
}

export async function add(name, data){
    await setup();
    const designsRef = collection(firestore, 'designs');
    const docRef = doc(designsRef, getUid());
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        try {
            let designs = docSnap.data();
            designs['designs'].push({"histindex": -1, "name": name, "data": data, "lastModified": new Date().getTime()});
            await setDoc(docRef, designs);
            const index = designs['designs'].length - 1;
            window.location.href = '/designs/' + getUid() + '?d=' + index;
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    } else {
    }
}

export async function update(index, name, history, designs, hi, uid){
    var a = designs['designs'];
    a[index] = {'histindex': hi, 'name': name, 'data': history, 'lastModified': new Date().getTime()};
    await updateDoc(doc(firestore, 'designs', uid), {'designs': a});
}

export async function getDesigns(uid){
    await setup();
    const designsRef = collection(firestore, 'designs');
    const docRef = doc(designsRef, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        }
        return [];
    }
}

function addDesignCard(name, index){
    const col = document.createElement('div');
    col.className = 'col-md-3';
    const card = document.createElement('div');
    card.className = 'design-card hover-darken';
    const para = document.createElement('p');
    para.innerHTML = name;
    const image = document.createElement('img');
    image.src = 'https://via.placeholder.com/150';
    card.appendChild(image);
    card.appendChild(para);
    col.appendChild(card);
    col.addEventListener('click', () => {
        window.location.href = '/designs/' + getUid() + '?d=' + index;
    });
    document.getElementById('designRow').appendChild(col);
}

export async function loadDesigns() {
    await getDesigns(getUid()).then(data => {
        if (data['designs'].length > 0) {
            data.designs.sort((a, b) => b.lastModified - a.lastModified);
            data.designs.forEach((design, index) => {
                addDesignCard(design.name, index);
            });
        }
    });
}