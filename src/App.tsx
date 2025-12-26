import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Login from "@/components/page/loginPage"
import Register from "@/components/page/registerPage"
import ForgotPassword from "@/components/page/forgetPage"
import Dashboard from "@/components/page/dashboardPage"
import './App.css'

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Login />} />
				<Route path="/register" element={<Register />} />
				<Route path="/forgot-password" element={<ForgotPassword />} />
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</Router>
	)
}

export default App
