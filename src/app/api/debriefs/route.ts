import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySessionToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifySessionToken(sessionToken);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport")?.toUpperCase() || "FOOTBALL";

    const isCoachOrAdmin = session.role === "COACH" || session.role === "ADMIN";

    let debriefs = await prisma.debrief.findMany({
      where: { sport },
      include: {
        match: true,
        coach: {
          select: {
            id: true,
            username: true,
            nameEn: true,
            nameZh: true,
            role: true,
          },
        },
        recipients: {
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
            profile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // If student/athlete, only include team-wide debriefs or debriefs directed to this user
    if (!isCoachOrAdmin) {
      debriefs = debriefs
        .map((d) => ({
          ...d,
          recipients: d.recipients.filter(
            (r) => r.userId === session.userId || d.targetType === "TEAM"
          ),
        }))
        .filter((d) => d.targetType === "TEAM" || d.recipients.length > 0);
    }

    const parsedDebriefs = debriefs.map((d) => ({
      ...d,
      recommendedBodyParts: d.recommendedBodyParts
        ? JSON.parse(d.recommendedBodyParts)
        : [],
    }));

    return NextResponse.json({ debriefs: parsedDebriefs });
  } catch (error) {
    console.error("GET /api/debriefs error:", error);
    return NextResponse.json({ error: "Failed to fetch debriefs" }, { status: 500 });
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
      targetType, // TEAM | GROUP | INDIVIDUAL
      targetGroupName,
      matchId,
      summaryZh,
      summaryEn,
      recommendedBodyParts,
      recipients, // array of { userId, profileId, rating, honors, quickTags, privateNoteZh, privateNoteEn }
    } = body;

    if (!sport || !targetType) {
      return NextResponse.json({ error: "Missing required debrief fields" }, { status: 400 });
    }

    const debrief = await prisma.debrief.create({
      data: {
        sport: sport.toUpperCase(),
        targetType,
        targetGroupName: targetGroupName || null,
        matchId: matchId || null,
        summaryZh: summaryZh || null,
        summaryEn: summaryEn || null,
        recommendedBodyParts: JSON.stringify(recommendedBodyParts || []),
        coachId: session.userId,
        recipients: {
          create: (recipients || []).map((r: any) => ({
            userId: r.userId || null,
            profileId: r.profileId || null,
            rating: r.rating ? Number(r.rating) : null,
            honors: r.honors || null,
            quickTags: r.quickTags || null,
            privateNoteZh: r.privateNoteZh || null,
            privateNoteEn: r.privateNoteEn || null,
          })),
        },
      },
      include: {
        recipients: true,
      },
    });

    return NextResponse.json({ debrief }, { status: 201 });
  } catch (error) {
    console.error("POST /api/debriefs error:", error);
    return NextResponse.json({ error: "Failed to create debrief" }, { status: 500 });
  }
}

// PATCH: Athlete acknowledges private debrief and adds actionItemNote
export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifySessionToken(sessionToken);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const body = await request.json();
    const { recipientId, actionItemNote } = body;

    if (!recipientId) {
      return NextResponse.json({ error: "Missing recipient ID" }, { status: 400 });
    }

    const updated = await prisma.debriefRecipient.update({
      where: { id: recipientId },
      data: {
        isRead: true,
        acknowledgedAt: new Date(),
        ...(actionItemNote !== undefined ? { actionItemNote } : {}),
      },
    });

    return NextResponse.json({ recipient: updated });
  } catch (error) {
    console.error("PATCH /api/debriefs error:", error);
    return NextResponse.json({ error: "Failed to acknowledge debrief" }, { status: 500 });
  }
}
