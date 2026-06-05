import { Toaster } from 'react-hot-toast';
import AdminSidebar from './AdminSidebar';
import AdminGuard from './AdminGuard';

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}>
        <AdminSidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '30px', position: 'relative', marginLeft: 'var(--sidebar-width)' }}>
          {children}
        </main>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '0.875rem',
            },
          }}
        />
      </div>
    </AdminGuard>
  );
}
