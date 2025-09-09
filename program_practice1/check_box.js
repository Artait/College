document.getElementById('showpass').addEventListener('change', function(){
    const password = document.getElementById('password');
    password.type= this.checked ? 'text' : 'password';
});