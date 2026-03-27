import { setVisible } from "./utils.js";

const loadingScreen = document.getElementById('loading-screen');
const loadingScreenSlow = loadingScreen.querySelector('.slow');

let isDoneLoading = false;
const waitingUntilDone = [];

export function show(isSlow = false) {
    setVisible(loadingScreen, true);
    setVisible(loadingScreenSlow, isSlow);
}

export function hide() {
    setVisible(loadingScreen, false);
    setVisible(loadingScreenSlow, false);
}

export function isDone() {
    return isDoneLoading;
}

export function waitUntilDone() {
    if (isDone()) {
        return;
    }

    show();
    return new Promise(res => {
        waitingUntilDone.push(res);
    });
}

export function onDone() {
    if (isDoneLoading) {
        return;
    }

    for (const waiting of waitingUntilDone) {
        waiting()
    }
    waitingUntilDone.splice(0);
    isDoneLoading = true;
    hide();
}