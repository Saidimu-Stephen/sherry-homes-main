/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import Conversation from "@/app/models/message";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const guestEmail = searchParams.get("guestEmail");
    const threadId = searchParams.get("threadId");

    const connected = await connectDB();
    if (!connected) {
      let threads = [...getStore().messages].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      if (threadId) {
        threads = threads.filter((t) => t._id === threadId);
      } else if (guestEmail) {
        const lower = guestEmail.toLowerCase();
        threads = threads.filter(
          (t) => (t.guestEmail || "").toLowerCase() === lower
        );
      }
      return NextResponse.json(threads);
    }

    const query = {};
    if (threadId) query._id = threadId;
    else if (guestEmail) query.guestEmail = guestEmail.toLowerCase();

    const threads = await Conversation.find(query).sort({ updatedAt: -1 });
    return NextResponse.json(threads);
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(getStore().messages);
  }
}

export async function POST(req) {
  try {
    const {
      threadId,
      apartmentName = "",
      roomName = "",
      guestName = "Guest",
      guestEmail = "",
      guestAvatar = "",
      hostName = "Stephen Saidimu",
      hostAvatar = "/images/avatars/host-stephen.jpg",
      senderRole = "guest",
      senderName,
      subject = "Stay inquiry",
      text,
    } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json(
        { success: false, msg: "Message text cannot be empty." },
        { status: 400 }
      );
    }

    const normalizedEmail = (guestEmail || "").trim().toLowerCase();
    const authorName =
      senderName?.trim() ||
      (senderRole === "host" ? hostName || "Stephen Saidimu" : guestName || "Guest");

    const newMessage = {
      _id: `msg-${Date.now()}`,
      senderRole: senderRole === "host" ? "host" : "guest",
      senderName: authorName,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    const connected = await connectDB();

    if (!connected) {
      const store = getStore();
      let thread = threadId
        ? store.messages.find((t) => t._id === threadId)
        : store.messages.find(
            (t) =>
              t.roomName === roomName &&
              t.guestEmail.toLowerCase() === normalizedEmail
          );

      if (thread) {
        thread.messages.push(newMessage);
        thread.updatedAt = new Date().toISOString();
        thread.unreadForHost = senderRole !== "host";
        thread.unreadForGuest = senderRole === "host";
        if (guestAvatar && !thread.guestAvatar) thread.guestAvatar = guestAvatar;
      } else {
        if (!roomName || !normalizedEmail) {
          return NextResponse.json(
            {
              success: false,
              msg: "Suite name and signed-in email are required to start a conversation.",
            },
            { status: 400 }
          );
        }
        thread = {
          _id: `thr-${Date.now()}`,
          apartmentName: apartmentName || "SherryHomes Residence",
          roomName,
          guestName: guestName || "Guest",
          guestEmail: normalizedEmail,
          guestAvatar: guestAvatar || "/images/avatars/guest-amina.jpg",
          hostName: hostName || "Stephen Saidimu",
          hostAvatar: hostAvatar || "/images/avatars/host-stephen.jpg",
          subject: subject || `Inquiry about ${roomName}`,
          unreadForHost: senderRole !== "host",
          unreadForGuest: senderRole === "host",
          updatedAt: new Date().toISOString(),
          messages: [newMessage],
        };
        store.messages.unshift(thread);
      }

      return NextResponse.json({
        success: true,
        msg: "Message sent.",
        data: thread,
      });
    }

    let thread = threadId
      ? await Conversation.findById(threadId)
      : await Conversation.findOne({
          roomName,
          guestEmail: normalizedEmail,
        });

    if (thread) {
      thread.messages.push({
        senderRole: newMessage.senderRole,
        senderName: newMessage.senderName,
        text: newMessage.text,
      });
      thread.unreadForHost = senderRole !== "host";
      thread.unreadForGuest = senderRole === "host";
      if (guestAvatar && !thread.guestAvatar) thread.guestAvatar = guestAvatar;
      await thread.save();
    } else {
      if (!roomName || !normalizedEmail) {
        return NextResponse.json(
          {
            success: false,
            msg: "Suite name and signed-in email are required to start a conversation.",
          },
          { status: 400 }
        );
      }
      thread = await Conversation.create({
        apartmentName: apartmentName || "SherryHomes Residence",
        roomName,
        guestName: guestName || "Guest",
        guestEmail: normalizedEmail,
        guestAvatar: guestAvatar || "/images/avatars/guest-amina.jpg",
        hostName: hostName || "Stephen Saidimu",
        hostAvatar: hostAvatar || "/images/avatars/host-stephen.jpg",
        subject: subject || `Inquiry about ${roomName}`,
        unreadForHost: senderRole !== "host",
        unreadForGuest: senderRole === "host",
        messages: [
          {
            senderRole: newMessage.senderRole,
            senderName: newMessage.senderName,
            text: newMessage.text,
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      msg: "Message sent.",
      data: thread,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { success: false, msg: "Unable to send message." },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const { threadId, role } = await req.json();
    if (!threadId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const connected = await connectDB();
    if (!connected) {
      const thread = getStore().messages.find((t) => t._id === threadId);
      if (thread) {
        if (role === "host") thread.unreadForHost = false;
        if (role === "guest") thread.unreadForGuest = false;
      }
      return NextResponse.json({ success: true });
    }

    const update =
      role === "host" ? { unreadForHost: false } : { unreadForGuest: false };
    await Conversation.findByIdAndUpdate(threadId, update);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
