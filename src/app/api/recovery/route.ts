import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySessionToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport")?.toUpperCase() || "FOOTBALL";
    const bodyPart = searchParams.get("bodyPart");
    const includePending = searchParams.get("includePending") === "true";

    let whereClause: any = { sport };

    if (!includePending) {
      whereClause.status = "APPROVED";
    }

    if (bodyPart) {
      whereClause.bodyPartKey = bodyPart;
    }

    const guides = await prisma.recoveryGuide.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            nameEn: true,
            nameZh: true,
            role: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            nameEn: true,
            nameZh: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ guides });
  } catch (error) {
    console.error("GET /api/recovery error:", error);
    return NextResponse.json({ error: "Failed to fetch recovery guides" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifySessionToken(sessionToken);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const body = await request.json();
    const {
      sport,
      bodyPartKey,
      modality,
      titleEn,
      titleZh,
      contentEn,
      contentZh,
      durationNotes,
      equipmentNotes,
      contraindications,
    } = body;

    if (!sport || !bodyPartKey || !modality || !titleZh || !contentZh) {
      return NextResponse.json({ error: "Missing required guide fields" }, { status: 400 });
    }

    // Auto-approve if coach or admin; require review if player
    const isPrivileged = session.role === "COACH" || session.role === "ADMIN";
    const status = isPrivileged ? "APPROVED" : "PENDING_REVIEW";

    const newGuide = await prisma.recoveryGuide.create({
      data: {
        sport: sport.toUpperCase(),
        bodyPartKey,
        modality,
        titleEn: titleEn || titleZh,
        titleZh,
        contentEn: contentEn || contentZh,
        contentZh,
        durationNotes: durationNotes || null,
        equipmentNotes: equipmentNotes || null,
        contraindications: contraindications || null,
        status,
        authorId: session.userId,
        ...(isPrivileged ? { reviewerId: session.userId, reviewedAt: new Date() } : {}),
      },
      include: {
        author: {
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

    return NextResponse.json({ guide: newGuide }, { status: 201 });
  } catch (error) {
    console.error("POST /api/recovery error:", error);
    return NextResponse.json({ error: "Failed to submit recovery guide" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifySessionToken(sessionToken);
    if (!session || (session.role !== "COACH" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Coach or Admin required to review UGC" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, rejectionReason } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing guide ID or status" }, { status: 400 });
    }

    const updated = await prisma.recoveryGuide.update({
      where: { id },
      data: {
        status,
        reviewerId: session.userId,
        reviewedAt: new Date(),
        rejectionReason: rejectionReason || null,
      },
    });

    return NextResponse.json({ guide: updated });
  } catch (error) {
    console.error("PATCH /api/recovery error:", error);
    return NextResponse.json({ error: "Failed to review guide" }, { status: 500 });
  }
}
