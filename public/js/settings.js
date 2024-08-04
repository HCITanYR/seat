const dropdownList = ['front', 'back', 'separate', 'lock'];
import { getUid } from '../../js/uid.js';
import { getDesigns, update } from '../../js/firestore.js';
const urlParams = new URLSearchParams(window.location.search);
const design = urlParams.get("d");
while (getUid() === null) {
    await new Promise((resolve) => setTimeout(resolve));
}
const designs = await getDesigns(getUid());
if (designs["designs"].length <= design) {
    //redirect home
    window.location.href = "/";
}
const designweusing = designs["designs"][design];
const historyIndex = designweusing["histindex"];
var history = [];
for (const item in designweusing["data"]) {
    history.push(designweusing["data"][item]);
}
const Students = JSON.parse(history[historyIndex].students);   
var settings = designweusing["settings"];     
populateDropdowns();    

// Function to populate dropdowns with options from the Students array
function populateDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-select');

    for (let j = 0; j < dropdowns.length; j++) {
        const dropdown = dropdowns[j];
        dropdown.innerHTML = ''; // Clear existing options

        for (var i = 0; i < Students.length; i++) {
            const option = document.createElement('option');
            option.textContent = Students[i];
            option.selected = settings[dropdownList[j]].includes(Students[i]);

            option.addEventListener('mousedown', function(event) {
                // Prevent the default behavior to avoid scrolling back up
                event.preventDefault();
                this.selected = !this.selected;
                updateSettings(this, dropdownList[j]);
            });

            dropdown.appendChild(option);
        }

    }
}

function updateSettings(option, dropdownKey) {
    if (option.selected) {
        // Add the selected value to the settings object
        if (!settings[dropdownKey].includes(option.textContent)) {
            settings[dropdownKey].push(option.textContent);
        }
    } else {
        // Remove the selected value from the settings object
        settings[dropdownKey] = settings[dropdownKey].filter(value => value !== option.textContent);
    }
    // To reflect changes, trigger the 'change' event on the select element if needed
    option.parentElement.dispatchEvent(new Event('change'));
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


async function submitSettings() {
    const x = await getDesigns(getUid());
    var dx = x["designs"][design];
    update(settings, design, dx["name"], dx['data'], x, dx['histindex'], getUid());
    alert('Saved Successfully');
}
function closeSettings() {
    window.location.href = window.location.href.replace("/settings", "");
}

document.getElementById('close').addEventListener('click', closeSettings);
document.getElementById('submit').addEventListener('click', submitSettings);