import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySessionToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifySessionToken(sessionToken);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment content cannot be empty" }, { status: 400 });
    }

    const comment = await prisma.tacticComment.create({
      data: {
        tacticId: params.id,
        userId: session.userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nameEn: true,
            nameZh: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tactics/[id]/comments error:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}
