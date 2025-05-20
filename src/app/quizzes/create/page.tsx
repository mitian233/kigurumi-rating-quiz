'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { DEFAULT_QUIZ_CONFIG } from '@/lib/defaultQuizConfig';
import { generateUniqueId } from '@/lib/utils';

export default function CreateQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('请输入评价活动标题');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const creatorId = generateUniqueId(); // In a real app, this would be the user's ID
      
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          creatorId,
          config: DEFAULT_QUIZ_CONFIG,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create quiz');
      }
      
      const data = await response.json();
      
      // Store the creator ID in localStorage to identify the creator
      localStorage.setItem(`quiz_creator_${data.id}`, creatorId);
      
      router.push(`/quizzes/${data.id}`);
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError('创建评价活动失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="container mx-auto max-w-3xl bg-white shadow-xl rounded-lg p-6 md:p-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-purple-700">创建新的评价活动</h1>
            <Link href="/quizzes">
              <Button variant="outline">返回列表</Button>
            </Link>
          </div>
        </header>

        <main>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                评价活动标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                placeholder="例如：XX头壳外观评价"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                评价活动描述
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                placeholder="请描述这个评价活动的目的和内容..."
              />
            </div>
            
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="mr-2">创建中</span>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  </span>
                ) : (
                  '创建评价活动'
                )}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
