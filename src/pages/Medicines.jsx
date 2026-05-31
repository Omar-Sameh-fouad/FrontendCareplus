import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getMedicines, addMedicine, updateMedicine, deleteMedicine, getSuppliers, analyzeMedicineImage } from '../api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';

const emptyForm = {
  name:'', barcode:'', expiryDate:'', quantity:0, purchasePrice:0,
  sellingPrice:0, requiresPrescription:false, supplierId:'',
  pillCount:0, stripCount:0, manufacturer:'', genericName:'', medicineForm:''
};

// تم استخراج المكون لحل مشكلة فقدان الـ Focus أثناء كتابة الأدوية
const F = ({ label, name, type='text', form, setForm, ...rest }) => {
  const handleChange = (e) => {
    if (type === 'checkbox') {
      setForm({ ...form, [name]: e.target.checked });
    } else {
      let val = e.target.value;
      if (type === 'number') val = parseFloat(val) || 0;
      setForm({ ...form, [name]: val });
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {type === 'select' ? (
        <select className="form-control" value={form[name]} onChange={handleChange} {...rest}>
          {rest.children}
        </select>
      ) : type === 'checkbox' ? (
        <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer'}}>
          <input type="checkbox" checked={form[name]} onChange={handleChange} style={{width:'16px',height:'16px'}} />
          <span style={{fontSize:'14px'}}>{rest.checkLabel}</span>
        </label>
      ) : (
        <input className="form-control" type={type} value={form[name]} onChange={handleChange} {...rest} />
      )}
    </div>
  );
};

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({ page:1, totalPages:1, total:0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');
  
  // 👇 حالة الرفع والتحليل بالذكاء الاصطناعي
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async (page=1) => {
    setLoading(true);
    try {
      const { data } = await getMedicines({ page, limit:20 });
      setMedicines(data.data);
      setPagination(data.pagination);
    } catch { toast.error('فشل تحميل الأدوية'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    getSuppliers().then(r => setSuppliers(r.data)).catch(() => {});
  }, [load]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ...m, supplierId: m.supplierId || '' }); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) { await updateMedicine(editing.id, form); toast.success('تم التعديل بنجاح'); }
      else { await addMedicine(form); toast.success('تم الإضافة بنجاح'); }
      setShowModal(false);
      load(pagination.page);
    } catch(err) { toast.error(err.response?.data?.error || 'خطأ'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteMedicine(deleteId);
      toast.success('تم الحذف');
      setDeleteId(null);
      load(pagination.page);
    } catch(err) { toast.error(err.response?.data?.error || 'خطأ في الحذف'); }
  };

  // 👇 دالة معالجة الصورة وإرسالها للذكاء الاصطناعي
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
	if (files.length === 0) return;

	const formData = new FormData();

	files.forEach(file => {
 	 formData.append('medicineImages', file);
});
    setAnalyzing(true);
    const loadingToast = toast.loading('الذكاء الاصطناعي بيقرأ العلبة... 🤖');

    try {
      const { data } = await analyzeMedicineImage(formData);
      
      setForm(prev => ({
        ...prev,
        name: data.name || prev.name,
        barcode: data.barcode || prev.barcode,
        genericName: data.genericName || prev.genericName,
        manufacturer: data.manufacturer || prev.manufacturer,
        medicineForm: data.medicineForm || prev.medicineForm,
        expiryDate: data.expiryDate || prev.expiryDate,
        stripCount: data.stripCount || prev.stripCount,
        pillCount: data.pillCount || prev.pillCount,
      }));

      toast.success('تم استخراج البيانات بنجاح! راجعها وضيف السعر والكمية.', { id: loadingToast });
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل تحليل الصورة، حاول بصورة أوضح', { id: loadingToast });
    } finally {
      setAnalyzing(false);
      e.target.value = ''; // تصفير الـ input
    }
  };

  const filtered = medicines.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.barcode?.includes(search)
  );

  const expiryStatus = (date) => {
    const diff = Math.ceil((new Date(date) - new Date()) / (1000*60*60*24));
    if (diff < 0) return { label:'منتهي', cls:'badge-danger' };
    if (diff <= 30) return { label:'ينتهي قريباً', cls:'badge-warning' };
    return { label:'صالح', cls:'badge-success' };
  };

  return (
    <div className="animate-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800' }}>💊 الأدوية</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'14px', marginTop:'2px' }}>إدارة مخزون الأدوية</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16}/>إضافة دواء</button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-box" style={{ flex:1, maxWidth:'340px' }}>
            <Search className="search-icon" size={16} />
            <input className="form-control" placeholder="بحث بالاسم أو الباركود..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingRight:'42px' }} />
          </div>
          <span style={{ color:'var(--text-muted)', fontSize:'13px' }}>الإجمالي: {pagination.total} دواء</span>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding:'40px', display:'flex', flexDirection:'column', gap:'12px' }}>
              {[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{height:'44px',borderRadius:'6px'}}/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><Package size={48}/><h3>لا توجد أدوية</h3><p>أضف أول دواء من الزر أعلاه</p></div>
          ) : (
            <table>
              <thead><tr>
                <th>الاسم</th><th>الباركود</th><th>الكمية</th>
                <th>سعر البيع</th><th>تاريخ الانتهاء</th><th>الحالة</th><th>الإجراءات</th>
              </tr></thead>
              <tbody>
                {filtered.map(m => {
                  const status = expiryStatus(m.expiryDate);
                  return (
                    <tr key={m.id}>
                      <td><span style={{fontWeight:'600'}}>{m.name}</span>{m.genericName&&<div style={{fontSize:'11px',color:'var(--text-muted)'}}>{m.genericName}</div>}</td>
                      <td><code style={{fontSize:'12px',background:'var(--bg)',padding:'2px 6px',borderRadius:'4px'}}>{m.barcode}</code></td>
                      <td>
                        <span style={{fontWeight:'700',color:m.quantity<=10?'var(--danger)':m.quantity<=20?'var(--warning)':'inherit'}}>
                          {m.quantity}
                        </span>
                      </td>
                      <td style={{fontWeight:'600',color:'var(--primary)'}}>{Number(m.sellingPrice).toFixed(2)} ج</td>
                      <td>{new Date(m.expiryDate).toLocaleDateString('ar-EG')}</td>
                      <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                      <td>
                        <div style={{display:'flex',gap:'6px'}}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>openEdit(m)} title="تعديل"><Edit2 size={15}/></button>
                          <button className="btn btn-ghost btn-icon btn-sm" style={{color:'var(--danger)'}} onClick={()=>setDeleteId(m.id)} title="حذف"><Trash2 size={15}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {pagination.totalPages > 1 && (
          <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)' }}>
            <div className="pagination">
              <button className="page-btn" disabled={pagination.page===1} onClick={()=>load(pagination.page-1)}>السابق</button>
              {[...Array(pagination.totalPages)].map((_,i)=>(
                <button key={i} className={`page-btn${pagination.page===i+1?' active':''}`} onClick={()=>load(i+1)}>{i+1}</button>
              ))}
              <button className="page-btn" disabled={pagination.page===pagination.totalPages} onClick={()=>load(pagination.page+1)}>التالي</button>
            </div>
          </div>
        )}
      </div>

      {showModal && createPortal(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal" style={{maxWidth:'680px'}}>
            <div className="modal-header">
              <span className="modal-title">{editing?'تعديل دواء':'إضافة دواء جديد'}</span>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              
              {/* 👇 منطقة الرفع بالذكاء الاصطناعي (بتظهر في الإضافة والتعديل) */}
              <div style={{ marginBottom: '24px' }}>
                <label 
                  className={`drop-zone ${analyzing ? 'drag-over' : ''}`} 
                  style={{ display: 'block', position: 'relative' }}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    onChange={handleImageUpload}
		      multiple
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
                    disabled={analyzing}
                  />
                  {analyzing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <span className="spinner spinner-dark" style={{ width: '30px', height: '30px' }} />
                      <p style={{ color: 'var(--primary)', fontWeight: '600' }}>جاري استخراج البيانات...</p>
                    </div>
                  ) : (
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        ✨ تعبئة تلقائية بالذكاء الاصطناعي
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        اضغط هنا لالتقاط صورة للعلبة أو سحب ملف للصورة
                      </p>
                    </div>
                  )}
                </label>
              </div>
              <hr className="divider" style={{ margin: '0 0 20px 0' }} />

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px'}}>
                <F label="اسم الدواء *" name="name" placeholder="أدخل اسم الدواء" form={form} setForm={setForm} />
                <F label="الباركود *" name="barcode" placeholder="الباركود" form={form} setForm={setForm} />
                <F label="الاسم العلمي" name="genericName" placeholder="Generic Name" form={form} setForm={setForm} />
                <F label="الشكل الدوائي" name="medicineForm" placeholder="أقراص / كبسول / شراب..." form={form} setForm={setForm} />
                <F label="الشركة المصنعة" name="manufacturer" placeholder="اسم الشركة" form={form} setForm={setForm} />
                <F label="تاريخ الانتهاء *" name="expiryDate" type="date" form={form} setForm={setForm} />
                <F label="الكمية *" name="quantity" type="number" min="0" form={form} setForm={setForm} />
                <F label="سعر الشراء *" name="purchasePrice" type="number" min="0" step="0.01" form={form} setForm={setForm} />
                <F label="سعر البيع *" name="sellingPrice" type="number" min="0" step="0.01" form={form} setForm={setForm} />
                <F label="المورد" name="supplierId" type="select" form={form} setForm={setForm}>
                  <option value="">-- بدون مورد --</option>
                  {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </F>
                <F label="عدد الأقراص في الشريط" name="pillCount" type="number" min="0" form={form} setForm={setForm} />
                <F label="عدد الشرائط في العلبة" name="stripCount" type="number" min="0" form={form} setForm={setForm} />
              </div>
              <F label="يستلزم وصفة طبية" name="requiresPrescription" type="checkbox" checkLabel="نعم، يستلزم وصفة طبية" form={form} setForm={setForm} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setShowModal(false)}>إلغاء</button>
              <button className="btn btn-primary" disabled={saving || analyzing} onClick={handleSave}>
                {saving?<span className="spinner"/>:(editing?'حفظ التعديلات':'إضافة الدواء')}
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
            <div className="modal-body"><p style={{color:'var(--text-secondary)'}}>هل أنت متأكد من حذف هذا الدواء؟ لا يمكن التراجع عن هذه العملية.</p></div>
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