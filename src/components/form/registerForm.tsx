import { useState } from "react"
import type React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, Mail, CheckCircle2, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"

export default function RegisterForm() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        if (formData.password !== formData.confirmPassword) {
            setMessage({ type: "error", text: "两次输入的密码不一致" })
            setLoading(false)
            return
        }

        if (formData.password.length < 8) {
            setMessage({ type: "error", text: "密码长度至少为8个字符" })
            setLoading(false)
            return
        }

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setMessage({ type: "success", text: "注册成功！正在跳转到登录页面..." })
                setTimeout(() => {
                    navigate("/")
                }, 1000)
            } else {
                setMessage({ type: "error", text: data.message || "注册失败，请重试" })
            }
        } catch (error) {
            setMessage({ type: "error", text: "网络错误，请稍后重试" })
            console.error("Register error:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    return (
        <Card className="border-border/50 shadow-2xl">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">注册账户</CardTitle>
                <CardDescription>填写以下信息创建您的账户</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {message && (
                        <Alert variant={message.type === "error" ? "destructive" : "default"} className="border-2">
                            {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            邮箱地址
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="bg-input border-border/50 focus:border-accent transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            密码
                        </Label>
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="至少8个字符"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="bg-input border-border/50 focus:border-accent transition-colors pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            确认密码
                        </Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="再次输入密码"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="bg-input border-border/50 focus:border-accent transition-colors pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="text-xs text-muted-foreground mb-2">
                        <span>注册即表示您同意我们的</span>
                        <a href="" className="text-accent hover:underline">服务条款</a>
                        <span>和</span>
                        <a href="" className="text-accent hover:underline">隐私政策</a>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
                        disabled={loading}
                    >
                        {loading ? "注册中..." : "注册账户"}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        已有账户？{" "}
                        <Link to="/" className="text-accent hover:underline font-semibold">
                            立即登录
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
