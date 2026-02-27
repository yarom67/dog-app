import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DogProfile from './pages/DogProfile'
import HealthHub from './pages/HealthHub'
import Medications from './pages/Medications'
import Vaccinations from './pages/Vaccinations'
import WeightLog from './pages/WeightLog'
import VetVisits from './pages/VetVisits'
import FoodLog from './pages/FoodLog'
import TherapySessions from './pages/TherapySessions'
import Settings from './pages/Settings'

// Pages with bottom nav
const WithNav = ({ children }) => <Layout>{children}</Layout>

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WithNav><Dashboard /></WithNav>} />
        <Route path="/dog-profile" element={<DogProfile />} />
        <Route path="/health" element={<WithNav><HealthHub /></WithNav>} />
        <Route path="/medications" element={<WithNav><Medications /></WithNav>} />
        <Route path="/vaccinations" element={<WithNav><Vaccinations /></WithNav>} />
        <Route path="/weight" element={<WeightLog />} />
        <Route path="/vet-visits" element={<VetVisits />} />
        <Route path="/food" element={<FoodLog />} />
        <Route path="/therapy" element={<TherapySessions />} />
        <Route path="/settings" element={<WithNav><Settings /></WithNav>} />
      </Routes>
    </BrowserRouter>
  )
}
