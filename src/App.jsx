import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MascotBackground from './components/MascotBackground'
import Login from './auth/Login'
import Signup from './auth/Signup'
import RequireRole from './auth/RequireRole'

import Menu from './worker/Menu'
import Cart from './worker/Cart'
import OrderStatus from './worker/OrderStatus'
import OrderHistory from './worker/OrderHistory'

import OrderQueue from './cook/OrderQueue'
import StockManager from './cook/StockManager'
import Announcements from './cook/Announcements'

import DailyIncome from './admin/DailyIncome'
import StockTracking from './admin/StockTracking'
import Receipts from './admin/Receipts'
import MenuMaster from './admin/MenuMaster'
import ManageStaff from './admin/ManageStaff'

export default function App() {
  return (
    <BrowserRouter>
      <MascotBackground />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Worker routes */}
        <Route path="/menu" element={<RequireRole role="worker"><Menu /></RequireRole>} />
        <Route path="/cart" element={<RequireRole role="worker"><Cart /></RequireRole>} />
        <Route path="/orders" element={<RequireRole role="worker"><OrderHistory /></RequireRole>} />
        <Route
          path="/order-status/:orderId"
          element={<RequireRole role={['worker', 'cook', 'admin']}><OrderStatus /></RequireRole>}
        />

        {/* Cook routes (tablet at the counter) */}
        <Route path="/cook" element={<RequireRole role={['cook', 'admin']}><OrderQueue /></RequireRole>} />
        <Route path="/cook/stock" element={<RequireRole role={['cook', 'admin']}><StockManager /></RequireRole>} />
        <Route path="/cook/announcements" element={<RequireRole role={['cook', 'admin']}><Announcements /></RequireRole>} />

        {/* Admin routes */}
        <Route path="/admin" element={<RequireRole role="admin"><DailyIncome /></RequireRole>} />
        <Route path="/admin/stock" element={<RequireRole role="admin"><StockTracking /></RequireRole>} />
        <Route path="/admin/receipts" element={<RequireRole role="admin"><Receipts /></RequireRole>} />
        <Route path="/admin/menu-master" element={<RequireRole role="admin"><MenuMaster /></RequireRole>} />
        <Route path="/admin/staff" element={<RequireRole role="admin"><ManageStaff /></RequireRole>} />
      </Routes>
    </BrowserRouter>
  )
}
