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

  async function handleDeletion(event) {
    event.preventDefault();
    const messageIDs = Array.from(qsa("input[name='emailCheckbox']:checked"))
      .map((checkbox) => checkbox.value);
    let data = {messageIDs: messageIDs, 
             placeholder: qs("#delete-button").value,
            };
    await fetch("/delete", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Delete from view of current session
    for (let messageID of messageIDs) {
      document.getElementById(`${messageID}`).remove();
    }
  }

  let emailsInfo = qsa(".email-info");
  let deleteForm = qs("#delete-form");
  deleteForm.addEventListener("submit", handleDeletion);
  for (let email of emailsInfo) {
    email.addEventListener("mouseover", emailHighlight);
    email.addEventListener("mouseout", changeBack);
    email.style.cursor = "pointer";
  }

}
