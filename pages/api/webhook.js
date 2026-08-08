// pages/api/webhook.js
// Receives call data from Vapi and stores it

let calls = [];
let lastRawPayload = null; // For debugging

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;
      lastRawPayload = data;

      console.log('========== WEBHOOK RECEIVED ==========');
      console.log('Full payload keys:', Object.keys(data));
      console.log('Payload:', JSON.stringify(data, null, 2).substring(0, 3000));

      // Vapi wraps in "message" object
      const message = data.message || data;
      const eventType = message.type || data.type || 'unknown';
      console.log('Event type:', eventType);

      // Extract call object - Vapi puts it in message.call
      const callObj = message.call || message;
      console.log('Call object keys:', Object.keys(callObj));

      // Extract messages array - Vapi puts it in message.call.messages
      let messages = [];
      if (callObj.messages && Array.isArray(callObj.messages)) {
        messages = callObj.messages;
      } else if (message.messages && Array.isArray(message.messages)) {
        messages = message.messages;
      } else if (data.messages && Array.isArray(data.messages)) {
        messages = data.messages;
      }
      console.log('Messages count:', messages.length);

      // Build transcript
      let transcript = '';
      if (messages.length > 0) {
        transcript = messages.map(m => {
          const role = m.role === 'assistant' ? 'Phillip' : 'Caller';
          const content = m.message || m.content || m.text || m.word || '(no text)';
          return `${role}: ${content}`;
        }).join('\n');
      } else {
        transcript = callObj.transcript || callObj.transcriptXML || data.transcript || 'No transcript available';
      }

      // Extract duration - Vapi sends durationMs
      let duration = 0;
      if (callObj.durationMs) {
        duration = Math.round(callObj.durationMs / 1000);
      } else if (callObj.duration_ms) {
        duration = Math.round(callObj.duration_ms / 1000);
      } else if (callObj.duration) {
        duration = parseInt(callObj.duration) || 0;
      } else if (data.durationMs) {
        duration = Math.round(data.durationMs / 1000);
      }

      // Extract phone number
      let fromNumber = 'Unknown';
      if (callObj.customer?.number) {
        fromNumber = callObj.customer.number;
      } else if (callObj.from) {
        fromNumber = callObj.from;
      } else if (data.from) {
        fromNumber = data.from;
      }

      let toNumber = 'Unknown';
      if (callObj.phoneNumber?.number) {
        toNumber = callObj.phoneNumber.number;
      } else if (callObj.to) {
        toNumber = callObj.to;
      }

      const callRecord = {
        id: callObj.id || callObj.call_id || data.call_id || Date.now().toString(),
        from: fromNumber,
        fromName: callObj.customer?.name || callObj.fromName || '',
        to: toNumber,
        status: callObj.status || data.status || 'completed',
        reason: callObj.endedReason || callObj.ended_reason || callObj.end_reason || data.endedReason || 'N/A',
        startedAt: callObj.startedAt || callObj.started_at || data.startedAt || new Date().toISOString(),
        endedAt: callObj.endedAt || callObj.ended_at || data.endedAt || new Date().toISOString(),
        duration: duration,
        transcript: transcript,
        messageCount: messages.length,
        summary: callObj.summary || data.summary || '',
        recordedAt: new Date().toISOString(),
        eventType: eventType
      };

      calls.unshift(callRecord);
      if (calls.length > 100) calls = calls.slice(0, 100);

      console.log('========== CALL LOGGED ==========');
      console.log('From:', callRecord.from);
      console.log('Duration:', callRecord.duration + 's');
      console.log('Messages:', callRecord.messageCount);

      return res.status(200).json({ success: true, id: callRecord.id });

    } catch (err) {
      console.error('Webhook error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({ calls, count: calls.length, lastPayload: lastRawPayload });
  }

  res.status(405).end();
}
