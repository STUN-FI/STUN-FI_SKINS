import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'image';
}

function toTitle(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const catalogueDir = path.join(process.cwd(), 'public', 'catalogue');
  const files = await fs.readdir(catalogueDir);

  const imageFiles = files
    .filter((file) => /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file))
    .sort();

  const limitValue = Number(searchParams.get('limit'));
  const safeLimit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, imageFiles.length) : imageFiles.length;

  const artworks = imageFiles.slice(0, safeLimit).map((file, index) => ({
    id: `${toSlug(file)}-${index + 1}`,
    category: 'Catalog',
    image: `/catalogue/${encodeURIComponent(file)}`,
    title: toTitle(file) || `Artwork ${index + 1}`,
  }));

  return NextResponse.json(artworks);
}
