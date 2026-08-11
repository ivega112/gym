"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { getCurrentUserId } from "./auth";

export async function getUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      username: true,
      createdAt: true,
      lastLogin: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUser(formData: FormData) {
  try {
    const userId = await getCurrentUserId();
    const fullName = formData.get("fullName") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!fullName || !username || !password) {
      return { success: false, error: "جميع الحقول مطلوبة" };
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return { success: false, error: "اسم المستخدم موجود مسبقاً" };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        fullName,
        username,
        passwordHash,
      },
    });

    await prisma.auditLog.create({
      data: {
        actionType: "USER_CREATED",
        message: `تم إنشاء مشرف جديد باسم ${fullName} (${username}).`,
        newData: { fullName, username },
        performedById: userId,
      },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to create user", error);
    return { success: false, error: "حدث خطأ أثناء إنشاء المستخدم" };
  }
}

export async function deleteUser(id: string) {
  try {
    const userId = await getCurrentUserId();
    // In a real app, verify the user is not deleting themselves using session info
    const deletedUser = await prisma.user.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        actionType: "USER_DELETED",
        message: `تم حذف المشرف ${deletedUser.fullName} (${deletedUser.username}).`,
        oldData: { fullName: deletedUser.fullName, username: deletedUser.username },
        performedById: userId,
      },
    });
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user", error);
    return { success: false, error: "حدث خطأ أثناء حذف المستخدم" };
  }
}
