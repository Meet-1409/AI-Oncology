import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * Class merging, taught about this project's custom type scale.
 *
 * THIS CONFIGURATION IS LOAD-BEARING, not tidiness. tailwind-merge resolves
 * conflicts by group, and it has no way to know that `text-display` is a
 * font-size rather than a text-colour — both are spelled `text-*`. Left to
 * guess, it filed our whole type scale under "text colour", so any element
 * carrying both a size and a tone (which is every heading in the application,
 * since `Text` composes `level` and `tone`) had its SIZE silently deleted by
 * the later colour class.
 *
 * The symptom was a 3.25rem display heading rendering at the 16px inherited
 * default, everywhere, with no error and no warning — the classes were all
 * present in the source and simply absent from the DOM.
 *
 * Declaring the scale here is what makes `level` and `tone` composable.
 */
const TEXT_SCALE = [
  'display',
  'title',
  'heading',
  'subheading',
  'body',
  'secondary',
  'caption',
  'micro',
  'edge',
]

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: TEXT_SCALE }],
      'font-family': ['font-display', 'font-sans'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
