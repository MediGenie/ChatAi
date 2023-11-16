const fetch = require('node-fetch');

// Function to convert text to audio using ElevenLabs API
const convertTextToAudio = async (textToConvert) => {
  // Set the API key for ElevenLabs API
  const apiKey = process.env.API_KEY_AUDIO;

  const data = {
    text: textToConvert,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
        stability: 0.6,
        similarity_boost: 0.7,
        use_speaker_boost: "True" 
    },
  };

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/hjlaVGmIa72yfOAHbXYK/stream?optimize_streaming_latency=1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'audio/mpeg;charset=UTF-8"',
      'xi-api-key': apiKey
    },
    body: JSON.stringify(data),
  });

  if (response.ok) {
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    return audioBase64;
  } else {
    // It's a good idea to log the error or handle it accordingly
    console.error('Error converting text to audio:', await response.text());
    return null;
  }
};

module.exports = {
  convertTextToAudio
};