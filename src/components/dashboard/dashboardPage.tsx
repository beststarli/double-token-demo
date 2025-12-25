"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, RefreshCw, LogOut, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
    const [user, setUser] = useState<{ email: string } | null>(null)
    const [tokenInfo, setTokenInfo] = useState<{ accessToken: string; refreshToken: string } | null>(null)

    useEffect(() => {
        // 检查是否已登录
        const accessToken = sessionStorage.getItem("accessToken")
        const refreshToken = localStorage.getItem("refreshToken")

        if (!accessToken || !refreshToken) {
            window.location.href = "/"
            return
        }

        setTokenInfo({ accessToken, refreshToken })

        // 验证token并获取用户信息
        verifyToken(accessToken)
    }, [])

    const verifyToken = async (token: string) => {
        try {
            const response = await fetch("/api/auth/verify", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setUser(data.user)
            } else if (response.status === 401) {
                // Access token过期，尝试刷新
                await refreshAccessToken()
            }
        } catch (error) {
            console.error("[v0] Token verification failed:", error)
        }
    }

    const refreshAccessToken = async () => {
        const refreshToken = localStorage.getItem("refreshToken")

        try {
            const response = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
            })

            if (response.ok) {
                const data = await response.json()
                sessionStorage.setItem("accessToken", data.accessToken)
                setTokenInfo((prev) => (prev ? { ...prev, accessToken: data.accessToken } : null))
                // 重新验证新token
                await verifyToken(data.accessToken)
            } else {
                // Refresh token也过期，需要重新登录
                handleLogout()
            }
        } catch (error) {
            console.error("[v0] Token refresh failed:", error)
        }
    }

    const handleLogout = () => {
        sessionStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        window.location.href = "/"
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">控制面板</h1>
                    <Button onClick={handleLogout} variant="outline" size="sm">
                        <LogOut className="h-4 w-4 mr-2" />
                        退出登录
                    </Button>
                </div>

                <Alert className="border-accent/50 bg-accent/10">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <AlertDescription className="text-accent-foreground">您已成功通过双Token认证系统登录</AlertDescription>
                </Alert>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                用户信息
                            </CardTitle>
                            <CardDescription>当前登录的账户信息</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <span className="text-muted-foreground">邮箱：</span>
                                    <span className="font-mono">{user.email}</span>
                                </p>
                                <p className="text-sm">
                                    <span className="text-muted-foreground">登录状态：</span>
                                    <span className="text-accent font-semibold">已认证</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="h-5 w-5" />
                                Token状态
                            </CardTitle>
                            <CardDescription>双Token认证机制</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold mb-1">Access Token</p>
                                <p className="text-xs text-muted-foreground font-mono break-all bg-muted p-2 rounded">
                                    {tokenInfo?.accessToken.substring(0, 40)}...
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">有效期: 15分钟</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold mb-1">Refresh Token</p>
                                <p className="text-xs text-muted-foreground font-mono break-all bg-muted p-2 rounded">
                                    {tokenInfo?.refreshToken.substring(0, 40)}...
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">有效期: 7天</p>
                            </div>
                            <Button onClick={refreshAccessToken} variant="outline" size="sm" className="w-full bg-transparent">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                手动刷新Token
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>双Token认证流程说明</CardTitle>
                        <CardDescription>了解系统的安全机制</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">1. 登录阶段</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                用户提交邮箱和密码后，后端验证成功后返回两个Token：Access Token（短期有效）和 Refresh Token（长期有效）
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">2. API请求</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                前端使用Access Token进行API请求，在请求头中携带 Authorization: Bearer {"<access_token>"}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">3. Token刷新</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                当Access Token过期时（15分钟），使用Refresh Token请求新的Access Token，无需重新登录
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm">4. 安全退出</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                退出登录时，清除本地所有Token，并可选择通知后端将Refresh Token加入黑名单
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
