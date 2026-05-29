
export default async function handler(req, res) {
  return res.status(200).json({ ok: true, message: "La subida se realiza desde el navegador con Supabase Storage." });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
    responseLimit: '8mb',
  },
};
