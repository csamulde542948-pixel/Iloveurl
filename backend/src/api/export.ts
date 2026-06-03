import { Router, Request, Response } from 'express';
import puppeteer from 'puppeteer';
import { hasPaidPlanAccess } from '../lib/credits';

const router = Router();

router.post('/pdf', async (req: Request, res: Response) => {
  const { html, title, fonts } = req.body;

  if (!req.authUserId) {
    return res.status(401).json({
      error: 'Sign in to export PDF reports.',
      code: 'AUTH_REQUIRED',
    });
  }

  const canExportPdf = await hasPaidPlanAccess(req.authUserId);
  if (!canExportPdf) {
    return res.status(403).json({
      error: 'PDF export is available on Starter, Pro, and Pro+ plans.',
      code: 'PLAN_REQUIRED',
      requiredPlans: ['starter', 'pro', 'pro-plus'],
    });
  }

  if (!html) {
    return res.status(400).json({ error: 'HTML content is required' });
  }

  console.log(`[PDF Export] Starting export for: ${title || 'Untitled'}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--font-render-hinting=none', 
        '--disable-gpu',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();
    
    // Construct font imports
    let fontImports = "";
    if (fonts && Array.isArray(fonts)) {
      fonts.forEach(f => {
        const family = typeof f === 'string' ? f : f.family;
        if (family) {
          const encoded = family.replace(/\s+/g, '+');
          fontImports += `@import url('https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700;800&display=swap');\n`;
        }
      });
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
            @import url('https://db.onlinewebfonts.com/c/14936bb7a4b6575fd2eee80a3ab52cc2?family=Feather+Bold');
            ${fontImports}
            
            :root {
              --brand-primary: rgb(79, 70, 229);
              --font-display: 'Feather Bold', 'Plus Jakarta Sans', sans-serif;
            }

            @page {
              size: A4;
              margin: 0.75in;
            }

            body {
              margin: 0;
              padding: 0;
              background-color: white;
              -webkit-print-color-adjust: exact;
            }

            table.layout-table {
              width: 100%;
              border-collapse: collapse;
            }

            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }

            .header-cell {
              padding-bottom: 20px;
              border-bottom: 1px solid rgba(0,0,0,0.05);
            }
            .footer-cell {
              padding-top: 15px;
              border-top: 1px solid rgba(0,0,0,0.05);
            }
            .content-cell {
              padding: 20px 0;
            }

            .navbar-logo {
              display: flex;
              align-items: baseline;
              gap: 0;
              opacity: 0.5;
            }
            .navbar-logo .base {
              font-family: var(--font-display) !important;
              font-weight: normal;
              font-size: 24px;
              color: var(--brand-primary);
              text-transform: lowercase;
              letter-spacing: -1.2px;
            }
            .navbar-logo .suffix {
              font-family: var(--font-display) !important;
              font-weight: 500;
              font-size: 14px;
              color: var(--brand-primary);
              opacity: 0.7;
            }

            .raw-doc-studio :not(.font-sample), 
            .raw-doc-studio :not(.font-sample) * { 
              font-family: Arial, Helvetica, sans-serif !important; 
              color: #000000 !important; 
              line-height: 1.6 !important;
              text-align: justify !important;
            } 
            .raw-doc-studio p { font-size: 15px !important; margin-bottom: 16px !important; }
            .raw-doc-studio h1 { font-size: 26px !important; font-weight: 800 !important; border-bottom: 3px solid #000; padding-bottom: 8px; margin-bottom: 24px; text-transform: uppercase; }
            .raw-doc-studio h2 { font-size: 19px !important; font-weight: 700 !important; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #DDD; padding-bottom: 5px; text-align: left !important; }
            .raw-doc-studio table { width: 100%; border-collapse: collapse; margin: 25px 0; border: 2px solid #000; text-align: left !important; }
            .raw-doc-studio th, .raw-doc-studio td { border: 1px solid #000; padding: 12px; font-size: 14px !important; }
            .raw-doc-studio th { background: #F9FAFB; font-weight: 800; text-transform: uppercase; font-size: 12px !important; }

            .typography-specimen-container {
              margin-top: 40px;
              padding-top: 30px;
              border-top: 2px solid #F3F4F6;
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <table class="layout-table">
            <thead>
              <tr>
                <td class="header-cell">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="navbar-logo"><span class="base">iLoveURL</span><span class="suffix">.space</span></div>
                  </div>
                </td>
              </tr>
            </thead>
            <tbody>
              <tr><td class="content-cell">${html}</td></tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="footer-cell">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: baseline;">
                      <div class="navbar-logo" style="transform: scale(0.8); transform-origin: left;"><span class="base">iLoveURL</span><span class="suffix">.space</span></div>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });
    // Controlled wait for fonts/images instead of networkidle
    await new Promise(r => setTimeout(r, 2000));
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();
    console.log(`[PDF Export] Successfully generated PDF for: ${title || 'Untitled'}`);

    res.contentType('application/pdf');
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('[PDF Export] CRITICAL Error:', err);
    if (browser) await browser.close().catch(() => {});
    res.status(500).json({ error: 'Failed to generate PDF. ' + err.message });
  }
});

export default router;
