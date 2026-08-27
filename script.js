document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("studentList")) {
        loadStudents();
    }
});

// Fetch all students from backend
async function loadStudents() {
    try {
        const response = await fetch("api.php?action=get_students");
        const res = await response.json();
        
        const tbody = document.getElementById("studentList");
        tbody.innerHTML = "";

        if (res.status === "success") {
            res.data.forEach(student => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${student.cpr}</td>
                    <td>${student.full_name_en}</td>
                    <td>${student.full_name_ar}</td>
                    <td>${student.email}</td>
                    <td>${student.phone}</td>
                    <td>${student.course_name}</td>
                    <td>
                        <button style="background: #ef4444;" onclick="deleteStudent(${student.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error("Error loading students:", err);
    }
}

// Handle Add Student Submit
async function handleFormSubmit(event) {
    event.preventDefault();

    const cpr = document.getElementById("cpr").value;
    if (cpr.length !== 9 || isNaN(cpr)) {
        alert("CPR must be exactly 9 digits.");
        return;
    }

    const payload = {
        cpr: cpr,
        full_name_en: document.getElementById("name_en").value,
        full_name_ar: document.getElementById("name_ar").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        course_name: document.getElementById("course").value
    };

    const response = await fetch("api.php?action=add_student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    alert(result.message);

    if (result.status === "success") {
        document.getElementById("addStudentForm").reset();
        loadStudents();
    }
}

// Delete Record
async function deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this record?")) return;

    const response = await fetch("api.php?action=delete_student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
    });

    const result = await response.json();
    alert(result.message);
    loadStudents();
}

// Export Table Data to Excel File
function exportToExcel() {
    const table = document.getElementById("studentsTable");
    const wb = XLSX.utils.table_to_book(table, { sheet: "Students" });
    XLSX.writeFile(wb, "Student_Directory.xlsx");
}
