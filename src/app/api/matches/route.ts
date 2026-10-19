import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySessionToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport")?.toUpperCase() || "FOOTBALL";

    const matches = await prisma.match.findMany({
      where: { sport },
      include: {
        stats: {
          include: {
            profile: {
              include: {
                user: {
                  select: {
                    id: true,
                    nameEn: true,
                    nameZh: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        debriefs: {
          include: {
            coach: {
              select: {
                id: true,
                nameZh: true,
                nameEn: true,
              },
            },
            recipients: {
              include: {
                user: {
                  select: {
                    id: true,
                    nameZh: true,
                    nameEn: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { matchDate: "desc" },
    });

    const parsedMatches = matches.map((m) => ({
      ...m,
      linkedTacticIds: m.linkedTacticIds ? JSON.parse(m.linkedTacticIds) : [],
    }));

    return NextResponse.json({ matches: parsedMatches });
  } catch (error) {
    console.error("GET /api/matches error:", error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
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
      matchDate,
      location,
      opponentName,
      isHome,
      ourScore,
      opponentScore,
      scoreDetails,
      linkedTacticIds,
    } = body;

    if (!sport || !matchDate || !location || !opponentName) {
      return NextResponse.json({ error: "Missing required match fields" }, { status: 400 });
    }

    const newMatch = await prisma.match.create({
      data: {
        sport: sport.toUpperCase(),
        matchDate: new Date(matchDate),
        location,
        opponentName,
        isHome: isHome !== undefined ? Boolean(isHome) : true,
        ourScore: ourScore !== undefined && ourScore !== "" ? Number(ourScore) : null,
        opponentScore: opponentScore !== undefined && opponentScore !== "" ? Number(opponentScore) : null,
        scoreDetails: scoreDetails || null,
        linkedTacticIds: linkedTacticIds ? JSON.stringify(linkedTacticIds) : null,
      },
    });

    return NextResponse.json({ match: newMatch }, { status: 201 });
  } catch (error) {
    console.error("POST /api/matches error:", error);
    return NextResponse.json({ error: "Failed to create match fixture" }, { status: 500 });
  }
}
