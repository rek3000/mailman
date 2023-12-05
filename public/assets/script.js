"use strict"


window.addEventListener("load", init);
function init() {
  function id(id) {
    return document.getElementById(id);
  }

  function qs(selector) {
    return document.querySelector(selector);
  }
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }
  function emailHighlight(event) {
    this.style.boxShadow = "10px 9px 28px -5px rgba(0, 0, 0, 0.51)";
  }

  function changeBack(event) {
    this.style.boxShadow = "none";
  }

  let emailsInfo = qsa(".email-info");
  for (let email of emailsInfo) {
    email.addEventListener("mouseover", emailHighlight);
    email.addEventListener("mouseout", changeBack);
    // email.addEventListener("click", function() {
    //   
    // });
    email.style.cursor = "pointer";
  }
}
