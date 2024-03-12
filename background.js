browser.tabs.onCreated.addListener(async () => {
  console.log("tab added");
  let newtabsearch = await browser.storage.local.get("newtabsearch");
  let searcharray = newtabsearch["newtabsearch"].split("||");
  let gettingActiveTab = browser.tabs.query({ active: true, currentWindow: true });
  gettingActiveTab.then((tab) => {
    let rtrn = false;
    for (let a of searcharray) {
      if (a === tab[0].title) {
        rtrn = true;
      }
    }
    console.log(rtrn, tab[0].title);
  });
});

browser.tabs.onRemoved.addListener(() => {
  console.log("tab removed");
  let gettingActiveTab = browser.tabs.query({ active: true, currentWindow: true });
  gettingActiveTab.then((tab) => {
    console.log(tab[0].title);
  });
});
