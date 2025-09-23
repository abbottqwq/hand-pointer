import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines clsx and tailwind-merge for conditional class names with Tailwind deduplication
 * @param inputs - Class values that can be strings, objects, arrays, etc.
 * @returns Merged and deduplicated class string
 */
export function tw(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
