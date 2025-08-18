(function () {
  const el = document.getElementById('result');
  const show = (html) => (el.innerHTML = html);
  const esc = (s) => (s + '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const params = new URLSearchParams(window.location.search);
  const code = (params.get('code') || '').trim().toUpperCase();

  if (!code) {
    show('<p class="badge bad">No code</p><p>Open this from the NFC tag or enter a code on the home page.</p>');
    return;
  }

  // Always fetch fresh
  fetch('data/items.json', { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error('items.json HTTP ' + r.status); return r.json(); })
    .then(db => {
      const items = Array.isArray(db.items) ? db.items : [];

      // Exact match (legacy)
      let item = items.find(x => (x.code || '').toUpperCase() === code);
      let edition = null;

      // Dynamic prefix (CAT-01 -> series with prefix "CAT-")
      if (!item) {
        const cand = items.find(x =>
          typeof x.prefix === 'string' &&
          code.startsWith((x.prefix || '').toUpperCase())
        );
        if (cand) {
          item = cand;
          const pref = (cand.prefix || '').toUpperCase();
          const num = parseInt(code.slice(pref.length).replace(/[^0-9]/g, ''), 10);
          if (!isNaN(num) && cand.total) edition = `${num}/${cand.total}`;
        }
      } else if (item.edition) {
        edition = String(item.edition);
      }

      if (!item) {
        show(`<p class="badge bad">Not found</p><p>Code “${esc(code)}” isn’t in our records.</p>`);
        return;
      }

      const img = item.image || '';
      const ig  = item.instagram || 'https://instagram.com/';
      const igUser = (ig.replace(/\/$/,'').split('/').pop() || '').replace('@','');
      const igDeep = `instagram://user?username=${encodeURIComponent(igUser)}`;
      const baseCap = item.caption || `I found a Little Wonder! Code ${code}`;
      const caption = edition ? `${baseCap} — Edition ${edition}` : baseCap;

      show(`
        <div class="result">
          ${img ? `<div><img src="${esc(img)}" alt="${esc(item.title || 'Found piece')}" /></div>` : ''}
          <div class="meta">
            <h2>${esc(item.title || 'Little Wonder')}</h2>
            <div>
              <span class="badge ok">Authentic</span>
              ${edition ? ` <span class="badge ok">Edition ${esc(edition)}</span>` : ''}
            </div>
            <dl class="kv">
