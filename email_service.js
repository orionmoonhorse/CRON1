// email_service.js

import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

// Gmail SMTP transporter WITH FULL DEBUGGING
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  logger: true,            // <-- prints SMTP logs
  debug: true,             // <-- prints Gmail rejection messages
  tls: {
    rejectUnauthorized: false   // <-- prevents TLS handshake failures on Railway
  }
});

// Helper to log email attempts
function logDebug(label, data) {
  console.log(`DEBUG: ${label}`, data);
}

// EMAIL TO BUSINESS INBOX (LEAD)
export async function sendLeadEmail(lead) {
  logDebug("sendLeadEmail payload", lead);

  const message = {
    from: `"River City Gutter & Wash" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `New Gutter Lead: ${lead.name}`,
    text: `
New lead:

Name: ${lead.name}
Phone: ${lead.phone}
Email: ${lead.email}
Address: ${lead.address}
Service: ${lead.service}
Details: ${lead.details}
Created: ${lead.createdAt}
    `
  };

  try {
    console.log("DEBUG: Sending lead email...");
    await transporter.sendMail(message);
    console.log("DEBUG: Lead email sent successfully");
  } catch (err) {
    console.error("ERROR: Lead email failed:", err);
  }
}

// EMAIL TO CUSTOMER (LEAD CONFIRMATION)
export async function sendCustomerEmail(lead) {
  logDebug("sendCustomerEmail payload", lead);

  const message = {
    from: process.env.EMAIL_USER,
    to: lead.email,
    subject: "We received your request!",
    text: `
Hi ${lead.name},

Thanks for reaching out about ${lead.service}!

We received your request and will follow up shortly.

Here’s what you submitted:
Name: ${lead.name}
Phone: ${lead.phone}
Address: ${lead.address}
Service: ${lead.service}
Details: ${lead.details || "n/a"}

– River City Gutter & Wash
`
  };

  try {
    console.log("DEBUG: Sending customer email...");
    await transporter.sendMail(message);
    console.log("DEBUG: Customer email sent successfully");
  } catch (err) {
    console.error("ERROR: Customer email failed:", err);
  }
}

// EMAIL TO CUSTOMER (BOOKING CONFIRMATION)
export async function sendBookingEmail(appointment) {
  logDebug("sendBookingEmail payload", appointment);

  const message = {
    from: process.env.EMAIL_USER,
    to: appointment.email,
    subject: "Your appointment is booked!",
    text: `
Hi ${appointment.name},

Thanks for booking your ${appointment.service} with River City Gutter & Wash!

Your appointment is scheduled for:
Date: ${appointment.date}
Time: ${appointment.time}

– River City Gutter & Wash
`
  };

  try {
    console.log("DEBUG: Sending booking email...");
    await transporter.sendMail(message);
    console.log("DEBUG: Booking email sent successfully");
  } catch (err) {
    console.error("ERROR: Booking email failed:", err);
  }
}

// ⭐ DAY-BEFORE REMINDER EMAIL
export async function sendDayBeforeEmail(appointment) {
  logDebug("sendDayBeforeEmail payload", appointment);

  const message = {
    from: process.env.EMAIL_USER,
    to: appointment.email,
    subject: "Reminder: Your appointment is tomorrow",
    text: `
Hi ${appointment.name},

This is a reminder that your ${appointment.service} appointment is scheduled for tomorrow.

Date: ${appointment.date}
Time: ${appointment.time}

– River City Gutter & Wash
`
  };

  try {
    console.log("DEBUG: Sending day-before email...");
    await transporter.sendMail(message);
    console.log("DEBUG: Day-before email sent successfully");
  } catch (err) {
    console.error("ERROR: Day-before email failed:", err);
  }
}

// ⭐ MORNING-OF REMINDER EMAIL
export async function sendMorningOfEmail(appointment) {
  logDebug("sendMorningOfEmail payload", appointment);

  const message = {
    from: process.env.EMAIL_USER,
    to: appointment.email,
    subject: "Reminder: Your appointment is today",
    text: `
Good morning ${appointment.name},

This is a reminder that your ${appointment.service} appointment is scheduled for today.

Date: ${appointment.date}
Time: ${appointment.time}

We look forward to serving you!

– River City Gutter & Wash
`
  };

  try {
    console.log("DEBUG: Sending morning-of email...");
    await transporter.sendMail(message);
    console.log("DEBUG: Morning-of email sent successfully");
  } catch (err) {
    console.error("ERROR: Morning-of email failed:", err);
  }
}
