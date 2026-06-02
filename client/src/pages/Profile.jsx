import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Loader, Save, X, Camera, Github } from 'lucide-react'
import { GITHUB_PROFILE_URL, GITHUB_USERNAME } from '../config/github'
import { motion, AnimatePresence } from 'framer-motion'

const API = '/api'
const token = () => localStorage.getItem('token')

function Avatar({ name, url, size = 72 }) {
  const [imgError, setImgError] = useState(false)
  const colors = ['#4F46E5', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2']
  const c = colors[(name?.charCodeAt(0) || 0) % colors.length]

  if (url && !imgError) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid var(--border)',
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: c,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.36, fontWeight: 700, color: '#fff',
        border: '2px solid var(--border)',
        flexShrink: 0,
      }}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function StatBadge({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 10, padding: '12px 16px', flex: 1,
    }}>
      <span style={{ fontSize: 20, fontWeight: 800, color: color || 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1 }}>
        {value ?? '—'}
      </span>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  )
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { addToast } = useToast()
  const fileRef = useRef()

  const [form, setForm]       = useState({ name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '' })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSave = async () => {
    // Validate
    if (form.name.trim().length < 2) {
      addToast('Name must be at least 2 characters.', 'danger')
      return
    }
    if (form.phone && !/^[+\d\s\-().]{4,20}$/.test(form.phone)) {
      addToast('Phone number format is invalid.', 'danger')
      return
    }
    if (form.bio.length > 200) {
      addToast('Bio must be 200 characters or fewer.', 'danger')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim(), bio: form.bio.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      updateUser(data)
      setEditing(false)
      addToast('Profile updated successfully!', 'success')
    } catch (err) {
      addToast(err.message, 'danger')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setForm({ name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '' })
    setEditing(false)
    setAvatarPreview(null)
  }

  const handleAvatarClick = () => fileRef.current?.click()

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { addToast('Image must be under 2MB.', 'danger'); return }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) { addToast('Only JPEG, PNG, WebP, and GIF allowed.', 'danger'); return }

    // Preview
    const reader = new FileReader()
    reader.onload = e => setAvatarPreview(e.target.result)
    reader.readAsDataURL(file)

    // Upload
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const res = await fetch(`${API}/auth/avatar`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      updateUser({ avatar: data.avatarUrl })
      addToast('Avatar updated!', 'success')
    } catch (err) {
      addToast(err.message, 'danger')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleDeleteAvatar = async () => {
    try {
      const res = await fetch(`${API}/auth/avatar`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateUser({ avatar: null })
      setAvatarPreview(null)
      addToast('Avatar removed.', 'success')
    } catch (err) {
      addToast(err.message, 'danger')
    }
  }

  const roleColor = user?.role === 'admin' ? { bg: '#F5F3FF', text: '#7C3AED' } : { bg: 'var(--surface-2)', text: 'var(--text-2)' }

  return (
    <div style={{ padding: '24px', maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Profile Settings
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            Manage your account details
          </p>
        </div>
        <AnimatePresence>
          {editing ? (
            <motion.div key="actions" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={handleCancel}
                className="btn-secondary"
                style={{ height: 34, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn-primary"
                style={{ height: 34, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                {loading && <Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
                <Save size={13} /> Save Changes
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="edit"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditing(true)}
              className="btn-secondary"
              style={{ height: 34, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              ✏️ Edit Profile
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Profile header card ─────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-xs)',
        padding: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle background accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 64,
          background: 'linear-gradient(135deg, var(--accent-bg) 0%, transparent 70%)',
          borderRadius: '14px 14px 0 0',
        }} />

        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0, zIndex: 1 }}>
          <Avatar
            name={user?.name}
            url={avatarPreview || user?.avatar ? `http://localhost:5001${user?.avatar}` : null}
            size={72}
          />
          {editing && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 26, height: 26,
                  background: 'var(--accent)',
                  border: '2px solid var(--surface)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                  color: '#fff', zIndex: 2,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {uploadingAvatar
                  ? <Loader size={11} style={{ animation: 'spin 0.8s linear infinite' }} />
                  : <Camera size={11} />
                }
              </button>
            </>
          )}
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 8, zIndex: 1 }}>
          {editing ? (
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input"
              style={{ maxWidth: 280, height: 38, marginBottom: 6 }}
              placeholder="Your full name"
              required
            />
          ) : (
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
              {user?.name}
            </h2>
          )}
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
            {user?.email}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: roleColor.bg, color: roleColor.text,
              padding: '3px 9px', borderRadius: 10,
              textTransform: 'capitalize', letterSpacing: 0,
            }}>
              {user?.role}
            </span>
            {user?.xp != null && (
              <span style={{
                fontSize: 10, fontWeight: 600,
                background: 'var(--accent-bg)', color: 'var(--accent)',
                padding: '3px 9px', borderRadius: 10,
              }}>
                {user.xp.toLocaleString()} XP
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10 }}>
        <StatBadge label="XP Earned"  value={user?.xp?.toLocaleString() ?? '—'} color="var(--accent)" />
        <StatBadge label="Role"       value={user?.role} />
        <StatBadge label="Member Since" value={user?.createdAt ? new Date(user.createdAt).getFullYear() : '—'} />
      </div>

      {/* ── Info & Account settings ─────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-xs)',
        overflow: 'hidden',
      }}>
        {/* Section: Profile Info */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 4 }}>
            Profile Information
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {editing ? 'Edit your public profile details below.' : 'Your profile information.'}
          </p>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Email — read only */}
          <div>
            <label className="label">Email address</label>
            <input
              value={user?.email || ''}
              className="input"
              disabled
              style={{ maxWidth: 360, background: 'var(--surface-2)', cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
              Contact an admin to change your email address.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="label">Phone number <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
            {editing ? (
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="input"
                placeholder="+1 (555) 000-0000"
                style={{ maxWidth: 260 }}
              />
            ) : (
              <p style={{ fontSize: 14, color: user?.phone ? 'var(--text)' : 'var(--text-3)', padding: '8px 0' }}>
                {user?.phone || 'Not set'}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="label">
              Bio
              {editing && <span style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 5 }}>· {form.bio.length}/200</span>}
            </label>
            {editing ? (
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                className="textarea"
                rows={3}
                placeholder="Tell your team a bit about yourself…"
                maxLength={200}
                style={{ maxWidth: 480 }}
              />
            ) : (
              <p style={{ fontSize: 14, color: user?.bio ? 'var(--text-2)' : 'var(--text-3)', lineHeight: 1.55 }}>
                {user?.bio || 'No bio yet.'}
              </p>
            )}
          </div>

          {/* Save button (mobile, when editing) */}
          {editing && (
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <button onClick={handleCancel} className="btn-secondary" style={{ height: 38 }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading} className="btn-primary" style={{ height: 38, justifyContent: 'center', gap: 6 }}>
                {loading && <Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Delete avatar — only when editing */}
        {editing && user?.avatar && (
          <div style={{ padding: '0 20px 16px' }}>
            <button
              onClick={handleDeleteAvatar}
              style={{
                fontSize: 12, color: 'var(--danger)',
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, fontWeight: 500,
              }}
            >
              Remove avatar
            </button>
          </div>
        )}
      </div>

      {/* ── Danger zone ────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid rgba(220,38,38,0.15)',
        borderRadius: 14, padding: '18px 20px',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Danger Zone
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>
          Once you delete your account, there is no going back. All your data will be permanently removed.
        </p>
        <button
          onClick={() => addToast('Account deletion is disabled in the demo.', 'warning')}
          style={{
            padding: '0 14px', height: 34,
            background: 'var(--danger-bg)',
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 8, color: 'var(--danger)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Delete Account
        </button>
      </div>

      {/* ── GitHub integration ──────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14, padding: '18px 20px',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          GitHub Integration
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>
          Connected GitHub developer profile
        </p>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 9,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Github size={18} style={{ color: 'var(--text-2)' }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{GITHUB_USERNAME}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Developer Profile</p>
            </div>
          </div>
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn-sm"
          >
            View ↗
          </a>
        </div>
      </div>

    </div>
  )
}