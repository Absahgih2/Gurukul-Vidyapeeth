<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    if (!$data) {
        echo json_encode(["status" => "error", "message" => "No application data received."]);
        exit;
    }

    $fullName = strip_tags(trim($data["fullName"]));
    $studentEmail = strip_tags(trim($data["studentEmail"]));
    $phone = strip_tags(trim($data["phone"]));
    $state = strip_tags(trim($data["state"]));
    $program = strip_tags(trim($data["program"]));
    $hostel = strip_tags(trim($data["hostel"]));
    $appId = strip_tags(trim($data["applicationId"]));

    // Clean phone number helper
    $cleanNumber = function($numStr) {
        $cleaned = preg_replace('/\D/', '', $numStr);
        if (strlen($cleaned) === 10) {
            $cleaned = '91' . $cleaned; // Add country code for India
        }
        return $cleaned;
    };

    $studentPhone = $cleanNumber($phone);
    $registrarPhone = "919204550038"; // Registrar number (private, not shown in UI)

    // ==========================================
    // META WHATSAPP CLOUD API CONFIGURATION
    // ==========================================
    // To send background messages officially, you need to set up a Meta developer account,
    // get a WhatsApp Business Phone Number ID and a Permanent Access Token.
    // Replace the placeholders below with your actual credentials.
    $accessToken = "YOUR_META_PERMANENT_ACCESS_TOKEN"; // e.g. EAAG...
    $phoneNumberId = "YOUR_META_PHONE_NUMBER_ID";      // e.g. 1029384756

    // Construct message body text
    $messageText = "*Gurukul Vidyapeeth University - Admission Application*\n";
    $messageText .= "====================================\n";
    $messageText .= "• *Application ID*: " . $appId . "\n";
    $messageText .= "• *Student Name*: " . $fullName . "\n";
    $messageText .= "• *Target Program*: " . $program . "\n";
    $messageText .= "• *Student Phone*: " . $phone . "\n";
    $messageText .= "• *Student Email*: " . $studentEmail . "\n";
    $messageText .= "• *State Domicile*: " . $state . "\n";
    $messageText .= "• *Hostel Required*: " . $hostel . "\n";
    $messageText .= "====================================\n";
    $messageText .= "*Admissions Registry Portal Confirmation Record*";

    // Helper function to send via Meta Graph API
    $sendWhatsApp = function($toPhone, $text, $token, $phoneId) {
        // If credentials are still placeholders, skip the actual API call and return simulated success
        if ($token === "YOUR_META_PERMANENT_ACCESS_TOKEN" || empty($token)) {
            return ["success" => true, "simulated" => true];
        }

        $url = "https://graph.facebook.com/v18.0/" . $phoneId . "/messages";
        
        // Setup payload structure
        $payload = [
            "messaging_product" => "whatsapp",
            "recipient_type" => "individual",
            "to" => $toPhone,
            "type" => "text",
            "text" => [
                "preview_url" => false,
                "body" => $text
            ]
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer " . $token,
            "Content-Type: application/json"
        ]);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            return ["success" => true, "response" => json_decode($response, true)];
        } else {
            return ["success" => false, "error" => $response];
        }
    };

    // Send to Registrar
    $resRegistrar = $sendWhatsApp($registrarPhone, $messageText, $accessToken, $phoneNumberId);

    // Send to Student
    $resStudent = $sendWhatsApp($studentPhone, $messageText, $accessToken, $phoneNumberId);

    if ($resRegistrar["success"] && $resStudent["success"]) {
        $msg = (isset($resRegistrar["simulated"]) || isset($resStudent["simulated"]))
            ? "Simulated background WhatsApp dispatch successful (Placeholder credentials active)."
            : "WhatsApp messages sent successfully in the background.";
        echo json_encode(["status" => "success", "message" => $msg]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "WhatsApp API dispatch failed.",
            "diagnostics" => [
                "registrar" => $resRegistrar,
                "student" => $resStudent
            ]
        ]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid HTTP request method."]);
}
?>
