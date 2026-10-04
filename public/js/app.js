/* CodeNest front-end behaviour. Plain JS, no dependencies. */
(function () {
  'use strict';

  var csrfMeta = document.querySelector('meta[name="csrf-token"]');
  var csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  // ------------------------------------------------------------ theme

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      /* storage unavailable: theme still applies for this page */
    }
  }

  // ------------------------------------------------------------ helpers

  function slugify(text) {
    return String(text || '')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\+/g, ' plus ')
      .replace(/#/g, ' sharp ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/g, '');
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
      } catch (err) {
        reject(err);
      } finally {
        area.remove();
      }
    });
  }

  function flashButton(button, label) {
    var original = button.getAttribute('data-original-label') || button.innerHTML;
    button.setAttribute('data-original-label', original);
    button.textContent = label;
    setTimeout(function () {
      button.innerHTML = original;
    }, 1500);
  }

  function randomPassword() {
    var letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    var digits = '23456789';
    var all = letters + digits + '!@#$%';
    var values = new Uint32Array(14);
    window.crypto.getRandomValues(values);
    var out = letters[values[0] % letters.length] + digits[values[1] % digits.length];
    for (var i = 2; i < values.length; i++) out += all[values[i] % all.length];
    return out
      .split('')
      .sort(function () {
        return 0.5 - Math.random();
      })
      .join('');
  }

  // ------------------------------------------------------------ per-element setup
  // Called on load and again when part of the page is replaced after an upload.

  function addCopyButtons(root) {
    $all('.prose pre', root).forEach(function (pre) {
      if (pre.querySelector('.copy-code')) return;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-code';
      button.textContent = 'Copy';
      button.addEventListener('click', function () {
        var code = pre.querySelector('code');
        copyText((code || pre).innerText).then(
          function () {
            flashButton(button, 'Copied!');
          },
          function () {
            flashButton(button, 'Press Ctrl+C');
          },
        );
      });
      pre.appendChild(button);
    });
  }

  function syncVideoPanels(root) {
    var group = $('[data-video-type]', root);
    if (!group) return;
    var checked = $('input[name="video_type"]:checked', group);
    var value = checked ? checked.value : 'none';
    $all('[data-video-panel]', root).forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-video-panel') !== value;
    });
  }

  function initAll(root) {
    addCopyButtons(root);
    syncVideoPanels(root);
  }

  // ------------------------------------------------------------ markdown editor

  var MD_ACTIONS = {
    heading: { prefix: '## ', line: true, placeholder: 'Heading' },
    bold: { before: '**', after: '**', placeholder: 'bold text' },
    italic: { before: '_', after: '_', placeholder: 'italic text' },
    code: { before: '`', after: '`', placeholder: 'code' },
    codeblock: { before: '\n```python\n', after: '\n```\n', placeholder: 'print("Hello")' },
    link: { before: '[', after: '](https://)', placeholder: 'link text' },
    image: { before: '![', after: '](/uploads/media/your-image.png)', placeholder: 'description' },
    list: { prefix: '- ', line: true, placeholder: 'List item' },
    quote: { prefix: '> ', line: true, placeholder: 'Quote' },
  };

  function applyMarkdown(textarea, action) {
    var spec = MD_ACTIONS[action];
    if (!spec) return;
    var start = textarea.selectionStart;
    var end = textarea.selectionEnd;
    var selected = textarea.value.slice(start, end) || spec.placeholder;
    var replacement;
    if (spec.line) {
      replacement = selected
        .split('\n')
        .map(function (line) {
          return spec.prefix + line;
        })
        .join('\n');
      if (start > 0 && textarea.value[start - 1] !== '\n') replacement = '\n' + replacement;
    } else {
      replacement = spec.before + selected + spec.after;
    }
    textarea.focus();
    var inserted = false;
    try {
      inserted = document.execCommand('insertText', false, replacement);
    } catch (e) {
      inserted = false;
    }
    if (!inserted) {
      textarea.setRangeText(replacement, start, end, 'end');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function showMarkdownTab(editor, tab) {
    var textarea = $('.md-input', editor);
    var preview = $('.md-preview', editor);
    var actions = $('[data-md-actions]', editor);
    $all('[data-md-tab]', editor).forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-md-tab') === tab);
    });
    if (tab === 'write') {
      preview.hidden = true;
      textarea.hidden = false;
      actions.hidden = false;
      textarea.focus();
      return;
    }
    preview.style.minHeight = textarea.offsetHeight + 'px';
    textarea.hidden = true;
    actions.hidden = true;
    preview.hidden = false;
    preview.textContent = 'Rendering preview…';
    fetch('/admin/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
      body: JSON.stringify({ markdown: textarea.value }),
      credentials: 'same-origin',
    })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        // The server sanitises this HTML before returning it.
        preview.innerHTML = data.html || '<p class="muted">Nothing to preview yet.</p>';
        addCopyButtons(editor);
      })
      .catch(function () {
        preview.textContent = 'Preview is unavailable right now. Your text is safe; try again in a moment.';
      });
  }

  // ------------------------------------------------------------ uploads with progress

  function fileTooLarge(input) {
    var maxMb = Number(input.getAttribute('data-max-mb'));
    if (!maxMb || !input.files) return null;
    for (var i = 0; i < input.files.length; i++) {
      if (input.files[i].size > maxMb * 1024 * 1024) {
        return '"' + input.files[i].name + '" is larger than ' + maxMb + ' MB.';
      }
    }
    return null;
  }

  function submitWithProgress(form, submitter) {
    var progress = $('[data-upload-progress]', form);
    var bar = progress && $('span', progress);
    var buttons = $all('button[type="submit"], button:not([type])', form);
    var data;
    try {
      data = submitter ? new FormData(form, submitter) : new FormData(form);
    } catch (e) {
      data = new FormData(form);
      if (submitter && submitter.name) data.append(submitter.name, submitter.value);
    }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', form.action);
    xhr.setRequestHeader('X-Upload-Request', '1');
    xhr.setRequestHeader('Accept', 'application/json, text/html');
    buttons.forEach(function (button) {
      button.disabled = true;
    });
    if (progress) progress.hidden = false;

    xhr.upload.addEventListener('progress', function (event) {
      if (bar && event.lengthComputable) bar.style.width = Math.round((event.loaded / event.total) * 100) + '%';
    });

    xhr.addEventListener('load', function () {
      var type = xhr.getResponseHeader('Content-Type') || '';
      if (type.indexOf('application/json') !== -1) {
        try {
          var payload = JSON.parse(xhr.responseText);
          if (payload.redirect && payload.redirect.charAt(0) === '/' && payload.redirect.charAt(1) !== '/') {
            window.location.assign(payload.redirect);
            return;
          }
        } catch (e) {
          /* fall through to a full reload */
        }
        window.location.reload();
        return;
      }
      // Validation errors come back as a full HTML page: swap in its <main>.
      var doc = new DOMParser().parseFromString(xhr.responseText, 'text/html');
      var incoming = doc.getElementById('main');
      var current = document.getElementById('main');
      if (incoming && current) {
        current.innerHTML = incoming.innerHTML;
        initAll(current);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.location.reload();
      }
    });

    xhr.addEventListener('error', function () {
      buttons.forEach(function (button) {
        button.disabled = false;
      });
      if (progress) progress.hidden = true;
      window.alert('The upload failed. Check your connection and try again.');
    });

    xhr.send(data);
  }

  // ------------------------------------------------------------ chart tooltip

  function showChartTooltip(col) {
    var body = col.closest('[data-chart-body]');
    var tooltip = body && $('.chart-tooltip', body);
    if (!tooltip) return;
    var bar = $('.chart-bar', col);
    var bodyRect = body.getBoundingClientRect();
    var colRect = col.getBoundingClientRect();
    var barRect = bar.getBoundingClientRect();
    $('strong', tooltip).textContent = col.getAttribute('data-tip-value');
    $('span', tooltip).textContent = col.getAttribute('data-tip-label');
    tooltip.hidden = false;
    var left = colRect.left + colRect.width / 2 - bodyRect.left;
    var half = tooltip.offsetWidth / 2;
    left = Math.max(half, Math.min(bodyRect.width - half, left));
    tooltip.style.left = left + 'px';
    tooltip.style.top = barRect.top - bodyRect.top + 'px';
  }

  function hideChartTooltip(col) {
    var body = col.closest('[data-chart-body]');
    var tooltip = body && $('.chart-tooltip', body);
    if (tooltip) tooltip.hidden = true;
  }

  // ------------------------------------------------------------ event wiring

  document.addEventListener('click', function (event) {
    var target = event.target;

    var themeButton = target.closest('[data-theme-toggle]');
    if (themeButton) {
      var current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      setTheme(current === 'light' ? 'dark' : 'light');
      return;
    }

    var navToggle = target.closest('[data-nav-toggle]');
    if (navToggle) {
      var nav = document.getElementById('site-nav');
      var open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      return;
    }

    var chapterToggle = target.closest('[data-chapter-toggle]');
    if (chapterToggle) {
      var chapters = document.getElementById('chapter-nav');
      var chaptersOpen = chapters.classList.toggle('open');
      chapterToggle.setAttribute('aria-expanded', String(chaptersOpen));
      return;
    }

    var adminToggle = target.closest('[data-admin-nav-toggle]');
    var adminClose = target.closest('[data-admin-nav-close]');
    if (adminToggle || adminClose) {
      var sidebar = $('[data-admin-nav]');
      var backdrop = $('[data-admin-nav-close]');
      var isOpen = adminToggle ? !sidebar.classList.contains('open') : false;
      sidebar.classList.toggle('open', isOpen);
      backdrop.classList.toggle('open', isOpen);
      var toggle = $('[data-admin-nav-toggle]');
      if (toggle) toggle.setAttribute('aria-expanded', String(isOpen));
      return;
    }

    var dismiss = target.closest('[data-dismiss]');
    if (dismiss) {
      var alertBox = dismiss.closest('[data-dismissible]');
      if (alertBox) alertBox.remove();
      return;
    }

    var demo = target.closest('[data-demo-email]');
    if (demo) {
      var email = $('[data-login-email]');
      var password = $('[data-login-password]');
      if (email && password) {
        email.value = demo.getAttribute('data-demo-email');
        password.value = demo.getAttribute('data-demo-password');
        email.form.requestSubmit ? email.form.requestSubmit() : email.form.submit();
      }
      return;
    }

    var togglePassword = target.closest('[data-toggle-password]');
    if (togglePassword) {
      var field = togglePassword.parentElement.querySelector('input');
      var show = field.type === 'password';
      field.type = show ? 'text' : 'password';
      togglePassword.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      return;
    }

    var generate = target.closest('[data-generate-password]');
    if (generate) {
      var output = generate.parentElement.querySelector('[data-password-output]');
      if (output) {
        output.value = randomPassword();
        output.focus();
        output.select();
      }
      return;
    }

    var copy = target.closest('[data-copy]');
    if (copy) {
      var text = copy.getAttribute('data-copy');
      if (text.charAt(0) === '/') {
        // Media links are stored as paths; copy the full URL for convenience
        // unless it's a Markdown snippet.
        text = window.location.origin + text;
      }
      copyText(text).then(
        function () {
          flashButton(copy, 'Copied!');
        },
        function () {
          window.prompt('Copy this:', text);
        },
      );
      return;
    }

    var mdTab = target.closest('[data-md-tab]');
    if (mdTab) {
      showMarkdownTab(mdTab.closest('[data-md-editor]'), mdTab.getAttribute('data-md-tab'));
      return;
    }

    var mdAction = target.closest('[data-md]');
    if (mdAction) {
      var editor = mdAction.closest('[data-md-editor]');
      applyMarkdown($('.md-input', editor), mdAction.getAttribute('data-md'));
      return;
    }

    var tableToggle = target.closest('[data-chart-table-toggle]');
    if (tableToggle) {
      var chart = tableToggle.closest('[data-chart]');
      var table = $('[data-chart-table]', chart);
      var chartBody = $('[data-chart-body]', chart);
      var showTable = table.hidden;
      table.hidden = !showTable;
      chartBody.hidden = showTable;
      tableToggle.textContent = showTable ? 'Show chart' : 'Show table';
      tableToggle.setAttribute('aria-expanded', String(showTable));
      return;
    }

    // Clicking outside an open account menu closes it.
    $all('details[data-menu][open]').forEach(function (menu) {
      if (!menu.contains(target)) menu.removeAttribute('open');
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    $all('details[data-menu][open]').forEach(function (menu) {
      menu.removeAttribute('open');
    });
    var sidebar = $('[data-admin-nav].open');
    if (sidebar) {
      sidebar.classList.remove('open');
      $('[data-admin-nav-close]').classList.remove('open');
    }
  });

  document.addEventListener('submit', function (event) {
    var form = event.target;
    var message = form.getAttribute('data-confirm');
    if (message && !window.confirm(message)) {
      event.preventDefault();
      return;
    }
    if (!form.hasAttribute('data-upload-form') || !window.FormData || !window.XMLHttpRequest) return;
    var hasFiles = $all('input[type="file"]', form).some(function (input) {
      return input.files && input.files.length;
    });
    if (!hasFiles) return;
    event.preventDefault();
    submitWithProgress(form, event.submitter);
  });

  document.addEventListener('change', function (event) {
    var input = event.target;

    if (input.name === 'video_type') {
      syncVideoPanels(input.form || document);
      return;
    }

    if (input.type === 'file') {
      var problem = fileTooLarge(input);
      if (problem) {
        window.alert(problem + ' Please choose a smaller file.');
        input.value = '';
        return;
      }
      var key = input.getAttribute('data-image-preview');
      var file = input.files && input.files[0];
      if (key && file && file.type.indexOf('image/') === 0) {
        var target = $('[data-image-preview-target="' + key + '"]');
        if (target) {
          var img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          img.alt = '';
          if (target.querySelector('.avatar')) img.className = 'avatar avatar-lg';
          target.innerHTML = '';
          target.appendChild(img);
        }
      }
    }
  });

  // Auto-fill slugs from titles until the slug is edited by hand.
  document.addEventListener('input', function (event) {
    var input = event.target;
    if (input.hasAttribute('data-slug-target')) {
      input.setAttribute('data-slug-touched', '');
      return;
    }
    if (input.hasAttribute('data-slug-source')) {
      var slug = input.form && $('[data-slug-target]', input.form);
      if (slug && !slug.hasAttribute('data-slug-locked') && !slug.hasAttribute('data-slug-touched')) {
        slug.value = slugify(input.value);
      }
    }
  });

  // Chart hover / focus tooltips.
  document.addEventListener('pointerover', function (event) {
    var col = event.target.closest && event.target.closest('.chart-col');
    if (col) showChartTooltip(col);
  });
  document.addEventListener('pointerout', function (event) {
    var col = event.target.closest && event.target.closest('.chart-col');
    if (col && !col.contains(event.relatedTarget)) hideChartTooltip(col);
  });
  document.addEventListener('focusin', function (event) {
    if (event.target.classList && event.target.classList.contains('chart-col')) showChartTooltip(event.target);
  });
  document.addEventListener('focusout', function (event) {
    if (event.target.classList && event.target.classList.contains('chart-col')) hideChartTooltip(event.target);
  });

  // Drag & drop onto upload zones.
  document.addEventListener('dragover', function (event) {
    var zone = event.target.closest && event.target.closest('[data-dropzone]');
    if (!zone) return;
    event.preventDefault();
    zone.classList.add('is-dragging');
  });
  document.addEventListener('dragleave', function (event) {
    var zone = event.target.closest && event.target.closest('[data-dropzone]');
    if (zone && !zone.contains(event.relatedTarget)) zone.classList.remove('is-dragging');
  });
  document.addEventListener('drop', function (event) {
    var zone = event.target.closest && event.target.closest('[data-dropzone]');
    if (!zone) return;
    event.preventDefault();
    zone.classList.remove('is-dragging');
    var input = $('input[type="file"]', zone);
    if (input && event.dataTransfer && event.dataTransfer.files.length) {
      input.files = event.dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // Auto-hide success messages after a few seconds.
  setTimeout(function () {
    $all('.flash-stack .alert-success').forEach(function (alertBox) {
      alertBox.style.transition = 'opacity 0.4s';
      alertBox.style.opacity = '0';
      setTimeout(function () {
        alertBox.remove();
      }, 400);
    });
  }, 5000);

  document.addEventListener('DOMContentLoaded', function () {
    initAll(document);
  });
})();
