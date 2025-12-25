import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("Authorization")

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ message: "未提供认证token" }, { status: 401 })
    }

    const token = authorization.substring(7)

    // TODO: 实际实现中，这里应该：
    // 1. 使用JWT库验证token签名
    // 2. 检查token是否过期
    // 3. 从token中解析用户信息
    // 4. 可选：检查token黑名单

    // 模拟验证（实际应使用jwt.verify）
    if (!token.startsWith("access_")) {
      return NextResponse.json({ message: "Token无效" }, { status: 401 })
    }

    // 从模拟token中解析邮箱
    const decoded = Buffer.from(token.split("_")[1], "base64").toString()
    const email = decoded.split(":")[0]

    return NextResponse.json({
      user: {
        email,
      },
    })
  } catch (error) {
    console.error("[v0] Verify error:", error)
    return NextResponse.json({ message: "Token验证失败" }, { status: 401 })
  }
}
