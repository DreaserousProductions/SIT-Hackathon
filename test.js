// Import the required package
const QRCode = require('qrcode');

// Function to generate a QR code
const generateQRCode = async (link) => {
    try {
        // Generate a QR code and save it as a file
        await QRCode.toFile('qrcode.png', link, {
            color: {
                dark: '#000000',  // Black dots
                light: '#FFFFFF'  // White background
            }
        });

        console.log('QR code generated and saved as qrcode.png');
    } catch (error) {
        console.error('Error generating QR code:', error);
    }
};

// Example usage
const link = 'http://52.251.41.188:7898/details?ppid=1001_13605';
generateQRCode(link);
