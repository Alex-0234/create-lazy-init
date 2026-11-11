// signál "loading screen zmizel" - intro animace na něj čekají, aby nehrály schované pod overlayem
const EVENT = 'app:loader-done'
let done = false

export function markLoaderDone() {
    if (done) return
    done = true
    window.dispatchEvent(new Event(EVENT))
}

/** Zavolá cb, jakmile je loader pryč (hned, pokud už je). Vrací úklid pro useGSAP/useEffect. */
export function onLoaderDone(cb: () => void): () => void {
    if (done) {
        cb()
        return () => {}
    }
    window.addEventListener(EVENT, cb, { once: true })
    return () => window.removeEventListener(EVENT, cb)
}
