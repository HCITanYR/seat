var name = '';
var history = [];
let historyIndex = -1;
const urlParams = new URLSearchParams(window.location.search);
const design = urlParams.get('d');
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
    designs = await getDesigns();
    var designweusing = designs['designs'][design];
    name = designweusing['name'];
    historyIndex = designweusing['histindex'];
    document.getElementById('designtitle').innerHTML = name;
    for (const item of designweusing['data']) {
        history.push(item);
    }
    if (history.length == 0) {
        updateSeatingPlan();
        saveState();
    }
    try {
        rows = history[historyIndex].rows;
        columns = history[historyIndex].cols;
    } catch(e) {
        //idgaf
    }
    applyState(history[historyIndex]);
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

function seatDrop(e) {
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
        saveState();
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
            saveState();
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


// History state management


function saveState() {
    console.log('saving state');
    const state = {
        students: document.getElementById('students-list').innerHTML,
        seatingPlan: document.getElementById('seating-plan').innerHTML,
        rows: rows,
        cols: columns,
    };
    if (historyIndex < history.length - 1) {
        history.splice(historyIndex + 1);
    }
    history.push(state);
    if (history.length > 255) {
        history.shift();
    } else {
        historyIndex++;
    }
    updateDraggableSeats();
    update(design, name, history, designs, historyIndex);
}

function applyState(state) {
    if (historyIndex > -1) {
        document.getElementById('students-list').innerHTML = state.students;
        document.getElementById('seating-plan').innerHTML = state.seatingPlan;
        document.getElementById('layout-rows').value = state.rows;
        document.getElementById('layout-columns').value = state.cols;
        attachEventListeners();
        updateDraggableSeats();
        update(design, name, history, designs, historyIndex);
    }
}

function undo() {
    console.log('undo');
    if (historyIndex > 0) {
        console.log('undo success');
        historyIndex--;
        applyState(history[historyIndex]);
        updateDraggableSeats();
    }
}

function redo() {
    console.log('redo');
    console.log(historyIndex, history.length);
    if (historyIndex < history.length - 1) {
        console.log('redo success');
        historyIndex++;
        applyState(history[historyIndex]);
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

document.getElementById('add-row').addEventListener('click', addRow);

document.getElementById('add-column').addEventListener('click', addColumn);

// Add a new row
function addRow() {
    const rowsInput = document.getElementById('layout-rows');
    rowsInput.value = parseInt(rowsInput.value) + 1;
    rows += 1;
    updateSeatingPlan();
    
    saveState(); // Save the new seating plan state
}

// Add a new column
function addColumn() {
    const columnsInput = document.getElementById('layout-columns');
    columnsInput.value = parseInt(columnsInput.value) + 1;
    columns += 1;
    updateSeatingPlan();
    
    saveState(); // Save the new seating plan state
}



//   seating plan
function updateSeatingPlan() {
    console.log('updating seating plan');
    const seatingPlanContainer = document.getElementById('seating-plan'); // Number of columns

    // Clear the existing seating plan
    seatingPlanContainer.innerHTML = '';

    // Generate new seating plan based on rows and columns input
    for (let row = 0; row < rows; row++) {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('row');
        for (let col = 0; col < columns; col++) {
            const seatDiv = document.createElement('div');
            seatDiv.classList.add('seat', 'unoccupied');
            seatDiv.classList.add('unselectable');
            seatDiv.dataset.seat = `${row + 1}-${String.fromCharCode(65 + col)}`; // Label seats as 1-A, 1-B, etc.
            seatDiv.innerText = ``;
            rowDiv.appendChild(seatDiv);
        }
        seatingPlanContainer.appendChild(rowDiv);
    }
}


// Adding delete button to student
function addDeleteButton(student) {
    var deleteBtn = document.createElement('span');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', function () {
        student.remove(); // remove student from list

        studentName = student.innerText;
        // find if the student is already seated 
        const allSeats = document.querySelectorAll('.seat');
        allSeats.forEach(seat => {
            if (seat.innerText === studentName) {
                seat.innerText = ''; // clear the student's name from the old seat
                seat.classList.remove('occupied');
                seat.classList.add('unoccupied'); // mark the old seat as unoccupied
            }
        });

        saveState(); // Save state after deleting a student
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

        function handleInput(e) {
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
                    saveState(); // Save state after editing a student name
                }
            } else {
                e.target.parentElement.textContent = originalName;
            }
            addDeleteButton(student); // re-add delete button after editing
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
document.getElementById('new-student').addEventListener('keypress', function (e) {
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
                var newStudent = document.createElement('div');
                var name = document.createElement('span');
                name.textContent = studentName;
                newStudent.className = 'student';
                newStudent.appendChild(name);
                addDeleteButton(newStudent); // Add delete button to new student
                studentList.appendChild(newStudent);
                e.target.value = '';
                addEditEventListener(name);
                saveState(); // Save state after adding a student
            }
        }
        e.preventDefault(); // Prevent form submission
    }
});

// Import from CSV
document.getElementById('import-btn').addEventListener('click', function () {
    document.getElementById('csv-file').click();
});

document.getElementById('csv-file').addEventListener('change', function (event) {
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
        saveState(); // Save state after importing CSV
    }
});

document.getElementById('finish-import').addEventListener('click', function () {
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
    saveState(); // Save state after importing students to link with main undo/redo
});

function attachEventListeners() {
    const students = document.querySelectorAll('.student');
    students.forEach(student => {
        addDeleteButton(student);
        addEditEventListener(student);
    });
}

attachEventListeners();