// app/(pages)/(roles)/parent/exam/[examId]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowRight, Loader2, CheckCircle, XCircle,
  AlertCircle, Eye, Clock, User, Calendar,
  FileText, Award, MessageSquare, ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";

// Question type mapping
const typeMap: Record<string, string> = {
  mcq: "اختيار من متعدد",
  true_false: "صح / خطأ",
  essay: "مقالي",
  fill_blank: "ملء الفراغ",
  matching: "مطابقة",
};

export default function ViewExamPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = params.examId as string;
  
  // ✅ الحصول على studentId من الـ URL
  const studentIdParam = searchParams?.get('student') || null;

  // ✅ جلب المستخدم الحالي
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // ✅ جلب أبناء ولي الأمر
  const children = useQuery(
    api.relationships.parentStudent.getChildrenByParent,
    currentUser?._id ? { parentId: currentUser._id as any } : "skip"
  );

  // ✅ تحديد studentId المناسب
  const [selectedStudentId, setSelectedStudentId] = useState<Id<"users"> | null>(null);

  useEffect(() => {
    if (children && children.length > 0) {
      // ✅ إذا كان هناك studentId في الـ URL استخدمه
      if (studentIdParam) {
        const found = children.find((c: any) => c._id === studentIdParam);
        if (found) {
          setSelectedStudentId(studentIdParam as Id<"users">);
          return;
        }
      }
      // ✅ وإلا استخدم أول ابن
      if (children[0]?._id) {
        setSelectedStudentId(children[0]._id);
      }
    }
  }, [children, studentIdParam]);

  // ✅ جلب تفاصيل الامتحان مع إجابات الطالب
  const examData = useQuery(
    api.exams.exams.getExamWithStudentAnswers,
    currentUser?._id && examId && selectedStudentId
      ? {
          examId: examId as Id<"exams">,
          studentId: selectedStudentId as Id<"users">,
        }
      : "skip"
  );

  // ✅ دالة تغيير الطالب
  const handleStudentChange = (studentId: string) => {
    router.push(`/parent/exam/${examId}?student=${studentId}`);
  };

  // حالة التحميل
  if (currentUser === undefined || children === undefined || examData === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // ✅ التحقق من وجود أبناء
  if (!children || children.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">لا يوجد أبناء مرتبطون بحسابك</p>
          <Button
            onClick={() => router.back()}
            className="mt-4 bg-[#001f24] text-white"
          >
            رجوع
          </Button>
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">الامتحان غير موجود أو لم يتم التصحيح بعد</p>
          <p className="text-xs text-gray-400 mt-2">Exam ID: {examId}</p>
          <Button
            onClick={() => router.back()}
            className="mt-4 bg-[#001f24] text-white"
          >
            رجوع
          </Button>
        </div>
      </div>
    );
  }

  const { exam, submission } = examData;
  const isGraded = submission.status === "graded";
  
  const totalMarks = submission.totalMarks ?? 0;
  const examTotalMarks = exam.totalMarks ?? 0;

  // ✅ اسم الطالب الحالي
  const currentStudentName = children.find((c: any) => c._id === selectedStudentId)?.name || "";

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm px-3 py-2 rounded-xl border border-white/20"
            >
              <ArrowRight className="h-4 w-4" /> رجوع
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Eye className="h-5 w-5" /> عرض الامتحان
              </h1>
              <p className="text-[#a3ced6] text-sm">{exam.title} — {exam.subject}</p>
            </div>
          </div>
          
          {/* ✅ اختيار الطالب (إذا كان أكثر من ابن) */}
          {children.length > 1 && (
            <div className="relative">
              <select
                value={selectedStudentId || ''}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="appearance-none bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 pr-10 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
              >
                {children.map((child: any) => (
                  <option key={child._id} value={child._id} className="text-gray-900">
                    {child.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70 pointer-events-none" />
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* ✅ معلومات الامتحان */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400">الطالب</p>
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <User className="h-4 w-4 text-teal-600" />
                {submission.studentName}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">المادة</p>
              <p className="text-sm font-semibold text-gray-800">{exam.subject}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">تاريخ الامتحان</p>
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-600" />
                {exam.date ? format(new Date(exam.date), "dd MMM yyyy", { locale: ar }) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">الحالة</p>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1 ${
                isGraded 
                  ? "bg-green-100 text-green-700" 
                  : "bg-amber-100 text-amber-700"
              }`}>
                {isGraded ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    تم التصحيح
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4" />
                    بانتظار التصحيح
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* ✅ النتيجة النهائية */}
        {isGraded && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">الدرجة النهائية</p>
                <p className="text-3xl font-bold text-teal-600">
                  {totalMarks} / {examTotalMarks}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">النسبة المئوية</p>
                <p className="text-2xl font-bold text-[#001f24]">
                  {examTotalMarks > 0 
                    ? Math.round((totalMarks / examTotalMarks) * 100) 
                    : 0}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">التقييم</p>
                <p className="text-2xl">
                  {examTotalMarks > 0 && (totalMarks / examTotalMarks) >= 0.5 ? "✅" : "❌"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ✅ أسئلة الامتحان مع الإجابات */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-[#f7fafa]">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-600" />
              أسئلة الامتحان ({exam.questions?.length || 0})
            </h3>
          </div>

          <div className="p-6 space-y-6">
            {exam.questions?.map((item: any, idx: number) => {
              const q = item.question;
              const marksObtained = q?.marksObtained ?? 0;
              const maxMarks = item.marks ?? 0;
              const isCorrect = marksObtained === maxMarks && maxMarks > 0;
              const isPartial = marksObtained > 0 && marksObtained < maxMarks;
              const isWrong = marksObtained === 0 && q?.studentAnswer;

              return (
                <div
                  key={q?._id || idx}
                  className="border border-gray-100 rounded-xl p-5 space-y-4"
                >
                  {/* رأس السؤال */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded mb-2 inline-block">
                        س{idx + 1} — {typeMap[q?.type] || q?.type}
                      </span>
                      <p className="text-sm text-gray-800 mt-2">{q?.questionText}</p>
                      {q?.imageUrl && (
                        <img 
                          src={q.imageUrl} 
                          alt="صورة السؤال" 
                          className="mt-2 max-h-40 rounded-lg object-cover"
                        />
                      )}
                    </div>
                    <div className="text-center shrink-0">
                      <p className={`text-sm font-bold ${
                        isGraded 
                          ? isCorrect 
                            ? "text-green-600" 
                            : isPartial 
                            ? "text-amber-600" 
                            : "text-red-500"
                          : "text-gray-400"
                      }`}>
                        {isGraded ? marksObtained : "—"}
                      </p>
                      <p className="text-xs text-gray-400">/ {maxMarks}</p>
                    </div>
                  </div>

                  {/* ✅ إجابة الطالب */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">إجابة الطالب:</p>
                    <p className="text-sm text-gray-800">
                      {q?.studentAnswer || <span className="text-gray-400 italic">لم يجب</span>}
                    </p>
                  </div>

                  {/* ✅ الإجابة الصحيحة (لـ MCQ و True/False) */}
                  {isGraded && q?.type === "mcq" && q?.options && (
                    <div className="flex flex-wrap gap-2">
                      <p className="text-xs text-gray-400 w-full mb-1">الإجابات:</p>
                      {q.options.map((opt: any) => (
                        <span
                          key={opt.id}
                          className={`text-xs px-3 py-1 rounded-full border ${
                            opt.isCorrect
                              ? "bg-green-100 text-green-700 border-green-200 font-semibold"
                              : opt.id === q.studentAnswer
                              ? "bg-red-100 text-red-600 border-red-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {opt.isCorrect && "✓ "}
                          {opt.text}
                          {opt.id === q.studentAnswer && !opt.isCorrect && " (إجابتك)"}
                        </span>
                      ))}
                    </div>
                  )}

                  {isGraded && q?.type === "true_false" && (
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-gray-400">الإجابة الصحيحة:</p>
                      <span className={`text-sm font-semibold ${
                        q.correctAnswer === "true" ? "text-green-600" : "text-red-600"
                      }`}>
                        {q.correctAnswer === "true" ? "صح ✅" : "خطأ ❌"}
                      </span>
                      {q.studentAnswer && (
                        <span className={`text-sm ${
                          q.studentAnswer === q.correctAnswer 
                            ? "text-green-600" 
                            : "text-red-600"
                        }`}>
                          {q.studentAnswer === q.correctAnswer ? "✓ إجابتك صحيحة" : "✗ إجابتك خاطئة"}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ✅ تعليق المعلم على السؤال */}
                  {isGraded && q?.feedback && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        تعليق المعلم:
                      </p>
                      <p className="text-sm text-gray-700">{q.feedback}</p>
                    </div>
                  )}

                  {/* ✅ حالة الإجابة */}
                  {isGraded && (
                    <div className="flex items-center gap-2">
                      {isCorrect && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          إجابة صحيحة ✅
                        </span>
                      )}
                      {isPartial && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          إجابة جزئية ⚠️
                        </span>
                      )}
                      {isWrong && q.studentAnswer && (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <XCircle className="h-4 w-4" />
                          إجابة خاطئة ❌
                        </span>
                      )}
                      {isWrong && !q.studentAnswer && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          لم يجب
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ✅ تعليق المعلم العام */}
        {isGraded && submission.feedback && (
          <div className="mt-6 bg-blue-50 rounded-xl border border-blue-200 p-6">
            <p className="text-sm font-semibold text-blue-700 flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5" />
              ملاحظات المعلم العامة
            </p>
            <p className="text-sm text-gray-700">{submission.feedback}</p>
          </div>
        )}

        {/* ✅ زر الرجوع */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => router.back()}
            className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع إلى الدرجات
          </Button>
        </div>
      </div>
    </div>
  );
}