import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()

    // TODO: 实际实现中，这里应该：
    // 1. 验证Refresh Token
    // 2. 将Refresh Token加入黑名单（存储在Redis或数据库）
    // 3. 可选：清理该用户的所有会话
    // 4. 记录登出日志

    if (refreshToken) {
      // 模拟将token加入黑名单
      console.log("[v0] Adding token to blacklist:", refreshToken.substring(0, 20))
    }

    return NextResponse.json({
      message: "登出成功",
    })
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ message: "登出失败" }, { status: 500 })
  }
}
