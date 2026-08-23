"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Id } from "@/convex/_generated/dataModel";
import { TransactionStats } from "@/app/_components/transactions/TransactionStats";
import { TransactionsTable } from "@/app/_components/transactions/TransactionsTable";
import { TransactionDetailsModal } from "@/app/_components/transactions/TransactionDetailsModal";

export default function ParentTransactionsPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [lang] = useState<"en" | "ar">("ar");

  // ✅ جلب البيانات
  const currentUser = useQuery(api.user.auth.getCurrentUser, isSignedIn ? {} : "skip");
  
  // ✅ جلب أبناء ولي الأمر
  const children = useQuery(
    api.relationships.parentStudent.getChildrenByParent,
    currentUser?._id
      ? { parentId: currentUser._id as Id<"users"> }
      : "skip"
  );

  // ✅ جلب معاملات الأبناء باستخدام الدالة المحسّنة
  const transactions = useQuery(
    api.transactions.transactions.getChildrenTransactions,
    currentUser?._id ? {
      parentId: currentUser._id as Id<"users">,
      childId: selectedChildId !== "all" ? selectedChildId as Id<"users"> : undefined,
      type: typeFilter !== "all" ? typeFilter as any : undefined,
      status: statusFilter !== "all" ? statusFilter as any : undefined,
    } : "skip"
  );

  // ✅ جلب الإحصائيات
  const stats = useQuery(
    api.transactions.transactions.getTransactionStats,
    currentUser?._id ? { parentId: currentUser._id as Id<"users"> } : "skip"
  );

  // ✅ التحقق من تسجيل الدخول
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }
    if (currentUser !== undefined && currentUser !== null) {
      if (currentUser.role !== "parent") {
        router.replace("/");
        return;
      }
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  // ✅ دالة التحديث
  const handleRefresh = () => {
    window.location.reload();
  };

  // حالة التحميل
  if (!isLoaded || currentUser === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ✅ تحويل بيانات الأطفال إلى خيارات
  const childOptions = children?.map((child: any) => ({
    value: child._id,
    label: child.name,
  })) || [];

  // ✅ فلترة المعاملات حسب البحث
  const filteredTransactions = transactions?.filter((tx: any) => {
    if (!searchQuery.trim()) return true;
    const search = searchQuery.toLowerCase().trim();
    const description = (tx.descriptionAr || tx.description || "").toLowerCase();
    const studentName = (tx.studentName || "").toLowerCase();
    const type = (tx.type || "").toLowerCase();
    const status = (tx.status || "").toLowerCase();
    return description.includes(search) || 
           studentName.includes(search) || 
           type.includes(search) || 
           status.includes(search);
  }) || [];

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/parent" className="text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">كشف حساب الأبناء</h1>
              <p className="text-sm text-gray-500">معاملات أبنائك المالية</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* ✅ اختيار الابن */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">عرض بيانات:</span>
          </div>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
          >
            <option value="all">جميع الأبناء</option>
            {childOptions.map((child: any) => (
              <option key={child.value} value={child.value}>
                {child.label}
              </option>
            ))}
          </select>
          {selectedChildId !== "all" && (
            <span className="text-xs text-gray-400">
              ({filteredTransactions.length} معاملة)
            </span>
          )}
        </div>

        {/* ✅ الإحصائيات */}
        {stats && <TransactionStats stats={stats} currency="EGP" lang={lang} />}

        {/* ✅ الفلاتر */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-50">
            <Input
              placeholder="بحث في المعاملات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
          >
            <option value="all">جميع الأنواع</option>
            <option value="platform">منصة</option>
            <option value="aptitude">قدرات</option>
            <option value="academic">تحصيلي</option>
            <option value="purchase">مشتريات</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a]"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="completed">مكتمل</option>
            <option value="approved">موافق عليه</option>
            <option value="rejected">مرفوض</option>
            <option value="failed">فشل</option>
            <option value="refunded">مرتجع</option>
          </select>
          {(searchQuery || typeFilter !== "all" || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("all");
                setStatusFilter("all");
              }}
              className="text-gray-500"
            >
              مسح الفلاتر
            </Button>
          )}
        </div>

        {/* ✅ جدول المعاملات */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {transactions === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500">
                {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                  ? "لا توجد معاملات تطابق معايير البحث"
                  : "لا توجد معاملات للأبناء"}
              </p>
              {(searchQuery || typeFilter !== "all" || statusFilter !== "all") && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                    setStatusFilter("all");
                  }}
                  className="mt-2"
                >
                  عرض جميع المعاملات
                </Button>
              )}
            </div>
          ) : (
            <TransactionsTable
              transactions={filteredTransactions}
              onViewDetails={(transaction) => {
                setSelectedTransaction(transaction);
                setIsDetailsOpen(true);
              }}
              showStudent={true}
              showActions={false}
              lang={lang}
            />
          )}
        </div>

        {/* ✅ عدد النتائج */}
        {filteredTransactions.length > 0 && (
          <div className="text-sm text-gray-400 text-center">
            عرض {filteredTransactions.length} معاملة
            {selectedChildId !== "all" && ` للطالب المحدد`}
          </div>
        )}
      </div>

      {/* ✅ مودال التفاصيل */}
      <TransactionDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        lang={lang}
      />
    </div>
  );
}