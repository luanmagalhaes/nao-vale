export function supabaseUrl(): string {
  const valor = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!valor) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ausente");
  }

  return valor;
}

export function supabasePublishableKey(): string {
  const valor = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!valor) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ausente");
  }

  return valor;
}

export function supabaseSecretKey(): string {
  const valor = process.env.SUPABASE_SECRET_KEY;

  if (!valor) {
    throw new Error("SUPABASE_SECRET_KEY ausente");
  }

  return valor;
}
