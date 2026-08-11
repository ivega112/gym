"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await loginUser(formData);
    
    if (result.success) {
      router.push("/dashboard");
    } else {
      alert(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight">تسجيل الدخول</CardTitle>
          <CardDescription className="text-gray-500">
            أدخل بيانات الاعتماد الخاصة بك للوصول إلى النظام
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium leading-none">
                اسم المستخدم
              </label>
              <Input
                id="username"
                type="text"
                placeholder="أدخل اسم المستخدم"
                required
                name="username"
                className="text-right text-base"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none">
                كلمة المرور
              </label>
              <Input
                id="password"
                type="password"
                placeholder="أدخل كلمة المرور"
                required
                name="password"
                className="text-right text-base"
                dir="rtl"
              />
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button type="submit" className="w-full text-lg font-medium" disabled={isLoading}>
              {isLoading ? "جاري تسجيل الدخول..." : "دخول"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
