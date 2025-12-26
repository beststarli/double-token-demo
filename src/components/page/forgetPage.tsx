import ForgotPasswordForm from "@/components/form/forgetForm"

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2 text-balance">重置密码</h1>
                    <p className="text-muted-foreground">输入您的邮箱地址，我们将发送重置链接</p>
                </div>
                <ForgotPasswordForm />
            </div>
        </div>
    )
}
