import { useState, useEffect } from 'react'

export default function Home() {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCall, setSelectedCall] = useState(null)

  useEffect(() => {
    fetchCalls()
    const interval = setInterval(fetchCalls, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchCalls() {
    try {
      const res = await fetch('/api/webhook')
      const data = await res.json()
      setCalls(data.calls || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const totalCalls = calls.length
  const totalDuration = calls.reduce((sum, c) => sum + (parseInt(c.duration) || 0), 0)
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px', minHeight: '100vh', background: '#0a0a0a', color: '#f0f0f0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 6px', letterSpacing: -1 }}>
          John Call <span style={{ color: '#ff6b00' }}>Tracker</span>
        </h1>
        <p style={{ color: '#888', fontSize: 15, margin: 0 }}>Phillip Voice Call Dashboard</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Calls" value={totalCalls} />
        <StatCard label="Total Minutes" value={Math.round(totalDuration / 60)} />
        <StatCard label="Avg Duration" value={`${avgDuration}s`} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#888' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div><p>Loading calls...</p>
        </div>
      ) : calls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, background: '#141414', borderRadius: 20, border: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📞</div>
          <p style={{ color: '#888', fontSize: 16 }}>No calls yet.</p>
          <p style={{ color: '#555', fontSize: 14 }}>When Phillip receives a call, it will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {calls.map((call) => (
            <div key={call.id} onClick={() => setSelectedCall(selectedCall?.id === call.id ? null : call)} style={{
              background: '#141414', border: '1px solid #2a2a2a', borderRadius: 16, padding: 18,
              cursor: 'pointer', transition: 'all 0.2s', borderLeft: '4px solid #00c853'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                    {call.fromName ? `${call.fromName} (${call.from})` : (call.from || 'Unknown Caller')}
                  </div>
                  <div style={{ color: '#888', fontSize: 13, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>{formatTime(call.recordedAt)}</span><span>•</span>
                    <span>{formatDuration(call.duration)}</span><span>•</span>
                    <span style={{ color: '#00c853' }}>{call.status}</span>
                  </div>
                </div>
              </div>

              {selectedCall?.id === call.id && (
                <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #2a2a2a' }}>

                  {call.vapiSummary && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: '#ff6b00', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                        🤖 AI Summary
                      </div>
                      <div style={{ fontSize: 15, lineHeight: 1.6, color: '#ddd', background: '#1a1a1a', padding: 14, borderRadius: 10, border: '1px solid #333' }}>
                        {call.vapiSummary}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: '#00c853', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                      📝 Message From Caller
                    </div>
                    <div style={{ fontSize: 16, lineHeight: 1.7, color: '#f0f0f0', background: '#1a1a1a', padding: 14, borderRadius: 10, border: '1px solid #333', whiteSpace: 'pre-wrap' }}>
                      {call.callerMessage || 'No message captured'}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: '#444', fontFamily: 'monospace' }}>
                    ID: {call.id} • Reason: {call.reason}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '30px 0 10px', color: '#333', fontSize: 12 }}>
        Auto-refreshes every 5 seconds • john-call-tracker
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 16, padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#ff6b00' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>{label}</div>
    </div>
  )
}

function formatTime(iso) {
  if (!iso) return 'Just now'
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDuration(sec) {
  const s = parseInt(sec) || 0
  if (s === 0) return '0s'
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`
}
