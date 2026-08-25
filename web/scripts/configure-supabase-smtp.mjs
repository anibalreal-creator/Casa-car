const required = [
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_PROJECT_REF",
  "SMTP_ADMIN_EMAIL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Faltan variables para configurar SMTP: ${missing.join(", ")}`);
  process.exit(1);
}

const projectRef = process.env.SUPABASE_PROJECT_REF;
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;

const payload = {
  external_email_enabled: true,
  mailer_secure_email_change_enabled: true,
  mailer_autoconfirm: false,
  smtp_admin_email: process.env.SMTP_ADMIN_EMAIL,
  smtp_host: process.env.SMTP_HOST,
  smtp_port: Number(process.env.SMTP_PORT),
  smtp_user: process.env.SMTP_USER,
  smtp_pass: process.env.SMTP_PASS,
  smtp_sender_name: process.env.SMTP_SENDER_NAME || "Casa-Car",
};

const response = await fetch(endpoint, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  const body = await response.text();
  console.error(`No se pudo configurar SMTP en Supabase (${response.status}).`);
  console.error(body);
  process.exit(1);
}

console.log("SMTP de Supabase configurado correctamente para Casa-Car.");
