const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function readData() {
    if (!fs.existsSync('assessments.json')) {
        fs.writeFileSync('assessments.json', JSON.stringify([]));
    }
    const data = fs.readFileSync('assessments.json', 'utf8');
    try { 
        return JSON.parse(data); 
    } catch (e) { 
        return []; 
    }
}

function writeData(data) {
    fs.writeFileSync('assessments.json', JSON.stringify(data, null, 2));
}

app.get('/', (req, res) => {
    app.sendFile(path.join(__dirname, 'demo.html'));
});

app.get('/api/assessments', (req, res) => {
    res.json({ success: true, data: readData() });
});

app.post('/api/assessments', async (req, res) => {
    const { companyEmail, nameVal } = req.body;
    
    if (!companyEmail || !nameVal) {
        return res.status(400).json({
            success: false,
            status: 400,
            message: "Bad Request: Email perusahaan dan Nama wajib diisi!"
        });
    }

    const payloadToAI = {
        email: companyEmail,
        name: nameVal
    };

    let responseStatus = 500;
    let responseMessage = "Server Error: Terjadi kesalahan pada server.";

    try {
        const apiResponse = await fetch('http://169.58.24.219:4024/send-result', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(payloadToAI)
        });
        
        responseStatus = apiResponse.status; 
        const responseData = await apiResponse.json();

        if (apiResponse.ok) {
            responseStatus = 200;
            responseMessage = "Success: Berhasil dikirim ke server AI!";
        } else if (responseStatus === 400) {
            responseStatus = 400;
            responseMessage = responseData.error || "Bad Request: Permintaan ditolak oleh server eksternal.";
        } else {
            responseStatus = 500;
            responseMessage = responseData.error || "Server Error pada API eksternal.";
        }
    } catch (error) {
        console.error("Gagal terhubung ke AI:", error.message);
        responseStatus = 500;
        responseMessage = "Server Error: Gagal terhubung ke jaringan server eksternal (Fetch Failed).";
    }

    const assessments = readData();
    const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        companyEmail: companyEmail,
        nameVal: nameVal,
        statusAI: responseMessage
    };

    assessments.unshift(newEntry);
    writeData(assessments);

    res.status(responseStatus).json({
        success: responseStatus === 200,
        status: responseStatus,
        message: responseMessage,
        data: newEntry
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan sempurna di http://localhost:${PORT}`);
});