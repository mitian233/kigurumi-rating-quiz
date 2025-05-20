import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateHeadShell_MultiTester } from "@/lib/quizEvaluation";
import { QuizResponse } from "@/types/quiz";

// Get aggregated results for a quiz
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

    const config = JSON.parse(quiz.config);
    const responses = quiz.responses.map(
      (response) => JSON.parse(response.answers) as QuizResponse
    );

    if (responses.length === 0) {
      return NextResponse.json(
        { error: "No responses found for this quiz" },
        { status: 404 }
      );
    }

    const results = evaluateHeadShell_MultiTester(responses, config);

    return NextResponse.json({
      quizId: quiz.id,
      quizTitle: quiz.title,
      responseCount: responses.length,
      results,
    });
  } catch (error) {
    console.error("Error calculating results:", error);
    return NextResponse.json(
      { error: "Failed to calculate results" },
      { status: 500 }
    );
  }
}
