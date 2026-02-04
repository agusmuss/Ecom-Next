import { NextResponse } from "next/server";
import { del, put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("file");

  if (!files.length) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }

  const uploads = await Promise.all(
    files.map(async (file) => {
      if (!(file instanceof File)) {
        return null;
      }
      const extension = file.name.split(".").pop();
      const filename = `${crypto.randomUUID()}.${extension ?? "bin"}`;
      const blob = await put(filename, file, { access: "public" });
      return blob.url;
    })
  );

  const urls = uploads.filter((url): url is string => Boolean(url));
  return NextResponse.json({ urls });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const urls = Array.isArray(body?.urls) ? body.urls : [];

  if (!urls.length) {
    return NextResponse.json({ ok: true });
  }

  await del(urls);
  return NextResponse.json({ ok: true });
}
