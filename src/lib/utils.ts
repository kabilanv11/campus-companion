import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge the design's named text sizes, so `text-caption` isn't mistaken
// for a colour and doesn't knock out `text-btn-ink` (and the reverse).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['greeting', 'num', 'meal', 'dayread', 'body', 'label', 'code', 'name', 'time', 'meta', 'caption', 'tab'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
