import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import './App.css'
import Login from "@/components/page/loginPage"
import Register from "@/components/page/registerPage"
import Dashboard from "@/components/page/dashboardPage"
import ForgotPassword from "@/components/page/forgetPage"

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
