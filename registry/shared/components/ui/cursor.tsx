'use client'

import { useState, useRef, useEffect } from "react";
import type { CSSProperties, RefObject } from "react";
import { MQ, matches, vh, vw } from "@/utils/viewport";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/* vzhled kurzoru je celý tady: varianta zapisuje jen to, čím se liší od BASE,
   takže přidat nebo přebarvit další je jeden řádek. Barvy jsou tokeny
   z app/globals.css (--light, --dark, --confirm) */

/* blend: difference potřebuje bílou, aby převracela podklad */
const LIGHT = "var(--light, #fff)";
const DARK = "var(--dark, #171717)";
const DARK_SOFT = "color-mix(in srgb, var(--dark, #171717) 75%, transparent)";
const CONFIRM = "var(--confirm, #4ade80)";
const CONFIRM_SOFT = "color-mix(in srgb, var(--confirm, #4ade80) 55%, transparent)";
const DIM = "color-mix(in srgb, var(--light, #fff) 22%, transparent)";
const MONO = "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const MOTION = {
  /* kolik ze zbývající vzdálenosti ujede prstenec za jeden snímek */
  follow: 0.18,
  /* rozměry se přelévají pomaleji než barvy, ať je změna tvaru čitelná */
  shape: "260ms cubic-bezier(.2,.9,.3,1)",
  paint: "220ms",
  label: "200ms",
} as const;

/* šířka štítku se neměří, jen odhaduje - mono písmo má pevnou šířku znaku */
const LABEL_BOX = { char: 8, pad: 28, min: 30 } as const;

const BASE_FONT = 16;

const clamp = (min: number, v: number, max: number) => Math.min(max, Math.max(min, v));

const ringSize = (f: number) => Math.round(clamp(28, 30 * Math.sqrt(f / BASE_FONT), 84));

const caretHeight = (f: number) => Math.round(clamp(16, f * 1.25, 120));

/** px, funkce = dopočítá se z písma pod kurzorem, "label" = podle délky štítku */
type Length = number | ((fontPx: number) => number) | "label";

export interface CursorStyle {
  width: Length;
  height: Length;
  radius: string;
  background: string;
  borderWidth: number;
  borderStyle: "solid" | "dashed";
  /* rámeček se schovává průhlednou barvou, ne nulovou šířkou - přes
     border-style ani z/na nulu se přechod mezi variantami nedá plynule udělat */
  borderColor: string;
  labelColor: string;
  labelSize: number;
  labelTracking: string;
  /** průměr tečky uprostřed, false = varianta ji nemá */
  dot: number | false;
  dotColor: string;
  /** difference převrací barvu podkladu, takže kurzor drží kontrast na tmavém i bílém */
  blend: boolean;
}

const BASE: CursorStyle = {
  width: ringSize,
  height: ringSize,
  radius: "50%",
  background: "transparent",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: LIGHT,
  labelColor: LIGHT,
  labelSize: 10,
  labelTracking: "0.2em",
  dot: 6,
  dotColor: LIGHT,
  blend: true,
};

const VARIANTS = {
  default: {},
  hover:   { width: 54, height: 54, dot: false },
  click:   { width: 60, height: 60, background: LIGHT, borderColor: "transparent", labelColor: DARK, dot: false },
  drag:    { width: 52, height: 52, borderStyle: "dashed" },
  text:    { width: 2, height: caretHeight, radius: "0%", background: LIGHT, borderColor: "transparent", dot: false },
  view:    { width: "label", height: 30, radius: "0%", background: DARK_SOFT, borderColor: CONFIRM_SOFT, labelColor: CONFIRM, dot: false, blend: false },
  off:     { width: 40, height: 40, borderColor: DIM, labelColor: DIM, dot: false, blend: false },
} satisfies Record<string, Partial<CursorStyle>>;

export type CursorVariant = keyof typeof VARIANTS;

/** přepsání vzhledu přes props - base pro všechny varianty, variants pro jednotlivé */
export interface CursorTheme {
  base?: Partial<CursorStyle>;
  variants?: Partial<Record<CursorVariant, Partial<CursorStyle>>>;
}

const styleOf = (variant: CursorVariant, theme: CursorTheme = {}): CursorStyle => ({
  ...BASE,
  ...theme.base,
  ...VARIANTS[variant],
  ...theme.variants?.[variant],
});

const SHAPE_TRANSITION = [
  `width ${MOTION.shape}`,
  `height ${MOTION.shape}`,
  `border-radius ${MOTION.shape}`,
  `background ${MOTION.paint}`,
  `border-color ${MOTION.paint}`,
  `border-width ${MOTION.paint}`,
].join(", ");

const DOT_TRANSITION = `width ${MOTION.shape}, height ${MOTION.shape}, background ${MOTION.paint}`;

const px = (value: Length, fontPx: number, labelWidth: number): number =>
  value === "label" ? labelWidth : typeof value === "function" ? value(fontPx) : value;

/* na serveru se předvolba přečíst nedá, takže se HTML vyrenderuje s animacemi
   a klient je hned při hydrataci případně vypne - kurzor je do prvního pohybu
   stejně neviditelný, takže není co bliknout */
const useReducedMotion = (): boolean => useMediaQuery(MQ.reducedMotion, false);

/* třída na <html>, jen když kurzor běží (myš, ne dotyk). Pravidlo, které schová
   systémovou šipku, vykresluje komponenta sama, takže nepotřebuje nic v globals.css */
const HIDE_NATIVE_CLASS = "has-custom-cursor";
const HIDE_NATIVE_CSS = `.${HIDE_NATIVE_CLASS}, .${HIDE_NATIVE_CLASS} * { cursor: none !important; }`;

const TEXT_FIELDS =
  'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea, [contenteditable="true"]';

const CLICKABLE = 'a[href], button, [role="button"], summary, select';

const INTERACTIVE = `[data-cursor], ${CLICKABLE}, ${TEXT_FIELDS}`;

function isVariant(value: string | undefined): value is CursorVariant {
  return value !== undefined && value in VARIANTS;
}

const fullscreenElement = (): Element | null =>
  document.fullscreenElement ??
  (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ??
  null;

function classify(el: HTMLElement): CursorVariant {
  if (isVariant(el.dataset.cursor)) return el.dataset.cursor;
  if (el.matches(TEXT_FIELDS)) return "text";
  if (el.matches(":disabled") || el.getAttribute("aria-disabled") === "true") return "off";
  return "click";
}

/* <T> musí zůstat - rozšíření musí sedět na deklaraci z @types/react */
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    "data-cursor"?: CursorVariant;
    "data-cursor-label"?: string;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface SVGAttributes<T> {
    "data-cursor"?: CursorVariant;
    "data-cursor-label"?: string;
  }
}

export interface Point {
  x: number;
  y: number;
}

export interface CursorState {
  variant: CursorVariant;
  label: string;
  fontPx: number;
  active: boolean;
  reduced: boolean;
  dotRef: RefObject<HTMLDivElement | null>;
  ringRef: RefObject<HTMLDivElement | null>;
  /** skutečná poloha ukazatele (clientX/Y), mění se bez re-renderu */
  pointer: RefObject<Point>;
  /** vyhlazená poloha prstence, která za ukazatelem dojíždí */
  trail: RefObject<Point>;
}

export interface CursorOptions {
  /** kolik ze zbývající vzdálenosti ujede prstenec za snímek, 1 = bez zpoždění */
  follow?: number;
}

function useDynamicCursor({ follow = MOTION.follow }: CursorOptions = {}): CursorState {
  const [variant, setVariant] = useState<CursorVariant>("default");
  const [label, setLabel] = useState("");
  const [fontPx, setFontPx] = useState(BASE_FONT);
  const [active, setActive] = useState(false);
  const reduced = useReducedMotion();
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const pointer = useRef<Point>({ x: 0, y: 0 });
  const trail = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    if (!matches(MQ.finePointer)) return;

    /* ease drží smyčka mimo React, tak si předvolbu hlídá sama */
    const motionQuery = window.matchMedia(MQ.reducedMotion);
    let ease = motionQuery.matches ? 1 : follow;
    const onMotionChange = (): void => {
      ease = motionQuery.matches ? 1 : follow;
    };
    motionQuery.addEventListener("change", onMotionChange);

    const root = document.documentElement;
    root.classList.add(HIDE_NATIVE_CLASS);

    const pos = pointer.current;
    const ring = trail.current;
    pos.x = ring.x = vw() / 2;
    pos.y = ring.y = vh() / 2;
    let visible = false;
    let fullscreen = false;
    let raf = 0;

    const show = (): void => {
      if (fullscreen || visible) return;
      visible = true;
      setActive(true);
    };

    const hide = (): void => {
      if (!visible) return;
      visible = false;
      setActive(false);
    };

    const onMove = (e: PointerEvent): void => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      show();
    };

    const onOver = (e: PointerEvent): void => {
      const target = e.target instanceof Element ? e.target : null;
      const el = target?.closest<HTMLElement>(INTERACTIVE) ?? null;
      const next = el ? classify(el) : "default";

      setVariant(next);
      setLabel(el?.dataset.cursorLabel ?? "");

      /* písmo bereme z prvku přímo pod hrotem, ne z toho, který variantu určil -
         caret tak sedí na řádek, nad kterým kurzor skutečně stojí */
      if (target) {
        const size = parseFloat(window.getComputedStyle(target).fontSize);
        if (Number.isFinite(size)) setFontPx(Math.round(size));
      }
    };

    const onLeave = (): void => {
      hide();
      setVariant("default");
      setLabel("");
    };

    const onFullscreenChange = (): void => {
      fullscreen = fullscreenElement() !== null;
      if (fullscreen) {
        root.classList.remove(HIDE_NATIVE_CLASS);
        hide();
      } else {
        root.classList.add(HIDE_NATIVE_CLASS);
      }
    };

    const loop = (): void => {
      ring.x += (pos.x - ring.x) * ease;
      ring.y += (pos.y - ring.y) * ease;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver);
    root.addEventListener("pointerleave", onLeave);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);

    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove(HIDE_NATIVE_CLASS);
      motionQuery.removeEventListener("change", onMotionChange);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, [follow]);

  return { variant, label, fontPx, active, reduced, dotRef, ringRef, pointer, trail };
}

interface CursorViewProps extends CursorState {
  theme?: CursorTheme;
  className?: string;
}

function CursorView({ variant, label, fontPx, active, reduced, dotRef, ringRef, theme, className = "" }: CursorViewProps) {
  const style = styleOf(variant, theme);
  const anim = (value: string) => (reduced ? "none" : value);

  const labelWidth = Math.max(
    LABEL_BOX.min,
    Math.round(label.length * LABEL_BOX.char + LABEL_BOX.pad),
  );

  const box: CSSProperties = {
    width: px(style.width, fontPx, labelWidth),
    height: px(style.height, fontPx, labelWidth),
    borderRadius: style.radius,
    background: style.background,
    borderWidth: style.borderWidth,
    borderStyle: style.borderStyle,
    borderColor: style.borderColor,
    color: style.labelColor,
    whiteSpace: "nowrap",
    transition: anim(SHAPE_TRANSITION),
  };

  return (
    <>
      <style>{HIDE_NATIVE_CSS}</style>
      <div
        ref={ringRef}
        aria-hidden
        className={`fixed left-0 top-0 z-9999 pointer-events-none ${className}`}
        style={{ opacity: active ? 1 : 0, mixBlendMode: style.blend ? "difference" : "normal" }}
      >
        <div className="grid place-items-center" style={box}>
          <span
            style={{
              fontFamily: MONO,
              fontSize: style.labelSize,
              letterSpacing: style.labelTracking,
              textTransform: "uppercase",
              opacity: label ? 1 : 0,
              /* text čeká, až se tvar přemění - jinak najíždí přes animaci */
              transition: anim(`opacity ${MOTION.label} ${label ? MOTION.label : "0ms"}`),
            }}
          >
            {label}
          </span>
        </div>
      </div>

      <div
        ref={dotRef}
        aria-hidden
        className={`fixed left-0 top-0 z-9999 pointer-events-none ${className}`}
        style={{
          opacity: active && style.dot !== false ? 1 : 0,
          mixBlendMode: style.blend ? "difference" : "normal",
        }}
      >
        <div
          style={{
            width: style.dot === false ? 0 : style.dot,
            height: style.dot === false ? 0 : style.dot,
            borderRadius: 999,
            background: style.dotColor,
            transition: anim(DOT_TRANSITION),
          }}
        />
      </div>
    </>
  );
}

interface DynamicCursorProps extends CursorOptions {
  theme?: CursorTheme;
  className?: string;
}

export default function DynamicCursor({ theme, className, ...options }: DynamicCursorProps) {
  const state = useDynamicCursor(options);
  return <CursorView {...state} theme={theme} className={className} />;
}
