<?php
// Set CORS headers to allow browser requests
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Process POST request
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Retrieve JSON payload
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data) {
        echo json_encode(["status" => "error", "message" => "No application data received."]);
        exit;
    }

    // Clean inputs
    $fullName = strip_tags(trim($data["fullName"]));
    $studentEmail = filter_var(trim($data["studentEmail"]), FILTER_SANITIZE_EMAIL);
    $phone = strip_tags(trim($data["phone"]));
    $state = strip_tags(trim($data["state"]));
    $program = strip_tags(trim($data["program"]));
    $hostel = strip_tags(trim($data["hostel"]));
    $appId = strip_tags(trim($data["applicationId"]));

    // Validate email
    if (empty($studentEmail) || !filter_var($studentEmail, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["status" => "error", "message" => "Invalid student email address."]);
        exit;
    }

    // University Registrar Email (aligned to gurukulvidyapeethuniversity.com)
    $registrarEmail = "home@gurukulvidyapeethuniversity.com"; 

    // Email subjects
    $subjectRegistrar = "New Admission Application: " . $appId . " - " . $fullName;
    $subjectStudent = "Gurukul Vidyapeeth Admission Application Confirmation: " . $appId;

    // Construct Email Body Content
    $bodyContent = "Gurukul Vidyapeeth University - Admission Application Confirmation\r\n";
    $bodyContent .= "======================================================================\r\n";
    $bodyContent .= "Provisional Application ID: " . $appId . "\r\n";
    $bodyContent .= "Student Full Name:          " . $fullName . "\r\n";
    $bodyContent .= "Student Email:              " . $studentEmail . "\r\n";
    $bodyContent .= "Phone / WhatsApp:           " . $phone . "\r\n";
    $bodyContent .= "State Domicile:             " . $state . "\r\n";
    $bodyContent .= "Target Program:             " . $program . "\r\n";
    $bodyContent .= "Hostel Requirement:         " . $hostel . "\r\n";
    $bodyContent .= "======================================================================\r\n\r\n";
    $bodyContent .= "Dear Applicant,\r\n\r\n";
    $bodyContent .= "Thank you for applying to Gurukul Vidyapeeth University. Your provisional application has been successfully logged. Our Admissions Desk will review your uploaded documents and reach back to you shortly.\r\n\r\n";
    $bodyContent .= "For any immediate queries, please write to admissions@gurukulvidyapeethuniversity.com or call +91 (03595) 295012.\r\n\r\n";
    $bodyContent .= "Best Regards,\r\n";
    $bodyContent .= "Gurukul Vidyapeeth Admissions Registry\r\n";

    // Setup headers
    $headers = "From: Gurukul Vidyapeeth Registry <admissions@gurukulvidyapeethuniversity.com>\r\n";
    $headers .= "Reply-To: admissions@gurukulvidyapeethuniversity.com\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // Send email to Registrar
    $successRegistrar = mail($registrarEmail, $subjectRegistrar, $bodyContent, $headers);

    // Send copy to Student
    $successStudent = mail($studentEmail, $subjectStudent, $bodyContent, $headers);

    if ($successRegistrar && $successStudent) {
        echo json_encode(["status" => "success", "message" => "Admission email dispatched successfully to registrar and student."]);
    } else {
        echo json_encode([
            "status" => "error", 
            "message" => "Web server failed to send email. Verify that sendmail/SMTP relay is configured in php.ini.",
            "diagnostics" => [
                "registrar_sent" => $successRegistrar,
                "student_sent" => $successStudent
            ]
        ]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid HTTP request method."]);
}
?>
