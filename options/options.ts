import browser from "webextension-polyfill";
import { selectOptions, selectOptionNames } from "../option-types";

let optionElements: NodeListOf<HTMLInputElement> = document.querySelectorAll('input[type="text"]');

let optionEl = document.querySelector('#options');
Object.entries(selectOptions).map(e => {
  let lbl = document.createElement('label');
  lbl.innerHTML = selectOptionNames[e[0] as keyof typeof selectOptions];
  let select = document.createElement('select');
  select.id = e[0];
  e[1].forEach(e => {
    let option = document.createElement('option');
    option.value = e.id;
    option.innerHTML = e.value;
    select.appendChild(option);
  });
  ;
  optionEl?.appendChild(lbl);
  optionEl?.appendChild(select);
});

async function updateUI() {
  for (let el of optionElements) {
    let val = await browser.storage.local.get(el.id);
    el.value = val[el.id];
  }

  for (let el of optionEl?.querySelectorAll('select')!) {
    let val = await browser.storage.local.get(el.id);
    let options = el.querySelectorAll('option');
    for (let option of options) {
      if (option.value == val[el.id]) {
        option.selected = true;
        break;
      }
    }
  }
}

async function updateOptions() {
  for (let el of optionElements) {
    browser.storage.local.set({ [el.id]: el.value });
  }
  optionEl?.querySelectorAll('select').forEach(e => {
    let val = e.options[e.selectedIndex].value;
    let setval = { [e.id]: val };
    console.log(setval);
    browser.storage.local.set(setval);
  });
}

document.addEventListener('DOMContentLoaded', updateUI);

document.querySelector('#update')!.addEventListener('click', updateOptions);
