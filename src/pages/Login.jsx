import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { login, forgotPassword, resetPassword } from '../api';
import { useAuth } from '../AuthContext';
import { clientRateLimit, clearRateLimit, validators, checkPasswordStrength } from '../security';
import { Eye, EyeOff, Lock, User, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [errors, setErrors] = useState({});
  const [attempts, setAttempts] = useState(0);
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'أدخل اسم المستخدم';
    if (!form.password) e.password = 'أدخل كلمة المرور';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const rl = clientRateLimit('login', 5, 15 * 60 * 1000);
    if (rl.blocked) { toast.error(rl.message); return; }

    setLoading(true);
    try {
      const { data } = await login({ username: form.username.trim(), password: form.password });
      clearRateLimit('login');
      loginUser(data.user, data.token);
      toast.success(`أهلاً بك، ${data.user.fullName || data.user.username} 👋`);
      navigate('/', { replace: true });
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      const msg = err.response?.data?.error || 'خطأ في تسجيل الدخول';
      toast.error(msg);
      if (newAttempts >= 3) {
        setErrors({ password: `محاولة ${newAttempts} من 5 — تجاوز 5 سيوقف الدخول لـ 15 دقيقة` });
      }
      setForm(f => ({ ...f, password: '' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0c1a2e 0%, #0f5a4d 45%, #1a7f6e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position:'absolute', top:'-100px', right:'-100px', width:'380px', height:'380px', borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'-80px', left:'-80px', width:'300px', height:'300px', borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:'35%', left:'8%', width:'140px', height:'140px', borderRadius:'50%', background:'rgba(245,158,11,0.07)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:'15%', right:'15%', width:'80px', height:'80px', borderRadius:'50%', background:'rgba(26,127,110,0.15)', pointerEvents:'none' }}/>

      <div className="animate-in" style={{ width:'100%', maxWidth:'440px' }}>
        <div style={{ textAlign:'center', marginBottom:'30px' }}>
          <div style={{
            width:'76px', height:'76px',
            background:'linear-gradient(135deg, #f59e0b, #fbbf24)',
            borderRadius:'22px', margin:'0 auto 16px',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 10px 30px rgba(245,158,11,0.4)',
            fontSize:'34px', transform:'rotate(-4deg)',
          }}>💊</div>
          <h1 style={{ color:'#fff', fontSize:'28px', fontWeight:'900', letterSpacing:'-0.5px', textShadow:'0 2px 10px rgba(0,0,0,0.3)' }}>CarePlus</h1>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'13.5px', marginTop:'4px' }}>نظام إدارة الصيدلية</p>
        </div>

        <div style={{
          background:'rgba(255,255,255,0.98)',
          borderRadius:'24px', padding:'36px',
          boxShadow:'0 30px 80px rgba(0,0,0,0.35)',
          backdropFilter:'blur(10px)',
        }}>
          <h2 style={{ fontSize:'20px', fontWeight:'800', marginBottom:'6px' }}>تسجيل الدخول</h2>
          <p style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'24px' }}>أدخل بيانات حسابك للمتابعة</p>

          {attempts >= 3 && (
            <div className="alert alert-warning" style={{ marginBottom:'16px' }}>
              <AlertTriangle size={16} style={{ flexShrink:0 }}/>
              <span>تحذير: محاولات متعددة فاشلة. سيتم قفل الدخول بعد {5 - attempts} محاولة إضافية.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" noValidate>
            <div className="form-group">
              <label className="form-label">اسم المستخدم</label>
              <div style={{ position:'relative' }}>
                <User size={16} style={{ position:'absolute', right:'13px', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}/>
                <input
                  className="form-control"
                  style={{ paddingRight:'40px', borderColor: errors.username ? 'var(--danger)' : undefined }}
                  placeholder="أدخل اسم المستخدم"
                  value={form.username}
                  onChange={e => { setForm({...form, username: e.target.value}); setErrors({...errors, username:''}); }}
                  autoComplete="off"
                  maxLength={30}
                  autoFocus
                />
              </div>
              {errors.username && <div style={{ fontSize:'12px', color:'var(--danger)', marginTop:'5px' }}>{errors.username}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">كلمة المرور</label>
              <div style={{ position:'relative' }}>
                <Lock size={16} style={{ position:'absolute', right:'13px', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }}/>
                <input
                  className="form-control"
                  style={{ paddingRight:'40px', paddingLeft:'42px', borderColor: errors.password ? 'var(--danger)' : undefined }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="كلمة المرور"
                  value={form.password}
                  onChange={e => { setForm({...form, password: e.target.value}); setErrors({...errors, password:''}); }}
                  autoComplete="new-password"
                  maxLength={128}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)',
                  padding:'4px', display:'flex',
                }}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.password && <div style={{ fontSize:'12px', color:'var(--danger)', marginTop:'5px' }}>{errors.password}</div>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width:'100%', justifyContent:'center', marginTop:'8px' }}
              disabled={loading}
            >
              {loading ? <span className="spinner"/> : '🔐 دخول'}
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:'16px' }}>
            <button className="btn btn-ghost btn-sm" style={{ color:'var(--text-muted)', fontSize:'13px' }} onClick={() => setShowForgot(true)}>
              نسيت كلمة المرور؟
            </button>
          </div>

          <div style={{ marginTop:'20px', paddingTop:'16px', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'6px', justifyContent:'center' }}>
            <Lock size={12} color="var(--text-muted)"/>
            <span style={{ fontSize:'11.5px', color:'var(--text-muted)' }}>الاتصال مشفر ومحمي — CarePlus v1.0</span>
          </div>
        </div>
      </div>

      {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}
    </div>
  );
}

function ForgotModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const strength = checkPasswordStrength(newPass);

  const sendOtp = async () => {
    if (!email.trim()) { toast.error('أدخل البريد الإلكتروني'); return; }
    if (validators.email(email)) { toast.error(validators.email(email)); return; }
    const rl = clientRateLimit('forgot', 3, 15 * 60 * 1000);
    if (rl.blocked) { toast.error(rl.message); return; }
    setLoading(true);
    try { await forgotPassword(email.trim()); toast.success('تم إرسال الرمز على بريدك'); setStep(2); }
    catch(err) { toast.error(err.response?.data?.error || 'خطأ'); }
    finally { setLoading(false); }
  };

  const doReset = async () => {
    if (!otp.trim() || otp.length < 4) { toast.error('أدخل رمز التحقق'); return; }
    if (newPass.length < 6) { toast.error('كلمة المرور يجب أن تكون 6 أحرف+'); return; }
    setLoading(true);
    try {
      await resetPassword({ email: email.trim(), otp: otp.trim(), newPassword: newPass });
      toast.success('تم تغيير كلمة المرور بنجاح');
      clearRateLimit('forgot');
      onClose();
    } catch(err) { toast.error(err.response?.data?.error || 'خطأ'); }
    finally { setLoading(false); }
  };

  return createPortal(
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:'420px' }}>
        <div className="modal-header">
          <span className="modal-title">{step === 1 ? '🔑 استعادة كلمة المرور' : '✉️ أدخل رمز التحقق'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {step === 1 ? (
            <div className="form-group">
              <label className="form-label">البريد الإلكتروني</label>
              <input className="form-control" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendOtp()} maxLength={100} autoComplete="off" />
            </div>
          ) : (
            <>
              <div className="alert alert-info" style={{ fontSize:'13px' }}>
                📧 تم إرسال رمز التحقق إلى <strong>{email}</strong>
              </div>
              <div className="form-group">
                <label className="form-label">رمز التحقق (OTP)</label>
                <input className="form-control" placeholder="الرمز المكون من 6 أرقام" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))} maxLength={6} autoComplete="off" />
              </div>
              <div className="form-group">
                <label className="form-label">كلمة المرور الجديدة</label>
                <div style={{ position:'relative' }}>
                  <input className="form-control" type={showPass ? 'text' : 'password'} placeholder="6 أحرف على الأقل" value={newPass} onChange={e => setNewPass(e.target.value)} style={{ paddingLeft:'40px' }} maxLength={128} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
                    {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
                {newPass && (
                  <div style={{ marginTop:'8px' }}>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width:`${(strength.score/5)*100}%`, background:strength.color }}/>
                    </div>
                    <div style={{ fontSize:'12px', color:strength.color, marginTop:'4px', fontWeight:'600' }}>{strength.label}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>إلغاء</button>
          <button className="btn btn-primary" disabled={loading} onClick={step === 1 ? sendOtp : doReset}>
            {loading ? <span className="spinner"/> : step === 1 ? 'إرسال الرمز' : 'تغيير كلمة المرور'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}