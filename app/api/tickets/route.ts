import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkTickets } from "@/lib/tickets";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not signed in." } },
        { status: 401 }
      );
    }

    const ticketStatus = await checkTickets(session.user.id, session.user.email);
    return NextResponse.json({
      ticketsLeft: ticketStatus.ticketsLeft,
      ticketsTotal: ticketStatus.ticketsTotal,
      resetInSeconds: ticketStatus.resetInSeconds,
    });
  } catch (err) {
    console.error("Error fetching ticket status:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Could not fetch tickets." } },
      { status: 500 }
    );
  }
}
