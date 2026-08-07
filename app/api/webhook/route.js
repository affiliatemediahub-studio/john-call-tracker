// In-memory call storage (resets on deploy, good for testing)
let calls = []

export async function POST(request) {
  try {
    const body = await request.json()
    
    const call = {
      id: body.message?.call?.id || body.call_id || `call-${Date.now()}`,
      from: body.message?.call?.customer?.number || body.from || 'Unknown',
      to: body.message?.call?.phoneNumber?.number || body.to || 'Unknown',
      status: body.message?.type || body.status || 'completed',
      duration: body.message?.call?.durationSeconds || body.duration || 0,
      transcript: body.message?.call?.transcript || body.transcript || '',
      summary: body.message?.call?.summary || body.summary || '',
      timestamp: new Date().toISOString(),
      raw: body
    }
    
    calls.unshift(call)
    if (calls.length > 100) calls = calls.slice(0, 100)
    
    return Response.json({ success: true, callId: call.id })
  } catch (err) {
    console.error('Webhook error:', err)
    return Response.json({ success: false, error: err.message }, { status: 200 })
  }
}

export async function GET() {
  return Response.json({ calls, count: calls.length })
}
