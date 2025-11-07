import { supabase } from "../../lib/supabase";

export async function GET() {
  const { data, error } = await supabase.from("documents").select("*").limit(1);
  if (error) {
    return Response.json({ message: "Connection failed!", error }, { status: 500 });
  }
  return Response.json({ message: "Supabase connected successfully!", data });
}
