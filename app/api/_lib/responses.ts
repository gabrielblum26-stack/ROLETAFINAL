import { NextResponse } from "next/server";

export function ok(data: any, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created(data: any) {
  return NextResponse.json(data, { status: 201 });
}

export function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}
