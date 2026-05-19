import { auth, setCurrentUser, toast } from '../api.js';

export function renderLogin(app) {
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-hero">
          <span class="logo-mark">🏁</span>
          <h1>BoxBox</h1>
          <p>Fantasy Tahmin Ligi</p>
        </div>

        <form id="loginForm">
          <div class="form-group">
            <label for="email">E-posta</label>
            <input type="email" id="email" class="form-input" required placeholder="ornek@email.com" />
          </div>

          <div class="form-group">
            <label for="password">Şifre</label>
            <input type="password" id="password" class="form-input" required minlength="8" placeholder="••••••••" />
          </div>

          <button type="submit" class="btn btn-primary btn-full btn-lg" id="submitBtn">
            Giriş Yap →
          </button>
        </form>

        <div class="auth-switch">
          Hesabın yok mu? <a href="#/register">Kayıt ol</a>
        </div>

        <div class="test-creds">
          <strong>Demo:</strong> sinem@test.com / abc12345
        </div>
      </div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('submitBtn');

    btn.disabled = true;
    btn.textContent = 'Giriş yapılıyor...';

    try {
      const result = await auth.login({ email, password });
      setCurrentUser(result.user);  //token artık responseda yok  
      toast(`Hoş geldin, ${result.user.username}! 🏎️`, 'success');
      location.hash = '#/leagues';
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Giriş Yap →';
    }
  });
}

export function renderRegister(app) {
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-hero">
          <span class="logo-mark">🏁</span>
          <h1>BoxBox</h1>
          <p>Yeni Hesap</p>
        </div>

        <form id="registerForm">
          <div class="form-group">
            <label for="username">Kullanıcı Adı</label>
            <input type="text" id="username" class="form-input" required minlength="3" maxlength="30" placeholder="kullanici_adi" />
            <span class="form-hint">3-30 karakter, sadece harf/rakam/_</span>
          </div>

          <div class="form-group">
            <label for="email">E-posta</label>
            <input type="email" id="email" class="form-input" required placeholder="ornek@email.com" />
          </div>

          <div class="form-group">
            <label for="password">Şifre</label>
            <input type="password" id="password" class="form-input" required minlength="8" placeholder="En az 8 karakter" />
          </div>

          <button type="submit" class="btn btn-primary btn-full btn-lg" id="submitBtn">
            Hesap Oluştur →
          </button>
        </form>

        <div class="auth-switch">
          Zaten hesabın var mı? <a href="#/login">Giriş yap</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('submitBtn');

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast('Kullanıcı adı sadece harf/rakam/_ içerebilir', 'error');
      return;
    }
    if (password.length < 8) {
      toast('Şifre en az 8 karakter olmalı', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Oluşturuluyor...';

    try {
      await auth.register({ username, email, password });
      toast('Hesap oluşturuldu! 🏁', 'success');
      const result = await auth.login({ email, password });
      setCurrentUser(result.user);  //token artık responseda yok
      location.hash = '#/leagues';
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Hesap Oluştur →';
    }
  });
}
