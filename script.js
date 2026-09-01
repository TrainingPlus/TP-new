// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCzTs_zw28wkHij4Jj9-EEW3XOpQ5si2yc",
    authDomain: "training-plus-212a2.firebaseapp.com",
    projectId: "training-plus-212a2",
    storageBucket: "training-plus-212a2.firebasestorage.app",
    messagingSenderId: "330136803727",
    appId: "1:330136803727:web:3013a358a547a112ff93fa",
    measurementId: "G-FX3XRSLD8W"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Application State
let currentUserRole = null;
let currentCourseId = null;
let currentClassId = null;

// Routing & View Management
function showView(viewId) {
    document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('hidden');

    if (viewId === 'view-auth') {
        document.getElementById('logout-btn').classList.add('hidden');
        document.getElementById('account-btn').classList.add('hidden');
        document.getElementById('user-display-email').textContent = '';
    } else {
        document.getElementById('logout-btn').classList.remove('hidden');
        document.getElementById('account-btn').classList.remove('hidden');
    }
}

function showOperatorSubView(subViewId) {
    document.querySelectorAll('.op-subview').forEach(el => el.classList.add('hidden'));
    document.getElementById(subViewId).classList.remove('hidden');

    if (subViewId === 'op-courses-view') fetchCourses();
}

function selectRole(role) {
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`role-btn-${role}`).classList.add('active');

    document.querySelectorAll('.auth-box').forEach(box => box.classList.add('hidden'));
    document.getElementById(`form-${role}`).classList.remove('hidden');
}

// Authentication Functions
function signInRoleWithGoogle(role) {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            currentUserRole = role;
            return db.collection('users').doc(result.user.uid).set({
                email: result.user.email,
                role: role,
                displayName: result.user.displayName || ''
            }, { merge: true });
        })
        .then(() => {
            routeUserByRole(currentUserRole);
        })
        .catch((error) => console.error("Sign-in Error:", error));
}

function handleSignOut() {
    auth.signOut().then(() => showView('view-auth'));
}

function routeUserByRole(role) {
    if (role === 'operator') {
        showView('view-operator-dashboard');
        showOperatorSubView('op-home-view');
        loadAccountData();
    } else {
        showView('view-home');
    }
}

// Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('user-display-email').textContent = user.email;
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists && doc.data().role) {
                currentUserRole = doc.data().role;
                routeUserByRole(currentUserRole);
            } else {
                showView('view-home');
            }
        });
    } else {
        showView('view-auth');
    }
});

// Account Management
function loadAccountData() {
    const user = auth.currentUser;
    if (user) {
        document.getElementById('acc-email').value = user.email;
        document.getElementById('acc-name').value = user.displayName || '';
    }
}

function saveAccountDetails(e) {
    e.preventDefault();
    const user = auth.currentUser;
    const name = document.getElementById('acc-name').value;

    user.updateProfile({ displayName: name }).then(() => {
        return db.collection('users').doc(user.uid).update({ displayName: name });
    }).then(() => alert("Account updated successfully."));
}

// Database Operations: Courses & Classes
function addCourse(e) {
    e.preventDefault();
    const courseName = document.getElementById('course-name').value;
    db.collection('courses').add({ name: courseName, createdAt: firebase.firestore.FieldValue.serverTimestamp() })
        .then(() => {
            document.getElementById('add-course-form').reset();
            showOperatorSubView('op-courses-view');
        });
}

function fetchCourses() {
    const container = document.getElementById('courses-list');
    container.innerHTML = '';
    db.collection('courses').get().then((snapshot) => {
        snapshot.forEach((doc) => {
            const card = document.createElement('div');
            card.className = 'grid-card';
            card.textContent = doc.data().name;
            card.onclick = () => openCourse(doc.id, doc.data().name);
            container.appendChild(card);
        });
    });
}

function openCourse(courseId, courseName) {
    currentCourseId = courseId;
    document.getElementById('current-course-title').textContent = `Classes - ${courseName}`;
    showOperatorSubView('op-classes-view');
    fetchClasses();
}

function addClass(e) {
    e.preventDefault();
    const className = document.getElementById('class-name').value;
    db.collection('courses').doc(currentCourseId).collection('classes').add({ name: className })
        .then(() => {
            document.getElementById('add-class-form').reset();
            fetchClasses();
        });
}

function fetchClasses() {
    const container = document.getElementById('classes-list');
    container.innerHTML = '';
    db.collection('courses').doc(currentCourseId).collection('classes').get().then((snapshot) => {
        snapshot.forEach((doc) => {
            const card = document.createElement('div');
            card.className = 'grid-card';
            card.textContent = doc.data().name;
            card.onclick = () => openClass(doc.id, doc.data().name);
            container.appendChild(card);
        });
    });
}

// Database Operations: Students
function openClass(classId, className) {
    currentClassId = classId;
    document.getElementById('current-class-title').textContent = `Students - ${className}`;
    showOperatorSubView('op-students-view');
    fetchStudents();
}

function addStudent(e) {
    e.preventDefault();
    const studentData = {
        name: document.getElementById('std-name').value,
        cpr: document.getElementById('std-cpr').value,
        status: document.getElementById('std-status').value,
        comment: document.getElementById('std-comment').value
    };

    db.collection('courses').doc(currentCourseId)
      .collection('classes').doc(currentClassId)
      .collection('students').doc(studentData.cpr).set(studentData)
      .then(() => {
          document.getElementById('add-student-form').reset();
          fetchStudents();
      });
}

function fetchStudents() {
    const tbody = document.getElementById('students-table-body');
    tbody.innerHTML = '';
    db.collection('courses').doc(currentCourseId)
      .collection('classes').doc(currentClassId)
      .collection('students').get().then((snapshot) => {
          snapshot.forEach((doc) => {
              const data = doc.data();
              const tr = document.createElement('tr');
              tr.innerHTML = `
                  <td>${data.name}</td>
                  <td>${data.cpr}</td>
                  <td>${data.status}</td>
                  <td>${data.comment || ''}</td>
                  <td><button onclick="deleteStudent('${doc.id}')">Delete</button></td>
              `;
              tbody.appendChild(tr);
          });
      });
}

function deleteStudent(cpr) {
    db.collection('courses').doc(currentCourseId)
      .collection('classes').doc(currentClassId)
      .collection('students').doc(cpr).delete()
      .then(() => fetchStudents());
}

// Export Table to Excel
function exportToExcel() {
    const table = document.getElementById("students-table");
    const wb = XLSX.utils.table_to_sheet(table);
    const workBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, wb, "Students");
    XLSX.writeFile(workBook, "Student_Directory.xlsx");
}
