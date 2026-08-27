<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'config.php';

$conn = getDBConnection();
$action = $_GET['action'] ?? '';

// GET ALL STUDENTS
if ($action === 'get_students') {
    $result = $conn->query("SELECT * FROM students ORDER BY id DESC");
    $students = [];
    while ($row = $result->fetch_assoc()) {
        $students[] = $row;
    }
    echo json_encode(['status' => 'success', 'data' => $students]);
    exit();
}

// ADD STUDENT (With 9-Digit CPR Validation)
if ($action === 'add_student' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $cpr = trim($input['cpr'] ?? '');
    $name_en = trim($input['full_name_en'] ?? '');
    $name_ar = trim($input['full_name_ar'] ?? '');
    $email = trim($input['email'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $course = trim($input['course_name'] ?? '');

    // CPR Validation (9 numeric digits)
    if (!preg_match('/^\d{9}$/', $cpr)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid CPR format. Must be exactly 9 digits.']);
        exit();
    }

    $stmt = $conn->prepare("INSERT INTO students (cpr, full_name_en, full_name_ar, email, phone, course_name) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $cpr, $name_en, $name_ar, $email, $phone, $course);

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Student added successfully.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to add student (Duplicate CPR or Database Error).']);
    }
    $stmt->close();
    exit();
}

// DELETE STUDENT
if ($action === 'delete_student' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = intval($input['id'] ?? 0);

    $stmt = $conn->prepare("DELETE FROM students WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Student removed.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete record.']);
    }
    $stmt->close();
    exit();
}

echo json_encode(['status' => 'error', 'message' => 'Invalid endpoint action']);
