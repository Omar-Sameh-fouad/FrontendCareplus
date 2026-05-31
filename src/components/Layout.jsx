import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  LayoutDashboard, Pill, Users, Truck, ShoppingCart,
  ClipboardList, Bell, Settings, LogOut, Shield, FileText
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'الرئيسية', roles: ['admin', 'pharmacist', 'cashier'] },
  { to: '/medicines', icon: Pill, label: 'الأدوية', roles: ['admin', 'pharmacist'] },
  { to: '/sales', icon: ShoppingCart, label: 'المبيعات', roles: ['admin', 'pharmacist', 'cashier'] },
  { to: '/suppliers', icon: Truck, label: 'الموردين', roles: ['admin', 'pharmacist'] },
  { to: '/users', icon: Users, label: 'الموظفون', roles: ['admin'] },
  { to: '/attendance', icon: ClipboardList, label: 'الحضور والانصراف', roles: ['admin', 'pharmacist', 'cashier'] },
  { to: '/reports', icon: FileText, label: 'التقارير', roles: ['admin', 'pharmacist'] },
  { to: '/logs', icon: Shield, label: 'سجل الأحداث', roles: ['admin'] },
  { to: '/notifications', icon: Bell, label: 'التنبيهات', roles: ['admin', 'pharmacist'] },
  { to: '/settings', icon: Settings, label: 'الإعدادات', roles: ['admin'] },
];

export default function Layout({ children }) {
  const { user, logoutUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  const allowed = navItems.filter(item => item.roles.includes(user?.role));

  const roleLabel = { admin: 'مدير', pharmacist: 'صيدلي', cashier: 'كاشير' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-width)',
        background: 'var(--bg-sidebar)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, right: 0, bottom: 0,
        zIndex: 100, overflowY: 'auto',
        borderLeft: '1px solid rgba(255,255,255,0.06)'
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #f0a500, #ffc82e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', flexShrink: 0
            }}>💊</div>
            <div>
              <div style={{ color: 'white', fontSize: '16px', fontWeight: '800', letterSpacing: '-0.3px' }}>CarePlus</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Pharmacy System</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {allowed.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', borderRadius: '10px',
                textDecoration: 'none', marginBottom: '4px',
                fontSize: '14px', fontWeight: '500',
                transition: 'all 0.15s ease',
                background: isActive ? 'rgba(13,110,94,0.8)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '15px', fontWeight: '700', flexShrink: 0
            }}>
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || '؟'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.fullName || user?.username}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{roleLabel[user?.role]}</div>
            </div>
          </div>
          <button
            onClick={() => { logoutUser(); navigate('/login'); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 12px', borderRadius: '8px', border: 'none',
              background: 'rgba(229,62,62,0.15)', color: '#fc8181',
              cursor: 'pointer', fontSize: '13px', fontWeight: '600',
              fontFamily: 'Cairo, sans-serif', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,62,62,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(229,62,62,0.15)'}
          >
            <LogOut size={15} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{
        flex: 1, marginRight: 'var(--sidebar-width)',
        minHeight: '100vh'
      }}>
        <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', overflowX: 'hidden' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
