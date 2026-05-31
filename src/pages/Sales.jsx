import { useState, useRef } from 'react';
import { searchMedicine, createSale, getSales } from '../api';
import toast from 'react-hot-toast';
import { Search, Plus, Trash2, ShoppingCart, History, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function Sales() {
  const [tab, setTab] = useState('pos');
  return (
    <div className="animate-in">
      <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'800' }}>🛒 المبيعات</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'14px', marginTop:'2px' }}>نقطة البيع وسجل المعاملات</p>
        </div>
        <div style={{ display:'flex', background:'var(--bg)', borderRadius:'10px', padding:'4px', marginRight:'auto' }}>
          {[{k:'pos',l:'نقطة البيع'},{k:'history',l:'السجل'}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} style={{
              padding:'8px 20px', borderRadius:'8px', border:'none', cursor:'pointer',
              fontFamily:'Cairo,sans-serif', fontWeight:'600', fontSize:'13px',
              background: tab===t.k ? 'white' : 'transparent',
              color: tab===t.k ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: tab===t.k ? 'var(--shadow-sm)' : 'none',
              transition:'all 0.2s'
            }}>{t.l}</button>
          ))}
        </div>
      </div>
      {tab === 'pos' ? <POS /> : <SaleHistory />}
    </div>
  );
}

function POS() {
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [interactionWarning, setInteractionWarning] = useState(null);
  const [pendingSaleData, setPendingSaleData] = useState(null);
  const inputRef = useRef(null);

  const searchAndAdd = async () => {
    if (!barcode.trim()) return;
    try {
      const { data } = await searchMedicine(barcode.trim());
      const existing = cart.find(i => i.medicineId === data.id);
      if (existing) {
        setCart(cart.map(i => i.medicineId===data.id ? {...i, qty:i.qty+1} : i));
      } else {
        setCart([...cart, {
          medicineId: data.id, name: data.name,
          genericName: data.genericName, sellingPrice: data.sellingPrice,
          qty: 1, quantityType: 'box', stripCount: data.stripCount, pillCount: data.pillCount,
          availableQty: data.quantity
        }]);
      }
      setBarcode('');
      inputRef.current?.focus();
    } catch(err) {
      toast.error(err.response?.data?.error || 'الدواء غير موجود');
    }
  };

  const updateQty = (id, qty) => {
    if (qty <= 0) { setCart(cart.filter(i=>i.medicineId!==id)); return; }
    setCart(cart.map(i => i.medicineId===id ? {...i, qty} : i));
  };

  const updateType = (id, quantityType) => setCart(cart.map(i=>i.medicineId===id?{...i,quantityType}:i));

  const total = cart.reduce((sum, i) => {
    let qty = i.qty;
    if (i.quantityType === 'strip') qty = i.stripCount ? i.qty/i.stripCount : i.qty;
    if (i.quantityType === 'pill') qty = i.pillCount ? i.qty/i.pillCount : i.qty;
    return sum + (i.sellingPrice * qty);
  }, 0);

  const checkout = async (force=false) => {
    if (cart.length === 0) { toast.error('السلة فارغة'); return; }
    setLoading(true);
    try {
      const saleData = {
        paymentMethod,
        items: cart.map(i=>({ medicineId:i.medicineId, qty:i.qty, quantityType:i.quantityType, stripCount:i.stripCount, pillCount:i.pillCount })),
        forceInteraction: force
      };
      const { data } = await createSale(saleData);
      toast.success(`✅ تم البيع! الإجمالي: ${data.total?.toFixed(2)} ج`);
      setCart([]);
      setInteractionWarning(null);
      setPendingSaleData(null);
    } catch(err) {
      if (err.response?.status === 409) {
        setInteractionWarning(err.response.data);
        setPendingSaleData({ paymentMethod, items: cart });
      } else {
        toast.error(err.response?.data?.error || 'فشل البيع');
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'20px', alignItems:'start' }}>
      {/* Left: Cart */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🛍️ السلة</span>
          {cart.length > 0 && <button className="btn btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={()=>setCart([])}>مسح الكل</button>}
        </div>
        <div style={{ padding:'16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', gap:'10px' }}>
            <div className="search-box" style={{ flex:1 }}>
              <Search className="search-icon" size={16}/>
              <input
                ref={inputRef}
                className="form-control"
                placeholder="أدخل الباركود أو امسحه..."
                value={barcode}
                onChange={e=>setBarcode(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&searchAndAdd()}
                style={{ paddingRight:'42px' }}
                autoFocus
              />
            </div>
            <button className="btn btn-primary" onClick={searchAndAdd}><Plus size={16}/>إضافة</button>
          </div>
        </div>

        {cart.length === 0 ? (
          <div className="empty-state" style={{padding:'50px 20px'}}>
            <ShoppingCart size={48}/>
            <h3>السلة فارغة</h3>
            <p>ابحث عن دواء بالباركود لإضافته</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>الدواء</th><th>النوع</th><th>الكمية</th><th>السعر</th><th></th></tr></thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.medicineId}>
                    <td>
                      <div style={{fontWeight:'600',fontSize:'14px'}}>{item.name}</div>
                      {item.genericName && <div style={{fontSize:'11px',color:'var(--text-muted)'}}>{item.genericName}</div>}
                    </td>
                    <td>
                      <select className="form-control" style={{padding:'5px 8px',fontSize:'12px',width:'100px'}}
                        value={item.quantityType} onChange={e=>updateType(item.medicineId,e.target.value)}>
                        <option value="box">علبة</option>
                        {item.stripCount>0&&<option value="strip">شريط</option>}
                        {item.pillCount>0&&<option value="pill">قرص</option>}
                      </select>
                    </td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                        <button className="btn btn-ghost btn-icon" style={{width:'26px',height:'26px',padding:0,fontSize:'16px'}} onClick={()=>updateQty(item.medicineId,item.qty-1)}>−</button>
                        <span style={{fontWeight:'700',minWidth:'24px',textAlign:'center'}}>{item.qty}</span>
                        <button className="btn btn-ghost btn-icon" style={{width:'26px',height:'26px',padding:0,fontSize:'16px'}} onClick={()=>updateQty(item.medicineId,item.qty+1)}>+</button>
                      </div>
                    </td>
                    <td style={{fontWeight:'600',color:'var(--primary)'}}>{(item.sellingPrice*(item.quantityType==='strip'&&item.stripCount?item.qty/item.stripCount:item.quantityType==='pill'&&item.pillCount?item.qty/item.pillCount:item.qty)).toFixed(2)} ج</td>
                    <td><button className="btn btn-ghost btn-icon" style={{color:'var(--danger)'}} onClick={()=>setCart(cart.filter(i=>i.medicineId!==item.medicineId))}><Trash2 size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right: Checkout */}
      <div style={{display:'flex',flexDirection:'column',gap:'16px',position:'sticky',top:'28px'}}>
        <div className="card">
          <div className="card-header"><span className="card-title">💳 إتمام الدفع</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">طريقة الدفع</label>
              <select className="form-control" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
                <option value="cash">نقدي</option>
                <option value="card">كارت</option>
                <option value="wallet">محفظة إلكترونية</option>
                <option value="insurance">تأمين</option>
              </select>
            </div>
            <div style={{
              background:'var(--bg)', borderRadius:'var(--radius-sm)',
              padding:'16px', marginBottom:'16px'
            }}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'var(--text-muted)',marginBottom:'8px'}}>
                <span>عدد الأصناف</span><span>{cart.length}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'18px',fontWeight:'800',color:'var(--primary)'}}>
                <span>الإجمالي</span><span>{total.toFixed(2)} ج</span>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" style={{width:'100%',justifyContent:'center'}}
              disabled={loading||cart.length===0} onClick={()=>checkout(false)}>
              {loading?<span className="spinner"/>:<><ShoppingCart size={18}/>تأكيد البيع</>}
            </button>
          </div>
        </div>
      </div>

      {/* Interaction Warning Modal */}
      {interactionWarning && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:'480px'}}>
            <div className="modal-header">
              <span className="modal-title" style={{color:'var(--warning)',display:'flex',alignItems:'center',gap:'8px'}}>
                <AlertTriangle size={20}/>تحذير: تعارض دوائي
              </span>
            </div>
            <div className="modal-body">
              {interactionWarning.interactions?.map((i,idx)=>(
                <div key={idx} style={{background:'#fffaf0',border:'1px solid #f6d860',borderRadius:'8px',padding:'12px',marginBottom:'10px'}}>
                  <div style={{fontWeight:'600',color:'#744210'}}>{i.severity === 'high' ? '🔴 خطر عالي' : '🟡 تحذير'}</div>
                  <div style={{fontSize:'13px',marginTop:'4px',color:'var(--text-secondary)'}}>{i.description}</div>
                </div>
              ))}
              <p style={{fontSize:'13px',color:'var(--text-muted)',marginTop:'10px'}}>{interactionWarning.message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>{setInteractionWarning(null);setPendingSaleData(null);}}>إلغاء البيع</button>
              <button className="btn btn-danger" onClick={()=>checkout(true)}>المتابعة رغم التحذير</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SaleHistory() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [date, setDate] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async (p=1) => {
    setLoading(true);
    try {
      const params = { page:p, limit:20 };
      if (date) params.date = date;
      const { data } = await getSales(params);
      setSales(data.data);
      setPagination(data.pagination);
      setPage(p);
    } catch { toast.error('خطأ في تحميل السجل'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const payLabel = { cash:'نقدي', card:'كارت', wallet:'محفظة', insurance:'تأمين' };
  const payColor = { cash:'badge-success', card:'badge-info', wallet:'badge-warning', insurance:'badge-gray' };

  return (
    <div className="card animate-in">
      <div className="card-header" style={{flexWrap:'wrap',gap:'10px'}}>
        <span className="card-title">سجل المبيعات</span>
        <div style={{display:'flex',gap:'10px',marginRight:'auto',flexWrap:'wrap'}}>
          <input type="date" className="form-control" style={{width:'180px'}} value={date} onChange={e=>setDate(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={()=>load(1)}><Search size={14}/>بحث</button>
          {date && <button className="btn btn-ghost btn-sm" onClick={()=>{setDate('');load(1);}}>إلغاء الفلتر</button>}
        </div>
      </div>
      <div className="table-wrapper">
        {loading ? (
          <div style={{padding:'40px',display:'flex',flexDirection:'column',gap:'12px'}}>
            {[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{height:'44px',borderRadius:'6px'}}/>)}
          </div>
        ) : sales.length === 0 ? (
          <div className="empty-state"><History size={48}/><h3>لا توجد مبيعات</h3></div>
        ) : (
          <table>
            <thead><tr><th>رقم الفاتورة</th><th>الإجمالي</th><th>الربح</th><th>طريقة الدفع</th><th>الكاشير</th><th>التاريخ</th></tr></thead>
            <tbody>
              {sales.map(s=>(
                <tr key={s.id} style={{cursor:'pointer'}} onClick={()=>setSelected(s)}>
                  <td><code style={{fontSize:'11px',background:'var(--bg)',padding:'2px 6px',borderRadius:'4px'}}>{s.id.slice(0,8)}...</code></td>
                  <td style={{fontWeight:'700',color:'var(--primary)'}}>{Number(s.total).toFixed(2)} ج</td>
                  <td style={{color:'var(--success)',fontWeight:'600'}}>{Number(s.profit).toFixed(2)} ج</td>
                  <td><span className={`badge ${payColor[s.paymentMethod]||'badge-gray'}`}>{payLabel[s.paymentMethod]||s.paymentMethod}</span></td>
                  <td>{s.cashierName}</td>
                  <td style={{fontSize:'12px',color:'var(--text-muted)'}}>{new Date(s.ts).toLocaleString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {pagination.totalPages > 1 && (
        <div style={{padding:'16px 24px',borderTop:'1px solid var(--border)'}}>
          <div className="pagination">
            <button className="page-btn" disabled={page===1} onClick={()=>load(page-1)}>السابق</button>
            <span style={{fontSize:'13px',color:'var(--text-muted)'}}>صفحة {page} من {pagination.totalPages}</span>
            <button className="page-btn" disabled={page===pagination.totalPages} onClick={()=>load(page+1)}>التالي</button>
          </div>
        </div>
      )}
    </div>
  );
}
