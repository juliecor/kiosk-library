// cronJobs/overdueAndLateFeeChecker.js
import cron from "node-cron";
import axios from "axios";
import BorrowedRequest from "../models/borrowedRequest.js";

const SMS_GATEWAY_URL = "http://192.168.1.2:8080/send";
const DAILY_LATE_FEE = 5;

// 💡 Reusable function to run overdue checks
export async function checkOverdues() {
  console.log("📅 Checking overdue books...");
  const today = new Date();

  const overdueList = await BorrowedRequest.find({
    status: { $in: ["approved", "overdue"] },
    returnDate: null,
    dueDate: { $lt: today }
  }).populate("student").populate("book");

  for (const request of overdueList) {
    const student = request.student;
    const book = request.book;
    if (!student || !book) continue;

    const dueDate = new Date(request.dueDate);
    
    // 🔧 FIX: Use Math.ceil for consistency with frontend
    const daysLate = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
    if (daysLate <= 0) continue;

    const newFee = daysLate * DAILY_LATE_FEE;

    request.status = "overdue";
    request.lateFee = newFee;
    await request.save();

    try {
      if (student.contactNumber) {
        await axios.get(SMS_GATEWAY_URL, {
          params: {
            to: student.contactNumber,
            message: `BENEDICTO COLLEGE LIBRARY: Hi ${student.firstName}, the book "${book.title}" is overdue by ${daysLate} day(s). Your current late fee is PHP ${newFee}. Please return it soon.`
          }
        });
        console.log(`📲 SMS sent to ${student.firstName} (${student.contactNumber})`);
      }
    } catch (smsError) {
      console.error("❌ SMS sending failed:", smsError.message);
    }
  }

  console.log("✅ Overdue and late fee check done.");
}

// ⏰ Schedule it daily at 8 AM
cron.schedule("25 20 * * *", checkOverdues);

// 🚀 Run once immediately for testing
(async () => {
  console.log("🚀 Manual test: running overdue check now...");
  await checkOverdues();
})();
