import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_QUIZ_CONFIG } from '@/lib/defaultQuizConfig';

// Create a new quiz
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, creatorId, config = DEFAULT_QUIZ_CONFIG } = body;

    if (!title || !creatorId) {
      return NextResponse.json(
        { error: 'Title and creatorId are required' },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        creatorId,
        config: JSON.stringify(config),
        isActive: true,
      },
    });

    return NextResponse.json({ 
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      createdAt: quiz.createdAt,
      isActive: quiz.isActive,
      creatorId: quiz.creatorId,
      config: JSON.parse(quiz.config)
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
}

// Get all quizzes
export async function GET(request: NextRequest) {
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      quizzes.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        createdAt: quiz.createdAt,
        isActive: quiz.isActive,
        creatorId: quiz.creatorId,
      }))
    );
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}
