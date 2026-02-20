export const AppFooter = () => (
  <footer className="py-4 px-4 flex flex-col items-center gap-2">
    <p className="text-xs text-neutral-500 dark:text-neutral-400">
      Made with{" "}
      <span className="text-red-500" aria-hidden>
        ♥
      </span>{" "}
      by{" "}
      <a
        href="https://feef.io"
        target="_blank"
        rel="noopener noreferrer"
        className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 hover:underline transition-colors"
      >
        Feef.io
      </a>
    </p>
  </footer>
)
