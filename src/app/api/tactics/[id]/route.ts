import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySessionToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tactic = await prisma.tactic.findUnique({
      where: { id: params.id },
      include: {
        phases: {
          orderBy: { phaseIndex: "asc" },
        },
        creator: {
          select: {
            id: true,
            username: true,
            nameEn: true,
            nameZh: true,
            role: true,
          },
        },
        comments: {
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
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!tactic) {
      return NextResponse.json({ error: "Tactic not found" }, { status: 404 });
    }

    const parsedTactic = {
      ...tactic,
      tags: tactic.tags ? JSON.parse(tactic.tags) : [],
      phases: tactic.phases.map((p) => ({
        ...p,
        tokens: p.tokensJson ? JSON.parse(p.tokensJson) : [],
        trajectories: p.trajectoriesJson ? JSON.parse(p.trajectoriesJson) : [],
      })),
    };

    return NextResponse.json({ tactic: parsedTactic });
  } catch (error) {
    console.error("GET /api/tactics/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch tactic" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifySessionToken(sessionToken);
    if (!session || (session.role !== "COACH" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Coach or Admin required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      titleEn,
      titleZh,
      scenario,
      courtFormat,
      tags,
      descriptionEn,
      descriptionZh,
      phases,
    } = body;

    // Delete existing phases and recreate with new state
    if (phases && Array.isArray(phases)) {
      await prisma.tacticPhase.deleteMany({
        where: { tacticId: params.id },
      });

      for (let idx = 0; idx < phases.length; idx++) {
        const p = phases[idx];
        await prisma.tacticPhase.create({
          data: {
            tacticId: params.id,
            phaseIndex: idx + 1,
            titleEn: p.titleEn || `Phase ${idx + 1}`,
            titleZh: p.titleZh || `阶段 ${idx + 1}`,
            notesEn: p.notesEn || "",
            notesZh: p.notesZh || "",
            tokensJson: JSON.stringify(p.tokens || []),
            trajectoriesJson: JSON.stringify(p.trajectories || []),
          },
        });
      }
    }

    const updated = await prisma.tactic.update({
      where: { id: params.id },
      data: {
        ...(titleEn && { titleEn }),
        ...(titleZh && { titleZh }),
        ...(scenario && { scenario }),
        ...(courtFormat && { courtFormat }),
        ...(tags && { tags: JSON.stringify(tags) }),
        ...(descriptionEn !== undefined && { descriptionEn }),
        ...(descriptionZh !== undefined && { descriptionZh }),
      },
      include: {
        phases: {
          orderBy: { phaseIndex: "asc" },
        },
      },
    });

    return NextResponse.json({ tactic: updated });
  } catch (error) {
    console.error("PUT /api/tactics/[id] error:", error);
    return NextResponse.json({ error: "Failed to update tactic" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifySessionToken(sessionToken);
    if (!session || (session.role !== "COACH" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Coach or Admin required" }, { status: 403 });
    }

    await prisma.tactic.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tactics/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete tactic" }, { status: 500 });
  }
}
