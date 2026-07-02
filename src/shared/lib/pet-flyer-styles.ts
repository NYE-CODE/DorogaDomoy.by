import { tokens } from '@/shared/styles/tokens';

type FlyerPalette = { accent: string; soft: string; border: string };

/** CSS листовки A4: шапка сверху, фото на свободную высоту, данные прижаты к низу. */
export function buildPetFlyerCss(palette: FlyerPalette): string {
  const c = tokens.colors;
  const sh = tokens.shadow;
  const pageH = '281mm';

  return `
    :root {
      --accent: ${palette.accent};
      --accent-soft: ${palette.soft};
      --accent-border: ${palette.border};
      --ink: ${c.textPrimary};
      --muted: ${c.textSecondary};
      --line: ${c.borderStrong};
      --page-h: ${pageH};
    }
    @page { size: A4 portrait; margin: 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 18px; height: 100%; }
    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: var(--ink);
      background: ${c.bgSubtle};
      padding: 18px 14px 28px;
      line-height: 1.45;
      min-height: 100%;
      -webkit-font-smoothing: antialiased;
    }
    .sheet {
      display: flex;
      flex-direction: column;
      max-width: 720px;
      min-height: min(900px, calc(100vh - 36px));
      margin: 0 auto;
      background: ${c.bgBase};
      border-radius: 4px;
      padding: 0;
      border: 1px solid var(--line);
      box-shadow: ${sh.printSheet};
      overflow: hidden;
    }
    .photo-area {
      flex: 1 1 auto;
      min-height: 120px;
      padding-top: 24px;
      overflow: hidden;
      background: ${c.bgSubtle};
      border-bottom: 1px solid var(--line);
    }
    .photo {
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: top center;
      display: block;
    }
    .flyer-header {
      flex: 0 0 auto;
      text-align: center;
      padding: 10px 20px 12px;
      border-bottom: 3px solid var(--accent);
    }
    .brand-strip {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.18em;
      color: var(--muted);
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .title {
      font-size: clamp(24px, 4.5vw, 34px);
      font-weight: 900;
      color: var(--accent);
      line-height: 1.05;
      letter-spacing: -0.02em;
      text-transform: uppercase;
    }
    .subtitle {
      font-size: 17px;
      font-weight: 700;
      margin-top: 3px;
      margin-bottom: 0;
      color: var(--ink);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 16px;
      font-size: 16px;
    }
    .label {
      font-weight: 700;
      color: var(--muted);
      font-size: 13px;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .value { font-weight: 600; color: var(--ink); }
    .flyer-details {
      flex: 0 0 auto;
      padding: 10px 20px 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .description {
      font-size: 15.5px;
      line-height: 1.38;
      padding: 8px 10px;
      background: var(--accent-soft);
      border-left: 4px solid var(--accent);
      border-radius: 0 4px 4px 0;
      white-space: pre-wrap;
    }
    .contact-box {
      text-align: center;
      border: 2px solid var(--accent);
      padding: 12px 14px;
      border-radius: 6px;
      background: ${c.bgContact};
    }
    .contact-qr {
      display: flex;
      align-items: stretch;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px 16px;
      border: 2px solid var(--accent);
      padding: 12px 14px;
      border-radius: 6px;
      background: ${c.bgContact};
    }
    .contact-qr .left {
      flex: 1 1 200px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
    }
    .contact-qr .qr { flex: 0 0 auto; text-align: center; }
    /* QR-жетон: круглый медальон с «ушком» — фирменная форма адресника */
    .qr-medallion {
      position: relative;
      width: 156px;
      height: 156px;
      margin: 6px auto 0;
      border-radius: 50%;
      border: 3px solid var(--accent);
      background: ${c.bgBase};
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-medallion-ear {
      position: absolute;
      top: -9px;
      left: 50%;
      transform: translateX(-50%);
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid var(--accent);
      background: ${c.bgBase};
    }
    .contact-qr .qr img {
      width: 100px;
      height: 100px;
      display: block;
    }
    .contact-qr .qr-label {
      font-size: 10px;
      color: var(--muted);
      margin-top: 5px;
      font-weight: 600;
      max-width: 120px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.25;
    }
    .contact-label {
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 3px;
      color: var(--ink);
      letter-spacing: 0.04em;
    }
    .phone {
      font-size: clamp(24px, 5.5vw, 32px);
      font-weight: 900;
      margin: 3px 0;
      letter-spacing: 0.03em;
      color: var(--accent);
      font-variant-numeric: tabular-nums;
      word-break: break-all;
    }
    .author-line {
      font-size: 17px;
      font-weight: 700;
      color: var(--ink);
      margin-top: 2px;
    }
    @media print {
      body { background: ${c.bgBase} !important; padding: 0; min-height: 0; }
      html { font-size: 15px; height: auto; }
      .sheet {
        width: 100%;
        height: var(--page-h);
        min-height: var(--page-h);
        max-height: var(--page-h);
        box-shadow: none !important;
        border: none !important;
        border-radius: 0;
        max-width: none;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .photo-area {
        min-height: 48mm;
        padding-top: 7.5mm;
      }
      .flyer-details {
        padding: 8px 0 0;
        gap: 7px;
      }
      .flyer-header {
        padding: 3px 0 6px;
      }
      .brand-strip { font-size: 9px; margin-bottom: 2px; letter-spacing: 0.14em; }
      .title { font-size: 27px !important; line-height: 1 !important; }
      .subtitle { font-size: 14.5px; margin-top: 2px; margin-bottom: 0; }
      .info-grid { font-size: 14px; gap: 4px 10px; }
      .label { font-size: 10px; }
      .description {
        font-size: 13.5px;
        line-height: 1.35;
        padding: 6px 8px;
      }
      .contact-box, .contact-qr {
        padding: 8px 10px;
        border-radius: 4px;
      }
      .contact-qr { gap: 8px 12px; }
      .contact-label { font-size: 12.5px; }
      .phone { font-size: 25px !important; }
      .author-line { font-size: 14px; }
      .contact-qr .qr img { width: 92px !important; height: 92px !important; }
      .qr-medallion { width: 142px; height: 142px; }
      .contact-qr .qr-label { font-size: 10px; max-width: 130px; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;
}
