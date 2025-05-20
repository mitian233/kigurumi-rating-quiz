import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Submit a response to a quiz
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { testerName, answers } = body;

    if (!testerName || !answers) {
      return NextResponse.json(
        { error: "Tester name and answers are required" },
        { status: 400 }
      );
    }

    // Check if the quiz exists and is active
    const quiz = await prisma.quiz.findUnique({
      where: {
        id,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (!quiz.isActive) {
      return NextResponse.json(
        { error: "This quiz is no longer accepting responses" },
        { status: 403 }
      );
    }

    // Create the response
    const response = await prisma.response.create({
      data: {
        quizId: id,
        testerName,
        answers: JSON.stringify(answers),
      },
    });

    return NextResponse.json(
      {
        id: response.id,
        testerName: response.testerName,
        answers: JSON.parse(response.answers),
        createdAt: response.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting response:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}

// Get all responses for a quiz
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const responses = await prisma.response.findMany({
      where: {
        quizId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      responses.map((response) => ({
        id: response.id,
        testerName: response.testerName,
        answers: JSON.parse(response.answers),
        createdAt: response.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}
