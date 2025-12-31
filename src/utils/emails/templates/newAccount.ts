export function newAccountTemplate(displayName: string | null) {
  const subject = "Welcome to Cinetegrate 🎬 Your Journey Begins";

  const text = `
Hi ${displayName ?? ""},

Your Cinetegrate account is ready.

You're now part of a community that celebrates stories, cinema, and creativity.  
To unlock the full experience, please verify your email from inside the Cinetegrate app.

If this wasn't you, feel free to ignore this message.
  `.trim();

  const html = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.7; color: #222;">
      <h2 style="margin-bottom: 8px;">Welcome to <span style="color:#2d7df4;">Cinetegrate</span> 🎬</h2>

      <p style="margin: 0 0 12px;">
        Hi ${displayName ?? ""},
      </p>

      <p style="margin: 0 0 12px;">
        Your account is officially created, and the reel has started rolling.
        You’re now part of a community built for people who love stories, frames, and the magic of cinema.
      </p>

      <p style="margin: 0 0 12px;">
        To unlock the full Cinetegrate experience, please verify your email
        from inside the app. Just a quick tap — like hitting "Play" on your favorite film.
      </p>

      <p style="margin: 0 0 12px;">
        If you didn’t create this account, you can safely ignore this message.
      </p>

      <p style="opacity: 0.8; margin-top: 20px; font-size: 14px;">
        Lights. Camera. Integrate. ✨
      </p>
    </div>
  `;

  return { subject, text, html };
}
