"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, Mail, CheckCircle2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            // 调用后端登录接口
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            })

            const data = await response.json()

            if (response.ok) {
                // 登录成功，保存tokens
                // Access Token 保存在内存或短期存储
                sessionStorage.setItem("accessToken", data.accessToken)
                // Refresh Token 可以保存在httpOnly cookie中（后端设置）
                // 或者安全存储在localStorage（仅作为demo演示）
                localStorage.setItem("refreshToken", data.refreshToken)

                setMessage({ type: "success", text: "登录成功！正在跳转..." })

                // 模拟跳转到受保护页面
                setTimeout(() => {
                    window.location.href = "/dashboard/dashboardPage"
                }, 1500)
            } else {
                setMessage({ type: "error", text: data.message || "登录失败，请检查您的凭据" })
            }
        } catch (error) {
            setMessage({ type: "error", text: "网络错误，请稍后重试" })
            console.error("Login error:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-border/50 shadow-2xl">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">登录账户</CardTitle>
                <CardDescription>输入您的邮箱和密码以访问系统</CardDescription>
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
                            type="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-input border-border/50 focus:border-accent transition-colors pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-2">
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" className="rounded border-border cursor-pointer" />
                            <span className="text-muted-foreground">记住我</span>
                        </label>
                        <a href="#" className="text-accent hover:underline">
                            忘记密码？
                        </a>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        disabled={loading}
                    >
                        {loading ? "登录中..." : "登录"}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        还没有账户？{" "}
                        <a href="#" className="text-accent hover:underline font-semibold">
                            立即注册
                        </a>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}
