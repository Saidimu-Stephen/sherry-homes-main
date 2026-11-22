/** @format */

import connectDB from "@/app/lib/mongodb";
import { getStore } from "@/app/lib/store";
import Payment from "@/app/models/payment";
import Booking from "@/app/models/bookedDates";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const guestEmail = searchParams.get("guestEmail");

    const connected = await connectDB();
    if (!connected) {
      let payments = getStore().payments;
      if (guestEmail) {
        const lower = guestEmail.toLowerCase();
        payments = payments.filter(
          (p) => (p.guestEmail || "").toLowerCase() === lower
        );
      }
      return NextResponse.json(payments);
    }

    const query = {};
    if (guestEmail) query.guestEmail = guestEmail.toLowerCase();
    const payments = await Payment.find(query).sort({ createdAt: -1 });
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json(getStore().payments);
  }
}

export async function PATCH(req) {
  try {
    const {
      paymentId,
      bookingId,
      action,
      method,
      last4,
      approvedBy = "Stephen Saidimu",
      approveImmediately = false,
    } = await req.json();

    if (!action || (!paymentId && !bookingId)) {
      return NextResponse.json(
        {
          success: false,
          msg: "Payment or booking reference and action are required.",
        },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    let updateFields = {};

    if (action === "approve") {
      updateFields = {
        status: "paid",
        hostApproved: true,
        approvedBy,
        approvedAt: nowIso,
      };
    } else if (action === "refund") {
      updateFields = {
        status: "refunded",
        hostApproved: false,
      };
    } else {
      // mark_paid (from guest payment or host manual confirmation)
      updateFields = {
        status: "paid",
        hostApproved: Boolean(approveImmediately),
        ...(approveImmediately ? { approvedBy, approvedAt: nowIso } : {}),
        ...(method ? { method } : {}),
        ...(last4 ? { last4 } : {}),
      };
    }

    const connected = await connectDB();

    if (!connected) {
      const store = getStore();
      let updatedPayment = null;
      store.payments = store.payments.map((p) => {
        if (
          (paymentId && p._id === paymentId) ||
          (bookingId && p.bookingId === bookingId)
        ) {
          updatedPayment = { ...p, ...updateFields };
          return updatedPayment;
        }
        return p;
      });

      const targetBookingId = updatedPayment?.bookingId || bookingId;
      if (targetBookingId) {
        store.bookings = store.bookings.map((b) =>
          b._id === targetBookingId
            ? {
                ...b,
                paymentStatus: updateFields.status,
                hostApproved: Boolean(updateFields.hostApproved),
                ...(updateFields.approvedBy
                  ? {
                      approvedBy: updateFields.approvedBy,
                      approvedAt: updateFields.approvedAt,
                    }
                  : {}),
                ...(method ? { paymentMethod: method } : {}),
              }
            : b
        );
      }

      if (!updatedPayment) {
        return NextResponse.json(
          { success: false, msg: "Payment record not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        msg:
          action === "approve"
            ? "Payment approved! Keybox & Wi-Fi details released to guest."
            : action === "refund"
            ? "Payment marked as refunded and access revoked."
            : approveImmediately
            ? "Payment confirmed & check-in access sent to guest."
            : "Payment submitted! Awaiting host verification to unlock check-in access.",
        data: updatedPayment,
      });
    }

    const filter = paymentId ? { _id: paymentId } : { bookingId };
    const updatedPayment = await Payment.findOneAndUpdate(filter, updateFields, {
      new: true,
    });
    if (!updatedPayment) {
      return NextResponse.json(
        { success: false, msg: "Payment record not found." },
        { status: 404 }
      );
    }

    if (updatedPayment.bookingId) {
      await Booking.findByIdAndUpdate(updatedPayment.bookingId, {
        paymentStatus: updateFields.status,
        hostApproved: Boolean(updateFields.hostApproved),
        ...(updateFields.approvedBy
          ? {
              approvedBy: updateFields.approvedBy,
              approvedAt: updateFields.approvedAt,
            }
          : {}),
        ...(method ? { paymentMethod: method } : {}),
      });
    }

    return NextResponse.json({
      success: true,
      msg:
        action === "approve"
          ? "Payment approved! Keybox & Wi-Fi details released to guest."
          : action === "refund"
          ? "Payment marked as refunded and access revoked."
          : approveImmediately
          ? "Payment confirmed & check-in access sent to guest."
          : "Payment submitted! Awaiting host verification to unlock check-in access.",
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json(
      { success: false, msg: "Unable to update payment." },
      { status: 500 }
    );
  }
}
