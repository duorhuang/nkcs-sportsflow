import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySessionToken } from "@/lib/jwt";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport")?.toUpperCase() || "FOOTBALL";
    const filter = searchParams.get("filter"); // ALL | ACTIVE | HALL_OF_FAME | ALUMNI_REGULAR

    let whereClause: any = { sport };

    if (filter === "ACTIVE") {
      whereClause.isRetired = false;
    } else if (filter === "HALL_OF_FAME") {
      whereClause.isRetired = true;
      whereClause.alumniTier = "HALL_OF_FAME";
    } else if (filter === "ALUMNI_REGULAR") {
      whereClause.isRetired = true;
      whereClause.alumniTier = "ALUMNI_REGULAR";
    }

    const profiles = await prisma.playerProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            nameEn: true,
            nameZh: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [
        { isCaptain: "desc" },
        { isViceCaptain: "desc" },
        { jerseyNumber: "asc" },
      ],
    });

    const parsedProfiles = profiles.map((p) => ({
      ...p,
      secondaryPositions: p.secondaryPositions
        ? JSON.parse(p.secondaryPositions)
        : [],
    }));

    return NextResponse.json({ profiles: parsedProfiles });
  } catch (error) {
    console.error("GET /api/players error:", error);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifySessionToken(sessionToken);
    if (!session || (session.role !== "ADMIN" && session.role !== "COACH")) {
      return NextResponse.json({ error: "Forbidden: Admin or Coach required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      username,
      password,
      nameEn,
      nameZh,
      sport,
      jerseyNumber,
      primaryPosition,
      secondaryPositions,
      positionGroup,
      honors,
      isCaptain,
      isViceCaptain,
      isRetired,
      alumniTier,
      graduationYear,
    } = body;

    if (!nameEn || !nameZh || !sport || jerseyNumber === undefined || !primaryPosition) {
      return NextResponse.json(
        { error: "Missing required player fields" },
        { status: 400 }
      );
    }

    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: "Username is required. Each athlete must have a dedicated login username (e.g. student ID or handle)." },
        { status: 400 }
      );
    }

    const cleanUsername = username.toLowerCase().trim();

    // Check if user already exists or create new
    let user = await prisma.user.findUnique({ where: { username: cleanUsername } });

    if (!user) {
      const defaultPasswordHash = await hashPassword(password || "player123");

      user = await prisma.user.create({
        data: {
          username: cleanUsername,
          passwordHash: defaultPasswordHash,
          role: "PLAYER",
          nameEn: nameEn.trim(),
          nameZh: nameZh.trim(),
        },
      });
    }

    // Create or update player profile for this specific sport
    const profile = await prisma.playerProfile.upsert({
      where: {
        userId_sport: {
          userId: user.id,
          sport: sport.toUpperCase(),
        },
      },
      update: {
        jerseyNumber: Number(jerseyNumber),
        primaryPosition: primaryPosition.trim().toUpperCase(),
        secondaryPositions: secondaryPositions
          ? JSON.stringify(secondaryPositions)
          : null,
        positionGroup: positionGroup || null,
        honors: honors || null,
        isCaptain: Boolean(isCaptain),
        isViceCaptain: Boolean(isViceCaptain),
        isRetired: Boolean(isRetired),
        alumniTier: isRetired ? alumniTier : null,
        graduationYear: graduationYear ? Number(graduationYear) : null,
      },
      create: {
        userId: user.id,
        sport: sport.toUpperCase(),
        jerseyNumber: Number(jerseyNumber),
        primaryPosition: primaryPosition.trim().toUpperCase(),
        secondaryPositions: secondaryPositions
          ? JSON.stringify(secondaryPositions)
          : null,
        positionGroup: positionGroup || null,
        honors: honors || null,
        isCaptain: Boolean(isCaptain),
        isViceCaptain: Boolean(isViceCaptain),
        isRetired: Boolean(isRetired),
        alumniTier: isRetired ? alumniTier : null,
        graduationYear: graduationYear ? Number(graduationYear) : null,
        xpPoints: 100,
        cardTier: "BRONZE",
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("POST /api/players error:", error);
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await verifySessionToken(sessionToken);
    if (!session || (session.role !== "ADMIN" && session.role !== "COACH")) {
      return NextResponse.json({ error: "Forbidden: Admin or Coach required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Profile id is required" }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (updates.jerseyNumber !== undefined) dataToUpdate.jerseyNumber = Number(updates.jerseyNumber);
    if (updates.primaryPosition !== undefined) dataToUpdate.primaryPosition = updates.primaryPosition;
    if (updates.secondaryPositions !== undefined) {
      dataToUpdate.secondaryPositions = JSON.stringify(updates.secondaryPositions);
    }
    if (updates.positionGroup !== undefined) dataToUpdate.positionGroup = updates.positionGroup;
    if (updates.honors !== undefined) dataToUpdate.honors = updates.honors;
    if (updates.isCaptain !== undefined) dataToUpdate.isCaptain = Boolean(updates.isCaptain);
    if (updates.isViceCaptain !== undefined) dataToUpdate.isViceCaptain = Boolean(updates.isViceCaptain);
    if (updates.isRetired !== undefined) dataToUpdate.isRetired = Boolean(updates.isRetired);
    if (updates.alumniTier !== undefined) dataToUpdate.alumniTier = updates.alumniTier;
    if (updates.graduationYear !== undefined) {
      dataToUpdate.graduationYear = updates.graduationYear ? Number(updates.graduationYear) : null;
    }
    if (updates.xpPoints !== undefined) dataToUpdate.xpPoints = Number(updates.xpPoints);
    if (updates.cardTier !== undefined) dataToUpdate.cardTier = updates.cardTier;

    const updatedProfile = await prisma.playerProfile.update({
      where: { id },
      data: dataToUpdate,
      include: { user: true },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("PATCH /api/players error:", error);
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 });
  }
}
