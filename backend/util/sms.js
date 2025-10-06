// utils/sms.js
const axios = require("axios");

exports.sendSMS = async (number, message) => {
  try {
    await axios.post("http://192.168.1.30:8080/send", { number, message });
  } catch (error) {
    console.error("SMS sending failed:", error.message);
  }
};
