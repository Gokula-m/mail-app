async function generateSummary(subject, body) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Summarize the following email in one short sentence, under 20 words. Respond with ONLY the summary, no preamble.'
          },
          {
            role: 'user',
            content: `Subject: ${subject}\n\nBody: ${body}`
          }
        ],
        temperature: 0.3,
        max_tokens: 60
      })
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status);
      return null; // fail gracefully — don't block the email from sending
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();

  } catch (err) {
    console.error('AI summary generation failed:', err);
    return null;
  }
}
async function generateQuickReplies(subject, body) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'Suggest exactly 3 short reply options (2-5 words each) someone might send back to this email, like "Thanks, got it" or "Interested, let\'s talk". Respond with ONLY a JSON array of 3 strings, nothing else. No markdown, no explanation.'
          },
          { role: 'user', content: `Subject: ${subject}\n\nBody: ${body}` }
        ],
        temperature: 0.4,
        max_tokens: 60
      })
    });

    if (!response.ok) return defaultReplies();
    const data = await response.json();
    const raw = data.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed.slice(0, 3) : defaultReplies();
  } catch (err) {
    console.error('Quick replies generation failed:', err);
    return defaultReplies();
  }
}

function defaultReplies() {
  return ['Thanks, got it.', "I'm interested.", 'Will get back to you.'];
}

module.exports = { generateSummary, generateQuickReplies };

