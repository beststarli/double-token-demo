import RegisterForm from "@/components/form/registerForm"

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2 text-balance">创建新账户</h1>
                    <p className="text-muted-foreground">注册并开始使用双Token认证系统</p>
                </div>
                <RegisterForm />
            </div>
        </div>
    )
}
