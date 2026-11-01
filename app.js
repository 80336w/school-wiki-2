'use strict';

// ===== 通用页面交互 =====
const menuBtn = document.querySelector('.menu-btn');
const mainNav = document.querySelector('.main-nav');

if (menuBtn && mainNav) {
  menuBtn.addEventListener('click', () => {
    mainNav.classList.toggle('open');
  });
}

const filterButtons = document.querySelectorAll('.filter-btn');
const courseCards = document.querySelectorAll('.course-card');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((btn) => btn.classList.toggle('active', btn === button));

    courseCards.forEach((card) => {
      const category = card.dataset.category;
      const show = filter === 'all' || category === filter;
      card.style.display = show ? 'block' : 'none';
    });
  });
});

// ===== 用户状态 =====
const authTrigger = document.getElementById('authTrigger');
const userBadge = document.getElementById('userBadge');
const miniAvatar = document.getElementById('miniAvatar');
const miniName = document.getElementById('miniName');

const profileNameLarge = document.getElementById('profileNameLarge');
const profileIntroLarge = document.getElementById('profileIntroLarge');
const profileAvatarLarge = document.getElementById('profileAvatarLarge');

const authModal = document.getElementById('authModal');
const closeModal = document.getElementById('closeModal');
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const githubLoginBtn = document.getElementById('githubLoginBtn');

const profileEditor = document.getElementById('profileEditor');
const editProfileBtn = document.getElementById('editProfileBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const cancelProfileBtn = document.getElementById('cancelProfileBtn');
const avatarInput = document.getElementById('avatarInput');
const nameInput = document.getElementById('nameInput');
const introInput = document.getElementById('introInput');

function defaultAvatar(name = 'User') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1d4ed8&color=fff`;
}

function openModal() { authModal.classList.remove('hidden'); }
function closeModalFn() { authModal.classList.add('hidden'); }

authTrigger.addEventListener('click', openModal);
closeModal.addEventListener('click', closeModalFn);
document.addEventListener('click', (e) => {
  if (e.target === authModal) closeModalFn();
});

authTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    authTabs.forEach((t) => t.classList.toggle('active', t === tab));
    const mode = tab.dataset.auth;

    if (mode === 'login') {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    } else {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
    }
  });
});

function getUserList() {
  return JSON.parse(localStorage.getItem('campus_users') || '[]');
}
function saveUserList(list) {
  localStorage.setItem('campus_users', JSON.stringify(list));
}
function getCurrentUser() {
  const raw = localStorage.getItem('campus_current_user');
  return raw ? JSON.parse(raw) : null;
}
function setCurrentUser(user) {
  localStorage.setItem('campus_current_user', JSON.stringify(user));
}

function createUser({ name, email, password, avatar, intro, provider = 'email' }) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name,
    email,
    password,
    avatar: avatar || defaultAvatar(name),
    intro: intro || '这个人还没有写介绍。',
    provider
  };
}

function setUserUI(user) {
  if (!user) {
    authTrigger.classList.remove('hidden');
    userBadge.classList.add('hidden');
    profileAvatarLarge.src = defaultAvatar('User');
    profileNameLarge.textContent = '校园用户';
    profileIntroLarge.textContent = '这个人还没有写介绍。';
    return;
  }

  authTrigger.classList.add('hidden');
  userBadge.classList.remove('hidden');

  const avatar = user.avatar || defaultAvatar(user.name || 'User');

  miniAvatar.src = avatar;
  miniName.textContent = user.name || '校园用户';

  profileAvatarLarge.src = avatar;
  profileNameLarge.textContent = user.name || '校园用户';
  profileIntroLarge.textContent = user.intro || '这个人还没有写介绍。';

  nameInput.value = user.name || '';
  introInput.value = user.intro || '';
}

// 邮箱注册
registerForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  if (!name || !email || !password) {
    alert('请完整填写注册信息');
    return;
  }

  if (password.length < 6) {
    alert('密码至少 6 位');
    return;
  }

  const users = getUserList();
  const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());

  if (exists) {
    alert('该邮箱已注册');
    return;
  }

  const user = createUser({
    name,
    email,
    password,
    avatar: defaultAvatar(name),
    intro: '这个人还没有写介绍。',
    provider: 'email'
  });

  users.push(user);
  saveUserList(users);
  setCurrentUser(user);
  setUserUI(user);
  closeModalFn();
  registerForm.reset();
});

// 邮箱登录
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  const users = getUserList();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

  if (!user) {
    alert('邮箱或密码不正确');
    return;
  }

  setCurrentUser(user);
  setUserUI(user);
  closeModalFn();
  loginForm.reset();
});

// GitHub 登录（前端演示版）
githubLoginBtn.addEventListener('click', () => {
  const users = getUserList();
  let githubUser = users.find((u) => u.provider === 'github');

  if (!githubUser) {
    const name = prompt('请输入你的 GitHub 用户名', 'schooluser');
    if (!name) return;

    githubUser = createUser({
      name,
      email: `${name.toLowerCase()}@github.local`,
      password: 'github-login',
      avatar: `https://github.com/${name}.png`,
      intro: 'GitHub 登录用户，欢迎来到校园百科。',
      provider: 'github'
    });

    users.push(githubUser);
    saveUserList(users);
  }

  setCurrentUser(githubUser);
  setUserUI(githubUser);
  closeModalFn();
});

// 编辑资料
editProfileBtn.addEventListener('click', () => {
  const user = getCurrentUser();
  if (!user) {
    openModal();
    return;
  }

  profileEditor.classList.remove('hidden');
  nameInput.value = user.name || '';
  introInput.value = user.intro || '';
});

cancelProfileBtn.addEventListener('click', () => {
  profileEditor.classList.add('hidden');
});

avatarInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const src = reader.result;
    profileAvatarLarge.src = src;
    miniAvatar.src = src;
  };
  reader.readAsDataURL(file);
});

saveProfileBtn.addEventListener('click', () => {
  const current = getCurrentUser();
  if (!current) {
    alert('请先登录后再修改资料');
    return;
  }

  const newName = nameInput.value.trim() || '校园用户';
  const newIntro = introInput.value.trim() || '这个人还没有写介绍。';
  const avatar = profileAvatarLarge.src || defaultAvatar(newName);

  const users = getUserList();
  const index = users.findIndex((u) => u.email === current.email && u.provider === current.provider);

  if (index >= 0) {
    const updated = { ...users[index], name: newName, intro: newIntro, avatar };
    users[index] = updated;
    saveUserList(users);
    setCurrentUser(updated);
  }

  setUserUI(getCurrentUser());
  profileEditor.classList.add('hidden');
});

const savedUser = getCurrentUser();
if (savedUser) setUserUI(savedUser);
else setUserUI(null);
