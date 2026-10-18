"use client"

import React, { useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { translateText, AppLanguage } from '@/lib/i18n'
import { Globe } from 'lucide-react'

const originalNodeText = new WeakMap<Node, string>()
const lastAppliedNodeText = new WeakMap<Node, string>()
const originalAttrMap = new WeakMap<Element, Record<string, string>>()
const lastAppliedAttrMap = new WeakMap<Element, Record<string, string>>()

const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'] as const

function shouldSkipElement(el: Element | null): boolean {
  if (!el) return true
  const tag = el.tagName
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CODE' || tag === 'SVG' || tag === 'PATH') {
    return true
  }
  if (el.closest('[data-no-translate="true"]')) {
    return true
  }
  return false
}

function processTextNode(node: Node, lang: AppLanguage) {
  if (node.nodeType !== Node.TEXT_NODE) return
  if (shouldSkipElement(node.parentElement)) return

  const currentVal = node.nodeValue || ''
  if (!currentVal.trim()) return

  const lastApplied = lastAppliedNodeText.get(node)
  let orig = originalNodeText.get(node)

  // If node has never been seen, or React updated its text since our last translation
  if (orig === undefined || (lastApplied !== undefined && currentVal !== lastApplied)) {
    orig = currentVal
    originalNodeText.set(node, orig)
  }

  const targetVal = lang === 'en' ? translateText(orig, 'en') : orig
  lastAppliedNodeText.set(node, targetVal)

  if (node.nodeValue !== targetVal) {
    node.nodeValue = targetVal
  }
}

function processElementAttributes(el: Element, lang: AppLanguage) {
  if (shouldSkipElement(el)) return

  let origAttrs = originalAttrMap.get(el)
  let appliedAttrs = lastAppliedAttrMap.get(el)

  if (!origAttrs) {
    origAttrs = {}
    originalAttrMap.set(el, origAttrs)
  }
  if (!appliedAttrs) {
    appliedAttrs = {}
    lastAppliedAttrMap.set(el, appliedAttrs)
  }

  for (const attr of TRANSLATABLE_ATTRS) {
    const val = el.getAttribute(attr)
    if (!val || !val.trim()) continue

    if (origAttrs[attr] === undefined || (appliedAttrs[attr] !== undefined && val !== appliedAttrs[attr])) {
      origAttrs[attr] = val
    }

    const targetVal = lang === 'en' ? translateText(origAttrs[attr], 'en') : origAttrs[attr]
    appliedAttrs[attr] = targetVal

    if (val !== targetVal) {
      el.setAttribute(attr, targetVal)
    }
  }
}

function walkAndTranslate(root: Node, lang: AppLanguage) {
  if (root.nodeType === Node.TEXT_NODE) {
    processTextNode(root, lang)
    return
  }

  if (root.nodeType === Node.ELEMENT_NODE) {
    const el = root as Element
    if (shouldSkipElement(el)) return
    processElementAttributes(el, lang)
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
  )

  let current: Node | null = walker.nextNode()
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      processTextNode(current, lang)
    } else if (current.nodeType === Node.ELEMENT_NODE) {
      processElementAttributes(current as Element, lang)
    }
    current = walker.nextNode()
  }
}

export function BilingualDomTranslator() {
  const { language } = useApp()
  const isProcessingRef = useRef(false)

  useEffect(() => {
    if (typeof document === 'undefined') return

    const runTranslation = (targetRoot: Node = document.body) => {
      if (isProcessingRef.current) return
      isProcessingRef.current = true
      try {
        walkAndTranslate(targetRoot, language)
      } finally {
        isProcessingRef.current = false
      }
    }

    // Immediate pass on language switch or mount
    runTranslation(document.body)

    const observer = new MutationObserver((mutations) => {
      if (isProcessingRef.current) return
      isProcessingRef.current = true
      try {
        for (const m of mutations) {
          if (m.type === 'characterData') {
            processTextNode(m.target, language)
          } else if (m.type === 'childList') {
            m.addedNodes.forEach((added) => {
              walkAndTranslate(added, language)
            })
          } else if (m.type === 'attributes' && m.target.nodeType === Node.ELEMENT_NODE) {
            processElementAttributes(m.target as Element, language)
          }
        }
      } finally {
        isProcessingRef.current = false
      }
    })

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    })

    return () => {
      observer.disconnect()
    }
  }, [language])

  return null
}

export function LanguageSwitcher({
  variant = 'header',
  className = '',
}: {
  variant?: 'header' | 'login' | 'card'
  className?: string
}) {
  const { language, setLanguage } = useApp()

  if (variant === 'login') {
    return (
      <div
        data-no-translate="true"
        className={`inline-flex items-center rounded-full bg-black/45 backdrop-blur-md border border-white/25 p-1 shadow-lg ${className}`}
      >
        <Globe className="h-3.5 w-3.5 text-white/80 ml-2 mr-1.5 shrink-0" />
        <button
          type="button"
          onClick={() => setLanguage('id')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
            language === 'id'
              ? 'bg-white text-[#0B2147] shadow-xs'
              : 'text-white/80 hover:text-white'
          }`}
        >
          🇮🇩 ID
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
            language === 'en'
              ? 'bg-white text-[#0B2147] shadow-xs'
              : 'text-white/80 hover:text-white'
          }`}
        >
          🇬🇧 EN
        </button>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div
        data-no-translate="true"
        className={`inline-flex items-center rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] p-1 ${className}`}
      >
        <button
          type="button"
          onClick={() => setLanguage('id')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            language === 'id'
              ? 'bg-[#163A70] text-white shadow-xs'
              : 'text-[#475569] hover:text-[#0F172A]'
          }`}
        >
          <span>🇮🇩</span>
          <span>Bahasa Indonesia</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            language === 'en'
              ? 'bg-[#163A70] text-white shadow-xs'
              : 'text-[#475569] hover:text-[#0F172A]'
          }`}
        >
          <span>🇬🇧</span>
          <span>English</span>
        </button>
      </div>
    )
  }

  return (
    <div
      data-no-translate="true"
      className={`inline-flex items-center rounded-full bg-[#F1F5F9] border border-[#E2E8F0] p-0.5 shadow-2xs ${className}`}
      title={language === 'id' ? 'Pilih Bahasa / Switch Language' : 'Switch Language / Pilih Bahasa'}
    >
      <button
        type="button"
        onClick={() => setLanguage('id')}
        className={`px-2 sm:px-2.5 py-1 rounded-full text-[10.5px] sm:text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
          language === 'id'
            ? 'bg-[#163A70] text-white shadow-2xs'
            : 'text-[#64748B] hover:text-[#0F172A]'
        }`}
      >
        <span className="hidden sm:inline">🇮🇩</span>
        <span>ID</span>
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 sm:px-2.5 py-1 rounded-full text-[10.5px] sm:text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
          language === 'en'
            ? 'bg-[#163A70] text-white shadow-2xs'
            : 'text-[#64748B] hover:text-[#0F172A]'
        }`}
      >
        <span className="hidden sm:inline">🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  )
}
