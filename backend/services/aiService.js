function fallbackSummary(subject, body) {
  if (body && body.trim()) {
    const text = body.trim().replace(/\s+/g, ' ');
    const firstSentence = text.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length <= 100) {
      return firstSentence;
    }
    const words = text.split(' ').slice(0, 15).join(' ');
    return words ? `${words}...` : subject;
  }
  return subject || 'No summary available';
}

async function generateSummary(subject, body) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return fallbackSummary(subject, body);
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'groq/compound-mini',
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
      console.error('Groq API status:', response.status);
      return fallbackSummary(subject, body);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    return content ? content.replace(/^\*\*Summary:\*\*\s*/i, '') : fallbackSummary(subject, body);

  } catch (err) {
    console.error('AI summary generation failed:', err.message);
    return fallbackSummary(subject, body);
  }
}

async function generateQuickReplies(subject, body) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return defaultReplies();
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'groq/compound-mini',
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
    const raw = data.choices?.[0]?.message?.content?.trim() || '';
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) && parsed.length ? parsed.slice(0, 3) : defaultReplies();
  } catch (err) {
    console.error('Quick replies generation failed:', err.message);
    return defaultReplies();
  }
}

function defaultReplies() {
  return ['Thanks, got it.', "I'm interested.", 'Will get back to you.'];
}

module.exports = { generateSummary, generateQuickReplies };


