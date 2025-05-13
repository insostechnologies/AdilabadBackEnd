const config = require('../config/config');



const sendOtp = async (phoneNumber, otp) => {
    const fetch = (await import('node-fetch')).default; // Dynamically import node-fetch
    const apiKey = config.SMS_API_KEY; // Fast2SMS API Key
    const senderId = config.SMS_SENDER_ID; // Your DLT approved Sender ID
    const messageId = config.SMS_MESSAGE_ID; // Approved Message ID from Fast2SMS
    const route = "dlt"; // DLT route
    const numbers = phoneNumber; // Recipient phone number(s) as a comma-separated string
    const variablesValues = otp; // OTP value to be sent, in the sequence approved in the message template

    const url = `https://www.fast2sms.com/dev/bulkV2`;

    // Form data parameters
    const data = new URLSearchParams({
        sender_id: senderId,
        message: messageId,
        variables_values: variablesValues,
        route: route,
        numbers: numbers,
        flash: "0", // Optional, "0" for regular SMS
    });

    const headers = {
        "Authorization": apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: data.toString(),
        });

        const result = await response.json();
        if (result.return) {
            // console.log("OTP sent successfully.");
        } else {
            console.error("Failed to send OTP:", result.message);
        }

        return result;
    } catch (error) {
        console.error("Error sending OTP:", error);
    }
};


module.exports = {
    sendOtp
};