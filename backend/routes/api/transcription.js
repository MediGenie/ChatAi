const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path'); // Import the 'path' module to handle file paths
const { OpenAI } = require("openai");

const openai = new OpenAI({
    apiKey: process.env.CHAT_API_KEY
});

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('audio'), async (req, res) => {
    try {
        console.log("Received transcription request");

        if (!req.file) {
            console.log("No audio file provided in request");
            return res.status(400).send('No audio file provided');
        }

        console.log("Processing audio file for transcription");
        const audioBuffer = req.file.buffer;

        // Generate a unique temporary file name
        const uniqueTempFileName = `temp_audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;

        // Define the full path for the temporary file
        const tempFilePath = path.join(__dirname, 'tmp', uniqueTempFileName); // Adjust the 'temp' directory as needed

        // Write the audio buffer to the temporary file
        fs.writeFileSync(tempFilePath, audioBuffer);

        console.log("Sending request to OpenAI transcription API");

        // Create a readable stream from the temporary file path
        const audioStream = fs.createReadStream(tempFilePath);

        const transcription = await openai.audio.transcriptions.create(audioStream, "whisper-1");

        console.log("Received response from OpenAI API");
        const transcriptionText = transcription.data.text;
        console.log("Transcription text:", transcriptionText);

        // Remove the temporary file
        fs.unlinkSync(tempFilePath);

        res.json({ transcription: transcriptionText });
    } catch (error) {
        console.error('Error in transcription:', error);
        res.status(500).json({ message: 'Error in processing transcription' });
    }
});

module.exports = router;
