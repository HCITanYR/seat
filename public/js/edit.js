var name = '';
var history = [];
let historyIndex = -1;
const urlParams = new URLSearchParams(window.location.search);
const design = urlParams.get('d');
var currentUrl = window.location.href;
var urlSegments = currentUrl.split('/');
var uid = urlSegments[4].split('?')[0];
var Students = [];

var seatlist = ['','','',''];
var designs = null;
var rows = 2;
var columns = 2;

import { getDesigns, update } from "./firestore.js";
import { getUid } from "./uid.js";

// Initialise page on load
document.addEventListener('DOMContentLoaded', async () => {
    while (getUid() === null) {
        await new Promise(resolve => setTimeout(resolve));
    }
    designs = await getDesigns(uid);
    if (designs['designs'].length <= design){
        //redirect home
        window.location.href = '/';
    }
    var designweusing = designs['designs'][design];
    name = designweusing['name'];
    historyIndex = designweusing['histindex'];
    for (const item in designweusing['data']){
        history.push(designweusing['data'][item]);
    }
    if (history.length == 0) {
        updateSeatingPlan();
        await saveState();
    }
    applyState(history[historyIndex]);
    document.getElementById('designtitle').innerHTML = name;
    document.getElementById('editpage').style.display = 'block';
});

function updateDraggableSeats() {
    // make the seats draggable AND droppable
    const allSeats = document.querySelectorAll('.seat');
    allSeats.forEach(seat => {
        seat.draggable = false; // default state
        if (seat.classList.contains('occupied') && !document.getElementById('pan').classList.contains('btn-primary') && !document.getElementById('pan').classList.contains('btn-primary')) {
            // can drag if seat is not empty and pan button is not toggled
            // and pan not toggled
            seat.draggable = true;
            seat.addEventListener('dragstart', seatDragStart);
            seat.addEventListener('dragend', seatDragEnd);
        }
        seat.addEventListener('dragover', seatDragOver);
        seat.addEventListener('drop', seatDrop);
        seat.addEventListener('dragleave', seatDragLeave);
    });
}

function seatDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.innerText);
    e.dataTransfer.effectAllowed = 'move';

    // highlight the seat being dragged
    e.target.classList.add('dragging');
}

function seatDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move'; // indicate a move operation

    if (e.target.classList.contains('seat') && !e.target.classList.contains('dragging')) {
        e.target.classList.add('over');
    }
}

function seatDragLeave(e) {
    if (e.target.classList.contains('seat')) {
        e.target.classList.remove('over');
    }
}

async function seatDrop(e) {
    e.preventDefault();
    const studentName = e.dataTransfer.getData('text/plain');
    const targetSeat = e.target;

    // remove the 'over' class first
    targetSeat.classList.remove('over');

    // remove the 'dragging' class from the previously selected seat
    const previousSeat = document.querySelector('.dragging');
    if (previousSeat) {
        previousSeat.classList.remove('dragging');
    }

    // find if the student is already seated elsewhere
    const allSeats = document.querySelectorAll('.seat');
    let existingSeat = null;
    allSeats.forEach(seat => {
        if (seat.innerText === studentName && seat !== targetSeat) {
            existingSeat = seat;
        }
    });

    if (targetSeat.classList.contains('unoccupied')) {
        // if empty seat
        if (existingSeat) {
            // if the student is already occupying another seat
            existingSeat.innerText = ''; // clear the student's name from the old seat
            existingSeat.classList.remove('occupied');
            existingSeat.classList.add('unoccupied'); // mark the old seat as unoccupied
        }
        // move the student to the new target seat
        targetSeat.innerText = studentName; // set the student's name to the new seat
        targetSeat.classList.remove('unoccupied');
        targetSeat.classList.add('occupied'); // mark the new seat as occupied
        await saveState();
    } else if (targetSeat.classList.contains('occupied')) {
        // target seat already occupied
        if (targetSeat.innerText == studentName) {
            return; // do nothing if same student is dropped
        } else {
            // occupied seat is a student of a different name
            if (existingSeat) {
                // if the student is already occupying another seat
                existingSeat.innerText = targetSeat.innerText; // swap the existing seat with target
            }
            targetSeat.innerText = studentName; // replace target
            await saveState();
        }
    }
}

function seatDragEnd(e) {
    // remove the 'dragging' class from the seat
    e.target.classList.remove('dragging');
}

// Zoom in and zoom out functionality
let zoomLevel = 1;

// trackpad functions
const seatingPlanContainer = document.getElementById('seating-plan');
seatingPlanContainer.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        // Zoom with two-finger scroll
        const deltaY = e.deltaY;
        if (deltaY < 0) {
            zoomLevel += 0.1;
        } else if (deltaY > 0 && zoomLevel > 0.2) {
            zoomLevel -= 0.1;
        }
        document.getElementById('seating-plan').style.transform = `translate(${initialPosX}px, ${initialPosY}px) scale(${zoomLevel})`;
    } else {
        // Drag with two-finger scroll
        initialPosX -= e.deltaX;
        initialPosY -= e.deltaY;
        // Check boundaries
        if (initialPosX > maxX) {
            initialPosX = maxX;
        }
        if (initialPosX < minX) {
            initialPosX = minX;
        }
        if (initialPosY > maxY) {
            initialPosY = maxY;
        }
        if (initialPosY < minY) {
            initialPosY = minY;
        }
        document.getElementById('seating-plan').style.transform = `translate(${initialPosX}px, ${initialPosY}px) scale(${zoomLevel})`;
    }
});


//draggable background
const detect = document.getElementById('zoomable-content');
const frame = document.getElementById('seating-plan');
const minX = -500; // Set your minimum X
const maxX = 500; // Set your maximum X
const minY = -500; // Set your minimum Y
const maxY = 500;
// TODO: need to calculate this

let startX, startY, initialPosX = 0, initialPosY = 0;

// mouse icons + pan functionality
detect.addEventListener('mousedown', (e) => {
    if (!document.getElementById('pan').classList.contains('btn-primary') && e.target.draggable) {
        detect.style.cursor = 'grabbing';
    } else if (document.getElementById('pan').classList.contains('btn-primary')) {
        // pan toggled
        // TODO: add pan functionality
        updateDraggableSeats(); // disable seat dragging
    }
});
document.addEventListener('mouseup', () => {

});
document.addEventListener('mousemove', (e) => {
    // TODO: add pan stuff
    // disable seat drag and drop
});
function handleMouseAction(e) {
    updateDraggableSeats(); // enable seat dragging
    if (document.getElementById('pan').classList.contains('btn-primary')) {
        // if pan toggled
        detect.style.cursor = 'move';
    } else {
        if (e.target.draggable) {
            detect.style.cursor = 'grab';
        } else {
            detect.style.cursor = 'default';
        }
    }
}

document.addEventListener('mouseup', handleMouseAction);
document.addEventListener('mouseover', handleMouseAction);



//zoom in and out

document.getElementById('zoom-in').addEventListener('click', function () {
    zoomLevel += 0.1;
    document.getElementById('seating-plan').style.transform = `translate(${initialPosX}px, ${initialPosY}px) scale(${zoomLevel})`;
});

document.getElementById('zoom-out').addEventListener('click', function () {
    if (zoomLevel > 0.2) {
        zoomLevel -= 0.1;
        document.getElementById('seating-plan').style.transform = `translate(${initialPosX}px, ${initialPosY}px) scale(${zoomLevel})`;
    }
});

// pan button
document.getElementById('pan').addEventListener('click', function() {
    this.classList.toggle('btn-primary');
    this.classList.toggle('btn-outline-secondary');
});

async function saveState() {
    seatlist = [];
    Array.from(document.getElementById('seating-plan').children).forEach(row => {
        Array.from(row.children).forEach(seat => {
            seatlist.push(seat.innerText);
        });
    });
    const state = {
        students: JSON.stringify(Students),
        seatingPlan: JSON.stringify(seatlist),
        rows: rows,
        cols: columns,
    };
    
    //new state, nothing wrong.
    history.push(state);
    historyIndex++;
    updateDraggableSeats();
    await update(design, name, history, designs, historyIndex, uid);
}

async function applyState(state) {
    if (historyIndex > -1) {
        // document.getElementById('students-list').innerHTML = state.students;
        seatlist = JSON.parse(state.seatingPlan);
        Students = JSON.parse(state.students);
        document.getElementById('students-list').innerHTML = '';
        Students.forEach(student => {
            appendStudent(student);
        });
        rows = state['rows'];
        columns = state['cols'];
        document.getElementById('layout-rows').value = rows;
        document.getElementById('layout-columns').value = columns;
        attachEventListeners();
        updateDraggableSeats();
        updateSeatingPlan();
        await update(design, name, history, designs, historyIndex, uid);
    }
}

async function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        await applyState(history[historyIndex]);
        updateDraggableSeats();
    }
}

async function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        await applyState(history[historyIndex]);
        updateDraggableSeats();
    }
}

// Undo Redo buttons
document.getElementById('undo-btn').addEventListener('click', undo);
document.getElementById('redo-btn').addEventListener('click', redo);

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    // Check if the Ctrl or Cmd key is pressed along with Z or Y
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        // Undo action (Ctrl+Z or Cmd+Z)
        e.preventDefault(); // Prevent the default browser behavior
        undo();
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        // Redo action (Ctrl+Shift+Z or Cmd+Shift+Z)
        e.preventDefault(); // Prevent the default browser behavior
        redo();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        // Redo action (Ctrl+Y or Cmd+Y)
        e.preventDefault(); // Prevent the default browser behavior
        redo();
    }
});

document.querySelectorAll('.add-row').forEach(element => {
    element.addEventListener('click', () => {
        addRow(element.classList.contains('up')); // Pass in any parameters you need
    });
});

document.querySelectorAll('.add-column').forEach(element => {
    element.addEventListener('click', () => {
        addColumn(element.classList.contains('left')); // Pass in any parameters you need
    });
});

// Add a new row
async function addRow(up) {
    let i = 0;
    let temp = [];
    let x = JSON.parse(JSON.stringify(seatlist));
    if (up) {
        while (i < columns){
            temp.push('');
            i++;
        }
        temp = temp.concat(x);
    } else {
        temp = x;
        while (i < columns){
            temp.push('');
            i++;
        }
    }
    seatlist = JSON.parse(JSON.stringify(temp));
    const rowsInput = document.getElementById('layout-rows');
    rowsInput.value = parseInt(rowsInput.value) + 1;
    rows += 1;
    updateSeatingPlan();
    await saveState(); // Save the new seating plan state
}

// Add a new column
async function addColumn(left) {
    let i = 0;
    let temp = [];
    if (left) {
        while (i < seatlist.length) {
            if((i) % columns == 0){
                temp.push('');
            }
            temp.push(seatlist[i]);
            i += 1;
        }
    } else {
        while (i < seatlist.length) {
            temp.push(seatlist[i]);
            i += 1;
            if((i+1) % columns == 0){
                temp.push('');
            }
        }
    }
    // loop through n columns, add, add to list continue.
    
    seatlist = JSON.parse(JSON.stringify(temp));
    const columnsInput = document.getElementById('layout-columns');
    columnsInput.value = parseInt(columnsInput.value) + 1;
    columns += 1;
    updateSeatingPlan();
    await saveState(); // Save the new seating plan state
}



//   seating plan
function updateSeatingPlan() {
    const seatingPlanContainer = document.getElementById('seating-plan'); // Number of columns
    // Clear the existing seating plan
    seatingPlanContainer.innerHTML = '';
    let i = 0;
    let rowDiv = null;
    while (i < seatlist.length){
        if (i % columns == 0){
            rowDiv = document.createElement('div');
            rowDiv.classList.add('row');
        }
        const seatDiv = document.createElement('div');
        if (seatlist[i] === ''){
            seatDiv.classList.add('seat', 'unoccupied');
            seatDiv.classList.add('unselectable');
        } else {
            seatDiv.classList.add('seat', 'occupied');
            seatDiv.classList.add('unselectable');
            seatDiv.innerText = seatlist[i];
        }
        rowDiv.appendChild(seatDiv);
        i += 1;
        if (i % columns == 0){
            seatingPlanContainer.appendChild(rowDiv);
        }
    }
}


// Adding delete button to student
function addDeleteButton(student) {
    var deleteBtn = document.createElement('span');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', async function () {
        student.remove(); // remove student from list

        var studentName = student.innerText;
        Students = Students.filter(name => name !== studentName); // remove student from array
        // find if the student is already seated 
        const allSeats = document.querySelectorAll('.seat');
        allSeats.forEach(seat => {
            if (seat.innerText === studentName) {
                seat.innerText = ''; // clear the student's name from the old seat
                seat.classList.remove('occupied');
                seat.classList.add('unoccupied'); // mark the old seat as unoccupied
            }
        });

        await saveState(); // Save state after deleting a student
    });
    student.appendChild(deleteBtn);
}

// Add event listener for editing names
function addEditEventListener(student) {
    // Make students draggable
    student.draggable = true;
    student.addEventListener('dragstart', dragStart);

    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.innerText);
        e.dataTransfer.effectAllowed = 'move';
    }

    student.addEventListener('click', function (e) {
        var originalName = e.target.textContent.trim();
        var input = document.createElement('input');
        input.type = 'text';
        input.value = originalName;
        e.target.textContent = '';
        e.target.appendChild(input);
        input.focus();

        async function handleInput(e) {
            var newName = e.target.value.trim();

            if (newName && newName !== originalName) {
                // Check for duplicates
                var studentList = document.getElementById('students-list');
                var students = Array.from(studentList.getElementsByClassName('student'));
                var names = students.map(student => student.textContent);
                if (names.includes(newName)) {
                    // Show the error modal
                    $('#errorModal').modal('show');
                    e.target.parentElement.textContent = originalName; // Revert to the original name
                } else {
                    e.target.parentElement.textContent = newName;
                    Students[Students.indexOf(originalName)] = newName;
                    await saveState(); // Save state after editing a student name
                }
            } else {
                e.target.parentElement.textContent = originalName;
            }
            addDeleteButton(student, Students, seatlist, rows, columns); // re-add delete button after editing
        }

        input.addEventListener('blur', handleInput);
        input.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission
                input.removeEventListener('blur', handleInput); // Remove blur event listener
                handleInput(e);
            }
        });
    });
}

// Adding new student
document.getElementById('new-student').addEventListener('keypress', async function (e) {
    if (e.key === 'Enter') {
        var studentName = e.target.value;
        var studentList = document.getElementById('students-list');
        var students = Array.from(studentList.getElementsByClassName('student'));
        var names = students.map(student => student.textContent);
        var errorMessage = document.getElementById('error-message');
        errorMessage.textContent = ''; // Clear previous error message
        if (studentName) {
            if (names.includes(studentName)) {
                errorMessage.textContent = 'Error: Student name already exists!';
            } else {
                appendStudent(studentName, e);
                Students.push(studentName);
                await saveState(); // Save state after adding a student
            }
        }
        e.preventDefault(); // Prevent form submission
    }
});

function appendStudent(studentName, e=null) {
    var newStudent = document.createElement('div');
    var name = document.createElement('span');
    name.textContent = studentName;
    newStudent.className = 'student';
    newStudent.appendChild(name);
    addDeleteButton(newStudent); // Add delete button to new student
    document.getElementById('students-list').appendChild(newStudent);
    if (e != null){
        e.target.value = '';
    }
    addEditEventListener(name);
}

// Import from CSV
document.getElementById('import-btn').addEventListener('click', function () {
    document.getElementById('csv-file').click();
});

document.getElementById('csv-file').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const content = e.target.result;
            // Assuming content is CSV
            const rows = content.split('\n');
            const table = document.getElementById('csv-table');
            table.innerHTML = ''; // Clear existing table content
            let isMouseDown = false;
            table.addEventListener('mousedown', function () {
                isMouseDown = true;
            });

            table.addEventListener('mouseup', function () {
                isMouseDown = false;
            });
            rows.forEach(row => {
                const cells = row.split(',');
                const tr = document.createElement('tr');
                cells.forEach(cell => {
                    const td = document.createElement('td');
                    td.className = 'unselectable';
                    td.textContent = cell.trim();
                    td.addEventListener('mouseover', function () {
                        if (isMouseDown) {
                            td.classList.toggle('selected');
                        }
                    });
                    td.addEventListener('mousedown', function () {
                        td.classList.toggle('selected');

                    });
                    tr.appendChild(td);
                });
                table.appendChild(tr);
            });
            $('#table-editor-modal').modal('show');
        };
        reader.readAsText(file);
        await saveState(); // Save state after importing CSV
    }
});

document.getElementById('finish-import').addEventListener('click', async function () {
    const selectedCells = document.querySelectorAll('#csv-table td.selected');
    const studentList = document.getElementById('students-list');

    selectedCells.forEach(cell => {
        const newStudent = document.createElement('div');
        newStudent.className = 'student';
        newStudent.textContent = cell.textContent.trim();
        addDeleteButton(newStudent); // Add delete button to imported student
        studentList.appendChild(newStudent);
        addEditEventListener(newStudent);
    });

    $('#table-editor-modal').modal('hide');
    await saveState(); // Save state after importing students to link with main undo/redo
});

function attachEventListeners() {
    const students = document.querySelectorAll('.student');
    students.forEach(student => {
        addDeleteButton(student);
        addEditEventListener(student);
    });
}

attachEventListeners();