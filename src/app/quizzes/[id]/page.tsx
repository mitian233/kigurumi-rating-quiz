'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { formatDate, safeToFixed } from '@/lib/utils';
import { QuizWithResponses, QuizResult } from '@/types/quiz';

export default function QuizDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizWithResponses | null>(null);
  const [results, setResults] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [showLog, setShowLog] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/quizzes/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch quiz');
        }
        const data = await response.json();
        setQuiz(data);

        // Check if the current user is the creator
        const creatorId = localStorage.getItem(`quiz_creator_${id}`);
        setIsCreator(creatorId === data.creatorId);

        // If there are responses, fetch results
        if (data.responses && data.responses.length > 0) {
          fetchResults();
        }
      } catch (err) {
        console.error(err);
        setError('加载评价活动失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  const fetchResults = async () => {
    setResultsLoading(true);
    try {
      const response = await fetch(`/api/quizzes/${id}/results`);
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      console.error(err);
      // Don't set error here, just log it
    } finally {
      setResultsLoading(false);
    }
  };

  const toggleQuizStatus = async () => {
    if (!quiz) return;

    try {
      const response = await fetch(`/api/quizzes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !quiz.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quiz status');
      }

      const updatedQuiz = await response.json();
      setQuiz({
        ...quiz,
        isActive: updatedQuiz.isActive,
      });
    } catch (err) {
      console.error(err);
      setError('更新评价活动状态失败，请稍后再试');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen py-8">
        <div className="container mx-auto max-w-6xl bg-white shadow-xl rounded-lg p-6 md:p-8">
          <div className="flex justify-center items-center py-12">
            <div className="loader border-t-4 border-purple-500 rounded-full w-12 h-12 animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="bg-gray-100 min-h-screen py-8">
        <div className="container mx-auto max-w-6xl bg-white shadow-xl rounded-lg p-6 md:p-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error || '评价活动不存在'}</p>
          </div>
          <Link href="/quizzes">
            <Button>返回列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="container mx-auto max-w-6xl bg-white shadow-xl rounded-lg p-6 md:p-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-purple-700">{quiz.title}</h1>
            <div className="flex space-x-2">
              <Link href="/quizzes">
                <Button variant="outline">返回列表</Button>
              </Link>
              <Link href={`/quizzes/${id}/participate`}>
                <Button>参与评价</Button>
              </Link>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            创建于 {formatDate(new Date(quiz.createdAt))}
          </p>
          {quiz.description && (
            <p className="mt-4 text-gray-700 bg-gray-50 p-4 rounded-md">{quiz.description}</p>
          )}
        </header>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-purple-700">评价状态</h2>
            {isCreator && (
              <Button
                onClick={toggleQuizStatus}
                variant={quiz.isActive ? 'destructive' : 'default'}
              >
                {quiz.isActive ? '停止收集评价' : '重新开始收集评价'}
              </Button>
            )}
          </div>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="flex items-center">
              <span
                className={`inline-block w-3 h-3 rounded-full mr-2 ${quiz.isActive ? 'bg-green-500' : 'bg-gray-500'
                  }`}
              ></span>
              <span>
                当前状态: {quiz.isActive ? '正在收集评价' : '已停止收集评价'}
              </span>
            </p>
            <p className="mt-2">
              已收集评价: <span className="font-semibold">{quiz.responses.length}</span> 份
            </p>
            {quiz.responses.length > 0 && (
              <div className="mt-2">
                <p>参与者: </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {quiz.responses.map((response: any) => (
                    <span
                      key={response.id}
                      className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
                    >
                      {response.testerName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {quiz.responses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-purple-700 mb-4">评价结果</h2>

            {resultsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="loader border-t-4 border-purple-500 rounded-full w-8 h-8 animate-spin"></div>
              </div>
            ) : results ? (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                    <h4 className="text-lg font-semibold text-purple-700 mb-2">最终评价分 (0-100)</h4>
                    <p className="text-5xl font-bold text-purple-800 my-4">
                      {safeToFixed(results.final_score_100)}
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                    <h4 className="text-lg font-semibold text-green-700 mb-2">整体评价等级</h4>
                    <p className="text-4xl font-bold text-green-800 my-4">
                      {results.final_tier}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">各评价方面得分 (0-10分制)</h4>
                  <div className="space-y-4">
                    {Object.entries(results.category_scores_final).map(([catId, score]) => {
                      const categoryName = quiz.config.categories[catId]?.name || catId;
                      const percentage = Math.min(100, Math.max(0, (score as number) * 10));

                      return (
                        <div key={catId} className="mb-2">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{categoryName}</span>
                            <span className="text-sm font-medium text-gray-700">
                              {safeToFixed(score as number)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-purple-600 h-2.5 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowLog(!showLog)}
                    className="text-sm text-purple-600 hover:text-purple-800 underline"
                  >
                    {showLog ? '隐藏详细计算过程' : '显示详细计算过程'}
                  </button>
                </div>

                {showLog && (
                  <div className="mt-4 bg-gray-800 text-gray-200 p-4 rounded-md max-h-96 overflow-y-auto text-sm font-mono">
                    {results.log.map((entry, index) => (
                      <div key={index} className="mb-1">{entry}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">无法加载评价结果</p>
            )}
          </div>
        )}

        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-semibold text-purple-700 mb-4">分享此评价活动</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="mb-2">复制以下链接分享给参与者:</p>
            <div className="flex">
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/quizzes/${id}/participate` : ''}
                className="flex-1 p-2 border border-gray-300 rounded-l-md"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/quizzes/${id}/participate`
                  );
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-r-md hover:bg-purple-700"
              >
                复制
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
