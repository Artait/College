// Жива валідація форми автентифікації
// Правила та повідомлення
const namePattern = /^[A-ZА-ЯІЇЄҐ][a-zа-яіїєґ]+$/u; // лише літери; починається з великої
const lettersOnly = /^[A-Za-zА-Яа-яІіЇїЄєҐґ]+$/u;

const validators = {
  firstName: {
    required: true,
    test: (v) => namePattern.test(v.trim()),
    message: (v) => {
      if(!v) return "Поле обов'язкове";
      if(!lettersOnly.test(v)) return "Лише українські або англійські літери";
      if(v && v[0] !== v[0].toUpperCase()) return "Має починатися з великої літери";
      if(!namePattern.test(v)) return "Має починатися з великої та містити лише літери";
      return "";
    }
  },
  lastName: {
    required: true,
    test: (v) => namePattern.test(v.trim()),
    message: (v) => {
      if(!v) return "Поле обов'язкове";
      if(!lettersOnly.test(v)) return "Лише українські або англійські літери";
      if(v && v[0] !== v[0].toUpperCase()) return "Має починатися з великої літери";
      if(!namePattern.test(v)) return "Має починатися з великої та містити лише літери";
      return "";
    }
  },
  email: {
    required: true,
    // Просте RFC-подібне правило для навчальних цілей
    test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    message: (v) => {
      if(!v) return "Поле обов'язкове";
      return "Невірний формат e-mail";
    }
  },
  password: {
    required: true,
    test: (v) => {
      const s = String(v);
      return s.length >= 8 &&
             /(?=.*\p{Lu})/u.test(s) &&
             /(?=.*\p{Ll})/u.test(s) &&
             /(?=.*\d)/.test(s) &&
             /(?=.*[!@#$%^&*])/.test(s);
    },
    message: (v) => {
      const rules = [];
      const s = String(v);
      if(s.length < 8) rules.push("мінімум 8 символів");
      if(!/(?=.*\p{Lu})/u.test(s)) rules.push("хоча б одна велика літера");
      if(!/(?=.*\p{Ll})/u.test(s)) rules.push("хоча б одна мала літера");
      if(!/(?=.*\d)/.test(s)) rules.push("хоча б одна цифра");
      if(!/(?=.*[!@#$%^&*])/.test(s)) rules.push("хоча б один спецсимвол (!@#$%^&*)");
      if(!s) return "Поле обов'язкове";
      return "Невиконані умови: " + rules.join(", ");
    }
  }
};

class FormValidator{
  constructor(form){
    this.form = form;
    this.fields = {
      firstName: form.querySelector("#firstName"),
      lastName: form.querySelector("#lastName"),
      email: form.querySelector("#email"),
      password: form.querySelector("#password")
    };
    this.errors = {
      firstName: form.querySelector("#firstNameError"),
      lastName: form.querySelector("#lastNameError"),
      email: form.querySelector("#emailError"),
      password: form.querySelector("#passwordError")
    };
    this.passwordRulesList = form.querySelector("#passwordRules");
    this.submitBtn = form.querySelector("#submitBtn");
    this.showPw = form.querySelector("#showPassword");
    this.attach();
    this.updateSubmitState();
  }

  attach(){
    // live validation
    Object.entries(this.fields).forEach(([key, input])=>{
      input.addEventListener("input", ()=>{
        this.validateField(key);
        this.updateSubmitState();
      });
      input.addEventListener("blur", ()=>{
        this.validateField(key, {showAllErrors:true});
        this.updateSubmitState();
      });
      // For name fields, remove spaces/extra characters on the fly
      if(key === "firstName" || key === "lastName"){
        input.addEventListener("input", ()=>{
          // Only keep letters
          const raw = input.value;
          const cleaned = raw.replace(/[^A-Za-zА-Яа-яІіЇїЄєҐґ]/gu, "");
          if(raw !== cleaned){
            const pos = input.selectionStart - (raw.length - cleaned.length);
            input.value = cleaned;
            input.setSelectionRange(pos, pos);
          }
        });
      }
    });

    // Show / hide password
    this.showPw.addEventListener("change", ()=>{
      this.fields.password.type = this.showPw.checked ? "text" : "password";
    });

    // Submit
    this.form.addEventListener("submit", (e)=>{
      e.preventDefault();
      const allOk = this.validateAll({showAllErrors:true});
      if(!allOk){
        this.updateSubmitState();
        return;
      }
      // Success — покажемо дані
      const payload = {
        firstName: this.fields.firstName.value.trim(),
        lastName: this.fields.lastName.value.trim(),
        email: this.fields.email.value.trim()
        // Пароль тут не логуємо для безпеки; просто факт валідності
      };
      console.log("Форма валідна. Дані:", payload);
      alert("Форма валідна!\\n" + JSON.stringify(payload, null, 2));
      this.form.reset();
      this.resetVisuals();
      this.updateSubmitState();
    });

    // Reset
    const resetBtn = this.form.querySelector("#resetBtn");
    resetBtn.addEventListener("click", ()=>{
      this.form.reset();
      this.resetVisuals();
      this.updateSubmitState();
    });
  }

  resetVisuals(){
    Object.values(this.fields).forEach((el)=>{
      el.closest(".field").classList.remove("valid","invalid");
    });
    Object.values(this.errors).forEach((el)=> el.textContent = "");
    this.updatePasswordRules("");
  }

  validateAll(opts={}){
    return Object.keys(this.fields).map((k)=> this.validateField(k, opts)).every(Boolean);
  }

  validateField(key, opts={}){
    const input = this.fields[key];
    const rules = validators[key];
    const value = input.value;
    let ok = true, message = "";

    if(rules.required && !String(value).trim()){
      ok = false;
      message = "Поле обов'язкове";
    }else if(!rules.test(value)){
      ok = false;
      message = typeof rules.message === "function" ? rules.message(value) : rules.message;
    }

    // Password rules list
    if(key === "password"){
      this.updatePasswordRules(String(value));
    }

    // Visual state + error text
    const fieldEl = input.closest(".field");
    fieldEl.classList.toggle("valid", ok);
    fieldEl.classList.toggle("invalid", !ok);
    this.errors[key].textContent = (!ok || opts.showAllErrors) ? message : "";

    return ok;
  }

  updateSubmitState(){
    const ok = this.validateAll();
    this.submitBtn.disabled = !ok;
  }

  updatePasswordRules(value){
    if(!this.passwordRulesList) return;
    const tests = {
      len: value.length >= 8,
      upper: /(?=.*\p{Lu})/u.test(value),
      lower: /(?=.*\p{Ll})/u.test(value),
      digit: /(?=.*\d)/.test(value),
      spec: /(?=.*[!@#$%^&*])/.test(value),
    };
    for(const li of this.passwordRulesList.querySelectorAll("li")){
      const key = li.getAttribute("data-rule");
      const good = !!tests[key];
      li.classList.toggle("ok", good);
      li.classList.toggle("bad", !good && value.length>0);
    }
  }
}

window.addEventListener("DOMContentLoaded", ()=>{
  const form = document.getElementById("authForm");
  new FormValidator(form);
});
