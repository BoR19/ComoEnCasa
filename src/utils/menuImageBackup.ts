import { getDishPhotoUrl } from '../components/BrandAssets';
import { MenuItem } from '../types/app';

export interface ImageBackupProgress {
  phase: 'downloading' | 'compressing';
  current: number;
  total: number;
  currentName: string;
  percent: number;
  downloadedCount: number;
  fallbackCount: number;
}

export interface ImageBackupResult {
  total: number;
  downloadedCount: number;
  fallbackCount: number;
}

function slugifyDishName(input: string): string {
  const normalized = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'plato';
}

function resolveExtension(mimeType: string | undefined, url: string): string {
  const cleanMime = (mimeType || '').toLowerCase();
  if (cleanMime.includes('png')) return 'png';
  if (cleanMime.includes('webp')) return 'webp';
  if (cleanMime.includes('gif')) return 'gif';
  if (cleanMime.includes('jpeg') || cleanMime.includes('jpg')) return 'jpg';

  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.png')) return 'png';
  if (cleanUrl.endsWith('.webp')) return 'webp';
  if (cleanUrl.endsWith('.gif')) return 'gif';
  return 'jpg';
}

function escapeCsvCell(value: string): string {
  const singleLine = value.replace(/[\r\n]+/g, ' ').trim();
  if (
    singleLine.includes(';') ||
    singleLine.includes('"') ||
    singleLine.includes('\n')
  ) {
    return `"${singleLine.replace(/"/g, '""')}"`;
  }
  return singleLine;
}

function computeUniqueSlugs(menuItems: MenuItem[]): string[] {
  const usedSlugs = new Map<string, number>();
  return menuItems.map((item) => {
    const baseSlug = slugifyDishName(item.id || item.name);
    const seenCount = (usedSlugs.get(baseSlug) || 0) + 1;
    usedSlugs.set(baseSlug, seenCount);
    return seenCount > 1 ? `${baseSlug}-${seenCount}` : baseSlug;
  });
}

export function buildMenuCsvContent(
  menuItems: MenuItem[],
  resolvedFileNames?: string[]
): string {
  const slugs = computeUniqueSlugs(menuItems);
  const headers = [
    'ID',
    'Nombre del Plato',
    'Categoría',
    'Descripción',
    'Precio (Bs.)',
    'Estado',
    'Nombre Archivo Imagen',
  ];

  const rows: string[] = [headers.map(escapeCsvCell).join(';')];

  menuItems.forEach((item, index) => {
    const imageUrl = getDishPhotoUrl(item.visualType, item.id);
    const fallbackFileName = `${slugs[index]}.${resolveExtension(undefined, imageUrl)}`;
    const fileName = resolvedFileNames?.[index] || fallbackFileName;

    const row = [
      item.id,
      item.name,
      item.category,
      item.description,
      item.priceBadge,
      item.available ? 'Disponible' : 'Agotado',
      fileName,
    ];
    rows.push(row.map(escapeCsvCell).join(';'));
  });

  return `\uFEFF${rows.join('\r\n')}`;
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}

export function downloadMenuCsvOnly(menuItems: MenuItem[]): void {
  const csvContent = buildMenuCsvContent(menuItems);
  const csvBlob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  triggerBrowserDownload(csvBlob, 'carta-menu.csv');
}

function loadImageViaCanvas(url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 800;
        canvas.height = img.naturalHeight || img.height || 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No 2D canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          'image/jpeg',
          0.92
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Canvas image load error'));
    img.src = url;
  });
}

async function fetchImageBlobWithFallback(
  url: string
): Promise<{ blob: Blob; method: 'fetch' | 'canvas' }> {
  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    if (!blob || blob.size === 0) {
      throw new Error('Empty blob');
    }
    return { blob, method: 'fetch' };
  } catch {
    const canvasBlob = await loadImageViaCanvas(url);
    return { blob: canvasBlob, method: 'canvas' };
  }
}

export async function downloadMenuFullBackupZip(
  menuItems: MenuItem[],
  onProgress?: (progress: ImageBackupProgress) => void
): Promise<ImageBackupResult> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const imagesFolder = zip.folder('imagenes');
  const total = menuItems.length;
  const slugs = computeUniqueSlugs(menuItems);
  const resolvedFileNames: string[] = [];

  const manifestLines: string[] = [
    'RESPALDO COMPLETO DEL MENU - COMO EN CASA',
    `Fecha: ${new Date().toLocaleString('es-BO')}`,
    `Total de productos: ${total}`,
    '------------------------------------------------------------',
    '',
  ];

  let downloadedCount = 0;
  let fallbackCount = 0;

  for (let i = 0; i < total; i++) {
    const item = menuItems[i];
    const imageUrl = getDishPhotoUrl(item.visualType, item.id);
    const uniqueSlug = slugs[i];

    onProgress?.({
      phase: 'downloading',
      current: i + 1,
      total,
      currentName: item.name,
      percent: total > 0 ? Math.round((i / total) * 85) : 0,
      downloadedCount,
      fallbackCount,
    });

    try {
      const { blob, method } = await fetchImageBlobWithFallback(imageUrl);
      const ext = resolveExtension(blob.type, imageUrl);
      const fileName = `${uniqueSlug}.${ext}`;
      resolvedFileNames[i] = fileName;

      if (imagesFolder) {
        imagesFolder.file(fileName, blob);
      } else {
        zip.file(`imagenes/${fileName}`, blob);
      }

      downloadedCount += 1;
      manifestLines.push(
        `[OK - ${method}] ${item.name} (${item.category}) -> imagenes/${fileName} | URL: ${imageUrl}`
      );
    } catch {
      fallbackCount += 1;
      const defaultName = `${uniqueSlug}.${resolveExtension(undefined, imageUrl)}`;
      resolvedFileNames[i] = `${defaultName} (CORS - ver lista-imagenes.txt)`;
      manifestLines.push(
        `[SOLO URL - CORS] ${item.name} (${item.category}) | URL: ${imageUrl}`
      );
    }
  }

  manifestLines.push('');
  manifestLines.push(
    `Resumen: ${downloadedCount} imagenes descargadas en imagenes/, ${fallbackCount} registradas solo como URL.`
  );

  // Add Excel-ready UTF-8 BOM CSV at the root of the zip
  const csvContent = buildMenuCsvContent(menuItems, resolvedFileNames);
  zip.file('carta-menu.csv', csvContent);

  if (fallbackCount > 0) {
    zip.file('lista-imagenes.txt', manifestLines.join('\n'));
  }

  onProgress?.({
    phase: 'compressing',
    current: total,
    total,
    currentName: 'Empaquetando imagenes/ y carta-menu.csv...',
    percent: 90,
    downloadedCount,
    fallbackCount,
  });

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (meta) => {
      onProgress?.({
        phase: 'compressing',
        current: total,
        total,
        currentName: 'Comprimiendo respaldo-menu-imagenes.zip...',
        percent: 85 + Math.round((meta.percent / 100) * 15),
        downloadedCount,
        fallbackCount,
      });
    }
  );

  triggerBrowserDownload(zipBlob, 'respaldo-menu-imagenes.zip');

  return {
    total,
    downloadedCount,
    fallbackCount,
  };
}
