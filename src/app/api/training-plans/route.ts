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
      orderBy: { trainingDate: "asc" },
      take: 50,
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
      title,
      titleEn,
      titleZh,
      contentEn,
      contentZh,
      tags,
      drills,
    } = body;

    // Single title flexibility: Coach doesn't need to write both Chinese and English!
    const effectiveTitleZh = (titleZh || title || titleEn || "").trim();
    const effectiveTitleEn = (titleEn || title || titleZh || effectiveTitleZh).trim();

    if (!sport || !effectiveTitleZh) {
      return NextResponse.json({ error: "Missing required training plan title" }, { status: 400 });
    }

    const plan = await prisma.trainingPlan.create({
      data: {
        sport: sport.toUpperCase(),
        trainingDate: trainingDate ? new Date(trainingDate) : new Date(),
        startTime: startTime || "16:30",
        endTime: endTime || "18:30",
        location: location || "主体育场 (Main Stadium)",
        titleEn: effectiveTitleEn,
        titleZh: effectiveTitleZh,
        contentEn: contentEn || "",
        contentZh: contentZh || "",
        tags: tags || "日常备战",
        drills: drills && drills.length > 0 ? {
          create: drills.map((d: any, index: number) => {
            const dTitleZh = (d.titleZh || d.title || d.titleEn || `科目 ${index + 1}`).trim();
            const dTitleEn = (d.titleEn || d.title || d.titleZh || dTitleZh).trim();
            return {
              sport: sport.toUpperCase(),
              titleEn: dTitleEn,
              titleZh: dTitleZh,
              category: d.category || "TACTICAL",
              durationMins: d.durationMins ? Number(d.durationMins) : 20,
              setsAndReps: d.setsAndReps || null,
              pitchSpecs: d.pitchSpecs || null,
              playerCount: d.playerCount || null,
              coachingCuesEn: d.coachingCuesEn || d.coachingCuesZh || null,
              coachingCuesZh: d.coachingCuesZh || d.coachingCuesEn || null,
              diagramUrl: d.diagramUrl || null,
              videoUrl: d.videoUrl || null,
              sortOrder: index + 1,
            };
          }),
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

export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifySessionToken(sessionToken);
    if (!session || (session.role !== "COACH" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Coach/Admin required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing plan id" }, { status: 400 });

    await prisma.trainingDrill.deleteMany({ where: { planId: id } });
    await prisma.trainingPlan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/training-plans error:", error);
    return NextResponse.json({ error: "Failed to delete training plan" }, { status: 500 });
  }
}
