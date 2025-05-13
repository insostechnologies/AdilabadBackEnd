const getCurrentDateTime = () => {
    const currentDateTime = new Date();

    // Extract date components
    const day = currentDateTime.getDate().toString().padStart(2, '0'); // Day of the month (01-31)
    const month = (currentDateTime.getMonth() + 1).toString().padStart(2, '0'); // Month (01-12)
    const year = currentDateTime.getFullYear(); // Full year (e.g., 2024)

    // Extract time components
    const hours = currentDateTime.getHours().toString().padStart(2, '0'); // Hours (00-23)
    const minutes = currentDateTime.getMinutes().toString().padStart(2, '0'); // Minutes (00-59)
    const seconds = currentDateTime.getSeconds().toString().padStart(2, '0'); // Seconds (00-59)

    // Construct formatted date and time string
    const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

    return formattedDateTime;
};

module.exports = {
    getCurrentDateTime
};