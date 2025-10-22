// ==============================
// LOAD ON SPECIFIC URL
// ==============================

const urlPaths = window.location.pathname.split('/')
switch (urlPaths[1] || '') {
  case 'connect':
    window.addEventListener('load', () => {
      hashChange();
      window.addEventListener('hashchange', hashChange);
    })
    break

  case 'about':
    switch (urlPaths[2] || '') {
      case 'leaders':
        document.querySelectorAll('[data-bio-href]').forEach(btn => {
          btn.addEventListener('click', () => {
            show_dialog(btn.getAttribute('data-bio-href'))
          })
        })
        document.querySelectorAll('[data-closebio-href]').forEach(btn => {
          btn.addEventListener('click', () => {
            close_dialog(btn.getAttribute('data-closebio-href'))
          })
        })
        break
      default:
        break
    }
    break

  case '':
    document.getElementById('main-title').addEventListener('click', () => {
      document.getElementById('3-services').scrollIntoView({ behavior: 'smooth' })
    })
    break

  default:
    break
}


// ==============================
// NAV MOBILE
// ==============================

document.getElementById('hamburger-open').addEventListener('click', openNavModal)
document.getElementById('hamburger-close').addEventListener('click', closeNavModal)
document.getElementById('mobile-nav-backdrop').addEventListener('click', closeNavModal)

const overlay = document.getElementById('nav-modal');
const drawer = document.getElementById('nav-modal-drawer');

function openNavModal() {
  document.body.classList.add('overflow-hidden');
  overlay.classList.toggle('hidden');
  setTimeout(() => {
    drawer.classList.toggle('translate-x-full');
  }, 10);
}
function closeNavModal() {
  document.body.classList.toggle('overflow-hidden');
  drawer.classList.add('translate-x-full');
  setTimeout(() => {
    overlay.classList.add('hidden');
  }, 300);
}

// ==============================
// NAV DESKTOP
// ==============================

let currentOpenMenu = null;

document.querySelectorAll('[data-nav-target]').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    const targetId = this.getAttribute('data-nav-target');
    const targetMenu = document.getElementById(targetId);
    // Close currently open menu if clicking the same button
    if (currentOpenMenu === targetMenu) {
      targetMenu.classList.add('hidden');
      currentOpenMenu = null;
      return;
    }
    // Close any open menu
    if (currentOpenMenu) {
      currentOpenMenu.classList.add('hidden');
    }
    // Open the clicked menu
    targetMenu.classList.remove('hidden');
    currentOpenMenu = targetMenu;
  });
});

// Check if screen is at least 1024px wide (Tailwind's 'lg' breakpoint)
if (window.matchMedia('(min-width: 1024px)').matches) {
  // Close menus when clicking outside
  document.addEventListener('click', function() {
    if (currentOpenMenu) {
      currentOpenMenu.classList.add('hidden');
      currentOpenMenu = null;
    }
  });
}

// ==============================
// CONNECT FORM
// ==============================

const connectBtns = document.querySelectorAll('input[name="connect-form"]')
connectBtns.forEach(btn => btn.addEventListener('change', changeCurrForm));

function changeCurrForm() {
  if (this.checked) {
    Array.from(connectBtns).filter(btn => btn.value != this.value)
      .forEach(btn => {
        const parentLabel = btn.closest('label')
        const targetDiv = parentLabel.querySelector('div');
        targetDiv.classList.add('hidden');
      });

    // Show the correct form; hide all others.
    document.getElementById('placeholder')?.classList.remove('md:flex');
    document.querySelectorAll('[id^="elvanto-form-"]').forEach(div => {
      div.classList.add('hidden');
    });
    const contentId = `form-${this.value}`;
    document.getElementById(contentId)?.classList.remove('hidden');

    // Style the IFrame
    const iframe = document.getElementById(`iframe-form-${this.value}`);
    if (iframe) {
      if (iframe.getAttribute("src") === null) {
        iframe.src = iframe.dataset.src;
        iframe.addEventListener("load", () => {
          beautifyIframe(iframe)
          const cover = document.getElementById(`cover-form-${this.value}`);
          cover.classList.add('hidden');
        });
      } else {
        beautifyIframe(iframe)
      }
    }
  } else {
    // Show all buttons again.
    connectBtns.forEach(btn => {
      const parentLabel = btn.closest('label')
      const targetDiv = parentLabel.querySelector('div');
      targetDiv.classList.remove('hidden');
    });

    document.getElementById('placeholder')?.classList.add('md:flex');
    document.querySelectorAll('[id^="form-"]')
      .forEach(div => div.classList.add('hidden'));
  }
}


function beautifyIframe(iframe) {
  iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 20 + 'px';
  const theme = document.documentElement.getAttribute('data-theme');
  iframe.contentWindow.document.documentElement.setAttribute('data-theme', theme);
}

function hashChange() {
  const hash = window.location.hash;
  if (!hash) return;
  const id = hash.substring(1);

  const checked = document.querySelector(`input[name="connect-form"]:checked`);
  if (checked) checked.click();
  const target = document.querySelector(`input[name="connect-form"][value="${id}"]`);
  if (target) {
    target.click();
    history.replaceState(null, '', window.location.pathname + window.location.search)
    if (!document.getElementById('nav-modal').classList.contains('hidden')) {
      closeNavModal();
    };
  }
}

// ==============================
// LEADERS
// ==============================

var dialog;

function handleBackdropClick(e) {
  if (e.target === dialog) {
    dialog.close();
    dialog.removeEventListener('click', handleBackdropClick);
  }
}

function show_dialog(id) {
  dialog = document.getElementById(id);
  dialog.showModal();
  dialog.addEventListener('click', handleBackdropClick);
  if (dialog.scrollTop != 0) {
    dialog.scrollTop = 0
  }
}

function close_dialog(id) {
  dialog = document.getElementById(id);
  dialog.close();
  dialog.removeEventListener('click', handleBackdropClick);
}
