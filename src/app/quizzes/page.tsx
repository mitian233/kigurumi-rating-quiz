'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  isActive: boolean;
  creatorId: string;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch('/api/quizzes');
        if (!response.ok) {
          throw new Error('Failed to fetch quizzes');
        }
        const data = await response.json();
        setQuizzes(data);
      } catch (err) {
        setError('Failed to load quizzes. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="container mx-auto max-w-6xl bg-white shadow-xl rounded-lg p-6 md:p-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-purple-700">评价活动列表</h1>
            <Link href="/quizzes/create">
              <Button>创建新的评价活动</Button>
            </Link>
          </div>
          <p className="text-gray-600 mt-2">查看所有可用的评价活动</p>
        </header>

        <main>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="loader border-t-4 border-purple-500 rounded-full w-12 h-12 animate-spin"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">目前还没有评价活动</p>
              <Link href="/quizzes/create">
                <Button>创建第一个评价活动</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-4 border-b bg-gray-50">
                    <h2 className="text-xl font-semibold text-purple-700 truncate">{quiz.title}</h2>
                    <p className="text-sm text-gray-500">
                      创建于 {formatDate(new Date(quiz.createdAt))}
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-700 mb-4 line-clamp-2">
                      {quiz.description || '无描述'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          quiz.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {quiz.isActive ? '正在收集' : '已停止收集'}
                      </span>
                      <div className="space-x-2">
                        <Link href={`/quizzes/${quiz.id}`}>
                          <Button size="sm" variant="outline">
                            查看详情
                          </Button>
                        </Link>
                        <Link href={`/quizzes/${quiz.id}/participate`}>
                          <Button size="sm">参与评价</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
