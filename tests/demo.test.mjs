import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
let server, browser, origin;
before(async () => {
  server = createServer(async (req, res) => {
    const path = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname.replace(/\/$/, '/index.html'));
    if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(path);
      res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript'})[extname(path)] || 'application/octet-stream');
      res.end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
});
after(async () => { await browser?.close(); if(server) await new Promise(resolve => server.close(resolve)); });

async function open(options = {}) {
  const context = await browser.newContext({reducedMotion:'reduce', ...options});
  const page = await context.newPage();
  await page.goto(origin);
  if(options.javaScriptEnabled !== false) await page.locator('#cookieReject').click();
  return {context, page};
}

test('todas as páginas identificam a ficção e seus links locais resolvem', async () => {
  const {context,page} = await open();
  for(const path of ['/', '/privacidade.html', '/termos.html', '/cookies.html']) {
    await page.goto(origin + path);
    assert.match(await page.locator('.demo-notice').innerText(), /Demonstração/);
    assert.equal(await page.locator('meta[name=robots]').getAttribute('content'), 'noindex, nofollow');
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('a[href*="wa.me"], a[href="#"]').count(), 0);
    for(const href of await page.locator('a[href]').evaluateAll(links => links.map(link => link.href))) {
      const url = new URL(href);
      if(url.origin !== origin) continue;
      const response = await context.request.get(url.origin + url.pathname);
      assert.equal(response.status(), 200, href);
      if(url.hash) {
        const html = await response.text();
        assert.ok(html.includes(`id="${url.hash.slice(1)}"`), href);
      }
    }
  }
  await context.close();
});

test('formulário mostra erros, não envia valores e apaga os campos após o teste', async () => {
  const {context,page} = await open();
  const submissions=[];
  page.on('request', request => { if(request.method() !== 'GET' || /Teste|example\.test/.test(request.url())) submissions.push(request.url()); });
  await page.locator('#leadForm button[type=submit]').click();
  assert.equal(await page.locator('#fName').getAttribute('aria-invalid'), 'true');
  assert.equal(await page.locator('#fName').evaluate(el => el === document.activeElement), true);
  await page.locator('#fName').fill('Pessoa Teste');
  await page.locator('#fPhone').fill('31900000000');
  await page.locator('#fEmail').fill('teste@example.test');
  await page.locator('#fInterest').selectOption('planta-a');
  await page.locator('#fConsent').check();
  await page.locator('#leadForm button[type=submit]').click();
  assert.match(await page.locator('#formSuccess').innerText(), /nada foi enviado/);
  assert.equal(await page.locator('#formSuccess').isVisible(), true);
  assert.equal(await page.locator('#fName').inputValue(), '');
  assert.equal(await page.locator('#fEmail').inputValue(), '');
  const state = await page.evaluate(() => ({events:window.dataLayer, storage:JSON.stringify(localStorage), url:location.href}));
  assert.doesNotMatch(JSON.stringify(state), /Pessoa Teste|teste@example.test|31900000000|generate_lead/);
  assert.ok(state.events.some(event => event.event === 'demo_form_completed'));
  assert.deepEqual(submissions, []);
  await page.locator('#testAgain').click();
  assert.equal(await page.locator('#fName').isVisible(), true);
  assert.equal(await page.locator('#fConsent').isChecked(), false);
  await context.close();
});

test('telefone inválido impede a conclusão e FAQ comunica expansão por teclado', async () => {
  const {context,page} = await open();
  await page.locator('#fPhone').fill('0000000000');
  await page.locator('#fPhone').blur();
  assert.equal(await page.locator('#fPhone').getAttribute('aria-invalid'), 'true');
  const faq = page.locator('.faq-q').first();
  await faq.focus();
  await faq.press('Enter');
  assert.equal(await faq.getAttribute('aria-expanded'), 'true');
  await faq.press('Enter');
  assert.equal(await faq.getAttribute('aria-expanded'), 'false');
  await context.close();
});

test('sem JavaScript os campos ficam desabilitados e não há submissão HTTP', async () => {
  const {context,page} = await open({javaScriptEnabled:false});
  assert.equal(await page.locator('#fName').isDisabled(), true);
  assert.equal(await page.locator('#leadForm button[type=submit]').isDisabled(), true);
  assert.equal(await page.locator('#leadForm').getAttribute('method'), 'dialog');
  await context.close();
});

test('desktop e celular não transbordam; menu mobile fecha por Escape e por link', async () => {
  const captures=resolve(root,process.env.CAPTURE_DEMO === '1' ? 'docs/capturas' : 'test-results');
  await mkdir(captures,{recursive:true});
  for(const viewport of [{width:1440,height:960},{width:390,height:844}]) {
    const {context,page}=await open({viewport,reducedMotion:'reduce'});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
    if(viewport.width===390) {
      await page.locator('#navToggle').click();
      assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'),'true');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'),'false');
      await page.locator('#navToggle').click();
      await page.locator('#mobileNav a[href="#plantas"]').click();
      assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'),'false');
      await page.evaluate(() => scrollTo(0,0));
    }
    await page.screenshot({path:resolve(captures,`${viewport.width===390?'mobile':'desktop'}.png`)});
    if(viewport.width===1440) {
      await page.locator('#plantas').scrollIntoViewIfNeeded();
      await page.screenshot({path:resolve(captures,'apartamentos.png')});
      await page.locator('#oferta').scrollIntoViewIfNeeded();
      await page.screenshot({path:resolve(captures,'formulario.png')});
    }
    await context.close();
  }
});
