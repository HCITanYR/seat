 // Zoom in and zoom out functionality
 let zoomLevel = 1;

//draggable background
const detect = document.getElementById('zoomable-content');
const frame = document.getElementById('seating-plan');
const minX = -500; // Set your minimum X
const maxX = 500; // Set your maximum X
const minY = -500; // Set your minimum Y
const maxY = 500;
// TODO: need to calculate this

let isDragging = false;
let startX, startY, initialPosX = 0, initialPosY = 0;
detect.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    detect.style.cursor = 'grabbing';
});


document.addEventListener('mouseup', () => {
    isDragging = false;
    detect.style.cursor = 'grab';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    let x = e.clientX - startX;
    let y = e.clientY - startY;
    initialPosX += x;
    initialPosY += y;

    // Check if the new position exceeds the maximum X
    if (initialPosX > maxX) {
        initialPosX = maxX;
    }

    // Check if the new position is less than the minimum X
    if (initialPosX < minX) {
        initialPosX = minX;
    }

    // Check if the new position exceeds the maximum Y
    if (initialPosY > maxY) {
        initialPosY = maxY;
    }

    // Check if the new position is less than the minimum Y
    if (initialPosY < minY) {
        initialPosY = minY;
    }
    
    frame.style.transform = `translate(${initialPosX}px, ${initialPosY}px) scale(${zoomLevel})`;
    startX = e.clientX;
    startY = e.clientY;
});

//zoom in and out

document.getElementById('zoom-in').addEventListener('click', function() {
    zoomLevel += 0.1;
    document.getElementById('seating-plan').style.transform = `translate(${initialPosX}px, ${initialPosY}px) scale(${zoomLevel})`;
});

document.getElementById('zoom-out').addEventListener('click', function() {
    if (zoomLevel > 0.2) {
        zoomLevel -= 0.1;
        document.getElementById('seating-plan').style.transform = `translate(${initialPosX}px, ${initialPosY}px) scale(${zoomLevel})`;
    }
});

// History state management
 const history = [];
 let historyIndex = -1;

 function saveState() {
     const state = {
         students: document.getElementById('students-list').innerHTML,
         seatingPlan: document.getElementById('seating-plan').innerHTML,
         rows: document.getElementById('layout-rows').value,
         cols: document.getElementById('layout-columns').value
     };
     if (historyIndex < history.length - 1) {
         history.splice(historyIndex + 1);
     }
     history.push(state);
     if (history.length > 25) {
         history.shift();
     } else {
         historyIndex++;
     }
 }

 function applyState(state) {
     document.getElementById('students-list').innerHTML = state.students;
     document.getElementById('seating-plan').innerHTML = state.seatingPlan;
     document.getElementById('layout-rows').value = state.rows;
     document.getElementById('layout-columns').value = state.cols;
     attachEventListeners();
 }

 function undo() {
     if (historyIndex > 0) {
         historyIndex--;
         applyState(history[historyIndex]);
     }
 }

 function redo() {
     if (historyIndex < history.length - 1) {
         historyIndex++;
         applyState(history[historyIndex]);
     }
 }

 document.getElementById('undo-btn').addEventListener('click', undo);
 document.getElementById('redo-btn').addEventListener('click', redo);

 // Add a new row
 document.getElementById('add-row').addEventListener('click', function() {
     const seatingPlan = document.getElementById('seating-plan');
     const rows = seatingPlan.querySelectorAll('.row').length;
     const cols = seatingPlan.querySelector('.row')?.children.length || 0;
     const newRow = document.createElement('div');
     newRow.className = 'row';
     for (let i = 0; i < cols; i++) {
         const newSeat = document.createElement('div');
         newSeat.className = 'seat';
         newSeat.dataset.seat = `${rows + 1}${String.fromCharCode(97 + i)}`;
         newRow.appendChild(newSeat);
     }
     seatingPlan.appendChild(newRow);
     saveState(); // Save state after adding a row
 });

 // Add a new column
 document.getElementById('add-column').addEventListener('click', function() {
     const seatingPlan = document.getElementById('seating-plan');
     const rows = seatingPlan.querySelectorAll('.row');
     rows.forEach((row, rowIndex) => {
         const newSeat = document.createElement('div');
         newSeat.className = 'seat';
         newSeat.dataset.seat = `${rowIndex + 1}${String.fromCharCode(97 + row.children.length)}`;
         row.appendChild(newSeat);
     });
     saveState(); // Save state after adding a column
 });


 // Adding delete button to student
 function addDeleteButton(student) {
     console.log('adding delete button');
     var deleteBtn = document.createElement('span');
     deleteBtn.className = 'delete-btn';
     deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
     deleteBtn.addEventListener('click', function() {
         student.remove();
         saveState(); // Save state after deleting a student
     });
     student.appendChild(deleteBtn);
 }

 // Add event listener for editing names
 function addEditEventListener(student) {
     student.addEventListener('click', function(e) {
         var originalName = e.target.textContent.trim();
         var input = document.createElement('input');
         input.type = 'text';
         input.value = originalName;
         e.target.textContent = '';
         e.target.appendChild(input);
         input.focus();

         function handleInput(e) {
             console.log('editing name');
             var newName = e.target.value.trim();
             if (newName && newName !== originalName) {
                 e.target.parentElement.textContent = newName;
                 saveState(); // Save state after editing a student name
             } else {
                 e.target.parentElement.textContent = originalName;
             }
             addDeleteButton(student); // re-add delete button after editing
         }

         input.addEventListener('blur', handleInput);
         input.addEventListener('keypress', function(e) {
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
                 newStudent.className = 'student';
                 newStudent.textContent = studentName;
                 addDeleteButton(newStudent); // Add delete button to new student
                 studentList.appendChild(newStudent);
                 e.target.value = '';
                 addEditEventListener(newStudent);
                 saveState(); // Save state after adding a student
             }
         }
         e.preventDefault(); // Prevent form submission
     }
 });

 // Import from CSV
 document.getElementById('import-btn').addEventListener('click', function() {
     document.getElementById('csv-file').click();
 });

 document.getElementById('csv-file').addEventListener('change', function(event) {
     const file = event.target.files[0];
     if (file) {
         const reader = new FileReader();
         reader.onload = function(e) {
             const content = e.target.result;
             // Assuming content is CSV
             const rows = content.split('\n');
             const table = document.getElementById('csv-table');
             table.innerHTML = ''; // Clear existing table content
             let isMouseDown = false;
             console.log('mouse down detection');
             table.addEventListener('mousedown', function() {
                 isMouseDown = true;
                 console.log('Mouse is pressed down');
             });

             table.addEventListener('mouseup', function() {
                 isMouseDown = false;
                 console.log('Mouse is released');
             });
             rows.forEach(row => {
                 const cells = row.split(',');
                 const tr = document.createElement('tr');
                 cells.forEach(cell => {
                     const td = document.createElement('td');
                     td.className = 'unselectable';
                     td.textContent = cell.trim();
                     td.addEventListener('mouseover', function() {
                         if (isMouseDown) {
                             td.classList.toggle('selected');
                         }
                     });
                     td.addEventListener('mousedown', function() {
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

 document.getElementById('finish-import').addEventListener('click', function() {
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

 