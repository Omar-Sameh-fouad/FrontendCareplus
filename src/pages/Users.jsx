import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getUsers, addUser, updateUser, deleteUser } from '../api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Users as UsersIcon, Search } from 'lucide-react';

const emptyForm = { username:'', fullName:'', email:'', phone:'', role:'cashier', password:'', dailyHours:8, expectedDays:24, active:1 };
const roles = { admin:'مدير', pharmacist:'صيدلي', cashier:'كاشير' };
const roleBadge = { admin:'badge-danger', pharmacist:'badge-info', cashier:'badge-success' };

const F = ({ label, name, type='text', form, setForm, ...rest }) => {
  const handleChange = (e) => {
    let val = e.target.value;
    if (type === 'number') val = parseInt(val) || 0;
    setForm({ ...form, [name]: val });
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {type === 'select' ? (
        <select className="form-control" value={form[name]} onChange={handleChange} {...rest}>
          {rest.children}
        </select>
      ) : (
        <input className="form-control" type={type} value={form[name]} onChange={handleChange} {...rest} />
      )}
    </div>
  );
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try { 
      const {data} = await getUsers(); 
      
      // الحل هنا من الفرونت اند: معالجة حالة "نشط/موقوف" عشان نتفادى مشكلة الـ Buffer اللي بتيجي من الداتا بيز
      const cleanedData = data.map(u => {
        let isActive = 1; // الافتراضي نشط
        if (u.active && typeof u.active === 'object' && u.active.data) {
          isActive = u.active.data[0]; // لو رجعت على هيئة Buffer
        } else if (u.active === 0 || u.active === '0' || u.active === false) {
          isActive = 0; // لو رجعت صفر صريح
        }
        return { ...u, active: isActive };
      });

      setUsers(cleanedData); 
    } catch { 
      toast.error('فشل تحميل الموظفين'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (u) => { setEditing(u); setForm({...u, password:''}); setShowModal(true); };

  const handleSave = async () => {
    // === التحقق من طول كلمة المرور (6 رموز بالضبط) ===
    if (!editing && (!form.password || form.password.length !== 6)) {
      toast.error('كلمة المرور يجب أن تتكون من 6 أحرف/أرقام بالضبط');
      return;
    }
    if (editing && form.password && form.password.length !== 6) {
      toast.error('كلمة المرور الجديدة يجب أن تتكون من 6 أحرف/أرقام بالضبط');
      return;
    }

    setSaving(true);
    try {
      if (editing) { await updateUser(editing.id, form); toast.success('تم التعديل بنجاح'); }
      else { await addUser(form); toast.success('تم إضافة الموظف بنجاح'); }
      setShowModal(false); load();
    } catch(err) { toast.error(err.response?.data?.error || 'خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await deleteUser(deleteId); toast.success('تم الحذف'); setDeleteId(null); load(); }
    catch(err) { toast.error(err.response?.data?.error || 'خطأ'); }
  };

  const filtered = users.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800' }}>👥 الموظفون</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'14px', marginTop:'2px' }}>إدارة حسابات الموظفين</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/>إضافة موظف</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-box" style={{flex:1,maxWidth:'300px'}}>
            <Search className="search-icon" size={16}/>
            <input className="form-control" placeholder="بحث بالاسم..." value={search} onChange={e=>setSearch(e.target.value)} style={{paddingRight:'42px'}}/>
          </div>
          <span style={{color:'var(--text-muted)',fontSize:'13px'}}>{users.length} موظف</span>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div style={{padding:'40px',display:'flex',flexDirection:'column',gap:'12px'}}>
              {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:'44px',borderRadius:'6px'}}/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><UsersIcon size={48}/><h3>لا يوجد موظفون</h3></div>
          ) : (
            <table>
              <thead><tr><th>الموظف</th><th>اسم المستخدم</th><th>الدور</th><th>البريد</th><th>ساعات/يوم</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
              <tbody>
                {filtered.map(u=>(
                  <tr key={u.id}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'linear-gradient(135deg,var(--primary),var(--primary-light))',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:'700',fontSize:'15px',flexShrink:0}}>
                          {u.fullName?.charAt(0)||'؟'}
                        </div>
                        <span style={{fontWeight:'600'}}>{u.fullName}</span>
                      </div>
                    </td>
                    <td><code style={{fontSize:'13px',background:'var(--bg)',padding:'2px 8px',borderRadius:'4px'}}>{u.username}</code></td>
                    <td><span className={`badge ${roleBadge[u.role]||'badge-gray'}`}>{roles[u.role]||u.role}</span></td>
                    <td style={{fontSize:'13px',color:'var(--text-muted)'}}>{u.email}</td>
                    <td style={{textAlign:'center'}}>{u.dailyHours} ساعة</td>
                    <td><span className={`badge ${u.active?'badge-success':'badge-danger'}`}>{u.active?'نشط':'موقوف'}</span></td>
                    <td>
                      <div style={{display:'flex',gap:'6px'}}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>openEdit(u)}><Edit2 size={15}/></button>
                        <button className="btn btn-ghost btn-icon btn-sm" style={{color:'var(--danger)'}} onClick={()=>setDeleteId(u.id)}><Trash2 size={15}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && createPortal(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal" style={{maxWidth:'600px'}}>
            <div className="modal-header">
              <span className="modal-title">{editing?'تعديل موظف':'إضافة موظف جديد'}</span>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px'}}>
                {/* خدعة لمنع المتصفح من الملء التلقائي */}
                <input type="text" style={{ display: 'none' }} />
                <input type="password" style={{ display: 'none' }} />

                <F label="الاسم الكامل *" name="fullName" placeholder="الاسم بالكامل" form={form} setForm={setForm} autoComplete="off" />
                <F label="اسم المستخدم *" name="username" placeholder="username" form={form} setForm={setForm} autoComplete="off" />
                <F label="البريد الإلكتروني" name="email" type="email" placeholder="email@example.com" form={form} setForm={setForm} autoComplete="off" />
                <F label="رقم الهاتف" name="phone" placeholder="01xxxxxxxxx" form={form} setForm={setForm} autoComplete="off" />
                <F label="الدور *" name="role" type="select" form={form} setForm={setForm}>
                  <option value="cashier">كاشير</option>
                  <option value="pharmacist">صيدلي</option>
                  <option value="admin">مدير</option>
                </F>
                <F label={editing?'كلمة مرور جديدة (للتغيير فقط)':'كلمة المرور *'} name="password" type="password" placeholder="6 أحرف أو أرقام فقط" form={form} setForm={setForm} maxLength={6} minLength={6} autoComplete="new-password" />
                <F label="ساعات العمل اليومية" name="dailyHours" type="number" min="1" max="24" form={form} setForm={setForm} autoComplete="off" />
                <F label="الأيام المتوقعة شهرياً" name="expectedDays" type="number" min="1" max="31" form={form} setForm={setForm} autoComplete="off" />
              </div>
              
              {/* حقل الحالة أصبح ظاهراً دائماً */}
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label">الحالة</label>
                <select className="form-control" value={form.active} onChange={e=>setForm({...form,active:parseInt(e.target.value)})}>
                  <option value={1}>نشط</option>
                  <option value={0}>موقوف</option>
                </select>
              </div>

            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setShowModal(false)}>إلغاء</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
                {saving?<span className="spinner"/>:(editing?'حفظ التعديلات':'إضافة الموظف')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {deleteId && createPortal(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDeleteId(null)}>
          <div className="modal" style={{maxWidth:'400px'}}>
            <div className="modal-header"><span className="modal-title" style={{color:'var(--danger)'}}>⚠️ تأكيد الحذف</span></div>
            <div className="modal-body"><p style={{color:'var(--text-secondary)'}}>هل أنت متأكد من حذف هذا الموظف؟</p></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setDeleteId(null)}>إلغاء</button>
              <button className="btn btn-danger" onClick={handleDelete}>تأكيد الحذف</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}