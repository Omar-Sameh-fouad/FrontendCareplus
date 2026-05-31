import { useEffect, useState } from 'react';
import { getTodayReport, getNotifications } from '../api';
import { TrendingUp, ShoppingCart, Bell, AlertTriangle, Package, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getHistoricalReport } from '../api';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [today, setToday] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, n, h] = await Promise.all([
          getTodayReport(), getNotifications(), getHistoricalReport('week')
        ]);
        setToday(t.data);
        setAlerts(n.data);
        setHistory(h.data.history || []);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  const urgentCount = alerts.filter(a => a.urgent).length;

  if (loading) return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'20px' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height:'110px', borderRadius:'var(--radius)' }} />
      ))}
    </div>
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 18) return 'مساء الخير';
    return 'مساء النور';
  };

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
          {greeting()}، {user?.fullName || user?.username} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
          {new Date().toLocaleDateString('ar-EG', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {/* Alerts banner */}
      {urgentCount > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fffaf0, #fef8e7)',
          border: '1px solid #f6d860', borderRadius: 'var(--radius)',
          padding: '14px 20px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <AlertTriangle size={20} color="#dd6b20" />
          <span style={{ fontWeight: '600', color: '#744210' }}>
            يوجد {urgentCount} تنبيه عاجل يحتاج إلى انتباهك
          </span>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#c6f6d5' }}>
            <DollarSign size={22} color="#276749" />
          </div>
          <div className="stat-info">
            <div className="stat-label">إجمالي اليوم</div>
            <div className="stat-value">{Number(today?.grandTotal || 0).toFixed(0)} ج</div>
            <div className="stat-sub">{today?.salesCount || 0} فاتورة</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#bee3f8' }}>
            <ShoppingCart size={22} color="#2c5282" />
          </div>
          <div className="stat-info">
            <div className="stat-label">مبيعات نقدي</div>
            <div className="stat-value">{Number(today?.totals?.cash || 0).toFixed(0)} ج</div>
            <div className="stat-sub">كاش</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e9d8fd' }}>
            <TrendingUp size={22} color="#553c9a" />
          </div>
          <div className="stat-info">
            <div className="stat-label">كارت / محفظة</div>
            <div className="stat-value">{Number((today?.totals?.card || 0) + (today?.totals?.wallet || 0)).toFixed(0)} ج</div>
            <div className="stat-sub">إلكتروني</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: urgentCount > 0 ? '#fed7d7' : '#fefcbf' }}>
            <Bell size={22} color={urgentCount > 0 ? '#c53030' : '#744210'} />
          </div>
          <div className="stat-info">
            <div className="stat-label">التنبيهات</div>
            <div className="stat-value">{alerts.length}</div>
            <div className="stat-sub">{urgentCount} عاجل</div>
          </div>
        </div>
      </div>

      {/* Chart + Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        {/* Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 المبيعات (آخر أسبوع)</span>
          </div>
          <div className="card-body">
            {history.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <Package size={40} />
                <p>لا توجد بيانات للأسبوع الماضي</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={history} margin={{ top:0, right:0, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f3" />
                  <XAxis dataKey="date" tick={{ fontSize:12, fontFamily:'Cairo' }}
                    tickFormatter={d => new Date(d).toLocaleDateString('ar-EG', { weekday:'short' })} />
                  <YAxis tick={{ fontSize:12, fontFamily:'Cairo' }} />
                  <Tooltip
                    formatter={(v) => [`${v.toFixed(0)} ج`, 'المبيعات']}
                    contentStyle={{ fontFamily:'Cairo', borderRadius:'8px', border:'1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="total" fill="var(--primary)" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="card" style={{ maxHeight:'380px', overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <div className="card-header">
            <span className="card-title">🔔 آخر التنبيهات</span>
            {alerts.length > 0 && <span className="badge badge-danger">{alerts.length}</span>}
          </div>
          <div style={{ overflowY:'auto', flex:1 }}>
            {alerts.length === 0 ? (
              <div className="empty-state" style={{ padding:'30px 20px' }}>
                <Bell size={32} />
                <p>لا توجد تنبيهات</p>
              </div>
            ) : alerts.slice(0,8).map(alert => (
              <div key={alert.id} style={{
                display:'flex', alignItems:'flex-start', gap:'10px',
                padding:'12px 16px', borderBottom:'1px solid var(--border)'
              }}>
                <div style={{
                  width:'8px', height:'8px', borderRadius:'50%', marginTop:'6px', flexShrink:0,
                  background: alert.urgent ? 'var(--danger)' : 'var(--warning)'
                }} />
                <div>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'var(--text-primary)' }}>{alert.title}</div>
                  <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'2px' }}>{alert.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
