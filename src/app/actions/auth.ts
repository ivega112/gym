"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

export async function loginUser(formData: FormData) {
  try {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
      return { success: false, error: "اسم المستخدم وكلمة المرور مطلوبة" };
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return { success: false, error: "بيانات الدخول غير صحيحة" };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return { success: false, error: "بيانات الدخول غير صحيحة" };
    }

    if (user.status !== "ACTIVE") {
      return { success: false, error: "الحساب موقوف" };
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("session", user.id, {
      httpOnly: false, // so client can clear it on logout easily, or we can use a server action for logout
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return { success: true };
  } catch (error) {
    console.error("Login failed", error);
    return { success: false, error: "حدث خطأ أثناء تسجيل الدخول" };
  }
}

export async function getCurrentUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session || session === "true") return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session },
      select: { id: true }
    });
    return user ? user.id : null;
  } catch (error) {
    return null;
  }
}
