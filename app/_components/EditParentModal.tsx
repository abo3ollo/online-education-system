// app/_components/EditParentModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  User,
  Phone,
  Mail,
  Briefcase,
  Building2,
  MapPin,
  AlertCircle,
  IdCard,
  Loader2,
} from "lucide-react";

interface EditParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentData: any;
  onSuccess?: () => void;
}

export function EditParentModal({
  isOpen,
  onClose,
  parentData,
  onSuccess,
}: EditParentModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    workPhone: "",
    workAddress: "",
    jobTitle: "",
    nationalId: "",
    address: "",
    relationship: "",
    status: "active" as "active" | "inactive",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateParent = useMutation(api.user.parents.updateParent);

  // ✅ تحديث البيانات عند تغيير parentData
  useEffect(() => {
    if (parentData) {
      setFormData({
        fullName: parentData.name || "",
        email: parentData.email || "",
        phone: parentData.phoneNumber || "",
        workPhone: parentData.workPhone || "",
        workAddress: parentData.workAddress || "",
        jobTitle: parentData.jobTitle || "",
        nationalId: parentData.nationalId || "",
        address: parentData.address || "",
        relationship: parentData.relationship || "",
        status: parentData.status || "active",
      });
    }
  }, [parentData]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "اسم ولي الأمر مطلوب";
    }
    if (!formData.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "بريد إلكتروني غير صحيح";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "رقم الهاتف مطلوب";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await updateParent({
        parentId: parentData._id,
        name: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phone,
        workPhone: formData.workPhone || undefined,
        workAddress: formData.workAddress || undefined,
        jobTitle: formData.jobTitle || undefined,
        nationalId: formData.nationalId || undefined,
        address: formData.address || undefined,
        relationship: formData.relationship || undefined,
        status: formData.status,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating parent:", error);
      setErrors({ submit: "حدث خطأ أثناء تحديث بيانات ولي الأمر" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-[#c0c8c9] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0a2540]">تعديل بيانات ولي الأمر</h2>
            <p className="text-sm text-gray-500 mt-1">
              تحديث معلومات {parentData?.name || "ولي الأمر"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* البيانات الشخصية */}
          <div>
            <h3 className="text-lg font-semibold text-[#0a2540] mb-4 pb-2 border-b border-[#c0c8c9]">
              البيانات الشخصية
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFullName" className="flex items-center gap-1">
                  اسم ولي الأمر <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="editFullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`pr-10 ${errors.fullName ? "border-red-500" : ""}`}
                    placeholder="أدخل اسم ولي الأمر كاملاً"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.fullName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editNationalId">رقم الهوية الوطنية</Label>
                <div className="relative">
                  <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="editNationalId"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="pr-10"
                    placeholder="أدخل رقم الهوية"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEmail" className="flex items-center gap-1">
                  البريد الإلكتروني <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="editEmail"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`pr-10 ${errors.email ? "border-red-500" : ""}`}
                    placeholder="parent@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editPhone" className="flex items-center gap-1">
                  رقم الهاتف <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="editPhone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`pr-10 ${errors.phone ? "border-red-500" : ""}`}
                    placeholder="05XXXXXXXX"
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="editRelationship">العلاقة بالطالب</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="editRelationship"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="pr-10"
                    placeholder="مثال: أب، أم، وصي"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editStatus">الحالة</Label>
                <select
                  id="editStatus"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as "active" | "inactive" })
                  }
                  className="w-full px-3 py-2.5 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
                >
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>
            </div>
          </div>

          {/* بيانات العمل */}
          <div>
            <h3 className="text-lg font-semibold text-[#0a2540] mb-4 pb-2 border-b border-[#c0c8c9]">
              بيانات العمل
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editJobTitle">المسمى الوظيفي</Label>
                <div className="relative">
                  <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="editJobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="pr-10"
                    placeholder="مثال: مهندس، طبيب، مدير"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editWorkPhone">هاتف العمل</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="editWorkPhone"
                    type="tel"
                    value={formData.workPhone}
                    onChange={(e) => setFormData({ ...formData, workPhone: e.target.value })}
                    className="pr-10"
                    placeholder="هاتف العمل"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="editWorkAddress">عنوان العمل</Label>
                <div className="relative">
                  <Building2 className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    id="editWorkAddress"
                    value={formData.workAddress}
                    onChange={(e) => setFormData({ ...formData, workAddress: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none"
                    rows={2}
                    placeholder="عنوان جهة العمل"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* العنوان */}
          <div>
            <h3 className="text-lg font-semibold text-[#0a2540] mb-4 pb-2 border-b border-[#c0c8c9]">
              العنوان
            </h3>
            <div className="space-y-2">
              <Label htmlFor="editAddress">العنوان الكامل</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  id="editAddress"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] resize-none"
                  rows={2}
                  placeholder="العنوان الكامل لولي الأمر"
                />
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#c0c8c9]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-30 bg-[#0a2540] hover:bg-[#1a7a8a]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري التحديث...
                </>
              ) : (
                "تحديث البيانات"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}