import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function normalizePath(pathname: string): string {
  let readable = pathname;

  try {
    readable = decodeURIComponent(pathname);
  } catch {
    readable = pathname;
  }

  return readable
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const normalized = normalizePath(pathname);

  if (normalized === pathname) {
    return NextResponse.next();
  }

  const target = request.nextUrl.clone();

  target.pathname = normalized;

  return NextResponse.redirect(target);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\.).*)"],
};
