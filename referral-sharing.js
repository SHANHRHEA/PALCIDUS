(function installPALCYAIReferral(global) {
  'use strict';
  const REFERRAL_URL = 'https://advisor-financial-insurance.pages.dev/';
  const TITLE = 'PALCYAI Financial Discovery';
  const TEXT = 'A private PALCYAI Financial Discovery can help organize financial priorities before a human-advisor discussion. Complete your own discovery here. My personal answers are not shared.';

  function makeSharePayload(url = REFERRAL_URL) {
    return { title: TITLE, text: TEXT, url };
  }
  function values(value) {
    return (Array.isArray(value) ? value : value == null ? [] : [value])
      .map(item => String(item ?? '').trim()).filter(Boolean);
  }
  function normalizeContacts(items = []) {
    return items.map(item => ({
      name: values(item.name)[0] || 'Contact',
      emails: [...new Set(values(item.email))],
      phones: [...new Set(values(item.tel))],
      selected: true,
    })).filter(item => item.emails.length || item.phones.length);
  }
  function areAllSelected(contacts) { return contacts.length > 0 && contacts.every(contact => contact.selected !== false); }
  function makeEmailDraft(contacts, payload = makeSharePayload()) {
    const recipients = [...new Set(contacts.filter(c => c.selected !== false).flatMap(c => c.emails || []))];
    const params = new URLSearchParams({
      subject: 'A financial discovery resource for you',
      body: `${payload.text}\n\n${payload.url}`,
    });
    if (recipients.length) params.set('bcc', recipients.join(','));
    return `mailto:?${params.toString()}`;
  }
  function makeSmsDraft(phone, payload = makeSharePayload()) {
    const number = String(phone || '').trim();
    const params = new URLSearchParams({ body: `${payload.text}\n\n${payload.url}` });
    return `sms:${number ? encodeURIComponent(number) : ''}?${params.toString()}`;
  }
  function makeEmailDraftContent(contacts = [], payload = makeSharePayload()) {
    return {
      to: '',
      bcc: [...new Set(contacts.filter(c => c.selected !== false).flatMap(c => c.emails || []))].join(', '),
      subject: 'A financial discovery resource for you',
      body: `${payload.text}\n\n${payload.url}`,
    };
  }
  function makeTextDraftContent(payload = makeSharePayload()) {
    return `${payload.text}\n\n${payload.url}`;
  }
  function beginContactSelection(nav, properties = ['name', 'email', 'tel']) {
    if (!nav?.contacts || typeof nav.contacts.select !== 'function') return Promise.reject(new Error('Device contact picker is unavailable.'));
    return nav.contacts.select(properties, { multiple: true });
  }
  function isContactPickerAvailable(nav = global.navigator, win = global) {
    return !!(win.isSecureContext && nav && nav.contacts && typeof nav.contacts.select === 'function');
  }

  function openReferralDialog() {
    const doc = global.document;
    const nav = global.navigator;
    if (!doc || !doc.body) return;
    const previous = doc.getElementById('palcyai-referral-dialog');
    if (previous) previous.remove();
    const dialog = doc.createElement('dialog');
    dialog.id = 'palcyai-referral-dialog';
    dialog.setAttribute('aria-labelledby', 'palcyai-referral-title');
    dialog.style.cssText = 'max-width:620px;width:calc(100% - 32px);max-height:82vh;overflow:auto;border:1px solid #cbd5e1;border-radius:18px;padding:0;color:#17324d;box-shadow:0 24px 70px #0008';
    dialog.innerHTML = `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;padding:22px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><h2 id="palcyai-referral-title" style="margin:0;font-size:1.35rem">Refer a family member</h2><button id="palcyai-referral-close" type="button" aria-label="Close" style="font-size:1.25rem">×</button></div><p style="line-height:1.55">Share the PALCYAI Financial Discovery link. Your private answers are not included.</p><div style="display:flex;flex-wrap:wrap;gap:10px"><button id="palcyai-share-apps" type="button">Share to apps and contacts</button><button id="palcyai-choose-contacts" type="button">Choose device contacts</button><button id="palcyai-email-draft" type="button">Create email draft</button><button id="palcyai-sms-draft" type="button">Create text draft</button><button id="palcyai-copy-link" type="button">Copy referral link</button></div><p id="palcyai-referral-status" role="status" aria-live="polite" style="min-height:1.4em;color:#345"></p><div id="palcyai-contact-area"></div><div id="palcyai-message-draft"></div><p style="font-size:.82rem;color:#526b83;border-top:1px solid #dbe2ea;padding-top:12px">The page only sees contacts you explicitly choose in a supported browser. It does not upload or send contact details. Email and text drafts stay here for you to review, copy, and send.</p></div>`;
    doc.body.appendChild(dialog);
    const byId = id => dialog.querySelector(`#${id}`);
    const status = byId('palcyai-referral-status');
    const contactsArea = byId('palcyai-contact-area');
    let contacts = [];
    let contactProperties = ['name', 'email', 'tel'];
    if (isContactPickerAvailable(nav, global) && typeof nav.contacts.getProperties === 'function') {
      nav.contacts.getProperties().then(supported => {
        contactProperties = ['name', 'email', 'tel'].filter(property => supported.includes(property));
      }).catch(() => {});
    }
    const close = () => dialog.close();
    byId('palcyai-referral-close').addEventListener('click', close);
    dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
    const draftArea = byId('palcyai-message-draft');

    async function copyDraft(text, textarea) {
      try {
        if (nav?.clipboard?.writeText) await nav.clipboard.writeText(text);
        else throw new Error('Clipboard unavailable');
        status.textContent = 'Draft copied. Paste it into your email or messaging app, review it, and send when ready.';
      } catch {
        textarea.focus();
        textarea.select();
        status.textContent = 'Draft is ready below. Select and copy it, then paste it into your email or messaging app.';
      }
    }
    function showDraft(kind, phone = '', emailContacts = selected()) {
      const emailMode = kind === 'email';
      const content = emailMode ? makeEmailDraftContent(emailContacts) : { body: makeTextDraftContent() };
      draftArea.replaceChildren();
      const panel = doc.createElement('section');
      panel.style.cssText = 'margin:14px 0;padding:14px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc';
      const heading = doc.createElement('h3'); heading.textContent = emailMode ? 'Email draft — review before sending' : 'Text draft — review before sending';
      const fields = [];
      if (emailMode) {
        for (const [labelText, value] of [['BCC (selected contacts)', content.bcc], ['Subject', content.subject]]) {
          const label = doc.createElement('label'); label.style.cssText = 'display:block;margin:8px 0;font-weight:700'; label.append(doc.createTextNode(labelText));
          const input = doc.createElement('input'); input.type = 'text'; input.value = value; input.readOnly = true; input.style.cssText = 'display:block;width:100%;box-sizing:border-box;padding:8px;margin-top:4px';
          label.append(input); panel.append(label); fields.push(input);
        }
      } else if (phone) {
        const label = doc.createElement('label'); label.style.cssText = 'display:block;margin:8px 0;font-weight:700'; label.append(doc.createTextNode('To'));
        const input = doc.createElement('input'); input.type = 'tel'; input.value = phone; input.readOnly = true; input.style.cssText = 'display:block;width:100%;box-sizing:border-box;padding:8px;margin-top:4px'; label.append(input); panel.append(label); fields.push(input);
      }
      const bodyLabel = doc.createElement('label'); bodyLabel.style.cssText = 'display:block;margin:8px 0;font-weight:700'; bodyLabel.append(doc.createTextNode('Message'));
      const textarea = doc.createElement('textarea'); textarea.rows = 6; textarea.value = content.body; textarea.style.cssText = 'display:block;width:100%;box-sizing:border-box;padding:10px;margin-top:4px'; bodyLabel.append(textarea); panel.append(heading, bodyLabel);
      const actions = doc.createElement('div'); actions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
      const copy = doc.createElement('button'); copy.type = 'button'; copy.textContent = emailMode ? 'Copy email draft' : 'Copy text draft'; copy.addEventListener('click', () => copyDraft([...(emailMode ? [`BCC: ${content.bcc}`, `Subject: ${content.subject}`] : phone ? [`To: ${phone}`] : []), '', textarea.value].join('\n'), textarea));
      const open = doc.createElement('a'); open.textContent = emailMode ? 'Open email app' : 'Open text app'; open.href = emailMode ? makeEmailDraft(emailContacts) : makeSmsDraft(phone); open.style.cssText = 'padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px';
      const closeDraft = doc.createElement('button'); closeDraft.type = 'button'; closeDraft.textContent = 'Close draft'; closeDraft.addEventListener('click', () => draftArea.replaceChildren());
      actions.append(copy, open, closeDraft); panel.append(actions); draftArea.append(panel);
      status.textContent = emailMode ? (content.bcc ? 'Email draft includes only the selected contacts with email addresses.' : 'Email draft ready. Add your recipient, then review and copy or open it in your email app.') : (phone ? 'Text draft ready for the selected phone number.' : 'Text draft ready. Choose a recipient in your messaging app.');
      textarea.focus();
    }

    byId('palcyai-email-draft').addEventListener('click', () => showDraft('email'));
    byId('palcyai-sms-draft').addEventListener('click', () => showDraft('sms'));

    byId('palcyai-share-apps').addEventListener('click', async () => {
      const data = makeSharePayload();
      if (typeof nav?.share === 'function') {
        try { await nav.share(data); status.textContent = 'The device share sheet opened. Choose an app and recipients there.'; }
        catch (error) { status.textContent = error?.name === 'AbortError' ? 'Sharing was cancelled.' : `Sharing is unavailable here. You can copy the link instead: ${data.url}`; }
      } else {
        status.textContent = 'This browser has no device share sheet. Use Copy referral link or choose device contacts where supported.';
      }
    });

    byId('palcyai-copy-link').addEventListener('click', async () => {
      const text = `${TEXT}\n\n${REFERRAL_URL}`;
      try {
        if (nav?.clipboard?.writeText) await nav.clipboard.writeText(text);
        else throw new Error('Clipboard unavailable');
        status.textContent = 'Referral message and link copied. Paste it into the app you choose.';
      } catch {
        status.textContent = `Copy this link: ${REFERRAL_URL}`;
      }
    });

    const pickerButton = byId('palcyai-choose-contacts');
    pickerButton.addEventListener('click', async () => {
      if (!isContactPickerAvailable(nav, global)) {
        if (typeof nav?.share === 'function') {
          try { await nav.share(makeSharePayload()); status.textContent = 'This browser cannot list contacts for the page. The device share sheet opened; choose a recipient or app there.'; }
          catch (error) { status.textContent = error?.name === 'AbortError' ? 'Sharing was cancelled. You can still create and copy an email or text draft below.' : 'Contact listing is unsupported here. Create a draft below or use Share to apps and contacts.'; }
        } else status.textContent = 'This browser cannot list contacts or open a device share sheet. Use the email/text draft buttons and copy the message into an app.';
        return;
      }
      let selection;
      try {
        if (!contactProperties.includes('email') && !contactProperties.includes('tel')) {
          status.textContent = 'This contact picker does not expose email or phone details.';
          return;
        }
        selection = beginContactSelection(nav, contactProperties);
      } catch (error) {
        status.textContent = 'The device contact picker could not be opened. Use the device share sheet instead.';
        return;
      }
      try {
        const result = await selection;
        contacts = normalizeContacts(result);
        renderContacts();
      } catch (error) {
        status.textContent = error?.name === 'AbortError' ? 'Contact selection was cancelled.' : 'The device contact picker could not be opened. Use the device share sheet instead.';
      }
    });

    function selected() { return contacts.filter(contact => contact.selected); }
    function renderContacts() {
      contactsArea.replaceChildren();
      if (!contacts.length) {
        status.textContent = 'No contacts with an email address or phone number were selected.';
        return;
      }
      status.textContent = `${contacts.length} contact${contacts.length === 1 ? '' : 's'} selected on your device. Uncheck anyone you do not want to include.`;
      const allLabel = doc.createElement('label');
      allLabel.style.cssText = 'display:block;margin:12px 0;font-weight:700';
      const all = doc.createElement('input'); all.type = 'checkbox'; all.checked = areAllSelected(contacts);
      all.addEventListener('change', () => {
        contacts.forEach(contact => { contact.selected = all.checked; });
        renderContacts();
      });
      allLabel.append(all, doc.createTextNode(' Select all chosen contacts'));
      contactsArea.append(allLabel);
      const list = doc.createElement('div');
      list.style.cssText = 'display:grid;gap:8px';
      contacts.forEach((contact, index) => {
        const row = doc.createElement('div');
        row.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;border:1px solid #dbe2ea;border-radius:10px;padding:10px';
        const check = doc.createElement('input'); check.type = 'checkbox'; check.checked = contact.selected;
        check.setAttribute('aria-label', `Include ${contact.name}`);
        check.addEventListener('change', () => { contacts[index].selected = check.checked; renderContacts(); });
        const label = doc.createElement('span');
        label.style.cssText = 'flex:1;min-width:180px';
        label.textContent = `${contact.name} · ${[...contact.emails, ...contact.phones].join(' · ')}`;
        row.append(check, label);
        contact.phones.forEach(phone => {
          const sms = doc.createElement('button'); sms.type = 'button'; sms.textContent = 'Text draft'; sms.disabled = !contact.selected;
          sms.addEventListener('click', () => showDraft('sms', phone));
          row.append(sms);
        });
        list.append(row);
      });
      contactsArea.append(list);
      const email = doc.createElement('button'); email.type = 'button';
      email.textContent = 'Create email draft for selected contacts';
      email.style.cssText = 'display:inline-block;margin-top:12px;font-weight:800';
      email.addEventListener('click', () => {
        const chosen = selected();
        if (!chosen.some(c => c.emails.length)) { status.textContent = 'Select at least one contact with an email address, or use Create email draft to prepare an unaddressed message.'; return; }
        showDraft('email', '', chosen);
      });
      contactsArea.append(email);
    }
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else { dialog.setAttribute('open', ''); dialog.style.position = 'fixed'; dialog.style.inset = '10% 5% auto'; }
  }

  global.PALCYAIReferral = { makeSharePayload, normalizeContacts, areAllSelected, makeEmailDraft, makeSmsDraft, makeEmailDraftContent, makeTextDraftContent, isContactPickerAvailable, beginContactSelection, openReferralDialog };
})(globalThis);



