// Test Gemini API connection
const API_KEY = 'AIzaSyDTK0Nk1rroKYG-G00VeIC3bYkOEmmjvZE';

async function testGemini() {
  console.log('Testing Gemini API...\n');

  const tests = [
    'gemini-1.5-pro-latest',
    'gemini-1.5-pro',
    'gemini-1.5-flash-latest',
    'gemini-pro'
  ];

  for (const model of tests) {
    try {
      console.log(`\nTrying model: ${model}`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: 'Say "Hello, I am working!" in one sentence.' }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 100,
            }
          })
        }
      );

      const data = await response.json();
      
      if (response.ok && data.candidates && data.candidates[0]) {
        console.log(`✅ ${model} WORKS!`);
        console.log(`Response: ${data.candidates[0].content.parts[0].text}`);
        console.log(`\nUse this model: ${model}`);
        return model;
      } else {
        console.log(`❌ ${model} failed:`, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.log(`❌ ${model} error:`, error.message);
    }
  }
  
  console.log('\n❌ All models failed!');
}

testGemini();
