import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get a specific quiz by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: {
        id,
      },
      include: {
        responses: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      createdAt: quiz.createdAt,
      isActive: quiz.isActive,
      creatorId: quiz.creatorId,
      config: JSON.parse(quiz.config),
      responses: quiz.responses.map((response: any) => ({
        id: response.id,
        testerName: response.testerName,
        answers: JSON.parse(response.answers),
        createdAt: response.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

// Update a quiz
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { title, description, isActive, config } = body;

    const quiz = await prisma.quiz.update({
      where: {
        id,
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(config && { config: JSON.stringify(config) }),
      },
    });

    return NextResponse.json({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      createdAt: quiz.createdAt,
      isActive: quiz.isActive,
      creatorId: quiz.creatorId,
      config: JSON.parse(quiz.config),
    });
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    );
  }
}

// Delete a quiz
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.quiz.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
