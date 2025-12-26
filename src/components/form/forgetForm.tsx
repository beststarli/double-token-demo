import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [emailSent, setEmailSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            const response = await fetch("/api/auth/forgot", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (response.ok) {
                setMessage({
                    type: "success",
                    text: "密码重置链接已发送到您的邮箱，请查收",
                })
                setEmailSent(true)
            } else {
                setMessage({ type: "error", text: data.message || "发送失败，请重试" })
            }
        } catch (error) {
            setMessage({ type: "error", text: "网络错误，请稍后重试" })
            console.error("Forgot Password error:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-border/50 shadow-2xl">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">忘记密码</CardTitle>
                <CardDescription>我们将向您的邮箱发送密码重置链接</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {message && (
                        <Alert variant={message.type === "error" ? "destructive" : "default"} className="border-2">
                            {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    )}

                    {!emailSent && (
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
                            <p className="text-xs text-muted-foreground mb-2">请输入您注册时使用的邮箱地址</p>
                        </div>
                    )}

                    {emailSent && (
                        <div className="bg-muted/50 border border-border/50 rounded-lg p-4 space-y-2">
                            <p className="text-sm text-foreground">重置链接已发送至：</p>
                            <p className="text-sm font-semibold text-accent">{email}</p>
                            <p className="text-xs text-muted-foreground">
                                请检查您的邮箱（包括垃圾邮件文件夹）。链接将在1小时后失效。
                            </p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col space-y-2">
                    {!emailSent ? (
                        <>
                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
                                disabled={loading}
                            >
                                {loading ? "发送中..." : "发送重置链接"}
                            </Button>

                            <Link
                                to="/"
                                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                返回登录
                            </Link>
                        </>
                    ) : (
                        <>
                            <Button
                                type="button"
                                onClick={() => {
                                    setEmailSent(false)
                                    setMessage(null)
                                }}
                                variant="outline"
                                className="w-full"
                            >
                                重新发送
                            </Button>

                            <Link
                                to="/"
                                className="flex items-center justify-center gap-2 text-sm text-accent hover:underline font-semibold"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                返回登录
                            </Link>
                        </>
                    )}
                </CardFooter>
            </form>
        </Card>
    )
}
