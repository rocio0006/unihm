import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { AdminPage } from './pages/AdminPage'
import { AvisosView } from './pages/AvisosView'
import { DelegateDashboard } from './pages/DelegateDashboard'
import { HomeView } from './pages/HomeView'
import { Login } from './pages/Login'
import { PastTasksView } from './pages/PastTasksView'
import { TaskDetailView } from './pages/TaskDetailView'
import { TasksView } from './pages/TasksView'

const TAB_PATHS = ['/', '/tareas', '/avisos', '/pasadas']

function StudentLayout() {
  const location = useLocation()
  const showNav = TAB_PATHS.includes(location.pathname)

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <div className="flex-1">
        <Outlet />
      </div>
      {showNav && <BottomNav />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StudentLayout />}>
          <Route path="/" element={<HomeView />} />
          <Route path="/tareas" element={<TasksView />} />
          <Route path="/tareas/:id" element={<TaskDetailView />} />
          <Route path="/avisos" element={<AvisosView />} />
          <Route path="/pasadas" element={<PastTasksView />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/panel" element={<DelegateDashboard />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
