import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto max-w-6xl bg-white shadow-xl rounded-lg p-6 md:p-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-purple-700">头壳外观评价系统</h1>
          <p className="text-gray-600 mt-2">一个细致量化头壳外观的工具 (多用户评级圈版)。</p>
        </header>

        <main className="py-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-4 text-purple-600">欢迎使用多人评价系统</h2>
            <p className="text-gray-700 mb-6">
              这个系统允许创建者创建评价活动，获取活动链接并与他人分享以填写。
              创建者也可以自己填写问卷。填写后，创建者可以在结果页面上停止收集结果，
              并在创建者视图中汇总收集的结果。
            </p>

            <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
              <Link href="/quizzes/create">
                <Button size="lg" className="w-full md:w-auto">
                  创建新的评价活动
                </Button>
              </Link>
              <Link href="/quizzes">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full md:w-auto border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  查看所有评价活动
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-16 bg-purple-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-purple-700">如何使用</h3>
            <ol className="list-decimal pl-5 space-y-2 text-gray-700">
              <li>创建一个新的评价活动，设置标题和描述</li>
              <li>获取活动链接并分享给参与者</li>
              <li>参与者（和创建者）可以填写评价表单</li>
              <li>创建者可以查看实时结果，并在适当的时候停止收集</li>
              <li>系统会自动计算并显示所有评价的平均结果</li>
            </ol>
          </div>
        </main>
      </div>

      <footer className="text-center mt-12 pb-8 text-gray-500 text-sm">
        <p>头壳外观评价系统。基于复杂模型，请谨慎校准参数。</p>
      </footer>
    </div>
  );
}
