import LoginForm from "@/components/form/loginForm"

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2 text-balance">双Token认证系统</h1>
                    <p className="text-muted-foreground">使用Access Token + Refresh Token的安全登录方案</p>
                </div>
                <LoginForm />
            </div>
        </div>
    )
}
