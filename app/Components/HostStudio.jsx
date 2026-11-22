/** @format */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BedDouble,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  Unlock,
  UserPlus,
  Users,
  Wifi,
  X,
} from "lucide-react";
import {
  saveStudioAuth,
  updateStudioUser,
  useStudioAuth,
} from "@/app/lib/authClient";
import Avatar from "@/app/Components/Avatar";

const BASE_TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "future", label: "Future Calendar", icon: CalendarCheck2 },
  { id: "apartments", label: "Apartments", icon: Building2 },
  { id: "rooms", label: "Rooms & Photos", icon: BedDouble },
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "reviews", label: "Guest Reviews", icon: Star },
];

const SAMPLE_PHOTOS = [
  { label: "Westlands Skyline", url: "/images/apt-westlands-skyline.jpg" },
  { label: "Diani Oceanfront", url: "/images/apt-diani-oceanfront.jpg" },
  { label: "Kilimani Atelier", url: "/images/apt-kilimani-atelier.jpg" },
  { label: "Lavington Veranda", url: "/images/apt-lavington-veranda.jpg" },
  { label: "Naivasha Lakeside", url: "/images/apt-naivasha-lakeside.jpg" },
  { label: "Nanyuki Highland", url: "/images/apt-nanyuki-highland.jpg" },
  { label: "Kilifi Creek", url: "/images/apt-kilifi-creek.jpg" },
  { label: "Runda Forest", url: "/images/apt-runda-forest.jpg" },
  { label: "Gigiri Diplomatic", url: "/images/apt-gigiri-diplomatic.jpg" },
  { label: "Malindi Coral", url: "/images/apt-malindi-coral.jpg" },
  { label: "Master Bedroom", url: "/images/support-master-bedroom.jpg" },
  { label: "Chef Kitchen", url: "/images/support-chef-kitchen.jpg" },
  { label: "Spa Bathroom", url: "/images/support-spa-bathroom.jpg" },
  { label: "Rooftop Pool", url: "/images/support-rooftop-pool.jpg" },
  { label: "Work Studio", url: "/images/support-work-studio.jpg" },
  { label: "Dining Patio", url: "/images/support-dining-patio.jpg" },
];

function formatDateKey(year, monthZeroIndexed, day) {
  return `${year}-${String(monthZeroIndexed + 1).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;
}

export default function HostStudio() {
  const {
    studioToken,
    studioUser,
    isStudioUnlocked,
    isSuperAdmin,
    hydrated: studioHydrated,
    lockStudio,
  } = useStudioAuth();

  // Studio Credential Gate Form State
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);
  const studioAvatarInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [apartments, setApartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [mainImages, setMainImages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [threads, setThreads] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [banner, setBanner] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApartmentFilter, setSelectedApartmentFilter] = useState("all");

  // Future Calendar & Availability Tracking State
  const [calendarRoomName, setCalendarRoomName] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDayKey, setSelectedDayKey] = useState("");
  const [blockEndKey, setBlockEndKey] = useState("");
  const [blockNote, setBlockNote] = useState("Owner maintenance");
  const [futureSubTab, setFutureSubTab] = useState("upcoming");

  // Payments Filter State
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Host Messages State
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [hostReply, setHostReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Apartment Form Modal (with keybox + Wi-Fi management)
  const [aptModal, setAptModal] = useState(null);
  const [aptForm, setAptForm] = useState({
    apartmentName: "",
    location: "",
    keyboxCode: "4829#",
    wifiName: "SherryHomes-Fiber-5G",
    wifiPassword: "WelcomeStay2026",
    keyboxInstructions:
      "Smart lockbox beside the main door. Enter the code + # to collect your keycard.",
  });

  // Room Form Modal
  const [roomModal, setRoomModal] = useState(null);
  const [roomForm, setRoomForm] = useState({
    roomName: "",
    roomType: "suite",
    numberOfGuests: "2",
    numberOfBeds: "1",
    roomDescription: "",
    price: "120",
    nameOfApartment: "",
  });

  // Photo Modal (1 main + 5+ supporting images)
  const [photoModalRoom, setPhotoModalRoom] = useState(null);
  const [photoMainUrl, setPhotoMainUrl] = useState("");
  const [photoGalleryUrls, setPhotoGalleryUrls] = useState([]);

  // Manager Creation Modal (Super Admin Only)
  const [managerModalOpen, setManagerModalOpen] = useState(false);
  const [managerForm, setManagerForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phoneNumber: "+254 700 000 000",
    gender: "female",
    password: "",
    avatar: "",
  });
  const [savingManager, setSavingManager] = useState(false);

  const studioFullName = useMemo(() => {
    if (!studioUser) return "Stephen Saidimu";
    return (
      `${studioUser.firstName || ""} ${studioUser.lastName || ""}`.trim() ||
      studioUser.username ||
      "Stephen Saidimu"
    );
  }, [studioUser]);

  const TABS = useMemo(() => {
    if (!isSuperAdmin) return BASE_TABS;
    return [
      ...BASE_TABS,
      { id: "managers", label: "Team & Managers", icon: Users },
    ];
  }, [isSuperAdmin]);

  const showToast = (type, text) => {
    setBanner({ type, text });
    setTimeout(() => {
      setBanner({ type: "", text: "" });
    }, 4500);
  };

  const loadManagers = useCallback(async () => {
    if (!isSuperAdmin || !studioToken) {
      setManagers([]);
      return;
    }
    try {
      const res = await fetch("/api/managers", {
        headers: { Authorization: `Bearer ${studioToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setManagers(Array.isArray(data) ? data : []);
      }
    } catch {
      // Ignore silent failure
    }
  }, [isSuperAdmin, studioToken]);

  const loadHostData = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const [aptRes, roomRes, imgRes, bkRes, payRes, msgRes, revRes] =
          await Promise.all([
            fetch("/api/getApartments"),
            fetch("/api/getAvailableRooms"),
            fetch("/api/getMainImages"),
            fetch("/api/bookings"),
            fetch("/api/payments"),
            fetch("/api/messages"),
            fetch("/api/reviews"),
          ]);

        const [aptData, roomData, imgData, bkData, payData, msgData, revData] =
          await Promise.all([
            aptRes.ok ? aptRes.json() : [],
            roomRes.ok ? roomRes.json() : [],
            imgRes.ok ? imgRes.json() : [],
            bkRes.ok ? bkRes.json() : [],
            payRes.ok ? payRes.json() : [],
            msgRes.ok ? msgRes.json() : [],
            revRes.ok ? revRes.json() : [],
          ]);

        const roomList = Array.isArray(roomData) ? roomData : [];
        const threadList = Array.isArray(msgData) ? msgData : [];

        setApartments(Array.isArray(aptData) ? aptData : []);
        setRooms(roomList);
        setMainImages(Array.isArray(imgData) ? imgData : []);
        setBookings(Array.isArray(bkData) ? bkData : []);
        setPayments(Array.isArray(payData) ? payData : []);
        setThreads(threadList);
        setReviews(Array.isArray(revData) ? revData : []);

        setCalendarRoomName((prev) => prev || roomList[0]?.roomName || "");
        setSelectedThreadId((prev) => prev || threadList[0]?._id || null);

        if (isSuperAdmin && studioToken) {
          await loadManagers();
        }
      } catch (err) {
        console.error("Failed loading Host Studio data:", err);
        if (!silent) showToast("error", "Unable to load host workspace data.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [isSuperAdmin, studioToken, loadManagers]
  );

  useEffect(() => {
    if (studioHydrated && isStudioUnlocked) {
      loadHostData();
    } else if (studioHydrated) {
      setLoading(false);
    }
  }, [studioHydrated, isStudioUnlocked, loadHostData]);

  // Poll messages lightly while in Messages tab
  useEffect(() => {
    if (!isStudioUnlocked || activeTab !== "messages") return;
    const timer = setInterval(() => loadHostData(true), 5000);
    return () => clearInterval(timer);
  }, [isStudioUnlocked, activeTab, loadHostData]);

  const handleStudioSignIn = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!loginIdentifier.trim() || !loginPassword) {
      setLoginError("Enter your Studio username/email and password.");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: loginIdentifier.trim(),
          password: loginPassword,
          studioOnly: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(
          Array.isArray(data.msg)
            ? data.msg[0]
            : data.msg || "Invalid Host Studio credentials."
        );
        return;
      }

      saveStudioAuth(data.token, data.userData);
      setLoginPassword("");
      setActiveTab("overview");
    } catch {
      setLoginError("Unable to reach authentication server.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleStudioAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !studioUser) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== "string") return;
      const dataUrl = reader.result;
      setSavingAvatar(true);
      try {
        await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: studioUser.email,
            username: studioUser.username,
            avatar: dataUrl,
          }),
        });
        updateStudioUser({ avatar: dataUrl });
        showToast("success", "Studio profile picture updated.");
      } catch {
        updateStudioUser({ avatar: dataUrl });
      } finally {
        setSavingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const today = new Date();
  const todayKey = formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // Payment Metrics
  const paymentSummary = useMemo(() => {
    let collected = 0;
    let awaitingAmount = 0;
    let awaitingCount = 0;
    let pending = 0;
    let refunded = 0;
    payments.forEach((p) => {
      const amt = Number(p.amount || 0);
      if (p.status === "paid") {
        collected += amt;
        if (!p.hostApproved) {
          awaitingAmount += amt;
          awaitingCount += 1;
        }
      } else if (p.status === "pending") {
        pending += amt;
      } else if (p.status === "refunded") {
        refunded += amt;
      }
    });
    return { collected, awaitingAmount, awaitingCount, pending, refunded };
  }, [payments]);

  // Future Bookings Metrics
  const futureBookings = useMemo(
    () =>
      bookings
        .filter(
          (b) =>
            !b.isBlocked &&
            new Date(b.checkOutDate).toISOString().split("T")[0] >= todayKey
        )
        .sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate)),
    [bookings, todayKey]
  );

  const unreadMessagesCount = useMemo(
    () => threads.filter((t) => t.unreadForHost).length,
    [threads]
  );

  const getRoomImage = (roomName) => {
    const found = mainImages.find((m) => m.selectedRoomName === roomName);
    return found ? found.mainImage : null;
  };

  // Calendar Map for Selected Suite & Month
  const calendarMeta = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const count = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();

    const dayBookingMap = new Map();
    bookings
      .filter((b) => !calendarRoomName || b.roomName === calendarRoomName)
      .forEach((b) => {
        (b.bookedDates || []).forEach((d) => {
          const k = new Date(d).toISOString().split("T")[0];
          if (!dayBookingMap.has(k)) {
            dayBookingMap.set(k, b);
          }
        });
      });

    let bookedDaysCount = 0;
    let blockedDaysCount = 0;
    let freeDaysCount = 0;

    for (let day = 1; day <= count; day++) {
      const k = formatDateKey(year, month, day);
      if (k < todayKey) continue;
      const entry = dayBookingMap.get(k);
      if (entry) {
        if (entry.isBlocked) blockedDaysCount++;
        else bookedDaysCount++;
      } else {
        freeDaysCount++;
      }
    }

    const totalFutureMonthDays =
      bookedDaysCount + blockedDaysCount + freeDaysCount;
    const occupancyPct =
      totalFutureMonthDays > 0
        ? Math.round((bookedDaysCount / totalFutureMonthDays) * 100)
        : 0;

    return {
      year,
      month,
      count,
      firstWeekday,
      dayBookingMap,
      bookedDaysCount,
      blockedDaysCount,
      freeDaysCount,
      occupancyPct,
    };
  }, [calendarMonth, bookings, calendarRoomName, todayKey]);

  const selectedDayBooking = selectedDayKey
    ? calendarMeta.dayBookingMap.get(selectedDayKey) || null
    : null;

  const handleBlockDates = async (e) => {
    e.preventDefault();
    if (!calendarRoomName || !selectedDayKey) {
      showToast("error", "Select a suite and start date to block.");
      return;
    }
    const endKey =
      blockEndKey && blockEndKey > selectedDayKey
        ? blockEndKey
        : (() => {
            const d = new Date(`${selectedDayKey}T00:00:00Z`);
            d.setUTCDate(d.getUTCDate() + 1);
            return d.toISOString().split("T")[0];
          })();

    const roomObj = rooms.find((r) => r.roomName === calendarRoomName);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkInDate: new Date(`${selectedDayKey}T00:00:00Z`).toISOString(),
          checkOutDate: new Date(`${endKey}T00:00:00Z`).toISOString(),
          roomName: calendarRoomName,
          apartmentName: roomObj?.nameOfApartment || "",
          isBlocked: true,
          notes: blockNote.trim() || "Host maintenance block",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Free dates locked as maintenance block.");
        setBlockEndKey("");
        await loadHostData(true);
      } else {
        showToast(
          "error",
          Array.isArray(data.msg) ? data.msg[0] : data.msg || "Block failed."
        );
      }
    } catch {
      showToast("error", "Network error blocking dates.");
    }
  };

  // Apartment CRUD (including Keybox & Wi-Fi details)
  const openCreateApartment = () => {
    setAptForm({
      apartmentName: "",
      location: "",
      keyboxCode: "4829#",
      wifiName: "SherryHomes-Fiber-5G",
      wifiPassword: "WelcomeStay2026",
      keyboxInstructions:
        "Smart lockbox beside the main door. Enter the code + # to collect your keycard.",
    });
    setAptModal({ mode: "create" });
  };

  const openEditApartment = (apt) => {
    setAptForm({
      apartmentName: apt.apartmentName || "",
      location: apt.location || "",
      keyboxCode: apt.keyboxCode || "4829#",
      wifiName: apt.wifiName || "SherryHomes-Fiber-5G",
      wifiPassword: apt.wifiPassword || "WelcomeStay2026",
      keyboxInstructions:
        apt.keyboxInstructions ||
        "Smart lockbox beside the main door. Enter the code + # to collect your keycard.",
    });
    setAptModal({ mode: "edit", data: apt });
  };

  const handleSaveApartment = async (e) => {
    e.preventDefault();
    if (!aptForm.apartmentName.trim() || !aptForm.location.trim()) {
      showToast("error", "Please enter both apartment name and location.");
      return;
    }

    try {
      const isEdit = aptModal?.mode === "edit";
      const res = await fetch("/api/apartmentDetails", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? {
                id: aptModal.data._id,
                apartmentName: aptForm.apartmentName.trim(),
                location: aptForm.location.trim(),
                keyboxCode: aptForm.keyboxCode.trim(),
                keyboxInstructions: aptForm.keyboxInstructions.trim(),
                wifiName: aptForm.wifiName.trim(),
                wifiPassword: aptForm.wifiPassword.trim(),
              }
            : {
                apartmentName: aptForm.apartmentName.trim(),
                location: aptForm.location.trim(),
                keyboxCode: aptForm.keyboxCode.trim(),
                keyboxInstructions: aptForm.keyboxInstructions.trim(),
                wifiName: aptForm.wifiName.trim(),
                wifiPassword: aptForm.wifiPassword.trim(),
                hostName: studioFullName || "Stephen Saidimu",
                hostEmail: studioUser?.email || "stevensaidimu@gmail.com",
                hostAvatar:
                  studioUser?.avatar || "/images/avatars/host-stephen.jpg",
              }
        ),
      });

      const data = await res.json();
      if (res.ok && data.success !== false) {
        showToast("success", data.msg || "Apartment & access details saved.");
        setAptModal(null);
        await loadHostData(true);
      } else {
        showToast("error", data.msg || "Failed to save apartment.");
      }
    } catch (err) {
      console.error("Save apartment error:", err);
      showToast("error", "Network error saving apartment.");
    }
  };

  const handleDeleteApartment = async (id) => {
    try {
      const res = await fetch("/api/apartmentDetails", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", data.msg);
        await loadHostData(true);
      } else {
        showToast("error", data.msg || "Unable to delete apartment.");
      }
    } catch (err) {
      console.error("Delete apartment error:", err);
      showToast("error", "Network error deleting apartment.");
    }
  };

  // Room CRUD
  const openCreateRoom = (defaultApartment = "") => {
    setRoomForm({
      roomName: "",
      roomType: "suite",
      numberOfGuests: "2",
      numberOfBeds: "1",
      roomDescription: "",
      price: "120",
      nameOfApartment:
        defaultApartment || apartments[0]?.apartmentName || "",
    });
    setRoomModal({ mode: "create" });
  };

  const openEditRoom = (room) => {
    setRoomForm({
      roomName: room.roomName || "",
      roomType: room.roomType || "suite",
      numberOfGuests: String(room.numberOfGuests || "2"),
      numberOfBeds: String(room.numberOfBeds || "1"),
      roomDescription: room.roomDescription || "",
      price: String(room.price || "120"),
      nameOfApartment: room.nameOfApartment || "",
    });
    setRoomModal({ mode: "edit", data: room });
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.roomName.trim() || !roomForm.nameOfApartment) {
      showToast("error", "Room title and apartment selection are required.");
      return;
    }

    try {
      const isEdit = roomModal?.mode === "edit";
      const res = await fetch("/api/roomDescriptions", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { id: roomModal.data._id, updates: roomForm }
            : { updatedFormData: roomForm }
        ),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", data.msg || "Room saved.");
        setRoomModal(null);
        await loadHostData(true);
      } else {
        showToast("error", data.msg || "Failed to save room.");
      }
    } catch (err) {
      console.error("Save room error:", err);
      showToast("error", "Network error saving room.");
    }
  };

  const handleDeleteRoom = async (id) => {
    try {
      const res = await fetch("/api/roomDescriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", data.msg);
        await loadHostData(true);
      } else {
        showToast("error", data.msg || "Unable to delete room.");
      }
    } catch (err) {
      console.error("Delete room error:", err);
      showToast("error", "Network error deleting room.");
    }
  };

  // Photos modal (1 main + 5+ supporting images)
  const openPhotoModal = async (room) => {
    setPhotoModalRoom(room);
    const existing = getRoomImage(room.roomName) || SAMPLE_PHOTOS[0].url;
    setPhotoMainUrl(existing);
    setPhotoGalleryUrls([existing]);

    try {
      const res = await fetch("/api/getMinorImages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: room.roomName }),
      });
      if (res.ok) {
        const data = await res.json();
        const extra = Array.isArray(data)
          ? data.flatMap((d) => d.minorImages || [])
          : [];
        if (extra.length > 0) {
          setPhotoGalleryUrls(Array.from(new Set([existing, ...extra])));
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleFileUploadMain = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoMainUrl(reader.result);
        setPhotoGalleryUrls((prev) =>
          prev.includes(reader.result) ? prev : [reader.result, ...prev]
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUploadSupporting = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPhotoGalleryUrls((prev) =>
            prev.includes(reader.result) ? prev : [...prev, reader.result]
          );
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSavePhotos = async (e) => {
    e.preventDefault();
    if (!photoModalRoom || !photoMainUrl.trim()) {
      showToast("error", "Please select or upload a primary suite photo.");
      return;
    }

    const orderedGallery = Array.from(
      new Set([photoMainUrl.trim(), ...photoGalleryUrls])
    );

    try {
      const res = await fetch("/api/saveImages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedRoomName: photoModalRoom.roomName,
          mainImage: photoMainUrl.trim(),
          minorImages: orderedGallery,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          "success",
          data.messages?.[0] || "Photos updated for client view."
        );
        setPhotoModalRoom(null);
        await loadHostData(true);
      } else {
        showToast("error", "Failed to save room photos.");
      }
    } catch (err) {
      console.error("Save photos error:", err);
      showToast("error", "Network error saving photos.");
    }
  };

  const handleCancelBooking = async (id) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", data.msg);
        await loadHostData(true);
      } else {
        showToast("error", data.msg || "Unable to cancel booking.");
      }
    } catch (err) {
      console.error("Cancel booking error:", err);
      showToast("error", "Network error cancelling booking.");
    }
  };

  const handlePaymentAction = async (
    paymentId,
    action,
    approveImmediately = false
  ) => {
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          action,
          approveImmediately,
          approvedBy: studioFullName,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", data.msg);
        await loadHostData(true);
      } else {
        showToast("error", data.msg || "Unable to update payment.");
      }
    } catch {
      showToast("error", "Network error updating payment.");
    }
  };

  const handleSelectThread = async (thread) => {
    setSelectedThreadId(thread._id);
    if (thread.unreadForHost) {
      try {
        await fetch("/api/messages", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ threadId: thread._id, role: "host" }),
        });
        setThreads((prev) =>
          prev.map((t) =>
            t._id === thread._id ? { ...t, unreadForHost: false } : t
          )
        );
      } catch {
        // Ignore
      }
    }
  };

  const handleSendHostReply = async (e) => {
    e.preventDefault();
    const activeThread = threads.find((t) => t._id === selectedThreadId);
    if (!activeThread || !hostReply.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: activeThread._id,
          senderRole: "host",
          senderName: studioFullName,
          hostAvatar: studioUser?.avatar || "/images/avatars/host-stephen.jpg",
          text: hostReply.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setHostReply("");
        setThreads((prev) =>
          prev.map((t) => (t._id === data.data._id ? data.data : t))
        );
      }
    } finally {
      setSendingReply(false);
    }
  };

  // Super Admin Manager CRUD
  const handleManagerAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setManagerForm((prev) => ({ ...prev, avatar: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateManager = async (e) => {
    e.preventDefault();
    setSavingManager(true);
    try {
      const res = await fetch("/api/managers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studioToken}`,
        },
        body: JSON.stringify(managerForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", data.msg);
        setManagerModalOpen(false);
        setManagerForm({
          firstName: "",
          lastName: "",
          username: "",
          email: "",
          phoneNumber: "+254 700 000 000",
          gender: "female",
          password: "",
          avatar: "",
        });
        await loadManagers();
      } else {
        showToast("error", data.msg || "Unable to create manager.");
      }
    } catch {
      showToast("error", "Network error creating manager.");
    } finally {
      setSavingManager(false);
    }
  };

  const handleDeleteManager = async (id, username) => {
    try {
      const res = await fetch("/api/managers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studioToken}`,
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", `Removed manager ${username}.`);
        await loadManagers();
      } else {
        showToast("error", data.msg || "Unable to delete manager.");
      }
    } catch {
      showToast("error", "Network error deleting manager.");
    }
  };

  const filteredApartments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return apartments;
    return apartments.filter(
      (a) =>
        a.apartmentName?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q)
    );
  }, [apartments, searchTerm]);

  const filteredRooms = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return rooms.filter((r) => {
      const matchesApt =
        selectedApartmentFilter === "all" ||
        r.nameOfApartment === selectedApartmentFilter;
      const matchesQ =
        !q ||
        r.roomName?.toLowerCase().includes(q) ||
        r.nameOfApartment?.toLowerCase().includes(q) ||
        r.roomType?.toLowerCase().includes(q);
      return matchesApt && matchesQ;
    });
  }, [rooms, selectedApartmentFilter, searchTerm]);

  const filteredPayments = useMemo(() => {
    if (paymentFilter === "all") return payments;
    if (paymentFilter === "awaiting") {
      return payments.filter((p) => p.status === "paid" && !p.hostApproved);
    }
    if (paymentFilter === "approved") {
      return payments.filter((p) => p.status === "paid" && p.hostApproved);
    }
    return payments.filter((p) => p.status === paymentFilter);
  }, [payments, paymentFilter]);

  const filteredFutureList = useMemo(() => {
    if (futureSubTab === "blocked") {
      return bookings.filter((b) => b.isBlocked);
    }
    if (futureSubTab === "active") {
      return bookings.filter((b) => {
        if (b.isBlocked) return false;
        const ci = new Date(b.checkInDate).toISOString().split("T")[0];
        const co = new Date(b.checkOutDate).toISOString().split("T")[0];
        return ci <= todayKey && co >= todayKey;
      });
    }
    return bookings
      .filter(
        (b) =>
          !b.isBlocked &&
          new Date(b.checkInDate).toISOString().split("T")[0] > todayKey
      )
      .sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate));
  }, [bookings, futureSubTab, todayKey]);

  const activeTabLabel =
    TABS.find((t) => t.id === activeTab)?.label || "Overview";
  const activeThread = threads.find((t) => t._id === selectedThreadId) || null;

  // Host Studio Credentials Gate
  if (studioHydrated && !isStudioUnlocked) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-sky-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 border border-sky-200 text-sky-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-sky-700">
              Restricted Host Management
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-slate-900">
              Sign in to Host Studio
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Enter your Super Admin or authorized Studio Manager credentials to
              manage apartments, payments, keybox details, and team access.
            </p>
          </div>

          {loginError && (
            <div
              role="alert"
              className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-900">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-700" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleStudioSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="studio-username"
                className="block text-sm font-medium text-slate-800">
                Studio Username or Email
              </label>
              <input
                id="studio-username"
                type="text"
                autoComplete="username"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="Compess or manager email"
                className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="studio-password"
                className="block text-sm font-medium text-slate-800">
                Studio Password
              </label>
              <div className="relative">
                <input
                  id="studio-password"
                  type={showLoginPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter Studio password"
                  className="min-h-[44px] w-full rounded-xl border border-sky-200 bg-white pl-3.5 pr-11 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPw((v) => !v)}
                  aria-label={showLoginPw ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-sky-50">
                  {showLoginPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60">
              <Lock className="h-4 w-4" />
              <span>
                {loginLoading ? "Verifying credentials..." : "Unlock Host Studio"}
              </span>
            </button>
          </form>

          <div className="mt-5 border-t border-sky-100 pt-4 text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-sky-700 hover:underline">
              Return to Client Stays
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row">
      {/* Host Sidebar (Desktop) + Mobile Tab Bar */}
      <aside className="border-b border-sky-200/80 bg-white lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="px-4 py-4 sm:px-6 lg:py-6 border-b border-sky-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
            {isSuperAdmin ? "Super Admin Studio" : "Manager Studio"}
          </p>
          <h1 className="font-display text-xl font-semibold text-slate-900">
            Host Studio
          </h1>
          {studioUser && (
            <div className="mt-3 flex items-center gap-2.5">
              <div className="relative shrink-0">
                <Avatar
                  src={studioUser.avatar}
                  name={studioFullName}
                  size="md"
                />
                <button
                  type="button"
                  onClick={() => studioAvatarInputRef.current?.click()}
                  disabled={savingAvatar}
                  title="Update Studio avatar"
                  aria-label="Update Studio avatar"
                  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 shadow-sm hover:bg-sky-50">
                  <Camera className="h-3 w-3" />
                </button>
                <input
                  ref={studioAvatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleStudioAvatarUpload}
                  className="hidden"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {studioFullName}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  @{studioUser.username}
                </p>
              </div>
            </div>
          )}
        </div>

        <nav
          aria-label="Host Studio sections"
          className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-col lg:px-3 lg:py-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex min-h-[42px] items-center justify-between gap-2.5 rounded-xl px-3.5 py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors lg:w-full ${
                  active
                    ? "bg-sky-50 text-sky-800"
                    : "text-slate-600 hover:bg-sky-50/50 hover:text-slate-900"
                }`}>
                <span className="inline-flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      active ? "text-sky-700" : "text-slate-400"
                    }`}
                  />
                  <span>{tab.label}</span>
                </span>
                {tab.id === "messages" && unreadMessagesCount > 0 && (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800 tabular-nums">
                    {unreadMessagesCount}
                  </span>
                )}
                {tab.id === "payments" && paymentSummary.awaitingCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 tabular-nums">
                    {paymentSummary.awaitingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="hidden border-t border-sky-100 p-4 space-y-2 lg:block">
          <Link
            href="/"
            className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-sky-50">
            <ExternalLink className="h-3.5 w-3.5 text-sky-700" />
            <span>View Client Site</span>
          </Link>
          <button
            type="button"
            onClick={lockStudio}
            className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50">
            <LogOut className="h-3.5 w-3.5" />
            <span>Lock / Switch User</span>
          </button>
        </div>
      </aside>

      {/* Main Host Workspace */}
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Top Workspace Bar */}
        <div className="mb-6 flex flex-col gap-3 border-b border-sky-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Host Studio / {activeTabLabel}
            </p>
            <h2 className="font-display text-2xl font-semibold text-slate-900">
              {activeTabLabel}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCreateApartment}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-700 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              <span>Add Apartment</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateRoom()}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-sky-50 whitespace-nowrap">
              <Plus className="h-4 w-4" />
              <span>Add Room</span>
            </button>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setManagerModalOpen(true)}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 transition-colors hover:bg-sky-100 whitespace-nowrap">
                <UserPlus className="h-4 w-4 text-sky-700" />
                <span>Add Manager</span>
              </button>
            )}
            <button
              type="button"
              onClick={lockStudio}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 lg:hidden">
              <LogOut className="h-3.5 w-3.5" />
              <span>Lock</span>
            </button>
          </div>
        </div>

        {banner.text && (
          <div
            role="alert"
            className={`mb-6 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${
              banner.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}>
            {banner.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-700" />
            )}
            <span>{banner.text}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-24 animate-pulse rounded-xl border border-sky-100 bg-white"
              />
            ))}
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div className="rounded-xl border border-sky-200/80 bg-white p-4 sm:p-5">
                    <p className="text-xs font-medium text-slate-500">
                      Apartments & Suites
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold text-slate-900 tabular-nums sm:text-3xl">
                      {apartments.length} / {rooms.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-sky-200/80 bg-white p-4 sm:p-5">
                    <p className="text-xs font-medium text-slate-500">
                      Future Bookings
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold text-slate-900 tabular-nums sm:text-3xl">
                      {futureBookings.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-sky-200/80 bg-white p-4 sm:p-5">
                    <p className="text-xs font-medium text-slate-500">
                      Collected Revenue
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold text-emerald-700 tabular-nums sm:text-3xl">
                      ${paymentSummary.collected}
                    </p>
                  </div>
                  <div className="rounded-xl border border-sky-200/80 bg-white p-4 sm:p-5">
                    <p className="text-xs font-medium text-slate-500">
                      Awaiting Approval
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold text-amber-700 tabular-nums sm:text-3xl">
                      {paymentSummary.awaitingCount} stays
                    </p>
                  </div>
                </div>

                {paymentSummary.awaitingCount > 0 && (
                  <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-amber-950">
                      <p className="font-semibold">
                        {paymentSummary.awaitingCount} paid reservation
                        {paymentSummary.awaitingCount === 1 ? "" : "s"} awaiting
                        your verification
                      </p>
                      <p className="text-xs text-amber-800">
                        Verify received funds under Payments to unlock the house
                        keybox code and Wi-Fi credentials for those guests.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentFilter("awaiting");
                        setActiveTab("payments");
                      }}
                      className="inline-flex min-h-[38px] items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700 shrink-0">
                      Review Payments
                    </button>
                  </div>
                )}

                <div className="rounded-2xl border border-sky-200/80 bg-white">
                  <div className="flex items-center justify-between border-b border-sky-100 px-5 py-4">
                    <h3 className="text-base font-semibold text-slate-900">
                      Upcoming Guest Arrivals
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab("future")}
                      className="text-xs font-semibold text-sky-700 hover:underline">
                      Open Future Calendar
                    </button>
                  </div>
                  {futureBookings.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500">
                      No upcoming guest stays scheduled yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-sky-100 bg-sky-50/50 text-xs font-semibold text-slate-600">
                          <tr>
                            <th className="px-5 py-3">Suite</th>
                            <th className="px-5 py-3">Guest</th>
                            <th className="px-5 py-3">Dates</th>
                            <th className="px-5 py-3">Check-in Access</th>
                            <th className="px-5 py-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sky-100">
                          {futureBookings.slice(0, 6).map((bk) => (
                            <tr key={bk._id} className="hover:bg-sky-50/40">
                              <td className="px-5 py-3 font-medium text-slate-900">
                                {bk.roomName}
                              </td>
                              <td className="px-5 py-3 text-slate-600">
                                <div className="flex items-center gap-2">
                                  <Avatar
                                    src={bk.guestAvatar}
                                    name={bk.guestName}
                                    size="xs"
                                  />
                                  <span>{bk.guestName || "Guest"}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-slate-600 tabular-nums whitespace-nowrap">
                                {new Date(bk.checkInDate).toLocaleDateString()}{" "}
                                –{" "}
                                {new Date(bk.checkOutDate).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-3 text-xs font-semibold">
                                {bk.paymentStatus === "paid" &&
                                bk.hostApproved ? (
                                  <span className="text-emerald-700">
                                    Approved · Keybox Sent
                                  </span>
                                ) : bk.paymentStatus === "paid" ? (
                                  <span className="text-amber-700">
                                    Paid · Needs Approval
                                  </span>
                                ) : (
                                  <span className="text-slate-500 capitalize">
                                    {bk.paymentStatus || "pending"}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3 text-right font-medium text-slate-900 tabular-nums">
                                ${bk.totalPrice || 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FUTURE BOOKINGS & CALENDAR TAB */}
            {activeTab === "future" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="rounded-2xl border border-sky-200/80 bg-white p-5 lg:col-span-8">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <select
                          aria-label="Select suite for availability calendar"
                          value={calendarRoomName}
                          onChange={(e) => {
                            setCalendarRoomName(e.target.value);
                            setSelectedDayKey("");
                          }}
                          className="min-h-[42px] rounded-xl border border-sky-200 bg-sky-50/40 px-3 py-2 text-sm font-semibold text-slate-900">
                          {rooms.map((r) => (
                            <option key={r._id} value={r.roomName}>
                              {r.roomName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Previous month"
                          onClick={() =>
                            setCalendarMonth(
                              (prev) =>
                                new Date(
                                  prev.getFullYear(),
                                  prev.getMonth() - 1,
                                  1
                                )
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 hover:bg-sky-50">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="min-w-[130px] text-center text-sm font-semibold text-slate-900">
                          {calendarMonth.toLocaleString("default", {
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <button
                          type="button"
                          aria-label="Next month"
                          onClick={() =>
                            setCalendarMonth(
                              (prev) =>
                                new Date(
                                  prev.getFullYear(),
                                  prev.getMonth() + 1,
                                  1
                                )
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 hover:bg-sky-50">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-center">
                      <div>
                        <p className="text-[11px] font-medium text-slate-500">
                          Free Days
                        </p>
                        <p className="text-lg font-semibold text-emerald-700 tabular-nums">
                          {calendarMeta.freeDaysCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-slate-500">
                          Booked Days
                        </p>
                        <p className="text-lg font-semibold text-rose-700 tabular-nums">
                          {calendarMeta.bookedDaysCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-slate-500">
                          Occupancy
                        </p>
                        <p className="text-lg font-semibold text-sky-800 tabular-nums">
                          {calendarMeta.occupancyPct}%
                        </p>
                      </div>
                    </div>

                    <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                        <div key={d} className="py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: calendarMeta.firstWeekday }).map(
                        (_, idx) => (
                          <div key={`pad-${idx}`} />
                        )
                      )}
                      {Array.from({ length: calendarMeta.count }).map(
                        (_, idx) => {
                          const day = idx + 1;
                          const key = formatDateKey(
                            calendarMeta.year,
                            calendarMeta.month,
                            day
                          );
                          const isPast = key < todayKey;
                          const bk = calendarMeta.dayBookingMap.get(key);
                          const isSelected = key === selectedDayKey;

                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setSelectedDayKey(key)}
                              className={`min-h-[44px] rounded-lg border px-1 py-1 text-center text-xs font-medium tabular-nums transition-colors ${
                                isSelected
                                  ? "ring-2 ring-sky-600 border-sky-600"
                                  : "border-sky-100"
                              } ${
                                bk?.isBlocked
                                  ? "bg-amber-50 text-amber-800"
                                  : bk
                                  ? "bg-rose-50 text-rose-700"
                                  : isPast
                                  ? "bg-slate-50 text-slate-400"
                                  : "bg-white text-slate-800 hover:bg-sky-50"
                              }`}>
                              <span className="block">{day}</span>
                              <span className="block text-[9px] font-semibold leading-none mt-0.5">
                                {bk?.isBlocked
                                  ? "Blocked"
                                  : bk
                                  ? "Booked"
                                  : isPast
                                  ? ""
                                  : "Free"}
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Day Inspector / Block Free Dates */}
                  <div className="rounded-2xl border border-sky-200/80 bg-white p-5 lg:col-span-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                        Day Inspector
                      </p>
                      <h3 className="mt-1 font-display text-lg font-semibold text-slate-900 tabular-nums">
                        {selectedDayKey || "Select any calendar day"}
                      </h3>
                    </div>

                    {!selectedDayKey ? (
                      <p className="text-sm text-slate-500">
                        Click a booked day to inspect guest details, or click a
                        free day to block dates for maintenance.
                      </p>
                    ) : selectedDayBooking ? (
                      <div className="space-y-3 rounded-xl border border-sky-100 bg-sky-50/50 p-4">
                        <p className="text-xs font-semibold uppercase text-rose-700">
                          {selectedDayBooking.isBlocked
                            ? "Host Maintenance Block"
                            : "Reserved Stay"}
                        </p>
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={selectedDayBooking.guestAvatar}
                            name={selectedDayBooking.guestName}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {selectedDayBooking.guestName}
                            </p>
                            {selectedDayBooking.guestEmail && (
                              <p className="text-xs text-slate-600">
                                {selectedDayBooking.guestEmail}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 tabular-nums">
                          {new Date(
                            selectedDayBooking.checkInDate
                          ).toLocaleDateString()}{" "}
                          –{" "}
                          {new Date(
                            selectedDayBooking.checkOutDate
                          ).toLocaleDateString()}
                        </p>
                        {selectedDayBooking.notes && (
                          <p className="text-xs text-slate-600">
                            Note: {selectedDayBooking.notes}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleCancelBooking(selectedDayBooking._id)
                          }
                          className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                          <Unlock className="h-3.5 w-3.5" />
                          <span>
                            {selectedDayBooking.isBlocked
                              ? "Unblock & mark free"
                              : "Cancel reservation"}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleBlockDates} className="space-y-3">
                        <p className="text-xs font-semibold text-emerald-700">
                          Free Day — Available for booking
                        </p>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-slate-700">
                            Block until checkout date (optional)
                          </label>
                          <input
                            type="date"
                            min={selectedDayKey}
                            value={blockEndKey}
                            onChange={(e) => setBlockEndKey(e.target.value)}
                            className="min-h-[40px] w-full rounded-xl border border-sky-200 px-3 py-1.5 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-slate-700">
                            Maintenance note
                          </label>
                          <input
                            type="text"
                            value={blockNote}
                            onChange={(e) => setBlockNote(e.target.value)}
                            className="min-h-[40px] w-full rounded-xl border border-sky-200 px-3 py-1.5 text-sm"
                          />
                        </div>
                        <button
                          type="submit"
                          className="inline-flex min-h-[42px] w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-700">
                          Block free date(s)
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Future Bookings & Blocks Schedule Table */}
                <div className="rounded-2xl border border-sky-200/80 bg-white overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 px-5 py-4">
                    <h3 className="text-base font-semibold text-slate-900">
                      Future Schedule Tracker
                    </h3>
                    <div className="flex items-center gap-1 rounded-lg bg-sky-50 p-1">
                      {[
                        { id: "upcoming", label: "Future Stays" },
                        { id: "active", label: "Active Today" },
                        { id: "blocked", label: "Blocked Dates" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setFutureSubTab(tab.id)}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                            futureSubTab === tab.id
                              ? "bg-white text-sky-800 shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}>
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredFutureList.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      No entries under this schedule view.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-sky-100 bg-sky-50/50 text-xs font-semibold text-slate-600">
                          <tr>
                            <th className="px-5 py-3">Suite</th>
                            <th className="px-5 py-3">Guest / Reason</th>
                            <th className="px-5 py-3">Stay Window</th>
                            <th className="px-5 py-3 text-right">Nights</th>
                            <th className="px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sky-100">
                          {filteredFutureList.map((bk) => (
                            <tr key={bk._id} className="hover:bg-sky-50/40">
                              <td className="px-5 py-3 font-medium text-slate-900">
                                {bk.roomName}
                              </td>
                              <td className="px-5 py-3 text-slate-600">
                                <div className="flex items-center gap-2">
                                  <Avatar
                                    src={bk.guestAvatar}
                                    name={bk.guestName}
                                    size="xs"
                                  />
                                  <span>
                                    {bk.guestName}
                                    {bk.notes ? ` · ${bk.notes}` : ""}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-slate-600 tabular-nums whitespace-nowrap">
                                {new Date(bk.checkInDate).toLocaleDateString()}{" "}
                                –{" "}
                                {new Date(bk.checkOutDate).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-3 text-right text-slate-700 tabular-nums">
                                {bk.nights || bk.bookedDates?.length || 1}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleCancelBooking(bk._id)}
                                  className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>
                                    {bk.isBlocked ? "Release" : "Cancel"}
                                  </span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* APARTMENTS TAB (Manage Properties + Keybox + Wi-Fi Credentials) */}
            {activeTab === "apartments" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filter apartments..."
                      className="min-h-[42px] w-full rounded-xl border border-sky-200 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Keybox codes & Wi-Fi credentials configured here are shared
                    with guests automatically after you approve their payment.
                  </p>
                </div>

                {filteredApartments.length === 0 ? (
                  <div className="rounded-2xl border border-sky-200 bg-white p-10 text-center">
                    <p className="text-sm text-slate-600">
                      No apartments found. Create your first apartment listing.
                    </p>
                    <button
                      type="button"
                      onClick={openCreateApartment}
                      className="mt-4 inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
                      <Plus className="h-4 w-4" />
                      <span>Add Apartment</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {filteredApartments.map((apt) => {
                      const aptRoomCount = rooms.filter(
                        (r) => r.nameOfApartment === apt.apartmentName
                      ).length;
                      return (
                        <article
                          key={apt._id}
                          className="flex flex-col justify-between rounded-2xl border border-sky-200/80 bg-white p-5">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="font-display text-lg font-semibold text-slate-900">
                                  {apt.apartmentName}
                                </h3>
                                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
                                  <MapPin className="h-4 w-4 text-sky-700" />
                                  <span>{apt.location}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50/70 py-1 pl-1 pr-2.5">
                                <Avatar
                                  src={apt.hostAvatar}
                                  name={apt.hostName || "Stephen Saidimu"}
                                  size="xs"
                                />
                                <span className="text-[11px] font-medium text-slate-700">
                                  {apt.hostName || "Stephen Saidimu"}
                                </span>
                              </div>
                            </div>

                            <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3 space-y-2 text-xs">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-1.5 text-slate-800">
                                  <KeyRound className="h-3.5 w-3.5 text-sky-700 shrink-0" />
                                  <span className="font-semibold">Keybox:</span>
                                  <span className="font-mono font-semibold text-sky-900">
                                    {apt.keyboxCode || "Not set"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-800 truncate">
                                  <Wifi className="h-3.5 w-3.5 text-sky-700 shrink-0" />
                                  <span className="font-semibold">Wi-Fi:</span>
                                  <span className="truncate">
                                    {apt.wifiName || "Not set"}
                                  </span>
                                </div>
                              </div>
                              {apt.wifiPassword && (
                                <p className="text-slate-600">
                                  <span className="font-medium text-slate-800">
                                    Wi-Fi Pass:
                                  </span>{" "}
                                  <span className="font-mono">
                                    {apt.wifiPassword}
                                  </span>
                                </p>
                              )}
                              {apt.keyboxInstructions && (
                                <p className="line-clamp-2 text-slate-600 leading-relaxed">
                                  <span className="font-medium text-slate-800">
                                    Instructions:
                                  </span>{" "}
                                  {apt.keyboxInstructions}
                                </p>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 tabular-nums">
                              {aptRoomCount}{" "}
                              {aptRoomCount === 1 ? "suite" : "suites"}{" "}
                              configured
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-sky-100 pt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApartmentFilter(apt.apartmentName);
                                setActiveTab("rooms");
                              }}
                              className="inline-flex min-h-[38px] items-center rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100">
                              Manage suites
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditApartment(apt)}
                              className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-sky-50">
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit & Keybox/Wi-Fi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteApartment(apt._id)}
                              className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ROOMS & PHOTOS TAB */}
            {activeTab === "rooms" && (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
                    <div className="relative flex-1 max-w-xs">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search rooms..."
                        className="min-h-[42px] w-full rounded-xl border border-sky-200 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900"
                      />
                    </div>
                    <select
                      aria-label="Filter by apartment"
                      value={selectedApartmentFilter}
                      onChange={(e) =>
                        setSelectedApartmentFilter(e.target.value)
                      }
                      className="min-h-[42px] rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-sm text-slate-900">
                      <option value="all">All apartments</option>
                      {apartments.map((apt) => (
                        <option key={apt._id} value={apt.apartmentName}>
                          {apt.apartmentName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredRooms.length === 0 ? (
                  <div className="rounded-2xl border border-sky-200 bg-white p-10 text-center">
                    <p className="text-sm text-slate-600">
                      No rooms match the current filter.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        openCreateRoom(
                          selectedApartmentFilter === "all"
                            ? ""
                            : selectedApartmentFilter
                        )
                      }
                      className="mt-4 inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
                      <Plus className="h-4 w-4" />
                      <span>Add Room</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {filteredRooms.map((room) => {
                      const img = getRoomImage(room.roomName);
                      return (
                        <article
                          key={room._id}
                          className="flex flex-col justify-between rounded-2xl border border-sky-200/80 bg-white overflow-hidden">
                          <div className="flex flex-col sm:flex-row">
                            <div className="aspect-[4/3] w-full bg-sky-50 sm:w-40 sm:shrink-0">
                              {img ? (
                                <img
                                  src={img}
                                  alt={room.roomName}
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                  No photo
                                </div>
                              )}
                            </div>
                            <div className="flex-1 p-4 space-y-1.5">
                              <p className="text-xs font-medium text-sky-700">
                                {room.nameOfApartment}
                              </p>
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-slate-900">
                                  {room.roomName}
                                </h3>
                                <span className="text-sm font-semibold text-slate-900 tabular-nums">
                                  ${room.price}/nt
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 tabular-nums">
                                {room.roomType} · {room.numberOfGuests} guests ·{" "}
                                {room.numberOfBeds} beds
                              </p>
                              <p className="line-clamp-2 text-xs text-slate-600">
                                {room.roomDescription}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 border-t border-sky-100 bg-sky-50/40 px-4 py-3">
                            <button
                              type="button"
                              onClick={() => openPhotoModal(room)}
                              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-white border border-sky-200 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-sky-50">
                              <ImagePlus className="h-3.5 w-3.5 text-sky-700" />
                              <span>Gallery Photos</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditRoom(room)}
                              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-white border border-sky-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-sky-50">
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRoom(room._id)}
                              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === "bookings" && (
              <div className="rounded-2xl border border-sky-200/80 bg-white overflow-hidden">
                {bookings.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-500">
                    No guest bookings recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-sky-100 bg-sky-50/50 text-xs font-semibold text-slate-600">
                        <tr>
                          <th className="px-5 py-3">Suite</th>
                          <th className="px-5 py-3">Guest</th>
                          <th className="px-5 py-3">Dates</th>
                          <th className="px-5 py-3">Payment & Access</th>
                          <th className="px-5 py-3 text-right">Total</th>
                          <th className="px-5 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sky-100">
                        {bookings.map((bk) => (
                          <tr key={bk._id} className="hover:bg-sky-50/40">
                            <td className="px-5 py-3.5 font-medium text-slate-900">
                              <div>{bk.roomName}</div>
                              <div className="text-xs text-slate-500">
                                {bk.apartmentName || "—"}
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-slate-600">
                              <div className="flex items-center gap-2.5">
                                <Avatar
                                  src={bk.guestAvatar}
                                  name={bk.guestName}
                                  size="sm"
                                />
                                <div>
                                  <div className="font-medium text-slate-900">
                                    {bk.guestName || "Guest"}
                                  </div>
                                  {bk.guestEmail && (
                                    <div className="text-xs text-slate-400">
                                      {bk.guestEmail}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-slate-600 tabular-nums whitespace-nowrap">
                              {new Date(bk.checkInDate).toLocaleDateString()} –{" "}
                              {new Date(bk.checkOutDate).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-3.5 text-xs font-semibold">
                              {bk.isBlocked ? (
                                <span className="text-amber-700">Blocked</span>
                              ) : bk.paymentStatus === "paid" &&
                                bk.hostApproved ? (
                                <span className="text-emerald-700">
                                  Approved · Keybox Sent
                                </span>
                              ) : bk.paymentStatus === "paid" ? (
                                <span className="text-amber-700">
                                  Paid · Awaiting Approval
                                </span>
                              ) : bk.paymentStatus === "refunded" ? (
                                <span className="text-rose-700">Refunded</span>
                              ) : (
                                <span className="text-slate-600 capitalize">
                                  {bk.paymentStatus || "pending"}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
                              {bk.isBlocked ? "—" : `$${bk.totalPrice || 0}`}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleCancelBooking(bk._id)}
                                className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>
                                  {bk.isBlocked ? "Unblock" : "Cancel"}
                                </span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PAYMENTS VERIFICATION & ACCESS RELEASE TAB */}
            {activeTab === "payments" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div className="rounded-xl border border-sky-200/80 bg-white p-5">
                    <p className="text-xs font-medium text-slate-500">
                      Collected Revenue
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold text-emerald-700 tabular-nums">
                      ${paymentSummary.collected}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
                    <p className="text-xs font-medium text-amber-900">
                      Awaiting Host Verification
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold text-amber-800 tabular-nums">
                      {paymentSummary.awaitingCount} (${paymentSummary.awaitingAmount})
                    </p>
                  </div>
                  <div className="rounded-xl border border-sky-200/80 bg-white p-5">
                    <p className="text-xs font-medium text-slate-500">
                      Pending Payment
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold text-slate-900 tabular-nums">
                      ${paymentSummary.pending}
                    </p>
                  </div>
                  <div className="rounded-xl border border-sky-200/80 bg-white p-5">
                    <p className="text-xs font-medium text-slate-500">
                      Refunded Total
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold text-rose-700 tabular-nums">
                      ${paymentSummary.refunded}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-200/80 bg-white overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 px-5 py-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Payment Verification & Check-in Release
                      </h3>
                      <p className="text-xs text-slate-500">
                        Confirm funds received before releasing the apartment
                        keybox code and Wi-Fi credentials to the guest.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 rounded-lg bg-sky-50 p-1">
                      {[
                        { id: "all", label: "All" },
                        {
                          id: "awaiting",
                          label: `Needs Approval (${paymentSummary.awaitingCount})`,
                        },
                        { id: "approved", label: "Approved" },
                        { id: "pending", label: "Pending" },
                        { id: "refunded", label: "Refunded" },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setPaymentFilter(st.id)}
                          className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                            paymentFilter === st.id
                              ? "bg-white text-sky-800 shadow-sm"
                              : "text-slate-600 hover:text-slate-900"
                          }`}>
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredPayments.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      No payment records match this filter.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-sky-100 bg-sky-50/50 text-xs font-semibold text-slate-600">
                          <tr>
                            <th className="px-5 py-3">Reference</th>
                            <th className="px-5 py-3">Guest & Suite</th>
                            <th className="px-5 py-3">Method</th>
                            <th className="px-5 py-3">Verification Status</th>
                            <th className="px-5 py-3 text-right">Amount</th>
                            <th className="px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sky-100">
                          {filteredPayments.map((pay) => (
                            <tr key={pay._id} className="hover:bg-sky-50/40">
                              <td className="px-5 py-3.5 font-mono text-xs text-slate-700">
                                {pay.reference}
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <Avatar
                                    src={pay.guestAvatar}
                                    name={pay.guestName}
                                    size="sm"
                                  />
                                  <div>
                                    <div className="font-medium text-slate-900">
                                      {pay.guestName}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {pay.roomName}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-xs uppercase text-slate-600">
                                {pay.method}
                                {pay.last4 ? ` ·••${pay.last4}` : ""}
                              </td>
                              <td className="px-5 py-3.5 text-xs">
                                {pay.status === "paid" && pay.hostApproved ? (
                                  <div>
                                    <span className="font-semibold text-emerald-700">
                                      Approved · Access Sent
                                    </span>
                                    {pay.approvedBy && (
                                      <p className="text-[11px] text-slate-500">
                                        By {pay.approvedBy}
                                      </p>
                                    )}
                                  </div>
                                ) : pay.status === "paid" ? (
                                  <span className="font-semibold text-amber-700">
                                    Paid · Awaiting Verification
                                  </span>
                                ) : pay.status === "refunded" ? (
                                  <span className="font-semibold text-rose-700">
                                    Refunded · Access Revoked
                                  </span>
                                ) : (
                                  <span className="font-semibold text-slate-600">
                                    Pending Guest Payment
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
                                ${pay.amount}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <div className="inline-flex flex-wrap justify-end gap-1.5">
                                  {pay.status === "paid" && !pay.hostApproved && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handlePaymentAction(pay._id, "approve")
                                      }
                                      className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700">
                                      Approve & Send Keybox
                                    </button>
                                  )}
                                  {pay.status === "pending" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handlePaymentAction(
                                          pay._id,
                                          "mark_paid",
                                          true
                                        )
                                      }
                                      className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700">
                                      Confirm Paid & Approve
                                    </button>
                                  )}
                                  {pay.status === "paid" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handlePaymentAction(pay._id, "refund")
                                      }
                                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                                      {pay.hostApproved
                                        ? "Refund & Revoke"
                                        : "Refund"}
                                    </button>
                                  )}
                                  {pay.status === "refunded" && (
                                    <span className="text-xs text-slate-400">
                                      Closed
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* HOST MESSAGES INBOX TAB */}
            {activeTab === "messages" && (
              <div className="grid min-h-[500px] grid-cols-1 overflow-hidden rounded-2xl border border-sky-200/80 bg-white lg:grid-cols-12">
                <div className="border-b border-sky-100 lg:col-span-4 lg:border-b-0 lg:border-r">
                  <div className="border-b border-sky-100 bg-sky-50/50 px-4 py-3 text-xs font-semibold text-slate-600">
                    Guest Inquiries ({threads.length})
                  </div>
                  {threads.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500">
                      No guest messages yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-sky-100">
                      {threads.map((t) => {
                        const last = t.messages?.[t.messages.length - 1];
                        return (
                          <button
                            key={t._id}
                            type="button"
                            onClick={() => handleSelectThread(t)}
                            className={`w-full px-4 py-3.5 text-left transition-colors ${
                              t._id === selectedThreadId
                                ? "bg-sky-50"
                                : "hover:bg-sky-50/40"
                            }`}>
                            <div className="flex items-start gap-2.5">
                              <Avatar
                                src={t.guestAvatar}
                                name={t.guestName}
                                size="sm"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold text-slate-900 truncate">
                                    {t.guestName}
                                  </p>
                                  {t.unreadForHost && (
                                    <span className="text-[11px] font-semibold text-sky-700 shrink-0">
                                      Unread
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-sky-700 truncate">
                                  {t.roomName}
                                </p>
                                {last && (
                                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                                    {last.text}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-col lg:col-span-8">
                  {activeThread ? (
                    <>
                      <div className="flex items-center gap-3 border-b border-sky-100 bg-sky-50/40 px-5 py-3.5">
                        <Avatar
                          src={activeThread.guestAvatar}
                          name={activeThread.guestName}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">
                            {activeThread.guestName} · {activeThread.roomName}
                          </h3>
                          <p className="text-xs text-slate-500 truncate">
                            {activeThread.guestEmail} · {activeThread.subject}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-3 overflow-y-auto p-5 max-h-[380px]">
                        {(activeThread.messages || []).map((m) => {
                          const isHost = m.senderRole === "host";
                          return (
                            <div
                              key={m._id}
                              className={`flex flex-col ${
                                isHost ? "items-end" : "items-start"
                              }`}>
                              <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[72%] ${
                                  isHost
                                    ? "bg-sky-600 text-white"
                                    : "border border-sky-100 bg-sky-50 text-slate-900"
                                }`}>
                                <p className="leading-relaxed">{m.text}</p>
                              </div>
                              <span className="mt-1 text-[11px] text-slate-400">
                                {m.senderName} ·{" "}
                                {new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <form
                        onSubmit={handleSendHostReply}
                        className="flex items-center gap-2 border-t border-sky-100 p-4">
                        <input
                          type="text"
                          value={hostReply}
                          onChange={(e) => setHostReply(e.target.value)}
                          placeholder="Reply to guest..."
                          className="min-h-[44px] flex-1 rounded-xl border border-sky-200 px-3.5 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                        />
                        <button
                          type="submit"
                          disabled={sendingReply || !hostReply.trim()}
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50">
                          <Send className="h-4 w-4" />
                          <span>Send</span>
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
                      Select a guest thread to read and reply.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === "reviews" && (
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="rounded-2xl border border-sky-200 bg-white p-10 text-center text-sm text-slate-500">
                    No guest ratings submitted yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {reviews.map((rev) => (
                      <article
                        key={rev._id}
                        className="rounded-2xl border border-sky-200/80 bg-white p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-medium text-sky-700">
                              {rev.apartmentName}
                            </p>
                            <h3 className="font-semibold text-slate-900">
                              {rev.roomName}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-semibold text-slate-900 tabular-nums">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                            <span>{rev.rating}.0</span>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600">
                          {rev.comment}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Avatar
                            src={rev.guestAvatar}
                            name={rev.guestName}
                            size="xs"
                          />
                          <p className="text-xs text-slate-500">
                            {rev.guestName} ·{" "}
                            {rev.createdAt
                              ? new Date(rev.createdAt).toLocaleDateString()
                              : "Recent"}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TEAM & MANAGERS TAB (SUPER ADMIN ONLY) */}
            {activeTab === "managers" && isSuperAdmin && (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Studio Team & Manager Access
                    </h3>
                    <p className="text-xs text-slate-600">
                      As Super Admin, you can create Manager login credentials
                      (username & password) or revoke their Host Studio access
                      at any time.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setManagerModalOpen(true)}
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 shrink-0">
                    <UserPlus className="h-4 w-4" />
                    <span>Create Manager</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-sky-200/80 bg-white overflow-hidden">
                  {managers.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      No studio staff records loaded yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-sky-100 bg-sky-50/50 text-xs font-semibold text-slate-600">
                          <tr>
                            <th className="px-5 py-3">Member</th>
                            <th className="px-5 py-3">Username</th>
                            <th className="px-5 py-3">Role</th>
                            <th className="px-5 py-3">Phone</th>
                            <th className="px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sky-100">
                          {managers.map((mgr) => (
                            <tr key={mgr._id} className="hover:bg-sky-50/40">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <Avatar
                                    src={mgr.avatar}
                                    name={`${mgr.firstName} ${mgr.lastName}`}
                                    size="sm"
                                  />
                                  <div>
                                    <p className="font-semibold text-slate-900">
                                      {mgr.firstName} {mgr.lastName}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {mgr.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 font-mono text-xs text-slate-800">
                                @{mgr.username}
                              </td>
                              <td className="px-5 py-3.5 text-xs font-semibold">
                                {mgr.role === "super_admin" ? (
                                  <span className="text-sky-800">
                                    Super Admin
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 capitalize">
                                    {mgr.role}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-xs text-slate-600">
                                {mgr.phoneNumber || "—"}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                {mgr.role === "super_admin" ? (
                                  <span className="text-xs text-slate-400">
                                    Protected
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteManager(mgr._id, mgr.username)
                                    }
                                    className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Apartment & Keybox / Wi-Fi Modal */}
      {aptModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-auto w-full max-w-lg rounded-2xl border border-sky-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-slate-900">
                {aptModal.mode === "edit"
                  ? "Edit Apartment & Access Details"
                  : "Add Apartment & Access Details"}
              </h3>
              <button
                type="button"
                onClick={() => setAptModal(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveApartment} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-800">
                    Apartment name
                  </label>
                  <input
                    type="text"
                    value={aptForm.apartmentName}
                    onChange={(e) =>
                      setAptForm((p) => ({
                        ...p,
                        apartmentName: e.target.value,
                      }))
                    }
                    placeholder="e.g. Westlands Atrium"
                    className="min-h-[44px] w-full rounded-xl border border-sky-200 px-3.5 py-2 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-800">
                    Location
                  </label>
                  <input
                    type="text"
                    value={aptForm.location}
                    onChange={(e) =>
                      setAptForm((p) => ({ ...p, location: e.target.value }))
                    }
                    placeholder="e.g. Nairobi, Westlands"
                    className="min-h-[44px] w-full rounded-xl border border-sky-200 px-3.5 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-800">
                  House Keybox & Wi-Fi Credentials (Shared After Payment Approval)
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Keybox Code
                    </label>
                    <input
                      type="text"
                      value={aptForm.keyboxCode}
                      onChange={(e) =>
                        setAptForm((p) => ({
                          ...p,
                          keyboxCode: e.target.value,
                        }))
                      }
                      placeholder="e.g. 4829#"
                      className="min-h-[40px] w-full rounded-xl border border-sky-200 bg-white px-3 py-1.5 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Wi-Fi Username (SSID)
                    </label>
                    <input
                      type="text"
                      value={aptForm.wifiName}
                      onChange={(e) =>
                        setAptForm((p) => ({ ...p, wifiName: e.target.value }))
                      }
                      placeholder="e.g. Sherry-Fiber-5G"
                      className="min-h-[40px] w-full rounded-xl border border-sky-200 bg-white px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Wi-Fi Password
                    </label>
                    <input
                      type="text"
                      value={aptForm.wifiPassword}
                      onChange={(e) =>
                        setAptForm((p) => ({
                          ...p,
                          wifiPassword: e.target.value,
                        }))
                      }
                      placeholder="Wi-Fi password"
                      className="min-h-[40px] w-full rounded-xl border border-sky-200 bg-white px-3 py-1.5 text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    House Keybox & Arrival Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={aptForm.keyboxInstructions}
                    onChange={(e) =>
                      setAptForm((p) => ({
                        ...p,
                        keyboxInstructions: e.target.value,
                      }))
                    }
                    placeholder="Where the keybox is mounted, gate instructions, and parking details..."
                    className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAptModal(null)}
                  className="min-h-[42px] rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
                  Save apartment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Room Modal */}
      {roomModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-auto w-full max-w-lg rounded-2xl border border-sky-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-slate-900">
                {roomModal.mode === "edit" ? "Edit Room" : "Add Room"}
              </h3>
              <button
                type="button"
                onClick={() => setRoomModal(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-800">
                  Apartment
                </label>
                <select
                  value={roomForm.nameOfApartment}
                  onChange={(e) =>
                    setRoomForm((prev) => ({
                      ...prev,
                      nameOfApartment: e.target.value,
                    }))
                  }
                  className="min-h-[44px] w-full rounded-xl border border-sky-200 px-3.5 py-2 text-sm"
                  required>
                  <option value="">Select apartment</option>
                  {apartments.map((apt) => (
                    <option key={apt._id} value={apt.apartmentName}>
                      {apt.apartmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-800">
                    Room / Suite title
                  </label>
                  <input
                    type="text"
                    value={roomForm.roomName}
                    onChange={(e) =>
                      setRoomForm((prev) => ({
                        ...prev,
                        roomName: e.target.value,
                      }))
                    }
                    placeholder="e.g. Terrace Sky Suite"
                    className="min-h-[44px] w-full rounded-xl border border-sky-200 px-3.5 py-2 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-800">
                    Suite type
                  </label>
                  <select
                    value={roomForm.roomType}
                    onChange={(e) =>
                      setRoomForm((prev) => ({
                        ...prev,
                        roomType: e.target.value,
                      }))
                    }
                    className="min-h-[44px] w-full rounded-xl border border-sky-200 px-3.5 py-2 text-sm">
                    <option value="loft">Loft</option>
                    <option value="suite">Suite</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Guests
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={roomForm.numberOfGuests}
                    onChange={(e) =>
                      setRoomForm((prev) => ({
                        ...prev,
                        numberOfGuests: e.target.value,
                      }))
                    }
                    className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Beds
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={roomForm.numberOfBeds}
                    onChange={(e) =>
                      setRoomForm((prev) => ({
                        ...prev,
                        numberOfBeds: e.target.value,
                      }))
                    }
                    className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Price / night ($)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={roomForm.price}
                    onChange={(e) =>
                      setRoomForm((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-800">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={roomForm.roomDescription}
                  onChange={(e) =>
                    setRoomForm((prev) => ({
                      ...prev,
                      roomDescription: e.target.value,
                    }))
                  }
                  placeholder="Describe layout, amenities, and natural light..."
                  className="w-full rounded-xl border border-sky-200 px-3.5 py-2 text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoomModal(null)}
                  className="min-h-[42px] rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
                  Save room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Photos Modal (Main + 5+ Supporting Gallery) */}
      {photoModalRoom && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-auto w-full max-w-lg rounded-2xl border border-sky-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-slate-900">
                Photos · {photoModalRoom.roomName}
              </h3>
              <button
                type="button"
                onClick={() => setPhotoModalRoom(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePhotos} className="space-y-4">
              {photoMainUrl && (
                <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border border-sky-200 bg-sky-50">
                  <img
                    src={photoMainUrl}
                    alt={photoModalRoom.roomName}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {photoGalleryUrls.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-700">
                    Supporting gallery ({photoGalleryUrls.length} photos)
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {photoGalleryUrls.map((url, idx) => (
                      <div key={`${url}-${idx}`} className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setPhotoMainUrl(url)}
                          className={`h-14 w-20 overflow-hidden rounded-lg border ${
                            photoMainUrl === url
                              ? "border-sky-600 ring-2 ring-sky-600/30"
                              : "border-sky-200"
                          }`}>
                          <img
                            src={url}
                            alt={`Gallery ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        </button>
                        {photoGalleryUrls.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPhotoGalleryUrls((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            aria-label="Remove photo"
                            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] text-white">
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Upload Main Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUploadMain}
                    className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-sky-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Add Supporting Images
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUploadSupporting}
                    className="block w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-sky-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-700">
                  Add or set from curated suite & interior collection
                </p>
                <div className="grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                  {SAMPLE_PHOTOS.map((sample) => (
                    <button
                      key={sample.url}
                      type="button"
                      onClick={() => {
                        setPhotoMainUrl(sample.url);
                        setPhotoGalleryUrls((prev) =>
                          prev.includes(sample.url)
                            ? prev
                            : [...prev, sample.url]
                        );
                      }}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium text-left transition-colors ${
                        photoMainUrl === sample.url
                          ? "border-sky-600 bg-sky-50 text-sky-800"
                          : "border-sky-200 text-slate-700 hover:bg-sky-50/50"
                      }`}>
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPhotoModalRoom(null)}
                  className="min-h-[42px] rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
                  Save photos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Manager Modal (Super Admin Only) */}
      {managerModalOpen && isSuperAdmin && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-auto w-full max-w-lg rounded-2xl border border-sky-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-slate-900">
                Create Studio Manager
              </h3>
              <button
                type="button"
                onClick={() => setManagerModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateManager} className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/50 p-3">
                <Avatar
                  src={managerForm.avatar}
                  name={`${managerForm.firstName || "New"} ${managerForm.lastName || "Manager"}`}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800">
                    Manager profile photo (optional)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleManagerAvatarUpload}
                    className="mt-1 block w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-white file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-sky-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    First name
                  </label>
                  <input
                    type="text"
                    value={managerForm.firstName}
                    onChange={(e) =>
                      setManagerForm((p) => ({
                        ...p,
                        firstName: e.target.value,
                      }))
                    }
                    placeholder="Grace"
                    className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={managerForm.lastName}
                    onChange={(e) =>
                      setManagerForm((p) => ({
                        ...p,
                        lastName: e.target.value,
                      }))
                    }
                    placeholder="Wanjiku"
                    className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Studio Username
                  </label>
                  <input
                    type="text"
                    value={managerForm.username}
                    onChange={(e) =>
                      setManagerForm((p) => ({
                        ...p,
                        username: e.target.value,
                      }))
                    }
                    placeholder="e.g. grace_mgr"
                    minLength={4}
                    className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={managerForm.email}
                    onChange={(e) =>
                      setManagerForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="manager@sherryhomes.com"
                    className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={managerForm.phoneNumber}
                    onChange={(e) =>
                      setManagerForm((p) => ({
                        ...p,
                        phoneNumber: e.target.value,
                      }))
                    }
                    className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Gender
                  </label>
                  <select
                    value={managerForm.gender}
                    onChange={(e) =>
                      setManagerForm((p) => ({ ...p, gender: e.target.value }))
                    }
                    className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm">
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Login Password (min 8 characters)
                </label>
                <input
                  type="password"
                  minLength={8}
                  value={managerForm.password}
                  onChange={(e) =>
                    setManagerForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="Create password for manager"
                  className="min-h-[42px] w-full rounded-xl border border-sky-200 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManagerModalOpen(false)}
                  className="min-h-[42px] rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-slate-700">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingManager}
                  className="min-h-[42px] rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60">
                  {savingManager ? "Creating..." : "Create Manager"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
