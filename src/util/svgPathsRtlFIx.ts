// see https://github.com/openstreetmap/iD/pull/3707
// https://gist.github.com/mapmeld/556b09ddec07a2044c76e1ef45f01c60
// fixed in Chromium 96.0 https://bugs.chromium.org/p/chromium/issues/detail?id=374526

import { WordShaper } from 'alif-toolkit'

export const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u07BF\u08A0–\u08BF]/

export function fixRTLTextForSvg(inputText: string) {
  let ret = ''
  let rtlBuffer: Array<any> = []
  const arabicRegex = /[\u0600-\u06FF]/g
  const arabicDiacritics = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g
  const arabicMath = /[\u0660-\u066C\u06F0-\u06F9]+/g
  const thaanaVowel = /[\u07A6-\u07B0]/
  const hebrewSign = /[\u0591-\u05BD\u05BF\u05C1-\u05C5\u05C7]/

  // Arabic word shaping
  if (arabicRegex.test(inputText))
    inputText = WordShaper(inputText)

  for (let n = 0; n < inputText.length; n++) {
    const c = inputText[n]
    if (arabicMath.test(c)) {
      // Arabic numbers go LTR
      ret += rtlBuffer.reverse().join('')
      rtlBuffer = [c]
    }
    else {
      if (rtlBuffer.length && arabicMath.test(rtlBuffer[rtlBuffer.length - 1])) {
        ret += rtlBuffer.reverse().join('')
        rtlBuffer = []
      }
      if ((thaanaVowel.test(c) || hebrewSign.test(c) || arabicDiacritics.test(c)) && rtlBuffer.length) {
        rtlBuffer[rtlBuffer.length - 1] += c
      }
      else if (rtlRegex.test(c)
                // include Arabic presentation forms
                || (c.charCodeAt(0) >= 64336 && c.charCodeAt(0) <= 65023)
                || (c.charCodeAt(0) >= 65136 && c.charCodeAt(0) <= 65279)) {
        rtlBuffer.push(c)
      }
      else if (c === ' ' && rtlBuffer.length) {
        // whitespace within RTL text
        rtlBuffer = [`${rtlBuffer.reverse().join('')} `]
      }
      else {
        // non-RTL character
        ret += rtlBuffer.reverse().join('') + c
        rtlBuffer = []
      }
    }
  }
  ret += rtlBuffer.reverse().join('')
  return ret
}
