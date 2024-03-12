let optionElements = document.querySelectorAll('input[type="text"]');

async function updateUI() {
  for (let el of optionElements) {
    let val = await browser.storage.local.get(el.id);
    el.value = val[el.id];
  }
}

async function updateOptions() {
  for (let el of optionElements) {
    browser.storage.local.set({ [el.id]: el.value });
  }
}

document.addEventListener('DOMContentLoaded', updateUI);

document.querySelector('#update').addEventListener('click', updateOptions)
