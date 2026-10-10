// app.post('/api/assessments', async (req, res) => {
//     const userEmail = req.body.companyEmail;
    
//     // Menggunakan key kapital sesuai standar API AI Engineer
//     const payloadToAI = {
//         Email: userEmail,
//         Name: "Abdul" // Diisi default agar lolos validasi required
//     };

//     let aiResponseResult = "Menunggu respons AI...";
//     let responseStatus = 500;

//     try {
        
//         const apiResponse = await fetch('http://169.58.24.219:4024/send-result', {
//             method: 'POST',
//             headers: { 
//                 'Content-Type': 'application/json' 
//             },
//             body: JSON.stringify(payloadToAI)
//         });
        
//         responseStatus = apiResponse.status; // Ambil status code (misal 200, 400, dll)
//         aiResponseResult = await apiResponse.json();

//     } catch (error) {
//         console.error("Gagal terhubung ke AI:", error.message);
//         responseStatus = 500;
//         aiResponseResult = { error: "Gagal terhubung ke server AI" };
//     }

    
//     const formattedStatusAI = typeof aiResponseResult === 'object' ? JSON.stringify(aiResponseResult) : aiResponseResult;

//     const assessments = readData();
//     const newEntry = {
//         id: Date.now(),
//         date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
//         companyEmail: userEmail,
//         statusAI: formattedStatusAI
//     };

//     assessments.unshift(newEntry);
//     writeData(assessments);

//     res.status(responseStatus).json({
//         success: responseStatus >= 200 && responseStatus < 300,
//         status: responseStatus,
//         message: formattedStatusAI,
//         data: newEntry
//     });
// });


const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// --- MIDDLEWARE ---
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route halaman utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'demo.html'));
});

// API POST untuk mengirim data ke AI Engineer / REST API
app.post('/api/assessments', async (req, res) => {
    const userEmail = req.body.companyEmail;
    const nameVal = req.body.nameVal || "-"; // Menangkap nameVal dari frontend dengan fallback aman

    // Payload sesuai standar API AI Engineer (menggunakan Name dan Email)
    const payloadToAI = {
        Email: userEmail,
        Name: nameVal
    };

    let aiResponseResult = "Menunggu respons AI...";
    let responseStatus = 500;

    try {
       const apiResponse = await fetch('https://backend-nodegreen.oriontacita.my.id/send-result', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(payloadToAI)
        });
        
        responseStatus = apiResponse.status; 
        
        // Ambil respons teks/JSON dari REST API dengan aman
        const responseText = await apiResponse.text();
        try {
            aiResponseResult = JSON.parse(responseText);
        } catch (e) {
            aiResponseResult = responseText;
        }

    } catch (error) {
        console.error("Gagal terhubung ke AI:", error.message);
        responseStatus = 500;
        aiResponseResult = { error: "Gagal terhubung ke server AI: " + error.message };
    }

    // Menyesuaikan format pesan respons dengan konversi REST API
    let errorMessage = "";
    if (typeof aiResponseResult === 'object' && aiResponseResult !== null) {
        errorMessage = aiResponseResult.error || aiResponseResult.message || JSON.stringify(aiResponseResult);
    } else {
        errorMessage = aiResponseResult;
    }

    // Mengirim respons kembali ke frontend tanpa menyimpan ke file JSON log
    res.status(responseStatus).json({
        success: responseStatus >= 200 && responseStatus < 300,
        status: responseStatus,
        message: errorMessage
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});