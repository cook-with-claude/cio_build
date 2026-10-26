// Loaded before the tests (see "test" in package.json). Teaches Node the two
// import conventions Vite already understands, so tests can import app code
// as is:
//   "@/lib/rules"  -> "src/lib/rules"   (the alias in vite.config.js)
//   "./dates"      -> "./dates.js"      (no file extension)

import { registerHooks } from 'node:module'

const SRC = new URL('../src/', import.meta.url)

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), SRC).href
    try {
      return nextResolve(specifier, context)
    } catch (error) {
      const hasExtension = /\.[a-z]+$/i.test(specifier)
      if (error.code !== 'ERR_MODULE_NOT_FOUND' || hasExtension) throw error
      return nextResolve(`${specifier}.js`, context)
    }
  },
})
