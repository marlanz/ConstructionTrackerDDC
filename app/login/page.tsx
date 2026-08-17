import Image from "next/image";
import Link from "next/link";
import LoginButton from "./_component/login-button";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center ">
      {/* Main Container */}
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
        style={{
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 6px 32px 0 rgba(0,0,0,0.10)",
          padding: 28,
        }}
      >
        {/* Left Side - Industrial Illustration */}
        <div className="hidden lg:flex flex-col justify-center items-center relative">
          <Image
            src={"/2-Gioi-Thieu.jpg"}
            className="absolute inset-0 object-cover rounded-lg"
            alt="banner"
            fill
            priority
          />

          {/* Content */}
        </div>

        {/* Right Side - Login Form */}
        <div className="flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Header */}
            <div className="mb-5">
              <div className="flex items-center justify-center">
                {/* Industrial Icon Cluster */}
                <div className="inline-flex items-center justify-center ">
                  <Image
                    src={"/logo-01.png"}
                    width={70}
                    height={70}
                    alt="logo"
                  />
                </div>
              </div>

              <h2
                className="text-3xl font-bold text-foreground mb-3 text-center"
                style={{ paddingTop: 16 }}
              >
                Hệ thống Quản lý Công trình lắp đặt Tập đoàn Đại Dũng
              </h2>
              {/* <p
                className="text-muted-foreground text-lg leading-relaxed mb-8 text-center"
                style={{ paddingBottom: 4 }}
              >
                Quản lý, giám sát thiết bị theo thời gian thực, phân tích báo
                cáo và cảnh báo thông minh
              </p> */}
            </div>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <Separator className="bg-border flex-1" />
              <span className="text-xs text-muted-foreground font-medium">
                ĐĂNG NHẬP BẰNG TÀI KHOẢN ĐẠI DŨNG
              </span>
              <Separator className="bg-border flex-1" />
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <LoginButton />
              <div
                style={{
                  marginTop: 16,
                  fontSize: 13,
                  color: "#888",
                  textAlign: "center",
                }}
              >
                Khi đăng nhập, bạn đồng ý với{" "}
                <Link
                  href={"https://daidung.com/chinh-sach-bao-mat/"}
                  style={{ color: "rgb(233, 34, 39)", fontWeight: 500 }}
                  target="_blank"
                >
                  Chính sách bảo mật dữ liệu{" "}
                </Link>
                của Đại Dũng
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#9ca3af",
                  textAlign: "center",
                }}
              >
                Powered by Phòng Thiết bị Công nghệ
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
