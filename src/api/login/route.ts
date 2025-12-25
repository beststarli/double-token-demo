import { type NextRequest, NextResponse } from "next/server"

// 这是一个演示接口，实际使用时需要连接真实的Express后端
// 或者替换为实际的数据库验证逻辑

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // TODO: 实际实现中，这里应该：
    // 1. 验证邮箱和密码格式
    // 2. 查询数据库验证用户凭据
    // 3. 使用bcrypt验证密码哈希
    // 4. 生成JWT格式的Access Token和Refresh Token

    // 演示用的简单验证
    if (!email || !password) {
      return NextResponse.json({ message: "邮箱和密码不能为空" }, { status: 400 })
    }

    // 模拟验证成功（实际应连接数据库）
    if (password.length < 6) {
      return NextResponse.json({ message: "邮箱或密码错误" }, { status: 401 })
    }

    // 生成模拟的tokens（实际应使用JWT库生成）
    const accessToken = generateMockToken("access", email)
    const refreshToken = generateMockToken("refresh", email)

    // 实际实现中，Refresh Token应该：
    // 1. 存储在数据库中，关联用户ID
    // 2. 设置过期时间
    // 3. 可以被撤销（黑名单机制）

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        email,
      },
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ message: "服务器错误" }, { status: 500 })
  }
}

// 模拟token生成函数（实际应使用jsonwebtoken库）
function generateMockToken(type: "access" | "refresh", email: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `${type}_${Buffer.from(`${email}:${timestamp}:${random}`).toString("base64")}`
}
