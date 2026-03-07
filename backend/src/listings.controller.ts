import { Request, Response } from "express";
import { supabase } from "./supabase";
export async function getListings(req: Request, res: Response) {
  const { data } = await supabase.from("listings").select("*").order("id", { ascending: false });
  res.json(data || []);
}
export async function createListing(req: Request, res: Response) {
  const { titulo, precio, descripcion, moneda } = req.body;
  if (!titulo || !Number.isFinite(precio) || precio <= 0) {
    return res.status(400).json({ error: "Precio inválido" });
  }
  const { error } = await supabase.from("listings").insert([{ titulo, precio, descripcion, moneda }]);
  if (error) return res.status(500).json({ error });
  res.json({ ok: true });
}
