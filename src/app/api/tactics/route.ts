import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySessionToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport")?.toUpperCase() || "FOOTBALL";

    const tactics = await prisma.tactic.findMany({
      where: { sport },
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
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });

    const parsedTactics = tactics.map((t) => ({
      ...t,
      tags: t.tags ? JSON.parse(t.tags) : [],
      phases: t.phases.map((p) => ({
        ...p,
        tokens: p.tokensJson ? JSON.parse(p.tokensJson) : [],
        trajectories: p.trajectoriesJson ? JSON.parse(p.trajectoriesJson) : [],
      })),
    }));

    return NextResponse.json({ tactics: parsedTactics });
  } catch (error) {
    console.error("GET /api/tactics error:", error);
    return NextResponse.json({ error: "Failed to fetch tactics" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifySessionToken(sessionToken);
    if (!session || (session.role !== "COACH" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Coach or Admin required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      sport,
      titleEn,
      titleZh,
      scenario,
      courtFormat,
      tags,
      descriptionEn,
      descriptionZh,
      phases,
    } = body;

    if (!sport || !titleZh || !titleEn || !scenario || !courtFormat) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newTactic = await prisma.tactic.create({
      data: {
        sport: sport.toUpperCase(),
        titleEn,
        titleZh,
        scenario,
        courtFormat,
        tags: JSON.stringify(tags || []),
        descriptionEn: descriptionEn || null,
        descriptionZh: descriptionZh || null,
        creatorId: session.userId,
        phases: {
          create: (phases || []).map((p: any, idx: number) => ({
            phaseIndex: idx + 1,
            titleEn: p.titleEn || `Phase ${idx + 1}`,
            titleZh: p.titleZh || `阶段 ${idx + 1}`,
            notesEn: p.notesEn || "",
            notesZh: p.notesZh || "",
            tokensJson: JSON.stringify(p.tokens || []),
            trajectoriesJson: JSON.stringify(p.trajectories || []),
          })),
        },
      },
      include: {
        phases: true,
      },
    });

    return NextResponse.json({ tactic: newTactic }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tactics error:", error);
    return NextResponse.json({ error: "Failed to create tactic" }, { status: 500 });
  }
}
