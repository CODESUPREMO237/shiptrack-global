import { supabaseAdmin } from "@/lib/supabaseClient";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/adminAuth";

// GET handler to fetch all feedbacks
export async function GET(req) {
  const authResult = await requireAdminUser(req);
  if (authResult.response) return authResult.response;

  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, error: "Server not configured" },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Error fetching feedbacks" },
      { status: 500 }
    );
  }
}

// POST handler to submit feedback
export async function POST(req) {
  try {
    const { name, email, feedback } = await req.json();

    if (!name || !email || !feedback) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Save feedback to Supabase
    const { data, error: supabaseError } = await supabaseAdmin
      .from("feedback")
      .insert([{ name, email, message: feedback }]);

    if (supabaseError) throw supabaseError;

    // Send email notification
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true,
      auth: {
        user: process.env.FEEDBACK_EMAIL,
        pass: process.env.FEEDBACK_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.FEEDBACK_EMAIL,
      replyTo: email,
      to: process.env.FEEDBACK_EMAIL,
      subject: `Feedback from ${name}`,
      text: feedback,
      html: `<p>${feedback}</p><p>From: ${name} (${email})</p>`,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Error submitting feedback" },
      { status: 500 }
    );
  }
}
