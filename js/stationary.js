import {rbinom_fast} from "./func.js";

const chart = new Chart(document.getElementById("chart"), {
  type: "bar",
  data: { labels: [], datasets: [] },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        type: 'linear',
        min: 0,
        max: 1,
        ticks: {
          stepSize: 0.2,
          callback: function(value) {
            return value.toFixed(1);
          }
        },
        grid: { display: false }
      },
      y: {
        grid: { display: false }
      }
    },
    elements: {
      bar: {
        borderWidth: 0
      }
    },
    categoryPercentage: 1.0,
    barPercentage: 1.0
  }
});

let stopRequested = false;
const nap = () => new Promise(requestAnimationFrame);

function draw(datasets, bin_mids, bin_width, count){
  chart.data.labels = bin_mids;
  chart.data.datasets = [{
    data: datasets.map(x => x / count / bin_width),
    label: "hist"
  }];

  chart.update();
}

document.getElementById("runBtn").addEventListener("click", async () => {
  stopRequested = false;

  const N = parseInt(document.getElementById("N").value, 10);
  const s1 = parseFloat(document.getElementById("s1").value);
  const s2 = parseFloat(document.getElementById("s2").value);
  const u = parseFloat(document.getElementById("u").value);
  const v = parseFloat(document.getElementById("v").value);
  const m = parseFloat(document.getElementById("m").value);
  const pm = parseFloat(document.getElementById("pm").value);
  const burnin = parseFloat(document.getElementById("burnin").value);
  const maxgen = parseFloat(document.getElementById("maxgen").value);
  const sampling = parseFloat(document.getElementById("sampling").value);
  const bin = parseInt(document.getElementById("bin").value, 10);
  const msgEl = document.getElementById("message");

  Ninput.value = N;

  const burnin_gen = Math.round(2 * N * burnin);
  burnininput.value = burnin_gen / 2 / N;

  const maxgen_gen = Math.round(2 * N * maxgen);
  maxgeninput.value = maxgen_gen / 2 / N;

  const sampling_gen = Math.max(Math.round(2 * N * sampling), 1);
  samplinginput.value = sampling_gen / 2 / N;

  bininput.value = bin;

  if (!Number.isSafeInteger(2*N) || N < 1 || 
      Number.isNaN(s1) || Number.isNaN(s2) || s1 < -1.0 || s2 < -1.0 || 
      Number.isNaN(u) || u < 0 || u > 1 || 
      Number.isNaN(v) || v < 0 || v > 1 || 
      Number.isNaN(m) || m < 0 || m > 1 || 
      Number.isNaN(pm) || pm < 0 || pm > 1 || 
      Number.isNaN(burnin) || burnin < 0 ||
      Number.isNaN(maxgen) || maxgen < 0 ||
      Number.isNaN(sampling) || sampling < 0 ||
      !Number.isSafeInteger(bin) || bin < 1
    ) {
    alert("パラメータが範囲外です。");
    return;
  }


  let p = 0.5;
  const datasets = Array(bin).fill(0);

  const bin_width = (1 + 1 / 2 / N) / bin;
  const bin_mids = Array(bin).fill(0);

  for(let i = 0; i < bin; i++){
    bin_mids[i] = - 0.5 / 2 / N + (i + 0.5) * bin_width;
  }

  msgEl.textContent = `burn-in中です`;
  await nap();

  // burnin
  for (let ite = 1; ite <= burnin_gen; ite++){
    if (stopRequested) {
      msgEl.textContent = `⏹ 中断しました（burn-in中)`;
      return;
    }

    // migration
    p = (1.0 - m) * p + m * pm;

    // selection
    p = (p*p * (1+s2) + p*(1-p)*(1+s1)) / (p*p * (1+s2) + 2*p*(1-p)*(1+s1) + (1-p)*(1-p));

    // mutation
    p = (1.0 - v) * p + u * (1.0 - p);

    // drift
    p = rbinom_fast(2*N, p) / 2 / N;
  }

  msgEl.textContent = `サンプリング中です`;
  await nap();

  let count = 0;
  for (let ite = 0; ite < maxgen_gen; ite++) {
    if (stopRequested) {
      msgEl.textContent = `⏹ 中断しました（${ite}世代, ${count}サンプル)`;
      draw(datasets, bin_mids, bin_width, count);
      return;
    }

    if(ite % (10 * N) == 0){
      msgEl.textContent = `サンプリング中です (${ite}世代, ${count}サンプル)`;
      draw(datasets, bin_mids, bin_width, count);
      await nap();
    }

    // migration
    p = (1.0 - m) * p + m * pm;

    // selection
    p = (p*p * (1+s2) + p*(1-p)*(1+s1)) / (p*p * (1+s2) + 2*p*(1-p)*(1+s1) + (1-p)*(1-p));

    // mutation
    p = (1.0 - v) * p + u * (1.0 - p);

    // drift
    p = rbinom_fast(2*N, p) / 2 / N;

    if(ite % sampling_gen == 0){
      const bin_index = Math.floor((p + 0.5 / 2 / N) / (1.0 + 1 / 2 / N) * bin);
      datasets[bin_index]++;
      count++;
    }
  }

  msgEl.textContent = `サンプリング終了 (${maxgen_gen}世代, ${count}サンプル)`;
  draw(datasets, bin_mids, bin_width, count);
  await nap();
});

document.getElementById("stopBtn").addEventListener("click", () => {
  stopRequested = true;
});

const Ninput = document.getElementById("N");
Ninput.addEventListener("input", () => {
  const N = parseInt(Ninput.value, 10);
  if (isNaN(N) || N < 1 || !Number.isSafeInteger(2*N)) {
    Ninput.classList.add("error");
  } else {
    Ninput.classList.remove("error");
  }
});

const s1input = document.getElementById("s1");
s1input.addEventListener("input", () => {
  const s1 = parseFloat(s1input.value);

  if (isNaN(s1) || s1 < -1.0) {
    s1input.classList.add("error");
  }else{
    s1input.classList.remove("error");
  }
});

const s2input = document.getElementById("s2");
s2input.addEventListener("input", () => {
  const s2 = parseFloat(s2input.value);

  if (isNaN(s2) || s2 < -1.0) {
    s2input.classList.add("error");
  }else{
    s2input.classList.remove("error");
  }
});

const uinput = document.getElementById("u");
uinput.addEventListener("input", () => {
  const u = parseFloat(uinput.value);
  if (isNaN(u) || u < 0 || u > 1) {
    uinput.classList.add("error");
  } else {
    uinput.classList.remove("error");
  }
});

const vinput = document.getElementById("v");
vinput.addEventListener("input", () => {
  const v = parseFloat(vinput.value);
  if (isNaN(v) || v < 0 || v > 1) {
    vinput.classList.add("error");
  } else {
    vinput.classList.remove("error");
  }
});

const minput = document.getElementById("m");
minput.addEventListener("input", () => {
  const m = parseFloat(minput.value);
  if (isNaN(m) || m < 0 || m > 1) {
    minput.classList.add("error");
  } else {
    minput.classList.remove("error");
  }
});

const pminput = document.getElementById("pm");
pminput.addEventListener("input", () => {
  const pm = parseFloat(pminput.value);
  if (isNaN(pm) || pm < 0 || pm > 1) {
    pminput.classList.add("error");
  } else {
    pminput.classList.remove("error");
  }
});

const burnininput = document.getElementById("burnin");
burnininput.addEventListener("input", () => {
  const burnin = parseFloat(burnininput.value);
  if (isNaN(burnin) || burnin < 0) {
    burnininput.classList.add("error");
  } else {
    burnininput.classList.remove("error");
  }
});

const maxgeninput = document.getElementById("maxgen");
maxgeninput.addEventListener("input", () => {
  const maxgen = parseFloat(maxgeninput.value);
  if (isNaN(maxgen) || maxgen < 0) {
    maxgeninput.classList.add("error");
  } else {
    maxgeninput.classList.remove("error");
  }
});

const samplinginput = document.getElementById("sampling");
samplinginput.addEventListener("input", () => {
  const sampling = parseFloat(samplinginput.value);
  if (isNaN(sampling) || sampling < 0) {
    samplinginput.classList.add("error");
  } else {
    samplinginput.classList.remove("error");
  }
});

const bininput = document.getElementById("bin");
bininput.addEventListener("input", () => {
  const bin = parseInt(bininput.value, 10);
  if (isNaN(bin) || bin < 1 || !Number.isSafeInteger(bin)) {
    bininput.classList.add("error");
  } else {
    bininput.classList.remove("error");
  }
});