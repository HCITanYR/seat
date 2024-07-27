var name = "";
var settings = [];
var history = [];
let historyIndex = -1;
const urlParams = new URLSearchParams(window.location.search);
const design = urlParams.get("d");
var currentUrl = window.location.href;
var urlSegments = currentUrl.split("/");
var uid = urlSegments[4].split("?")[0];
var Students = [];

var seatlist = ["", "", "", ""];
var designs = null;
var rows = 2;
var columns = 2;

import { getDesigns, update } from "./firestore.js";
import { getUid } from "./uid.js";

// Initialise page on load
document.addEventListener("DOMContentLoaded", async () => {
    while (getUid() === null) {
        await new Promise((resolve) => setTimeout(resolve));
    }
    designs = await getDesigns(uid);
    if (designs["designs"].length <= design) {
        //redirect home
        window.location.href = "/";
    }
    var designweusing = designs["designs"][design];
    name = designweusing["name"];
    settings = designweusing["settings"];
    historyIndex = designweusing["histindex"];
    for (const item in designweusing["data"]) {
        history.push(designweusing["data"][item]);
    }
    if (history.length == 0) {
        updateSeatingPlan();
        await saveState();
    }
    applyState(history[historyIndex]);
    document.getElementById("designtitle").innerHTML = name;
    document
        .getElementById("designtitle")
        .addEventListener("blur", async function (e) {
            if (this.innerText == "") {
                this.innerText = name;
            } else {
                name = this.innerText;
                e.preventDefault();
                await update(
                    settings,
                    design,
                    name,
                    history,
                    designs,
                    historyIndex,
                    uid
                );
            }
        });
    document
        .getElementById("designtitle")
        .addEventListener("keydown", (evt) => {
            if (evt.key === "Enter") {
                evt.preventDefault();
            }
        });

    document.getElementById("editpage").style.display = "flex";
    fadeIn("editpage", 1000);
});

function fadeIn(elementId, duration) {
    let element = document.getElementById(elementId);
    element.style.opacity = 0; // Ensure the element is initially hidden
    let last = +new Date();
    let tick = function () {
        element.style.opacity =
            +element.style.opacity + (new Date() - last) / duration;
        last = +new Date();

        if (+element.style.opacity < 1) {
            (window.requestAnimationFrame && requestAnimationFrame(tick)) ||
                setTimeout(tick, 16);
        }
    };
    tick();
}

function updateDraggableSeats() {
    // make the seats draggable AND droppable
    const allSeats = document.querySelectorAll(".seat");
    allSeats.forEach((seat) => {
        seat.draggable = false; // default state
        if (
            seat.classList.contains("occupied") &&
            !document.getElementById("pan").classList.contains("btn-primary") &&
            !document.getElementById("pan").classList.contains("btn-primary")
        ) {
            // can drag if seat is not empty and pan button is not toggled
            // and pan not toggled
            seat.draggable = true;
            seat.addEventListener("dragstart", seatDragStart);
            seat.addEventListener("dragend", seatDragEnd);
        }
        seat.addEventListener("dragover", seatDragOver);
        seat.addEventListener("drop", seatDrop);
        seat.addEventListener("dragleave", seatDragLeave);

        // for context menu
        seat.addEventListener("mouseenter", () => {
            seat.classList.add("hover"); // Add hover class if needed for CSS
        });
        seat.addEventListener("mouseleave", () => {
            seat.classList.remove("hover"); // Remove hover class if needed for CSS
        });
        seat.addEventListener("contextmenu", showContextMenu); // Right-click event
    });
}

function seatDragStart(e) {
    e.dataTransfer.setData("text/plain", e.target.innerText);
    e.dataTransfer.effectAllowed = "move";

    // highlight the seat being dragged
    e.target.classList.add("dragging");
}

function seatDragOver(e) {
    e.preventDefault();

    if (
        e.target.classList.contains("seat") &&
        !e.target.classList.contains("dragging") &&
        !e.target.classList.contains("empty")
    ) {
        e.target.classList.add("over");
        e.dataTransfer.dropEffect = "move"; // indicate a move operation
    }
    if (
        e.target.classList.contains("seat") &&
        !e.target.classList.contains("dragging") &&
        e.target.classList.contains("empty")
    ) {
        e.dataTransfer.dropEffect = "none";
    }
}

function seatDragLeave(e) {
    if (e.target.classList.contains("seat")) {
        e.target.classList.remove("over");
    }
}

async function seatDrop(e) {
    e.preventDefault();
    const studentName = e.dataTransfer.getData("text/plain");
    const targetSeat = e.target;

    // remove the 'over' class first
    targetSeat.classList.remove("over");

    // remove the 'dragging' class from the previously selected seat
    const previousSeat = document.querySelector(".dragging");
    if (previousSeat) {
        previousSeat.classList.remove("dragging");
    }

    // find if the student is already seated elsewhere
    const allSeats = document.querySelectorAll(".seat");
    let existingSeat = null;
    allSeats.forEach((seat) => {
        if (seat.innerText === studentName && seat !== targetSeat) {
            existingSeat = seat;
        }
    });

    // Check if the target seat is in the front row
    // const isInFrontRow =
    //     targetSeat.parentElement.classList.contains("front-row");

    // if (!isInFrontRow && targetSeat.classList.contains("occupied")) {
    //     // If not in the front row and the seat is occupied
    //     return; // Prevent dropping students in non-front row occupied seats
    // }

    if (targetSeat.classList.contains("unoccupied")) {
        // if empty seat
        if (existingSeat) {
            // if the student is already occupying another seat
            existingSeat.innerText = ""; // clear the student's name from the old seat
            existingSeat.classList.remove("occupied");
            existingSeat.classList.add("unoccupied"); // mark the old seat as unoccupied
        }
        // move the student to the new target seat
        targetSeat.innerText = studentName; // set the student's name to the new seat
        targetSeat.classList.remove("unoccupied");
        targetSeat.classList.add("occupied"); // mark the new seat as occupied
        await saveState();
    } else if (targetSeat.classList.contains("occupied")) {
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
    e.target.classList.remove("dragging");
}

// Zoom in and zoom out functionality
let zoomLevel = 1;

// trackpad functions
const seatingPlanContainer = document.getElementById("seating-plan");
seatingPlanContainer.addEventListener("wheel", (e) => {
    if (e.ctrlKey) {
        // Zoom with two-finger scroll
        const deltaY = e.deltaY;
        if (deltaY < 0) {
            zoomLevel += 0.1;
        } else if (deltaY > 0 && zoomLevel > 0.2) {
            zoomLevel -= 0.1;
        }
        document.getElementById(
            "seating-plan"
        ).style.transform = `translate(${initialPosX}px, ${initialPosY}px) scale(${zoomLevel})`;
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
        document.getElementById(
            "seating-plan"
        ).style.transform = `translate(${initialPosX}px, ${initialPosY}px) scale(${zoomLevel})`;
    }
});

//draggable background
const detect = document.getElementById("zoomable-content");
const frame = document.getElementById("seating-plan");
const minX = -500; // Set your minimum X
const maxX = 500; // Set your maximum X
const minY = -500; // Set your minimum Y
const maxY = 500;
// TODO: need to calculate this

let startX,
    startY,
    initialPosX = 0,
    initialPosY = 0;

// mouse icons + pan functionality
detect.addEventListener("mousedown", (e) => {
    if (
        !document.getElementById("pan").classList.contains("btn-primary") &&
        e.target.draggable
    ) {
        detect.style.cursor = "grabbing";
    } else if (
        document.getElementById("pan").classList.contains("btn-primary")
    ) {
        // pan toggled
        // TODO: add pan functionality
        updateDraggableSeats(); // disable seat dragging
    }
});
document.addEventListener("mouseup", () => {});
document.addEventListener("mousemove", (e) => {
    // TODO: add pan stuff
    // disable seat drag and drop
});
function handleMouseAction(e) {
    updateDraggableSeats(); // enable seat dragging
    if (document.getElementById("pan").classList.contains("btn-primary")) {
        // if pan toggled
        detect.style.cursor = "move";
    } else {
        if (e.target.draggable) {
            detect.style.cursor = "grab";
        } else {
            detect.style.cursor = "default";
        }
    }
}

document.addEventListener("mouseup", handleMouseAction);
document.addEventListener("mouseover", handleMouseAction);

//zoom in and out

document.getElementById("zoom-in").addEventListener("click", function () {
    zoomLevel += 0.1;
    document.getElementById(
        "seating-plan"
    ).style.transform = `translate(${initialPosX}px, ${initialPosY}px) scale(${zoomLevel})`;
});

document.getElementById("zoom-out").addEventListener("click", function () {
    if (zoomLevel > 0.2) {
        zoomLevel -= 0.1;
        document.getElementById(
            "seating-plan"
        ).style.transform = `translate(${initialPosX}px, ${initialPosY}px) scale(${zoomLevel})`;
    }
});

// pan button
document.getElementById("pan").addEventListener("click", function () {
    this.classList.toggle("btn-primary");
    this.classList.toggle("btn-outline-secondary");
    const zoomableContent = document.getElementById("zoomable-content");
    const seatingPlan = document.querySelector(".seating-plan");

    let isPanning = false;
    let startingX = 0;
    let startingY = 0;
    let translateX = 0;
    let translateY = 0;

    zoomableContent.addEventListener("mousedown", (e) => {
        isPanning = true;
        startingX = e.clientX - translateX;
        startingY = e.clientY - translateY;
        zoomableContent.style.cursor = "grabbing";
    });

    zoomableContent.addEventListener("mousemove", (e) => {
        if (!isPanning) return;
        translateX = e.clientX - startingX;
        translateY = e.clientY - startingY;
        seatingPlan.style.transform = `translate(${translateX}px, ${translateY}px)`;
    });

    zoomableContent.addEventListener("mouseup", () => {
        isPanning = false;
        zoomableContent.style.cursor = "grab";
    });

    zoomableContent.addEventListener("mouseleave", () => {
        isPanning = false;
        zoomableContent.style.cursor = "grab";
    });
});

async function saveState() {
    seatlist = [];
    Array.from(document.getElementById("seating-plan").children).forEach(
        (row) => {
            Array.from(row.children).forEach((seat) => {
                if (seat.classList.contains("empty")) {
                    seatlist.push(false);
                } else {
                    seatlist.push(seat.innerText);
                }
            });
        }
    );
    const state = {
        students: JSON.stringify(Students),
        seatingPlan: JSON.stringify(seatlist),
        rows: rows,
        cols: columns,
    };
    if (historyIndex < history.length - 1) {
        //if we are not at the end of the history array
        history = history.slice(0, historyIndex + 1); //remove all the states after the current state
    }
    //new state, nothing wrong.
    history.push(state);
    historyIndex++;
    updateDraggableSeats();
    await update(settings, design, name, history, designs, historyIndex, uid);
}

async function applyState(state) {
    if (historyIndex > -1) {
        // document.getElementById('students-list').innerHTML = state.students;
        seatlist = JSON.parse(state.seatingPlan);
        Students = JSON.parse(state.students);
        document.getElementById("students-list").innerHTML = "";
        Students.forEach((student) => {
            appendStudent(student);
        });
        rows = state["rows"];
        columns = state["cols"];
        document.getElementById("layout-rows").value = rows;
        document.getElementById("layout-columns").value = columns;
        attachEventListeners();
        updateDraggableSeats();
        updateSeatingPlan();
        await update(
            settings,
            design,
            name,
            history,
            designs,
            historyIndex,
            uid
        );
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
document.getElementById("undo-btn").addEventListener("click", undo);
document.getElementById("redo-btn").addEventListener("click", redo);

// Keyboard shortcuts
document.addEventListener("keydown", function (e) {
    // Check if the Ctrl or Cmd key is pressed along with Z or Y
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") {
        // Undo action (Ctrl+Z or Cmd+Z)
        e.preventDefault(); // Prevent the default browser behavior
        undo();
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") {
        // Redo action (Ctrl+Shift+Z or Cmd+Shift+Z)
        e.preventDefault(); // Prevent the default browser behavior
        redo();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        // Redo action (Ctrl+Y or Cmd+Y)
        e.preventDefault(); // Prevent the default browser behavior
        redo();
    }
});

document.querySelectorAll(".add-row").forEach((element) => {
    element.addEventListener("click", () => {
        addRow(element.classList.contains("up")); // Pass in any parameters you need
    });
});

document.querySelectorAll(".add-column").forEach((element) => {
    element.addEventListener("click", () => {
        addColumn(element.classList.contains("left")); // Pass in any parameters you need
    });
});

// Add a new row
async function addRow(up) {
    let i = 0;
    let temp = [];
    let x = JSON.parse(JSON.stringify(seatlist));
    if (up) {
        while (i < columns) {
            temp.push("");
            i++;
        }
        temp = temp.concat(x);
    } else {
        temp = x;
        while (i < columns) {
            temp.push("");
            i++;
        }
    }
    seatlist = JSON.parse(JSON.stringify(temp));
    const rowsInput = document.getElementById("layout-rows");
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
            if (i % columns == 0) {
                temp.push("");
            }
            temp.push(seatlist[i]);
            i += 1;
        }
    } else {
        while (i < seatlist.length) {
            temp.push(seatlist[i]);
            i += 1;
            if (i % columns == 0) {
                temp.push("");
            }
        }
    }
    // loop through n columns, add, add to list continue.

    seatlist = JSON.parse(JSON.stringify(temp));
    const columnsInput = document.getElementById("layout-columns");
    columnsInput.value = parseInt(columnsInput.value) + 1;
    columns += 1;
    updateSeatingPlan();
    await saveState(); // Save the new seating plan state
}

//   seating plan
function updateSeatingPlan() {
    const seatingPlanContainer = document.getElementById("seating-plan"); // Number of columns
    // Clear the existing seating plan
    seatingPlanContainer.innerHTML = "";
    let i = 0;
    let rowDiv = null;
    while (i < seatlist.length) {
        if (i % columns == 0) {
            rowDiv = document.createElement("div");
            rowDiv.classList.add("row");
        }
        const seatDiv = document.createElement("div");
        seatDiv.classList.add("col" + i % columns);
        seatDiv.classList.add("row" + Math.floor(i / columns));
        if (seatlist[i] === false) {
            seatDiv.classList.add("seat", "empty");
            seatDiv.classList.add("unselectable");
        } else {
            if (seatlist[i] === "") {
                seatDiv.classList.add("seat", "unoccupied");
                seatDiv.classList.add("unselectable");
            } else {
                seatDiv.classList.add("seat", "occupied");
                seatDiv.classList.add("unselectable");
                seatDiv.innerText = seatlist[i];
            }
        }
        rowDiv.appendChild(seatDiv);
        i += 1;
        if (i % columns == 0) {
            seatingPlanContainer.appendChild(rowDiv);
        }
    }
}

// Adding delete button to student
function addDeleteButton(student) {
    var deleteBtn = document.createElement("span");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener("click", async function () {
        student.remove(); // remove student from list

        var studentName = student.innerText;
        Students = Students.filter((name) => name !== studentName); // remove student from array
        // find if the student is already seated
        const allSeats = document.querySelectorAll(".seat");
        allSeats.forEach((seat) => {
            if (seat.innerText === studentName) {
                seat.innerText = ""; // clear the student's name from the old seat
                seat.classList.remove("occupied");
                seat.classList.add("unoccupied"); // mark the old seat as unoccupied
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
    student.addEventListener("dragstart", dragStart);

    function dragStart(e) {
        e.dataTransfer.setData("text/plain", e.target.innerText);
        e.dataTransfer.effectAllowed = "move";
    }

    student.addEventListener("click", function (e) {
        var originalName = e.target.textContent.trim();
        var input = document.createElement("input");
        input.type = "text";
        input.value = originalName;
        e.target.textContent = "";
        e.target.appendChild(input);
        input.focus();

        async function handleInput(e) {
            var newName = e.target.value.trim();

            if (newName && newName !== originalName) {
                // Check for duplicates
                var studentList = document.getElementById("students-list");
                var students = Array.from(
                    studentList.getElementsByClassName("student")
                );
                var names = students.map((student) => student.textContent);
                if (names.includes(newName)) {
                    // Show the error modal
                    $("#errorModal").modal("show");
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

        input.addEventListener("blur", handleInput);
        input.addEventListener("keypress", function (e) {
            if (e.key === "Enter") {
                e.preventDefault(); // Prevent form submission
                input.removeEventListener("blur", handleInput); // Remove blur event listener
                handleInput(e);
            }
        });
    });
}

// Adding new student
document
    .getElementById("new-student")
    .addEventListener("keypress", async function (e) {
        if (e.key === "Enter") {
            var studentName = e.target.value;
            var studentList = document.getElementById("students-list");
            var students = Array.from(
                studentList.getElementsByClassName("student")
            );
            var names = students.map((student) => student.textContent);
            var errorMessage = document.getElementById("error-message");
            errorMessage.textContent = ""; // Clear previous error message
            if (studentName) {
                if (names.includes(studentName)) {
                    errorMessage.textContent =
                        "Error: Student name already exists!";
                } else {
                    appendStudent(studentName, e);
                    Students.push(studentName);
                    await saveState(); // Save state after adding a student
                }
            }
            e.preventDefault(); // Prevent form submission
        }
    });

function appendStudent(studentName, e = null) {
    var newStudent = document.createElement("div");
    var name = document.createElement("span");
    name.textContent = studentName;
    newStudent.className = "student";
    newStudent.appendChild(name);
    addDeleteButton(newStudent); // Add delete button to new student
    document.getElementById("students-list").appendChild(newStudent);
    if (e != null) {
        e.target.value = "";
    }
    addEditEventListener(name);
}

document.getElementById('import-btn').addEventListener('click', function() {
    console.log('import from csv');
    document.getElementById('csv-file').click();
});

document
    .getElementById("finish-import")
    .addEventListener("click", async function () {
        const selectedCells = document.querySelectorAll(
            "#csv-table td.selected"
        );
        const studentList = document.getElementById("students-list");
        selectedCells.forEach((cell) => {
            if (!Students.includes(cell.textContent.trim())) {
                const newStudent = document.createElement("div");
                newStudent.className = "student";
                newStudent.textContent = cell.textContent.trim();
                addDeleteButton(newStudent); // Add delete button to imported student
                studentList.appendChild(newStudent);
                Students.push(cell.textContent.trim());
                addEditEventListener(newStudent);
            }
        });


        $("#table-editor-modal").modal("hide");
        await saveState(); // Save state after importing students to link with main undo/redo
    });

function attachEventListeners() {
    const students = document.querySelectorAll(".student");
    students.forEach((student) => {
        addDeleteButton(student);
        addEditEventListener(student);
    });
}

attachEventListeners();

document
    .getElementById("generate")
    .addEventListener("click", async function () {
        var tempStudents = JSON.parse(JSON.stringify(Students));

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        // Shuffle the tempStudents array
        shuffleArray(tempStudents);

        var temp = new Array(seatlist.length).fill("");
        const front = settings["front"];
        const back = settings["back"];
        const separate = settings["separate"];

        // Helper function to add students to temp and remove from tempStudents
        function addStudentsToTemp(studentList, startIndex) {
            for (var i = 0; i < studentList.length; i++) {
                if (tempStudents.includes(studentList[i])) {
                    temp[startIndex + i] = studentList[i];
                    tempStudents.splice(
                        tempStudents.indexOf(studentList[i]),
                        1
                    );
                }
            }
        }

        // Add front students to the beginning of the temp list
        addStudentsToTemp(front, 0);

        // Add back students to the end of the temp list
        addStudentsToTemp(back, seatlist.length - back.length);

        // Apply separation constraints
        function applySeparation(separateList) {
            if (separateList.length === 0) return;

            // Function to calculate distance between two seats
            function calculateDistance(index1, index2) {
                let row1 = Math.floor(index1 / seatlist[0].length);
                let col1 = index1 % seatlist[0].length;
                let row2 = Math.floor(index2 / seatlist[0].length);
                let col2 = index2 % seatlist[0].length;
                return Math.sqrt(
                    Math.pow(row1 - row2, 2) + Math.pow(col1 - col2, 2)
                );
            }

            // Randomly assign the first student
            let firstStudentIndex = Math.floor(Math.random() * temp.length);
            temp[firstStudentIndex] = separateList[0];
            tempStudents.splice(tempStudents.indexOf(separateList[0]), 1);

            for (let i = 1; i < separateList.length; i++) {
                let maxDistance = -1;
                let bestIndex = -1;

                for (let j = 0; j < temp.length; j++) {
                    if (temp[j] === "") {
                        let minDistance = Infinity;
                        for (let k = 0; k < temp.length; k++) {
                            if (
                                temp[k] !== "" &&
                                separateList.includes(temp[k])
                            ) {
                                let distance = calculateDistance(j, k);
                                minDistance = Math.min(minDistance, distance);
                            }
                        }
                        if (minDistance > maxDistance) {
                            maxDistance = minDistance;
                            bestIndex = j;
                        }
                    }
                }

                if (bestIndex !== -1) {
                    temp[bestIndex] = separateList[i];
                    tempStudents.splice(
                        tempStudents.indexOf(separateList[i]),
                        1
                    );
                }
            }
        }

        // Apply separation constraints
        applySeparation(separate);

        // Fill remaining seats
        var tempIndex = 0;
        for (var i = 0; i < temp.length; i++) {
            if (temp[i] === "") {
                if (tempIndex < tempStudents.length) {
                    temp[i] = tempStudents[tempIndex];
                    tempIndex++;
                }
            }
        }

        // Update the seatlist and save the state
        seatlist = JSON.parse(JSON.stringify(temp));
        updateSeatingPlan();
        await saveState();
    });


// context menu stuff
var selectedrow = -1;
var selectedcol = -1;
function showContextMenu(event) {
    event.preventDefault(); // Prevent default context menu
    const contextMenu = document.getElementById("context-menu"); // Adjust ID to match your context menu
    contextMenu.style.display = "block";
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
    const classList = event.currentTarget.classList;
    classList.forEach(className => {
        if (className.startsWith('row')) {
            selectedrow = parseInt(className.replace('row', ''), 10);
        }
        if (className.startsWith('col')) {
            selectedcol = parseInt(className.replace('col', ''), 10);
        }
    });
}
document.addEventListener("click", hideContextMenu);
function hideContextMenu() {
    const contextMenu = document.getElementById("context-menu");
    contextMenu.style.display = "none";
}


document.getElementById('delete-row').addEventListener('click', function() {
    // Add your delete row logic here
    rows -= 1;
    seatlist.splice(selectedrow * columns, columns);
    updateSeatingPlan();
    saveState();
});

document.getElementById('delete-column').addEventListener('click', function() {
    // Add your delete column logic here
    
    seatlist = seatlist.filter((_, index) => index % columns !== selectedcol);
    columns -= 1;
    updateSeatingPlan();
    saveState();
});

document.getElementById('add-row-top').addEventListener('click', function() {
    // Add your add row top logic here
    addRow(true);
});

document.getElementById('add-row-bottom').addEventListener('click', function() {
    // Add your add row bottom logic here
    addRow(false);
});

document.getElementById('add-column-left').addEventListener('click', function() {
    // Add your add column left logic here
    addColumn(true);
});

document.getElementById('add-column-right').addEventListener('click', function() {
    // Add your add column right logic here
    addColumn(false);
});

document.getElementById('copyLink').addEventListener('click', function() {
    // Add your copy link logic here
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
});

document.getElementById('select-all').addEventListener('click', function() {
    document.getElementById('csv-table').querySelectorAll('td').forEach(cell => {
        cell.classList.add('selected');
    });
});