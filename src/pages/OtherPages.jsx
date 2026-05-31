import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getSuppliers, addSupplier, deleteSupplier } from '../api';
import { checkIn, checkOut, getAttendanceReport, getUsers } from '../api';
import { getHistoricalReport, getTodayReport } from '../api';
import { getNotifications } from '../api';
import { getLogs } from '../api';
import { setupSecurity, getSecurity, dailyClosing, downloadBackup } from '../api';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';
import { Plus, Truck, Trash2, LogIn, LogOut, Bell, AlertTriangle, Package, Shield, Download, Search } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// =================== Suppliers ===================
export function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:'', phones:[''], address:'' });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const {data}=await getSuppliers(); setSuppliers(data); }
    catch { toast.error('فشل التحميل'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await addSupplier({ ...form, phones: form.phones.filter(p=>p.trim()) });
      toast.success('تم الإضافة'); setShowModal(false); load();
    } catch(err) { toast.error(err.response?.data?.error||'خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await deleteSupplier(deleteId); toast.success('تم الحذف'); setDeleteId(null); load(); }
    catch(err) { toast.error(err.response?.data?.error||'خطأ'); }
  };

  return (
    <div className="animate-in">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:'800'}}>🚚 الموردون</h1>
          <p style={{color:'var(--text-muted)',fontSize:'14px',marginTop:'2px'}}>إدارة الموردين</p>
        </div>
        <button className="btn btn-primary" onClick={()=>{setForm({name:'',phones:[''],address:''});setShowModal(true)}}><Plus size={16}/>إضافة مورد</button>
      </div>
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div style={{padding:'40px',display:'flex',flexDirection:'column',gap:'12px'}}>
              {[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:'44px',borderRadius:'6px'}}/>)}
            </div>
          ) : suppliers.length === 0 ? (
            <div className="empty-state"><Truck size={48}/><h3>لا يوجد موردون</h3></div>
          ) : (
            <table>
              <thead><tr><th>اسم المورد</th><th>أرقام الهاتف</th><th>العنوان</th><th>الإجراءات</th></tr></thead>
              <tbody>
                {suppliers.map(s=>{
                  let phones = [];
                  try { phones = typeof s.phones === 'string' ? JSON.parse(s.phones) : (s.phones||[]); } catch {}
                  return (
                    <tr key={s.id}>
                      <td style={{fontWeight:'600'}}>{s.name}</td>
                      <td>{Array.isArray(phones)?phones.join(' | '):'-'}</td>
                      <td style={{color:'var(--text-muted)',fontSize:'13px'}}>{s.address||'-'}</td>
                      <td><button className="btn btn-ghost btn-icon btn-sm" style={{color:'var(--danger)'}} onClick={()=>setDeleteId(s.id)}><Trash2 size={15}/></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {showModal && createPortal(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header"><span className="modal-title">إضافة مورد</span><button className="btn btn-ghost btn-icon" onClick={()=>setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">اسم المورد *</label><input className="form-control" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="اسم الشركة"/></div>
              <div className="form-group">
                <label className="form-label">أرقام الهاتف</label>
                {form.phones.map((p,i)=>(
                  <div key={i} style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
                    <input className="form-control" value={p} onChange={e=>{const ph=[...form.phones];ph[i]=e.target.value;setForm({...form,phones:ph});}} placeholder="01xxxxxxxxx"/>
                    {i>0&&<button className="btn btn-ghost btn-icon" style={{color:'var(--danger)'}} onClick={()=>setForm({...form,phones:form.phones.filter((_,j)=>j!==i)})}>✕</button>}
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={()=>setForm({...form,phones:[...form.phones,'']})}>+ إضافة رقم</button>
              </div>
              <div className="form-group"><label className="form-label">العنوان</label><input className="form-control" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="عنوان المورد"/></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setShowModal(false)}>إلغاء</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleSave}>{saving?<span className="spinner"/>:'إضافة المورد'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {deleteId && createPortal(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDeleteId(null)}>
          <div className="modal" style={{maxWidth:'400px'}}>
            <div className="modal-header"><span className="modal-title" style={{color:'var(--danger)'}}>⚠️ تأكيد الحذف</span></div>
            <div className="modal-body"><p>هل تريد حذف هذا المورد؟</p></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setDeleteId(null)}>إلغاء</button>
              <button className="btn btn-danger" onClick={handleDelete}>تأكيد</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// =================== Attendance ===================
export function Attendance() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reportUserId, setReportUserId] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => { getUsers().then(r=>setUsers(r.data)).catch(()=>{}); }, []);

  const doCheckIn = async () => {
    if (!username.trim()) { toast.error('أدخل اسم المستخدم'); return; }
    setLoading(true);
    try { const {data}=await checkIn(username); toast.success(data.message); setUsername(''); }
    catch(err) { toast.error(err.response?.data?.error||'خطأ'); }
    finally { setLoading(false); }
  };

  const doCheckOut = async () => {
    if (!username.trim()) { toast.error('أدخل اسم المستخدم'); return; }
    setLoading(true);
    try { const {data}=await checkOut(username); toast.success(data.message); setUsername(''); }
    catch(err) { toast.error(err.response?.data?.error||'خطأ'); }
    finally { setLoading(false); }
  };

  const loadReport = async () => {
    if (!reportUserId) { toast.error('اختر موظفاً'); return; }
    try { const {data}=await getAttendanceReport(reportUserId); setReport(data); }
    catch(err) { toast.error(err.response?.data?.error||'خطأ'); }
  };

  return (
    <div className="animate-in">
      <div style={{marginBottom:'24px'}}>
        <h1 style={{fontSize:'22px',fontWeight:'800'}}>📋 الحضور والانصراف</h1>
        <p style={{color:'var(--text-muted)',fontSize:'14px',marginTop:'2px'}}>تسجيل حضور وانصراف الموظفين</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
        <div className="card">
          <div className="card-header"><span className="card-title">⏰ تسجيل الحضور / الانصراف</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">اسم المستخدم</label>
              <input className="form-control" placeholder="أدخل username الموظف" value={username} onChange={e=>setUsername(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doCheckIn()} />
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}} disabled={loading} onClick={doCheckIn}>
                {loading?<span className="spinner"/>:<><LogIn size={16}/>تسجيل حضور</>}
              </button>
              <button className="btn btn-outline" style={{flex:1,justifyContent:'center',borderColor:'var(--danger)',color:'var(--danger)'}} disabled={loading} onClick={doCheckOut}>
                {loading?<span className="spinner"/>:<><LogOut size={16}/>تسجيل انصراف</>}
              </button>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">📊 تقرير الحضور الشهري</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">اختر الموظف</label>
              <select className="form-control" value={reportUserId} onChange={e=>setReportUserId(e.target.value)}>
                <option value="">-- اختر موظف --</option>
                {users.map(u=><option key={u.id} value={u.id}>{u.fullName} ({u.username})</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={loadReport}>عرض التقرير</button>
            {report && (
              <div style={{marginTop:'16px',background:'var(--bg)',borderRadius:'var(--radius-sm)',padding:'16px'}}>
                <div style={{fontWeight:'700',marginBottom:'12px',fontSize:'15px'}}>{report.fullName || report.userName}</div>
                {[['الأيام المتوقعة',report.expectedDays+' يوم'],['الأيام الفعلية',report.actualDaysWorked+' يوم'],['ساعات العمل اليومية',report.dailyHours+' ساعة'],['نسبة الحضور',report.attendanceRate]].map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)',fontSize:'14px'}}>
                    <span style={{color:'var(--text-muted)'}}>{k}</span><span style={{fontWeight:'600'}}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =================== Reports ===================
export function Reports() {
  const [range, setRange] = useState('week');
  const [data, setData] = useState(null);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [h, t] = await Promise.all([getHistoricalReport(range), getTodayReport()]);
        setData(h.data); setToday(t.data);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [range]);

  return (
    <div className="animate-in">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:'800'}}>📈 التقارير</h1>
          <p style={{color:'var(--text-muted)',fontSize:'14px',marginTop:'2px'}}>تحليل المبيعات والأرباح</p>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          {[{k:'day',l:'اليوم'},{k:'week',l:'أسبوع'},{k:'month',l:'شهر'}].map(r=>(
            <button key={r.k} className={`btn ${range===r.k?'btn-primary':'btn-outline'} btn-sm`} onClick={()=>setRange(r.k)}>{r.l}</button>
          ))}
        </div>
      </div>
      {today && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'16px',marginBottom:'24px'}}>
          {[
            {label:'مبيعات اليوم',value:`${Number(today.grandTotal||0).toFixed(2)} ج`,bg:'#c6f6d5'},
            {label:'نقدي',value:`${Number(today.totals?.cash||0).toFixed(2)} ج`,bg:'#bee3f8'},
            {label:'كارت',value:`${Number(today.totals?.card||0).toFixed(2)} ج`,bg:'#e9d8fd'},
            {label:'فواتير اليوم',value:today.salesCount||0,bg:'#fefcbf'},
          ].map(s=>(
            <div key={s.label} className="stat-card">
              <div style={{background:s.bg,borderRadius:'var(--radius-sm)',width:'44px',height:'44px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:'20px'}}>💰</div>
              <div><div style={{fontSize:'12px',color:'var(--text-muted)',marginBottom:'4px'}}>{s.label}</div><div style={{fontSize:'22px',fontWeight:'800'}}>{s.value}</div></div>
            </div>
          ))}
        </div>
      )}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📊 المبيعات والأرباح</span>
          {data?.overall && (
            <div style={{display:'flex',gap:'16px',fontSize:'13px'}}>
              <span>إجمالي: <strong style={{color:'var(--primary)'}}>{Number(data.overall.total).toFixed(2)} ج</strong></span>
              <span>ربح: <strong style={{color:'var(--success)'}}>{Number(data.overall.profit).toFixed(2)} ج</strong></span>
            </div>
          )}
        </div>
        <div className="card-body">
          {loading ? <div className="skeleton" style={{height:'280px',borderRadius:'8px'}}/> :
           !data?.history?.length ? <div className="empty-state"><p>لا توجد بيانات لهذه الفترة</p></div> : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.history} margin={{top:5,right:5,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f3"/>
                <XAxis dataKey="date" tick={{fontSize:12,fontFamily:'Cairo'}} tickFormatter={d=>new Date(d).toLocaleDateString('ar-EG',{month:'short',day:'numeric'})}/>
                <YAxis tick={{fontSize:12,fontFamily:'Cairo'}} width={55} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(1)}k`:v}/>
                <Tooltip contentStyle={{fontFamily:'Cairo',borderRadius:'8px'}} formatter={(v,n)=>[`${Number(v).toFixed(2)} ج`,n==='total'?'المبيعات':'الربح']}/>
                <Line type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={2.5} dot={{r:4}} name="المبيعات"/>
                <Line type="monotone" dataKey="profit" stroke="var(--success)" strokeWidth={2.5} dot={{r:4}} name="الربح"/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// =================== Notifications ===================
export function Notifications() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getNotifications().then(r=>setAlerts(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const filtered = filter==='all' ? alerts : alerts.filter(a=>filter==='urgent'?a.urgent:a.type===filter);

  return (
    <div className="animate-in">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px',flexWrap:'wrap',gap:'10px'}}>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:'800'}}>🔔 التنبيهات</h1>
          <p style={{color:'var(--text-muted)',fontSize:'14px',marginTop:'2px'}}>تنبيهات المخزون وتواريخ الانتهاء</p>
        </div>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
          {[{k:'all',l:'الكل'},{k:'urgent',l:'عاجل'},{k:'low_stock',l:'نقص مخزون'},{k:'expiry',l:'انتهاء صلاحية'}].map(f=>(
            <button key={f.k} className={`btn ${filter===f.k?'btn-primary':'btn-outline'} btn-sm`} onClick={()=>setFilter(f.k)}>{f.l}</button>
          ))}
        </div>
      </div>
      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{height:'70px',borderRadius:'var(--radius)'}}/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{padding:'80px 20px'}}>
          <Bell size={56}/><h3>لا توجد تنبيهات</h3><p>كل شيء على ما يرام!</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          {filtered.map(alert=>(
            <div key={alert.id} className="card" style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:'14px',borderRight:`4px solid ${alert.urgent?'var(--danger)':'var(--warning)'}`}}>
              <div style={{width:'40px',height:'40px',borderRadius:'50%',background:alert.urgent?'#fed7d7':'#fefcbf',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {alert.type==='low_stock'?<Package size={18} color={alert.urgent?'var(--danger)':'var(--warning)'}/>:<AlertTriangle size={18} color={alert.urgent?'var(--danger)':'var(--warning)'}/>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:'700',fontSize:'15px'}}>{alert.title}</div>
                <div style={{fontSize:'13px',color:'var(--text-muted)',marginTop:'2px'}}>{alert.message}</div>
              </div>
              {alert.urgent && <span className="badge badge-danger">عاجل</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =================== Logs ===================
export function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const load = async (p=1) => {
    setLoading(true);
    try { const {data}=await getLogs({page:p,limit:30}); setLogs(data.data); setPagination(data.pagination); setPage(p); }
    catch {} finally { setLoading(false); }
  };

  useEffect(()=>{load();},[]);

  const sevBadge = { warning:'badge-warning', error:'badge-danger', info:'badge-info' };

  return (
    <div className="animate-in">
      <div style={{marginBottom:'24px'}}>
        <h1 style={{fontSize:'22px',fontWeight:'800'}}>🛡️ سجل الأحداث</h1>
        <p style={{color:'var(--text-muted)',fontSize:'14px',marginTop:'2px'}}>تتبع جميع الأحداث والإجراءات في النظام</p>
      </div>
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div style={{padding:'40px',display:'flex',flexDirection:'column',gap:'12px'}}>
              {[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{height:'44px',borderRadius:'6px'}}/>)}
            </div>
          ) : logs.length===0 ? (
            <div className="empty-state"><Shield size={48}/><h3>لا توجد أحداث مسجلة</h3></div>
          ) : (
            <table>
              <thead><tr><th>الإجراء</th><th>المنفذ</th><th>التفاصيل</th><th>الخطورة</th><th>الوقت</th></tr></thead>
              <tbody>
                {logs.map(l=>(
                  <tr key={l.id}>
                    <td><code style={{fontSize:'12px',background:'var(--bg)',padding:'2px 6px',borderRadius:'4px'}}>{l.action}</code></td>
                    <td style={{fontWeight:'600'}}>{l.actorName}</td>
                    <td style={{fontSize:'12px',color:'var(--text-muted)',maxWidth:'280px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.details}</td>
                    <td><span className={`badge ${sevBadge[l.severity]||'badge-gray'}`}>{l.severity}</span></td>
                    <td style={{fontSize:'12px',color:'var(--text-muted)'}}>{new Date(l.ts).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {pagination.totalPages>1&&(
          <div style={{padding:'16px 24px',borderTop:'1px solid var(--border)'}}>
            <div className="pagination">
              <button className="page-btn" disabled={page===1} onClick={()=>load(page-1)}>السابق</button>
              <span style={{fontSize:'13px',color:'var(--text-muted)'}}>صفحة {page} من {pagination.totalPages}</span>
              <button className="page-btn" disabled={page===pagination.totalPages} onClick={()=>load(page+1)}>التالي</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =================== Settings ===================
export function Settings() {
  const { user } = useAuth();
  const [security, setSecurity] = useState(null);
  const [secForm, setSecForm] = useState({ pin:'', recoveryEmail:'', recoveryPhone:'' });
  const [pin, setPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(()=>{
    getSecurity().then(r=>setSecurity(r.data)).catch(()=>{});
  },[]);

  const handleSecuritySetup = async () => {
    setSaving(true);
    try { await setupSecurity(secForm); toast.success('تم إعداد الأمان'); setSecurity({setupComplete:true}); }
    catch(err) { toast.error(err.response?.data?.error||'خطأ'); }
    finally { setSaving(false); }
  };

  const handleDailyClose = async () => {
    if (!pin) { toast.error('أدخل الـ PIN'); return; }
    setClosing(true);
    try {
      const {data:r} = await getTodayReport();
      await dailyClosing({ date:new Date().toISOString().split('T')[0], totals:r.totals, grandTotal:r.grandTotal, salesCount:r.salesCount, closedByName:user.username, closedById:user.id, pin });
      toast.success('تم تقفيل اليوم بنجاح'); setPin('');
    } catch(err) { toast.error(err.response?.data?.error||'خطأ'); }
    finally { setClosing(false); }
  };

  const handleBackup = async () => {
    try {
      const {data} = await downloadBackup();
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url; a.download = `careplus_backup_${new Date().toISOString().slice(0,10)}.sql`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('تم تحميل النسخة الاحتياطية');
    } catch { toast.error('فشل التحميل'); }
  };

  return (
    <div className="animate-in">
      <div style={{marginBottom:'24px'}}>
        <h1 style={{fontSize:'22px',fontWeight:'800'}}>⚙️ الإعدادات</h1>
        <p style={{color:'var(--text-muted)',fontSize:'14px',marginTop:'2px'}}>إعدادات النظام والأمان</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
        <div className="card">
          <div className="card-header"><span className="card-title">🔐 إعداد الأمان</span>{security?.setupComplete&&<span className="badge badge-success">مُفعَّل</span>}</div>
          <div className="card-body">
            {!security?.setupComplete ? (
              <>
                <div className="form-group"><label className="form-label">رمز PIN</label><input className="form-control" type="password" value={secForm.pin} onChange={e=>setSecForm({...secForm,pin:e.target.value})} placeholder="أدخل الـ PIN"/></div>
                <div className="form-group"><label className="form-label">بريد الاسترداد</label><input className="form-control" type="email" value={secForm.recoveryEmail} onChange={e=>setSecForm({...secForm,recoveryEmail:e.target.value})} placeholder="email@example.com"/></div>
                <div className="form-group"><label className="form-label">هاتف الاسترداد</label><input className="form-control" value={secForm.recoveryPhone} onChange={e=>setSecForm({...secForm,recoveryPhone:e.target.value})} placeholder="01xxxxxxxxx"/></div>
                <button className="btn btn-primary" disabled={saving} onClick={handleSecuritySetup}>{saving?<span className="spinner"/>:'حفظ الإعدادات'}</button>
              </>
            ) : (
              <div style={{textAlign:'center',padding:'20px',color:'var(--success)'}}>
                <div style={{fontSize:'48px',marginBottom:'12px'}}>✅</div>
                <div style={{fontWeight:'700'}}>تم إعداد الأمان بنجاح</div>
              </div>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">🔒 تقفيل اليوم</span></div>
          <div className="card-body">
            <p style={{fontSize:'14px',color:'var(--text-secondary)',marginBottom:'16px'}}>أدخل الـ PIN لتأكيد تقفيل اليوم وتسجيل ملخص المبيعات.</p>
            <div className="form-group"><label className="form-label">رمز PIN</label><input className="form-control" type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="أدخل الـ PIN"/></div>
            <button className="btn btn-accent" disabled={closing} onClick={handleDailyClose} style={{width:'100%',justifyContent:'center'}}>{closing?<span className="spinner"/>:'تقفيل اليوم'}</button>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">💾 النسخ الاحتياطي</span></div>
          <div className="card-body">
            <p style={{fontSize:'14px',color:'var(--text-secondary)',marginBottom:'16px'}}>تحميل نسخة احتياطية كاملة من قاعدة البيانات بصيغة SQL.</p>
            <button className="btn btn-primary" onClick={handleBackup} style={{display:'flex',alignItems:'center',gap:'8px'}}><Download size={16}/>تحميل النسخة الاحتياطية</button>
          </div>
        </div>
      </div>
    </div>
  );
}