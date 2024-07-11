console.log('settings.js loaded');
import { getUid } from '../../js/uid.js';
import { getDesigns } from '../../js/firestore.js';
const urlParams = new URLSearchParams(window.location.search);
const design = urlParams.get("d");
while (getUid() === null) {
    await new Promise((resolve) => setTimeout(resolve));
}
const designs = await getDesigns(getUid());
const designweusing = designs["designs"][design];
const historyIndex = designweusing["histindex"];
var history = [];
for (const item in designweusing["data"]) {
    history.push(designweusing["data"][item]);
}
const Students = JSON.parse(history[historyIndex].students);        
populateDropdowns();    
// Function to populate dropdowns with options from the Students array
function populateDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-select');
    
    dropdowns.forEach(dropdown => {
        dropdown.innerHTML = ''; // Clear existing options
        const option = document.createElement('option');
        option.textContent = ''; // blank option
        dropdown.appendChild(option);
        for(var i=0; i<Students.length; i++){
            console.log(Students[i]);
            const option = document.createElement('option');
            option.textContent = Students[i];
            dropdown.appendChild(option);
        }
    });
}

function fadeIn(elementId, duration) {
    let element = document.getElementById(elementId);
    element.style.opacity = 0; // Ensure the element is initially hidden
    let last = +new Date();
    let tick = function() {
        element.style.opacity = +element.style.opacity + (new Date() - last) / duration;
        last = +new Date();

        if (+element.style.opacity < 1) {
            (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
        }
    };
    tick();
}
fadeIn('settings', 500);

// Call the function to populate dropdowns on page load


// Function to add selected student to the list
function addStudent(type) {
    let inputId, listId;
    switch (type) {
        case 'front':
            inputId = 'frontRowStudent';
            listId = 'frontRowList';
            break;
        case 'back':
            inputId = 'backRowStudent';
            listId = 'backRowList';
            break;
        case 'separated':
            inputId = 'separatedStudent';
            listId = 'separatedList';
            break;
        case 'locked':
            inputId = 'lockedStudent';
            listId = 'lockedList';
            break;
        case 'createTag':
            inputId = 'createTag';
            listId = 'createTagList';
            break;
    }

    const selectedOption = document.getElementById(inputId).value;
    if (selectedOption) {
        const li = document.createElement('li');
        li.textContent = selectedOption;
        document.getElementById(listId).appendChild(li);
        document.getElementById(inputId).value = '';
    }
}

// Function to submit settings
function submitSettings() {
    const settings = {
        frontRowStudents: Array.from(document.getElementById('frontRowList').children).map(li => li.textContent),
        backRowStudents: Array.from(document.getElementById('backRowList').children).map(li => li.textContent),
        separatedStudents: Array.from(document.getElementById('separatedList').children).map(li => li.textContent),
        lockedStudents: Array.from(document.getElementById('lockedList').children).map(li => li.textContent),
        tags: Array.from(document.getElementById('createTagList').children).map(li => li.textContent)
    };
    console.log(settings); // You can process the settings object here as needed
}
function closeSettings() {
    window.location.href = window.location.href.replace("/settings", "");
}

document.getElementById('close').addEventListener('click', closeSettings);
document.getElementById('submit').addEventListener('click', submitSettings);