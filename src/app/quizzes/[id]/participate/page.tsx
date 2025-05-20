'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { QuizConfig, QuizResponse } from '@/types/quiz';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  isActive: boolean;
  creatorId: string;
  config: QuizConfig;
}

export default function QuizParticipatePage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testerName, setTesterName] = useState('');
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [responses, setResponses] = useState<QuizResponse>({});

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/quizzes/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch quiz');
        }
        const data = await response.json();

        if (!data.isActive) {
          setError('此评价活动已停止收集评价');
        }

        setQuiz(data);

        // Initialize responses object
        const initialResponses: QuizResponse = {};
        Object.keys(data.config.categories).forEach(catId => {
          initialResponses[catId] = {};
          Object.keys(data.config.categories[catId].criteria).forEach(critId => {
            initialResponses[catId][critId] = { score: '' };
          });
        });
        setResponses(initialResponses);
      } catch (err) {
        console.error(err);
        setError('加载评价活动失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  const handleRatingSelect = (catId: string, critId: string, value: number | string) => {
    setResponses(prev => ({
      ...prev,
      [catId]: {
        ...prev[catId],
        [critId]: { score: value }
      }
    }));
  };

  const validateCurrentCategory = () => {
    if (!quiz) return false;

    const categoryIds = Object.keys(quiz.config.categories);
    const currentCatId = categoryIds[currentCategoryIndex];
    const currentCategory = quiz.config.categories[currentCatId];

    for (const critId in currentCategory.criteria) {
      const response = responses[currentCatId]?.[critId]?.score;
      if (response === undefined || response === null || response === '') {
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateCurrentCategory()) {
      setError('请为当前评价方面的所有项目选择评分');
      return;
    }

    setError(null);
    if (quiz) {
      const categoryIds = Object.keys(quiz.config.categories);
      if (currentCategoryIndex < categoryIds.length - 1) {
        setCurrentCategoryIndex(currentCategoryIndex + 1);
      }
    }
  };

  const handlePrevious = () => {
    setError(null);
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(currentCategoryIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    if (!testerName.trim()) {
      setError('请输入您的名字');
      return;
    }

    if (!validateCurrentCategory()) {
      setError('请为当前评价方面的所有项目选择评分');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/quizzes/${id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testerName,
          answers: responses,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      router.push(`/quizzes/${id}/thanks`);
    } catch (err) {
      console.error(err);
      setError('提交评价失败，请稍后再试');
    } finally {
      setSubmitting(false);
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

  if (error && !quiz) {
    return (
      <div className="bg-gray-100 min-h-screen py-8">
        <div className="container mx-auto max-w-6xl bg-white shadow-xl rounded-lg p-6 md:p-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <Link href="/quizzes">
            <Button>返回列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="bg-gray-100 min-h-screen py-8">
        <div className="container mx-auto max-w-6xl bg-white shadow-xl rounded-lg p-6 md:p-8">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">评价活动不存在</p>
          </div>
          <Link href="/quizzes">
            <Button>返回列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryIds = Object.keys(quiz.config.categories);
  const currentCatId = categoryIds[currentCategoryIndex];
  const currentCategory = quiz.config.categories[currentCatId];
  const isLastCategory = currentCategoryIndex === categoryIds.length - 1;

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="container mx-auto max-w-6xl bg-white shadow-xl rounded-lg p-6 md:p-8">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-purple-700">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-gray-600 mt-2">{quiz.description}</p>
          )}
        </header>

        {!quiz.isActive ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
            <p className="text-yellow-700">此评价活动已停止收集评价</p>
            <Link href={`/quizzes/${id}`} className="text-purple-600 hover:underline mt-2 inline-block">
              查看评价结果
            </Link>
          </div>
        ) : (
          <main>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="testerName" className="block text-sm font-medium text-gray-700 mb-1">
                您的名字 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="testerName"
                value={testerName}
                onChange={(e) => setTesterName(e.target.value)}
                className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                placeholder="请输入您的名字"
                required
              />
            </div>

            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-purple-700">
                评价方面: {currentCategory.name}
              </h2>
              <span className="text-sm text-gray-500">
                {currentCategoryIndex + 1} / {categoryIds.length}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {Object.entries(currentCategory.criteria).map(([critId, criterion]) => {
                const currentResponse = responses[currentCatId]?.[critId]?.score;

                return (
                  <div key={critId} className="border rounded-lg p-4 shadow-sm">
                    <h3 className="font-medium text-gray-800 mb-1">{criterion.name}</h3>
                    <p className="text-xs text-gray-500 mb-3">
                      影响程度: {
                        criterion.crit_level === 0 ? '普通' :
                          criterion.crit_level === 1 ? '重要' :
                            criterion.crit_level === 2 ? '很关键' :
                              criterion.crit_level === 3 ? '严重问题点' : '普通'
                      }
                    </p>

                    <div className="flex justify-around mt-2">
                      {criterion.type === 'A' ? (
                        // Numeric rating
                        quiz.config.rating_circle_definitions.map((def) => (
                          <div key={def.label} className="flex flex-col items-center">
                            <button
                              type="button"
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transition-all
                                ${currentResponse === def.value ?
                                  `bg-${def.colorClass.replace('level-', 'purple-')} text-white border-${def.colorClass.replace('level-', 'purple-')}` :
                                  'border-gray-300 hover:scale-110'
                                }`}
                              onClick={() => handleRatingSelect(currentCatId, critId, def.value)}
                            >
                              {def.value}
                            </button>
                            <span className="text-xs text-gray-600 mt-1">{def.label}</span>
                          </div>
                        ))
                      ) : (
                        // Linguistic rating
                        (criterion.rating_labels || []).map((label) => (
                          <div key={label} className="flex flex-col items-center">
                            <button
                              type="button"
                              className={`w-auto px-2 h-8 rounded-full border-2 flex items-center justify-center text-xs transition-all
                                ${currentResponse === label ?
                                  'bg-purple-600 text-white border-purple-600' :
                                  'border-gray-300 hover:scale-110'
                                }`}
                              onClick={() => handleRatingSelect(currentCatId, critId, label)}
                            >
                              {label}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between mt-8">
              <Button
                onClick={handlePrevious}
                disabled={currentCategoryIndex === 0}
                variant="outline"
              >
                &larr; 上一步
              </Button>

              {isLastCategory ? (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !testerName.trim()}
                >
                  {submitting ? (
                    <span className="flex items-center">
                      <span className="mr-2">提交中</span>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    </span>
                  ) : (
                    '提交评价'
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  下一步 &rarr;
                </Button>
              )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
