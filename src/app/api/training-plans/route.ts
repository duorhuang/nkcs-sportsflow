import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySessionToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport")?.toUpperCase() || "FOOTBALL";

    const plans = await prisma.trainingPlan.findMany({
      where: { sport },
      include: {
        drills: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { trainingDate: "desc" },
      take: 10,
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("GET /api/training-plans error:", error);
    return NextResponse.json({ error: "Failed to fetch training plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifySessionToken(sessionToken);
    if (!session || (session.role !== "COACH" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Coach/Admin required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      sport,
      trainingDate,
      startTime,
      endTime,
      location,
      titleEn,
      titleZh,
      contentEn,
      contentZh,
      tags,
      drills,
    } = body;

    if (!sport || !titleEn || !titleZh) {
      return NextResponse.json({ error: "Missing required training fields" }, { status: 400 });
    }

    const plan = await prisma.trainingPlan.create({
      data: {
        sport: sport.toUpperCase(),
        trainingDate: trainingDate ? new Date(trainingDate) : new Date(),
        startTime,
        endTime,
        location,
        titleEn,
        titleZh,
        contentEn: contentEn || "",
        contentZh: contentZh || "",
        tags,
        drills: drills && drills.length > 0 ? {
          create: drills.map((d: any, index: number) => ({
            sport: sport.toUpperCase(),
            titleEn: d.titleEn,
            titleZh: d.titleZh,
            category: d.category || "TACTICAL",
            durationMins: d.durationMins ? Number(d.durationMins) : null,
            setsAndReps: d.setsAndReps || null,
            pitchSpecs: d.pitchSpecs || null,
            playerCount: d.playerCount || null,
            coachingCuesEn: d.coachingCuesEn || null,
            coachingCuesZh: d.coachingCuesZh || null,
            diagramUrl: d.diagramUrl || null,
            videoUrl: d.videoUrl || null,
            sortOrder: index + 1,
          })),
        } : undefined,
      },
      include: {
        drills: true,
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("POST /api/training-plans error:", error);
    return NextResponse.json({ error: "Failed to create training plan" }, { status: 500 });
  }
}
