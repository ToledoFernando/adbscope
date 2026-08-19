# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Desarrolladores de apps React Native / Android en Windows que hacen debugging del día a día en su propia máquina de desarrollo: chequear si un dispositivo está online, ver la pantalla en vivo, meterse a una shell, o leer Logcat — sin abrir Android Studio. También usan la app para mostrar avances a otra persona (demo/pairing) directamente desde su propia máquina, sin compartir pantalla con salida cruda de `adb shell` ni levantar `scrcpy` a mano en una terminal aparte.

El proyecto se va a publicar/compartir (repo público en GitHub) para que otros devs RN/Android lo instalen — la UI debe sostenerse frente a usuarios que no conocen al autor, no solo como herramienta interna.

## Product Purpose

ADBScope reemplaza el ir-y-venir entre Android Studio Device Manager, una terminal suelta con `adb shell`, y `scrcpy` lanzado a mano, con una sola app nativa de escritorio que cubre ese ciclo completo: conectar uno o varios dispositivos Android (USB o WiFi), verlos todos en una barra lateral, y tener espejo de pantalla real, shell interactiva y stream de Logcat para el dispositivo activo. Éxito = un dev puede hacer todo su debugging diario de dispositivo sin salir de la app y sin tocar Android Studio.

## Positioning

Es una app de escritorio nativa (Wails: Go + WebView2), no una pestaña de navegador ni un panel de devtools — se siente parte del escritorio. La diferencia frente a usar las herramientas sueltas (Android Studio, adb shell en una terminal cualquiera, scrcpy manual) es que junta device info + espejo de pantalla embebido + shell real (ConPTY, no un pipe) + Logcat virtualizado en una sola ventana, multi-dispositivo en la barra lateral con una sesión activa a la vez, y se distribuye como un único .exe con adb/scrcpy embebidos — sin que el usuario necesite tener el Android SDK instalado.

## Operating Context

- Solo Windows; app de escritorio standalone (Wails), no un sitio web.
- El dev trabaja con el dispositivo Android conectado por USB o WiFi (incluye emparejamiento por código en Android 11+) o un emulador.
- Un dispositivo activo a la vez para pantalla/shell/logcat; la detección y la barra lateral sí son multi-dispositivo simultáneas.
- El espejo de pantalla es una ventana nativa Win32 real (scrcpy reparentado vía `SetParent`), no parte del compositing web — se oculta manualmente cada vez que se abre un dialog/dropdown/menú de Radix para evitar que tape los overlays ("problema del airspace"). Cualquier rediseño de overlays/dialogs tiene que respetar ese mecanismo.
- Reconexión automática: si el dispositivo activo se cae de USB/WiFi, las sesiones de pantalla/shell se detienen y la UI debe mostrar un estado claro de "desconectado — reconectar", nunca una ventana congelada sin explicación.

## Capabilities and Constraints

- Gestión de dispositivos: detección automática (USB/WiFi/emulador), conectar/desconectar, alias local, eliminar de la lista sin que el polling (cada 1.5s) lo vuelva a traer.
- Info de dispositivo: modelo, fabricante, versión Android/SDK, CPU/ABIs, build fingerprint, resolución/densidad, batería (nivel/salud/voltaje/temperatura) y almacenamiento, con gráficos de dona (Recharts).
- Espejo de pantalla embebido con toggle de audio y reconexión manual.
- Shell interactiva real vía xterm.js + ConPTY: colores ANSI, edición de línea, Ctrl+C, prompt configurable, scrollback.
- Logcat: tail en vivo, búsqueda, filtro por nivel (Verbose→Fatal), pausar/reanudar, orden más-reciente-primero, virtualizado (TanStack Virtual) para no trabar la UI con apps ruidosas.
- UI bilingüe ES/EN (react-i18next, `frontend/src/i18n/locales/{es,en}.json`) — obligatorio mantener ambos locales sincronizados; cualquier texto nuevo o modificado del rediseño se agrega/actualiza en los dos idiomas.
- Tema claro/oscuro/sistema, persistido en localStorage y aplicado antes del primer render (evita flash).
- Stack de frontend ya definido: React 19 + TypeScript + Vite, Tailwind CSS v4 + shadcn/ui + Radix UI, Zustand, GSAP (+ @gsap/react) ya instalado para animación, xterm.js, TanStack Virtual, Sonner para toasts.
- Un solo dispositivo activo a la vez es una limitación conocida y aceptada, no algo que la UI deba disimular.
- Resize de la shell remota no se propaga al PTY — limitación conocida (apps TUI a pantalla completa pueden renderizar con dimensiones incorrectas).

## Brand Commitments

- Nombre del producto **ADBScope** — fijo, no se rediseña.
- Ícono/logo actual (`images/icon.png`) — fijo, no se rediseña.
- UI bilingüe español/inglés — fija, obligatoria; todo texto nuevo o tocado por el rediseño se traduce a ambos idiomas.
- Todo lo demás (paleta, tipografía, layout, componentes, motion, incluso el esquema de temas claro/oscuro/sistema como mecanismo) queda abierto para el rediseño.

## Evidence on Hand

- README.md del repo (raíz) documenta a fondo el propósito, arquitectura, decisiones técnicas y limitaciones — usado como fuente principal para este documento.
- `images/icon.png` — ícono/logo actual, a preservar.
- `frontend/src/i18n/locales/{es,en}.json` — copy actual de la UI en ambos idiomas.
- No hay testimonios, casos de estudio, ni métricas de uso reales — no inventar ninguno.

## Product Principles

1. Es una app de escritorio, no un sitio web: la UI debe sentirse nativa de Windows, no como devtools de navegador embebidas.
2. Un dispositivo activo, foco claro: la jerarquía visual debe dejar obvio cuál dispositivo está activo y qué sesión (pantalla/shell/logcat) está en vivo.
3. La densidad de información (logcat de miles de líneas/seg, datos de dispositivo) no puede sacrificar legibilidad ni rendimiento — el rediseño no puede romper la virtualización ni el streaming en vivo.
4. Estados de error/desconexión son primera clase: nunca una ventana que parece congelada sin explicación.
5. Ahora que se va a publicar, la primera impresión (empty states, flujo de conexión, overview) debe sostenerse frente a un usuario que no conoce el proyecto.

## Accessibility & Inclusion

No se estableció un requisito de accesibilidad específico del producto más allá de lo que Radix UI ya provee (foco/teclado correctos en dialogs, dropdowns, tooltips) — preservar ese comportamiento en el rediseño.
