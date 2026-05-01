/**
 * Key Save Button — Unit & Integration Tests
 * Tests: iOS Safari double-fire prevention, Enter key, remember checkbox
 *
 * Run: node key-save.test.js
 */

const { JSDOM } = require('jsdom');

// ── Test helpers ─────────────────────────────────────────────────────────────

let pass = 0, fail = 0;

function assert(condition, label) {
  if (condition) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label}`);
  }
}

function section(name) {
  console.log(`\n${name}`);
}

function createDOM(html) {
  return new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

async function run() {

  section('UNIT: _handleKeySave logic');
  {
    const dom = createDOM(`<!DOCTYPE html><html><body>
      <input id="api-key-input" value="">
      <div id="key-input-error"></div>
      <input type="checkbox" id="key-remember" checked>
      <script>
        var _savedKey = null, _savedRemember = null;
        function saveKey(k, r) { _savedKey = k; _savedRemember = r; }
        function safeStorageSet(k, v) {}
        function hideKeyModal() {}
        function showToast() {}

        window._handleKeySave = function() {
          var input = document.getElementById('api-key-input');
          var errorEl = document.getElementById('key-input-error');
          var key = input.value.trim();
          var remember = document.getElementById('key-remember').checked;
          if (!key) { errorEl.textContent = 'Key 不能为空'; return; }
          if (key.length < 10) { errorEl.textContent = 'Key 格式不对'; return; }
          errorEl.textContent = '';
          saveKey(key, remember);
          safeStorageSet('remember', remember ? '1' : '0');
        };
      </script>
    </body></html>`);

    const doc = dom.window.document;

    doc.getElementById('api-key-input').value = '';
    doc.getElementById('key-input-error').textContent = '';
    dom.window._handleKeySave();
    assert(doc.getElementById('key-input-error').textContent === 'Key 不能为空',
      'empty key → error message');

    doc.getElementById('api-key-input').value = 'abc';
    doc.getElementById('key-input-error').textContent = '';
    dom.window._handleKeySave();
    assert(doc.getElementById('key-input-error').textContent === 'Key 格式不对',
      'short key (<10) → error message');

    doc.getElementById('api-key-input').value = 'valid-key-12345';
    doc.getElementById('key-input-error').textContent = '';
    dom.window._handleKeySave();
    assert(doc.getElementById('key-input-error').textContent === '', 'valid key → no error');
    assert(dom.window._savedKey === 'valid-key-12345', 'valid key → saveKey called');
    assert(dom.window._savedRemember === true, 'checkbox checked → remember=true');

    doc.getElementById('api-key-input').value = 'another-key-12345678';
    doc.getElementById('key-remember').checked = false;
    dom.window._handleKeySave();
    assert(dom.window._savedRemember === false, 'checkbox unchecked → remember=false');
  }

  section('UNIT: _saveLocked double-fire prevention');
  {
    const dom = createDOM(`<!DOCTYPE html><html><body>
      <input id="api-key-input" value="valid-key-12345">
      <div id="key-input-error"></div>
      <input type="checkbox" id="key-remember" checked>
      <script>
        var _callCount = 0;
        function safeStorageSet(k, v) {}
        function saveKey() { _callCount++; }
        function hideKeyModal() {}
        function showToast() {}

        window._handleKeySave = function() {
          var input = document.getElementById('api-key-input');
          var errorEl = document.getElementById('key-input-error');
          var key = input.value.trim();
          if (!key) { errorEl.textContent = 'Key 不能为空'; return; }
          if (key.length < 10) { errorEl.textContent = 'Key 格式不对'; return; }
          errorEl.textContent = '';
          saveKey();
        };

        var _saveLocked = false;
        function _triggerSave(e) {
          if (_saveLocked) return;
          _saveLocked = true;
          window._handleKeySave();
          setTimeout(function() { _saveLocked = false; }, 400);
        }

        window._triggerSave = _triggerSave;
        window._isLocked = function() { return _saveLocked; };
      </script>
    </body></html>`);

    dom.window._triggerSave({});
    assert(dom.window._callCount === 1, 'first call → saveKey called once');
    assert(dom.window._isLocked() === true, 'after first call → locked');

    dom.window._triggerSave({});
    assert(dom.window._callCount === 1, 'second immediate call → blocked by lock');

    await new Promise(resolve => setTimeout(resolve, 450));
    dom.window._triggerSave({});
    assert(dom.window._callCount === 2, 'after lock released → saveKey called twice');
  }

  section('UNIT: Enter key → _triggerSave');
  {
    const dom = createDOM(`<!DOCTYPE html><html><body>
      <input id="api-key-input" value="enter-key-12345">
      <div id="key-input-error"></div>
      <input type="checkbox" id="key-remember" checked>
      <script>
        var _callCount = 0;
        function safeStorageSet(k, v) {}
        function saveKey() { _callCount++; }
        function hideKeyModal() {}
        function showToast() {}

        window._handleKeySave = function() {
          var input = document.getElementById('api-key-input');
          var errorEl = document.getElementById('key-input-error');
          var key = input.value.trim();
          if (!key) { errorEl.textContent = 'Key 不能为空'; return; }
          if (key.length < 10) { errorEl.textContent = 'Key 格式不对'; return; }
          errorEl.textContent = '';
          saveKey();
        };

        var _saveLocked = false;
        function _triggerSave(e) {
          if (_saveLocked) return;
          _saveLocked = true;
          window._handleKeySave();
          setTimeout(function() { _saveLocked = false; }, 400);
        }

        document.getElementById('api-key-input').onkeydown = function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            _triggerSave(e);
          }
        };
        window._triggerSave = _triggerSave;
      </script>
    </body></html>`);

    const input = dom.window.document.getElementById('api-key-input');
    const keyEvent = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    Object.defineProperty(keyEvent, 'preventDefault', { value: function() {} });
    input.dispatchEvent(keyEvent);
    assert(dom.window._callCount === 1, 'Enter key → saveKey called');
  }

  section('INTEGRATION: safeStorageSet REMEMBER_STORAGE called on save');
  {
    const dom = createDOM(`<!DOCTYPE html><html><body>
      <input id="api-key-input" value="remember-test-12345">
      <input type="checkbox" id="key-remember" checked>
      <div id="key-input-error"></div>
      <script>
        var REMEMBER_STORAGE = 'lingo-glm-remember';
        window._captured = [];
        function safeStorageSet(k, v) {
          if (k === 'lingo-glm-remember') window._captured.push(v);
        }
        function saveKey() {}
        function hideKeyModal() {}
        function showToast() {}

        window._handleKeySave = function() {
          var input = document.getElementById('api-key-input');
          var errorEl = document.getElementById('key-input-error');
          var key = input.value.trim();
          var remember = document.getElementById('key-remember').checked;
          if (!key) { errorEl.textContent = 'Key 不能为空'; return; }
          if (key.length < 10) { errorEl.textContent = 'Key 格式不对'; return; }
          errorEl.textContent = '';
          saveKey(key, remember);
          safeStorageSet(REMEMBER_STORAGE, remember ? '1' : '0');
        };
      </script>
    </body></html>`);

    dom.window._handleKeySave();
    assert(dom.window._captured.length === 1 && dom.window._captured[0] === '1',
      'remember checked → safeStorageSet called with "1"');
    assert(dom.window._captured[0] === '1', 'remember value is "1"');

    dom.window.document.getElementById('key-remember').checked = false;
    dom.window._handleKeySave();
    assert(dom.window._captured.length === 2 && dom.window._captured[1] === '0',
      'remember unchecked → safeStorageSet called with "0"');
  }

  // ── Summary
  section('SUMMARY');
  console.log(`  Passed: ${pass}  Failed: ${fail}  Total: ${pass + fail}`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });