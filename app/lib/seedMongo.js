/** @format */

import { getStore } from "./store";
import User from "@/app/models/users";
import ApartmentDetails from "@/app/models/apartment";
import Room from "@/app/models/roomDetails";
import MainImage from "@/app/models/mainImageModel";
import MinorImage from "@/app/models/minorImageModel";
import Booking from "@/app/models/bookedDates";
import Payment from "@/app/models/payment";
import Conversation from "@/app/models/message";
import Review from "@/app/models/review";

const globalForSeed = globalThis;

export async function ensureMongoSeeded() {
  if (globalForSeed.__sherryMongoSeededV2) return;
  if (globalForSeed.__sherryMongoSeedPromise) {
    return globalForSeed.__sherryMongoSeedPromise;
  }

  globalForSeed.__sherryMongoSeedPromise = (async () => {
    try {
      const seed = getStore();

      // 1. Ensure Super Admin (Compess / stevensaidimu@gmail.com), Manager, and Demo Guest accounts exist with avatars
      for (const u of seed.users) {
        const exists = await User.findOne({
          $or: [{ email: u.email.toLowerCase() }, { username: u.username }],
        });
        if (!exists) {
          await User.create({
            firstName: u.firstName,
            lastName: u.lastName,
            username: u.username,
            email: u.email.toLowerCase(),
            phoneNumber: u.phoneNumber,
            gender: u.gender,
            role: u.role,
            avatar: u.avatar,
            createdBy: u.createdBy || "",
            password: u.password,
          });
        } else if (u.role === "super_admin") {
          exists.username = u.username;
          exists.email = u.email.toLowerCase();
          exists.firstName = u.firstName;
          exists.lastName = u.lastName;
          exists.role = "super_admin";
          exists.password = u.password;
          if (!exists.avatar) exists.avatar = u.avatar;
          await exists.save();
        } else if (!exists.avatar && u.avatar) {
          exists.avatar = u.avatar;
          await exists.save();
        }
      }

      // 2. Ensure all 10+ apartments exist with keybox & Wi-Fi & host details
      for (const apt of seed.apartments) {
        const foundApt = await ApartmentDetails.findOne({
          apartmentName: apt.apartmentName,
        });
        if (!foundApt) {
          await ApartmentDetails.create({
            apartmentName: apt.apartmentName,
            location: apt.location,
            keyboxCode: apt.keyboxCode,
            keyboxInstructions: apt.keyboxInstructions,
            wifiName: apt.wifiName,
            wifiPassword: apt.wifiPassword,
            hostName: apt.hostName,
            hostEmail: apt.hostEmail,
            hostAvatar: apt.hostAvatar,
          });
        } else if (!foundApt.keyboxCode || !foundApt.wifiName) {
          foundApt.keyboxCode = foundApt.keyboxCode || apt.keyboxCode;
          foundApt.keyboxInstructions =
            foundApt.keyboxInstructions || apt.keyboxInstructions;
          foundApt.wifiName = foundApt.wifiName || apt.wifiName;
          foundApt.wifiPassword = foundApt.wifiPassword || apt.wifiPassword;
          foundApt.hostName = foundApt.hostName || apt.hostName;
          foundApt.hostEmail = foundApt.hostEmail || apt.hostEmail;
          foundApt.hostAvatar = foundApt.hostAvatar || apt.hostAvatar;
          await foundApt.save();
        }
      }

      // 3. Ensure all seeded rooms exist
      for (const r of seed.rooms) {
        const foundRoom = await Room.findOne({ roomName: r.roomName });
        if (!foundRoom) {
          await Room.create({
            roomName: r.roomName,
            roomType: r.roomType,
            numberOfGuests: r.numberOfGuests,
            numberOfBeds: r.numberOfBeds,
            roomDescription: r.roomDescription,
            price: r.price,
            nameOfApartment: r.nameOfApartment,
          });
        }
      }

      // 4. Ensure each room has its catchy main image and 5+ supporting images
      for (const img of seed.mainImages) {
        const foundMain = await MainImage.findOne({
          selectedRoomName: img.selectedRoomName,
        });
        if (!foundMain) {
          await MainImage.create({
            selectedRoomName: img.selectedRoomName,
            mainImage: img.mainImage,
          });
        }
      }

      for (const img of seed.minorImages) {
        const foundMinor = await MinorImage.findOne({
          selectedRoomName: img.selectedRoomName,
        });
        if (!foundMinor) {
          await MinorImage.create({
            selectedRoomName: img.selectedRoomName,
            minorImages: img.minorImages,
          });
        } else if ((foundMinor.minorImages || []).length < 5) {
          const merged = Array.from(
            new Set([...(foundMinor.minorImages || []), ...img.minorImages])
          );
          foundMinor.minorImages = merged;
          await foundMinor.save();
        }
      }

      // 5. Seed initial bookings & matching payments if empty
      const bookingCount = await Booking.countDocuments();
      if (bookingCount === 0) {
        for (const bk of seed.bookings) {
          const createdBk = await Booking.create({
            checkInDate: bk.checkInDate,
            checkOutDate: bk.checkOutDate,
            roomName: bk.roomName,
            apartmentName: bk.apartmentName,
            guestName: bk.guestName,
            guestEmail: bk.guestEmail,
            guestAvatar: bk.guestAvatar,
            nights: bk.nights,
            totalPrice: bk.totalPrice,
            paymentStatus: bk.paymentStatus,
            hostApproved: Boolean(bk.hostApproved),
            approvedBy: bk.approvedBy || "",
            approvedAt: bk.approvedAt || undefined,
            paymentMethod: bk.paymentMethod,
            isBlocked: bk.isBlocked,
            notes: bk.notes,
            bookedDates: bk.bookedDates,
          });

          const matchingPay = seed.payments.find((p) => p.bookingId === bk._id);
          if (matchingPay) {
            await Payment.create({
              bookingId: String(createdBk._id),
              roomName: matchingPay.roomName,
              apartmentName: matchingPay.apartmentName,
              guestName: matchingPay.guestName,
              guestEmail: matchingPay.guestEmail,
              guestAvatar: matchingPay.guestAvatar,
              nights: matchingPay.nights,
              subtotal: matchingPay.subtotal,
              cleaningFee: matchingPay.cleaningFee,
              serviceFee: matchingPay.serviceFee,
              amount: matchingPay.amount,
              method: matchingPay.method,
              last4: matchingPay.last4,
              reference: matchingPay.reference,
              status: matchingPay.status,
              hostApproved: Boolean(matchingPay.hostApproved),
              approvedBy: matchingPay.approvedBy || "",
              approvedAt: matchingPay.approvedAt || undefined,
            });
          }
        }
      }

      // 6. Ensure conversations exist if empty
      const msgCount = await Conversation.countDocuments();
      if (msgCount === 0) {
        for (const thr of seed.messages) {
          await Conversation.create({
            apartmentName: thr.apartmentName,
            roomName: thr.roomName,
            guestName: thr.guestName,
            guestEmail: thr.guestEmail,
            guestAvatar: thr.guestAvatar,
            hostName: thr.hostName,
            hostAvatar: thr.hostAvatar,
            subject: thr.subject,
            unreadForHost: thr.unreadForHost,
            unreadForGuest: thr.unreadForGuest,
            messages: thr.messages.map((m) => ({
              senderRole: m.senderRole,
              senderName: m.senderName,
              text: m.text,
              createdAt: m.createdAt,
            })),
          });
        }
      }

      // 7. Ensure reviews exist if empty
      const revCount = await Review.countDocuments();
      if (revCount === 0) {
        for (const rev of seed.reviews) {
          await Review.create({
            apartmentName: rev.apartmentName,
            roomName: rev.roomName,
            guestName: rev.guestName,
            guestAvatar: rev.guestAvatar,
            rating: rev.rating,
            comment: rev.comment,
          });
        }
      }

      globalForSeed.__sherryMongoSeededV2 = true;
    } catch (err) {
      console.warn("Mongo seed warning:", err.message);
    } finally {
      globalForSeed.__sherryMongoSeedPromise = null;
    }
  })();

  return globalForSeed.__sherryMongoSeedPromise;
}
