// app/(pages)/(roles)/parent/chatbox/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MessageSquare,
  Users,
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Search,
  ArrowRight,
  User,
  Mail,
  GraduationCap,
  Clock,
  CheckCheck,
  Check,
  Smile,
  ImageIcon,
  FileIcon,
  Mic,
  X,
  ChevronLeft,
  Menu,
  School,
  UserCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────
function formatTime(ts?: number) {
  if (!ts) return "";
  return format(new Date(ts), "hh:mm a", { locale: ar });
}

function formatDate(ts?: number) {
  if (!ts) return "";
  return format(new Date(ts), "dd MMM yyyy", { locale: ar });
}

function getInitials(name: string) {
  if (!name) return "؟";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-500";
    case "inactive":
      return "bg-gray-400";
    default:
      return "bg-gray-300";
  }
}

// ── Components ──────────────────────────────────────────────────

function ChatListItem({
  chat,
  isSelected,
  onClick,
}: {
  chat: any;
  isSelected: boolean;
  onClick: () => void;
}) {
  if (!chat) return null;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-gray-100",
        isSelected ? "bg-[#e0f5f7] hover:bg-[#e0f5f7]" : ""
      )}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-[#001f24] text-white text-sm">
            {getInitials(chat.name || "محادثة")}
          </AvatarFallback>
        </Avatar>
        {chat.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {chat.unreadCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {chat.name}
          </p>
          <span className="text-xs text-gray-400 shrink-0">
            {chat.lastMessageAt ? formatTime(chat.lastMessageAt) : ""}
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate">
          {chat.lastMessage || "لا توجد رسائل"}
        </p>
      </div>
      {chat.type === "group" && (
        <Badge variant="outline" className="text-xs">
          {chat.memberCount || 0}
        </Badge>
      )}
    </div>
  );
}

function TeacherListItem({
  teacher,
  onClick,
}: {
  teacher: any;
  onClick: () => void;
}) {
  if (!teacher) return null;
  
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-gray-100 border border-gray-100"
    >
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-purple-100 text-purple-700 text-sm">
          {getInitials(teacher.name || "م")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {teacher.name}
          </p>
          <Badge variant="outline" className="text-xs">
            معلم
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {teacher.subject && (
            <span className="flex items-center gap-1">
              <School className="h-3 w-3" />
              {teacher.subject}
            </span>
          )}
          {teacher.gradeName && (
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {teacher.gradeName}
            </span>
          )}
        </div>
      </div>
      <Button variant="ghost" size="sm" className="text-[#1a7a8a]">
        <MessageSquare className="h-4 w-4" />
      </Button>
    </div>
  );
}

function MessageBubble({
  message,
  isMine,
  showAvatar,
}: {
  message: any;
  isMine: boolean;
  showAvatar: boolean;
}) {
  if (!message) return null;
  
  const isSystem = message.type === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-2", isMine ? "flex-row-reverse" : "")}>
      {showAvatar && !isMine && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback className="bg-gray-300 text-gray-700 text-xs">
            {getInitials(message.sender?.name || "م")}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2",
          isMine
            ? "bg-[#001f24] text-white rounded-br-sm"
            : "bg-gray-100 text-gray-800 rounded-bl-sm"
        )}
      >
        {!isMine && message.sender?.name && (
          <p className="text-xs font-semibold text-[#1a7a8a] mb-1">
            {message.sender.name}
          </p>
        )}
        <p className="text-sm wrap-break-words">{message.content}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] opacity-70">
            {formatTime(message.createdAt)}
          </span>
          {isMine && (
            <span className="text-[10px]">
              {message.isEdited && "✎ "}
              {message.readBy?.length > 1 ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────

export default function ParentChatboxPage() {
  const router = useRouter();
  const [selectedChatId, setSelectedChatId] = useState<Id<"chatGroups"> | null>(
    null
  );
  const [messageInput, setMessageInput] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chats" | "teachers">("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Queries ───────────────────────────────────────────────────
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // جلب أبناء ولي الأمر
  const children = useQuery(
    api.relationships.parentStudent.getChildrenByParent,
    currentUser?._id ? { parentId: currentUser._id as any } : "skip"
  );

  // جلب محادثات ولي الأمر
  const userChats = useQuery(
    api.chat.chats.getUserChats,
    currentUser?._id ? {} : "skip"
  );

  // جلب تفاصيل المحادثة المحددة
  const chatDetails = useQuery(
    api.chat.chats.getChatById,
    selectedChatId ? { chatId: selectedChatId } : "skip"
  );

  // جلب رسائل المحادثة
  const messages = useQuery(
    api.chat.messages.getMessages,
    selectedChatId ? { chatId: selectedChatId, limit: 50 } : "skip"
  );

  // ── جلب المعلمين من مجموعات الأبناء ─────────────────────────
  const teachersFromChildren = useQuery(
    api.user.teachers.getTeachersByChildren,
    children && children.length > 0
      ? { childrenIds: children.map((c: any) => c._id) }
      : "skip"
  );

  // ── Mutations ─────────────────────────────────────────────────
  const sendMessage = useMutation(api.chat.messages.sendMessage);
  const markChatAsRead = useMutation(api.chat.messages.markChatAsRead);
  const createChat = useMutation(api.chat.chats.createChat);

  // ── Effects ──────────────────────────────────────────────────

  // تحديد أول محادثة عند التحميل
  useEffect(() => {
    if (userChats && userChats.length > 0 && !selectedChatId) {
      const firstChat = userChats[0];
      if (firstChat?._id) {
        setSelectedChatId(firstChat._id);
      }
    }
  }, [userChats, selectedChatId]);

  // تمرير إلى أسفل عند وصول رسائل جديدة
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // تعليم المحادثة كمقروءة عند فتحها
  useEffect(() => {
    if (selectedChatId) {
      markChatAsRead({ chatId: selectedChatId });
    }
  }, [selectedChatId, markChatAsRead]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChatId) return;

    try {
      await sendMessage({
        chatId: selectedChatId,
        content: messageInput.trim(),
        type: "text",
      });
      setMessageInput("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectChat = (chatId: Id<"chatGroups">) => {
    setSelectedChatId(chatId);
    setIsMobileMenuOpen(false);
    setActiveTab("chats");
  };

  const handleStartChatWithTeacher = async (teacherId: string, teacherName: string) => {
    try {
      // ✅ التحقق من وجود محادثة مسبقة مع هذا المعلم
      const existingChat = userChats?.find((chat: any) => {
        // التحقق من أن المحادثة من نوع direct وتحتوي على المعلم
        if (chat.type === "direct") {
          // نحتاج إلى التحقق من المشاركين في المحادثة
          // هذه منطق مبسط - سنفترض أن chat.name هو اسم المعلم
          return chat.name === teacherName;
        }
        return false;
      });

      if (existingChat) {
        setSelectedChatId(existingChat._id);
        setActiveTab("chats");
        return;
      }

      // ✅ إنشاء محادثة جديدة مع المعلم
      const result = await createChat({
        name: `محادثة مع ${teacherName}`,
        type: "direct",
        isPrivate: true,
        participants: [teacherId as Id<"users">],
        isGroupChat: false,
      });

      if (result?.chatId) {
        setSelectedChatId(result.chatId);
        setActiveTab("chats");
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  // ── Loading ──────────────────────────────────────────────────

  if (currentUser === undefined || userChats === undefined || children === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  if (currentUser?.role !== "parent") {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p className="text-gray-500">غير مصرح بالوصول</p>
      </div>
    );
  }

  // فلترة المعلمين حسب البحث
  const filteredTeachers = teachersFromChildren?.filter((teacher: any) =>
    teacher?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-80px)] bg-[#f7fafa]" dir="rtl">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "w-80 border-l border-gray-200 bg-white flex flex-col shrink-0 transition-all",
          isMobileMenuOpen ? "fixed inset-0 z-50 w-full" : "hidden md:flex"
        )}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-[#1a7a8a]" />
            <h2 className="text-lg font-bold text-[#001f24]">المحادثات</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            {userChats?.length || 0}
          </Badge>
          {isMobileMenuOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Tabs: المحادثات | المعلمين */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("chats")}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium transition-all border-b-2",
                activeTab === "chats"
                  ? "border-[#1a7a8a] text-[#1a7a8a]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              المحادثات
            </button>
            <button
              onClick={() => setActiveTab("teachers")}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium transition-all border-b-2",
                activeTab === "teachers"
                  ? "border-[#1a7a8a] text-[#1a7a8a]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <div className="flex items-center justify-center gap-1">
                <UserCircle className="h-4 w-4" />
                المعلمين
                {filteredTeachers.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {filteredTeachers.length}
                  </Badge>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Search - يظهر في تبويب المعلمين */}
        {activeTab === "teachers" && (
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث عن معلم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <ScrollArea className="flex-1 p-2">
          {activeTab === "chats" ? (
            // ── قائمة المحادثات ──
            userChats?.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">لا توجد محادثات</p>
                <p className="text-xs text-gray-400 mt-1">
                  اذهب إلى تبويب "المعلمين" للبدء
                </p>
              </div>
            ) : (
              userChats?.map((chat: any) => (
                <ChatListItem
                  key={chat._id}
                  chat={chat}
                  isSelected={selectedChatId === chat._id}
                  onClick={() => handleSelectChat(chat._id)}
                />
              ))
            )
          ) : (
            // ── قائمة المعلمين ──
            filteredTeachers.length === 0 ? (
              <div className="text-center py-12">
                <UserCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {searchQuery ? "لا يوجد معلمين مطابقين للبحث" : "لا يوجد معلمين"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery ? "حاول تغيير كلمة البحث" : "المعلمين سيظهرون هنا"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTeachers.map((teacher: any) => (
                  <TeacherListItem
                    key={teacher._id}
                    teacher={teacher}
                    onClick={() => handleStartChatWithTeacher(teacher._id, teacher.name)}
                  />
                ))}
              </div>
            )
          )}
        </ScrollArea>

        {/* Sidebar Footer */}
        {/* <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#001f24] text-white text-xs">
                {getInitials(currentUser?.name || "و")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-gray-400">ولي أمر</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/parent")}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div> */}
      </div>

      {/* ── Chat Area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {chatDetails?.chat ? (
              <>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#001f24] text-white">
                    {getInitials(chatDetails.chat.name || "م")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-[#001f24]">
                    {chatDetails.chat.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {chatDetails.chat.type === "group"
                      ? `${chatDetails.participants?.length || 0} أعضاء`
                      : "محادثة خاصة"}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-gray-400">اختر محادثة أو معلم</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {!selectedChatId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">اختر محادثة من القائمة</p>
                <p className="text-xs text-gray-400 mt-1">
                  أو ابدأ محادثة جديدة مع معلم من تبويب "المعلمين"
                </p>
              </div>
            </div>
          ) : messages === undefined ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-[#1a7a8a]" />
            </div>
          ) : messages.messages?.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">لا توجد رسائل</p>
                <p className="text-xs text-gray-400 mt-1">أرسل أول رسالة</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.messages.map((msg: any, idx: number) => {
                const prevMsg = idx > 0 ? messages.messages[idx - 1] : null;
                const showAvatar =
                  !msg.isMine && (!prevMsg || prevMsg.senderId !== msg.senderId);
                return (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isMine={msg.isMine}
                    showAvatar={showAvatar}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0">
              <Paperclip className="h-5 w-5 text-gray-400" />
            </Button>
            <Input
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك..."
              className="flex-1"
              disabled={!selectedChatId}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || !selectedChatId}
              className="bg-[#001f24] hover:bg-[#03363d] text-white shrink-0"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-[10px] text-gray-400">
              {selectedChatId
                ? "اضغط Enter للإرسال"
                : "اختر محادثة أو معلم للبدء"}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <Smile className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}