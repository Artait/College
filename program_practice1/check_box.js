function togglePassword() {
    const password = document.getElementById('password');
    const showPass = document.getElementById('showpass');
    password.type = showPass.checked ? 'text' : 'password';
}

document.getElementById('showpass').addEventListener('change', togglePassword);
