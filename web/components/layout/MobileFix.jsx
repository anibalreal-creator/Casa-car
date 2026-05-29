export default function MobileFix() {
  return (
    <style jsx global>{`
      html, body {
        overflow-x: hidden;
      }

      *, *::before, *::after {
        box-sizing: border-box;
      }

      img {
        max-width: 100%;
      }

      @media (max-width: 980px) {
        body {
          -webkit-tap-highlight-color: transparent;
        }

        input, select, textarea, button {
          font-size: 16px;
        }

        .cc-touch-target,
        a[role='button'],
        button,
        .button,
        [type='button'],
        [type='submit'] {
          min-height: 44px;
        }
      }
    `}</style>
  );
}
