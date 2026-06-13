import { useState, useEffect } from 'react'
import { Lock, Unlock, Plus, Trash2, Eye, EyeOff, Key, FileText, Copy, Check, Shield } from 'lucide-react'

const ACCENT = '#10b981'

interface Note {
  id: string
  title: string
  publicContent: string
  secretFields: SecretField[]
  category: string
  created: string
  pinned: boolean
}
interface SecretField { id: string; label: string; value: string; visible: boolean }

const CATS = ['Login', 'Finance', 'Identity', 'Notes', 'Other']

function xor(text: string, key: string): string {
  return btoa(text.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))).join(''))
}
function dxor(enc: string, key: string): string {
  try { const t = atob(enc); return t.split('').map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))).join('') } catch { return '' }
}

export default function App() {
  const [masterKey, setMasterKey] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [selected, setSelected] = useState<Note | null>(null)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [pub, setPub] = useState('')
  const [category, setCategory] = useState('Login')
  const [fields, setFields] = useState<SecretField[]>([{ id: '1', label: 'Username', value: '', visible: false }, { id: '2', label: 'Password', value: '', visible: false }])
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState('')

  const MASTER_KEY_STORAGE = 'pn_mk_hash'

  useEffect(() => {
    const h = localStorage.getItem(MASTER_KEY_STORAGE)
    if (!h) {
      // first time
    }
  }, [])

  async function hashKey(k: string): Promise<string> {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(k))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async function setupOrUnlock() {
    if (!keyInput.trim()) return
    const h = await hashKey(keyInput)
    const saved = localStorage.getItem(MASTER_KEY_STORAGE)
    if (!saved) {
      localStorage.setItem(MASTER_KEY_STORAGE, h)
      setMasterKey(keyInput)
      setUnlocked(true)
      setError('')
    } else if (h === saved) {
      setMasterKey(keyInput)
      setUnlocked(true)
      setError('')
      const raw = localStorage.getItem('pn_notes')
      if (raw) {
        try { setNotes(JSON.parse(dxor(raw, keyInput))) } catch { setNotes([]) }
      }
    } else {
      setError('Wrong master key')
    }
    setKeyInput('')
  }

  function saveNotes(list: Note[]) {
    setNotes(list)
    localStorage.setItem('pn_notes', xor(JSON.stringify(list), masterKey))
  }

  function addNote() {
    if (!title.trim()) return
    const n: Note = { id: Date.now().toString(), title: title.trim(), publicContent: pub.trim(), secretFields: fields.filter(f => f.label.trim()), category, created: new Date().toISOString(), pinned: false }
    saveNotes([n, ...notes])
    setAdding(false)
    setTitle(''); setPub(''); setCategory('Login')
    setFields([{ id: '1', label: 'Username', value: '', visible: false }, { id: '2', label: 'Password', value: '', visible: false }])
  }

  function deleteNote(id: string) { saveNotes(notes.filter(n => n.id !== id)); setSelected(null) }
  function togglePin(id: string) { saveNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n)) }

  function toggleFieldVisible(fid: string) {
    if (!selected) return
    const updated = { ...selected, secretFields: selected.secretFields.map(f => f.id === fid ? { ...f, visible: !f.visible } : f) }
    setSelected(updated)
  }

  async function copyField(val: string, id: string) {
    await navigator.clipboard.writeText(val).catch(() => {})
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!unlocked) return (
    <div style={{ background: 'linear-gradient(135deg,#022c22,#064e3b)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', padding: '2rem' }}>
      <div style={{ background: '#0f2d24', borderRadius: 24, padding: '2.5rem', width: '100%', maxWidth: 380, textAlign: 'center', boxShadow: '0 20px 60px rgba(16,185,129,0.2)' }}>
        <Shield size={44} style={{ color: ACCENT, marginBottom: '1rem' }} />
        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>PasswordNotes</h2>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>{localStorage.getItem(MASTER_KEY_STORAGE) ? 'Enter your master key' : 'Create a master key to get started'}</p>
        <input type="password" placeholder="Master key" value={keyInput} onChange={e => setKeyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && setupOrUnlock()} style={{ width: '100%', background: '#1a3d32', border: '2px solid #2d5a4a', borderRadius: 12, padding: '0.9rem', color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 12, boxSizing: 'border-box' }} />
        {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 10 }}>{error}</p>}
        <button onClick={setupOrUnlock} style={{ width: '100%', background: ACCENT, border: 'none', borderRadius: 12, padding: '0.9rem', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>{localStorage.getItem(MASTER_KEY_STORAGE) ? 'Unlock' : 'Create Vault'}</button>
      </div>
    </div>
  )

  if (selected) return (
    <div style={{ background: '#020f0a', minHeight: '100vh', fontFamily: 'Inter,sans-serif', color: '#fff', padding: '1.5rem' }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>← Back</button>
          <button onClick={() => deleteNote(selected.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ background: ACCENT + '22', color: ACCENT, borderRadius: 20, padding: '0.2rem 0.7rem', fontSize: 12 }}>{selected.category}</span>
          <Lock size={14} style={{ color: ACCENT }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>{selected.title}</h1>

        {selected.publicContent && (
          <div style={{ background: '#0f2d24', borderRadius: 14, padding: '1.2rem', marginBottom: 16 }}>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 6 }}>NOTES</p>
            <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selected.publicContent}</p>
          </div>
        )}

        {selected.secretFields.length > 0 && (
          <div style={{ background: '#0f2d24', borderRadius: 14, padding: '1.2rem' }}>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>SECRET FIELDS</p>
            {selected.secretFields.map(f => (
              <div key={f.id} style={{ marginBottom: 14 }}>
                <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>{f.label}</p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1, background: '#020f0a', borderRadius: 8, padding: '0.6rem 0.8rem', fontFamily: 'monospace', fontSize: 14, color: '#e2e8f0', letterSpacing: f.visible ? 0 : 2 }}>{f.visible ? f.value : '••••••••'}</div>
                  <button onClick={() => toggleFieldVisible(f.id)} style={{ background: '#1a3d32', border: 'none', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', color: '#64748b' }}>{f.visible ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  <button onClick={() => copyField(f.value, f.id)} style={{ background: '#1a3d32', border: 'none', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', color: copied === f.id ? ACCENT : '#64748b' }}>{copied === f.id ? <Check size={16} /> : <Copy size={16} />}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ background: '#020f0a', minHeight: '100vh', fontFamily: 'Inter,sans-serif', color: '#fff', padding: '1.5rem' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Key size={24} style={{ color: ACCENT }} />
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>PasswordNotes</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#10b981', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Unlock size={12} /> Unlocked</span>
            <button onClick={() => { setUnlocked(false); setNotes([]) }} style={{ background: '#1a3d32', border: 'none', borderRadius: 8, padding: '0.4rem 0.8rem', color: '#64748b', cursor: 'pointer', fontSize: 12 }}>Lock</button>
            <button onClick={() => setAdding(true)} style={{ background: ACCENT, border: 'none', borderRadius: 10, padding: '0.5rem 1rem', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><Plus size={14} /> Add</button>
          </div>
        </div>

        {adding && (
          <div style={{ background: '#0f2d24', borderRadius: 16, padding: '1.5rem', marginBottom: 16, border: '1px solid #1a3d32' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>New Secure Note</h3>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title *" style={{ width: '100%', background: '#020f0a', border: '1px solid #1a3d32', borderRadius: 8, padding: '0.6rem', color: '#fff', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {CATS.map(c => <button key={c} onClick={() => setCategory(c)} style={{ flex: 1, background: category === c ? ACCENT : '#020f0a', border: 'none', borderRadius: 8, padding: '0.4rem', color: category === c ? '#fff' : '#64748b', fontSize: 11, cursor: 'pointer' }}>{c}</button>)}
            </div>
            <textarea value={pub} onChange={e => setPub(e.target.value)} placeholder="Public notes (URL, username hints...)" rows={2} style={{ width: '100%', background: '#020f0a', border: '1px solid #1a3d32', borderRadius: 8, padding: '0.6rem', color: '#fff', fontSize: 13, resize: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>SECRET FIELDS</p>
            {fields.map((f, i) => (
              <div key={f.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={f.label} onChange={e => { const nf = [...fields]; nf[i] = { ...f, label: e.target.value }; setFields(nf) }} placeholder="Field name" style={{ width: 110, background: '#020f0a', border: '1px solid #1a3d32', borderRadius: 8, padding: '0.5rem', color: '#fff', fontSize: 13, flexShrink: 0 }} />
                <input type={f.visible ? 'text' : 'password'} value={f.value} onChange={e => { const nf = [...fields]; nf[i] = { ...f, value: e.target.value }; setFields(nf) }} placeholder="Value" style={{ flex: 1, background: '#020f0a', border: '1px solid #1a3d32', borderRadius: 8, padding: '0.5rem', color: '#fff', fontSize: 13 }} />
                <button onClick={() => { const nf = [...fields]; nf[i] = { ...f, visible: !f.visible }; setFields(nf) }} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>{f.visible ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                {fields.length > 1 && <button onClick={() => setFields(fields.filter((_, j) => j !== i))} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>}
              </div>
            ))}
            <button onClick={() => setFields([...fields, { id: Date.now().toString(), label: '', value: '', visible: false }])} style={{ background: 'transparent', border: '1px dashed #1a3d32', borderRadius: 8, padding: '0.4rem 0.8rem', color: '#64748b', cursor: 'pointer', fontSize: 12, marginBottom: 14 }}>+ Add field</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addNote} style={{ background: ACCENT, border: 'none', borderRadius: 10, padding: '0.6rem 1.2rem', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Save</button>
              <button onClick={() => setAdding(false)} style={{ background: '#1a3d32', border: 'none', borderRadius: 10, padding: '0.6rem 1.2rem', color: '#888', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#1a3d32' }}>
            <FileText size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p style={{ color: '#2d5a4a', fontSize: 16 }}>No notes yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notes.map(n => (
              <div key={n.id} onClick={() => setSelected(n)} style={{ background: '#0f2d24', borderRadius: 12, padding: '1rem 1.2rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #1a3d32' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontWeight: 600, fontSize: 15 }}>{n.title}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ background: ACCENT + '22', color: ACCENT, borderRadius: 20, padding: '0.15rem 0.6rem', fontSize: 11 }}>{n.category}</span>
                    <span style={{ color: '#2d5a4a', fontSize: 12 }}>{n.secretFields.length} secret field{n.secretFields.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <Lock size={14} style={{ color: ACCENT }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
