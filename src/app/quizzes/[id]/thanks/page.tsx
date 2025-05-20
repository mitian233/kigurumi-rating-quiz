'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { use } from 'react';

export default function ThanksPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="container mx-auto max-w-3xl bg-white shadow-xl rounded-lg p-6 md:p-8 text-center">
        <div className="py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">感谢您的参与！</h1>
          <p className="text-gray-600 mb-8">
            您的评价已成功提交。感谢您对头壳外观评价的贡献。
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link href={`/quizzes/${id}`}>
              <Button variant="outline" className="w-full md:w-auto">
                查看评价结果
              </Button>
            </Link>
            <Link href="/quizzes">
              <Button className="w-full md:w-auto">
                返回评价列表
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
