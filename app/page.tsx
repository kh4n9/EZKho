import Link from "next/link";
import { Metadata } from "next";
import { ArrowRight, BarChart3, Box, Users, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "EZKho - Phần mềm quản lý kho hàng chuyên nghiệp",
  description: "Giải pháp quản lý kho hàng, tồn kho, và khách hàng hiệu quả cho doanh nghiệp vừa và nhỏ. Tối ưu hóa quy trình, kiểm soát chính xác.",
  keywords: ["quản lý kho", "phần mềm kho", "inventory management", "ezkho", "quản lý tồn kho"],
  openGraph: {
    title: "EZKho - Quản lý kho hàng thông minh",
    description: "Hệ thống quản lý kho hàng hiện đại, dễ sử dụng.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <Box className="w-6 h-6" />
            <span>EZKho</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-blue-600 transition-colors">Tính năng</Link>
            <Link href="#benefits" className="hover:text-blue-600 transition-colors">Lợi ích</Link>
            <Link href="#contact" className="hover:text-blue-600 transition-colors">Liên hệ</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/auth"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/auth"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              Dùng thử ngay
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-slate-50 to-white overflow-hidden relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -z-10 opacity-50 pointer-events-none" />

          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold mb-6 border border-blue-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Phiên bản mới nhất 2.0
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900 leading-tight">
              Phần mềm quản lý kho hàng <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                EZKho - Giải pháp tối ưu
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Giải pháp toàn diện giúp bạn theo dõi tồn kho, quản lý đơn hàng và tối ưu hóa quy trình kinh doanh. Dành cho doanh nghiệp hiện đại.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 flex items-center justify-center gap-2"
              >
                Truy cập Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#features"
                className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all hover:border-slate-300 flex items-center justify-center"
              >
                Tìm hiểu thêm
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-slate-900">Tính năng quản lý kho nổi bật</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Mọi thứ bạn cần để vận hành kho hàng một cách trơn tru và chính xác.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Box className="w-6 h-6 text-blue-600" />}
                title="Quản lý tồn kho"
                description="Theo dõi số lượng hàng hóa theo thời gian thực. Cảnh báo khi sắp hết hàng và quản lý nhập xuất dễ dàng."
              />
              <FeatureCard
                icon={<Users className="w-6 h-6 text-indigo-600" />}
                title="Quản lý khách hàng"
                description="Lưu trữ thông tin khách hàng, lịch sử mua hàng và công nợ. Xây dựng mối quan hệ bền vững."
              />
              <FeatureCard
                icon={<BarChart3 className="w-6 h-6 text-emerald-600" />}
                title="Báo cáo chi tiết"
                description="Hệ thống báo cáo trực quan về doanh thu, lợi nhuận và biến động kho. Ra quyết định dựa trên dữ liệu."
              />
              <FeatureCard
                icon={<ShieldCheck className="w-6 h-6 text-orange-600" />}
                title="An toàn & Bảo mật"
                description="Dữ liệu được mã hóa và bảo vệ an toàn. Phân quyền chi tiết cho từng nhân viên."
              />
              <FeatureCard
                icon={<Box className="w-6 h-6 text-purple-600" />}
                title="Kiểm kho thông minh"
                description="Quy trình kiểm kho được tối ưu hóa, hỗ trợ quét mã vạch và đối chiếu tự động."
              />
              <FeatureCard
                icon={<Users className="w-6 h-6 text-pink-600" />}
                title="Đa nền tảng"
                description="Truy cập hệ thống từ mọi nơi, trên mọi thiết bị: máy tính, máy tính bảng và điện thoại."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Sẵn sàng tối ưu kho hàng của bạn với EZKho?</h2>
            <p className="text-slate-300 mb-10 max-w-2xl mx-auto text-lg">
              Tham gia cùng hàng ngàn doanh nghiệp đang sử dụng EZKho để nâng cao hiệu quả kinh doanh.
            </p>
            <Link
              href="/auth"
              className="inline-flex px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
            >
              Bắt đầu ngay hôm nay
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
              <Box className="w-6 h-6" />
              <span>EZKho</span>
            </div>
            <div className="text-slate-500 text-sm">
              © {new Date().getFullYear()} EZKho. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-lg hover:border-blue-100 hover:bg-white transition-all duration-300 group">
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}