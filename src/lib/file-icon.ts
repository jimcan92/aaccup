import File from '@lucide/svelte/icons/file';
import FileArchive from '@lucide/svelte/icons/file-archive';
import FileImage from '@lucide/svelte/icons/file-image';
import FileMusic from '@lucide/svelte/icons/file-music';
import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
import FileText from '@lucide/svelte/icons/file-text';
import FileVideoCamera from '@lucide/svelte/icons/file-video-camera';
import Folder from '@lucide/svelte/icons/folder';
import Presentation from '@lucide/svelte/icons/presentation';

/** A Lucide icon for a Drive item, chosen from its MIME type. */
export function fileIcon(mimeType: string) {
	if (mimeType === 'application/vnd.google-apps.folder') return Folder;
	if (mimeType.startsWith('image/') || mimeType === 'application/vnd.google-apps.drawing') return FileImage;
	if (mimeType.startsWith('video/')) return FileVideoCamera;
	if (mimeType.startsWith('audio/')) return FileMusic;
	if (/spreadsheet|excel|csv/.test(mimeType)) return FileSpreadsheet;
	if (/presentation|powerpoint/.test(mimeType)) return Presentation;
	if (/zip|compressed|x-rar|x-7z|x-tar/.test(mimeType)) return FileArchive;
	if (/pdf|document|msword|text\//.test(mimeType)) return FileText;
	return File;
}

/** Icon tint per kind, so a list of mixed files scans quickly. */
export function fileIconTone(mimeType: string): string {
	if (/pdf/.test(mimeType)) return 'text-red-600 dark:text-red-400';
	if (/spreadsheet|excel|csv/.test(mimeType)) return 'text-emerald-600 dark:text-emerald-400';
	if (/presentation|powerpoint/.test(mimeType)) return 'text-amber-600 dark:text-amber-400';
	if (/document|msword/.test(mimeType)) return 'text-blue-600 dark:text-blue-400';
	if (mimeType.startsWith('image/')) return 'text-violet-600 dark:text-violet-400';
	return 'text-ink-soft';
}
