import {rbinom_fast} from "./func.js";

function simulate(N, p0, max_gen, s1, s2){
  N = Number(N);
  p0 = Number(p0);
  max_gen = Number(max_gen);

  let p = p0;
  const series = [p];

  for(let t = 0; t < max_gen; t++){
    p = (p*p * (1+s2) + p*(1-p)*(1+s1)) / (p*p * (1+s2) + 2*p*(1-p)*(1+s1) + (1-p)*(1-p));
    let ac = rbinom_fast(2*N, p);
    
    p = ac / (2*N);
    series.push(p);

    if(ac == 0 || ac == 2*N){
      return(series);
    }
  }

  return(series);
}

const chart = new Chart(document.getElementById("chart"), {
  type: "line",
  data: { labels: [], datasets: [] },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: { y: { min: 0, max: 1 } },
    elements: { point: { radius: 0 }, line: { borderWidth: 2 } },
    plugins: { legend: { display: false } }
  }
});

let stopRequested = false;
const nap = () => new Promise(requestAnimationFrame);

document.getElementById("runBtn").addEventListener("click", async () => {
  stopRequested = false;

  const N = parseInt(document.getElementById("N").value, 10);
  const s1 = parseFloat(document.getElementById("s1").value);
  const s2 = parseFloat(document.getElementById("s2").value);
  const p0 = parseFloat(document.getElementById("p0").value);
  const maxgen = parseInt(maxginput.value, 10);
  const maxite = parseInt(maxiteinput.value, 10);
  const msgEl = document.getElementById("message");

  Ninput.value = N;
  maxginput.value = maxgen;
  maxiteinput.value = maxite;

  if (!Number.isSafeInteger(2*N) || N < 1 || 
    Number.isNaN(p0) || p0 < 0 || p0 > 1 || 
    !Number.isSafeInteger(maxgen) || maxgen < 1 || 
    !Number.isSafeInteger(maxite) || maxite < 1 || 
    Number.isNaN(s1) || Number.isNaN(s2) || s1 < -1.0 || s2 < -1.0) {
    alert("パラメータが範囲外です。");
    return;
  }

  const datasets = [];
  const maxplot = 50;

  let fixed = 0, extinct = 0, unfinished = 0;
  let sum_fixed = 0.0, sum_extinct = 0.0;

  let max_length = 0;

  for (let r = 1; r <= maxite; r++) {
    if (stopRequested) {
      msgEl.textContent = `⏹ 中断しました（${r - 1}/${maxite}ランまで実行)\n固定: ${fixed}, 消失: ${extinct}, 多型: ${unfinished}
      平均固定時間: ${Math.round(sum_fixed / fixed*10)/10} 世代, 平均消失時間: ${Math.round(sum_extinct / extinct*10)/10} 世代`;
      break;
    }

    const series = simulate(N, p0, maxgen, s1, s2);

    if(series[series.length - 1] == 0.0){
      extinct++;
      sum_extinct += series.length - 1;
    }else if(series[series.length - 1] == 1.0){
      fixed++;
      sum_fixed += series.length - 1;
    }else{
      unfinished++;
    }

    if(r <= maxplot){
      if(series.length > max_length){
        max_length = series.length;
      }

      datasets.push({
        label: `run ${r}`,
        data: series,
        borderColor: `hsla(${Math.random() * 360}, 70%, 55%, 0.6)`,
        borderWidth: 1.0,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
      });
    }

    if(r == maxplot || r == maxite){
      chart.data.labels = Array.from({ length: max_length }, (_, i) => i);;
      chart.data.datasets = datasets;
      chart.update();
      await nap();
    }

    if(r == maxite){
      msgEl.textContent = `⏹ 終了しました（${maxite}ラン実行)\n固定: ${fixed}, 消失: ${extinct}, 多型: ${unfinished}
      平均固定時間: ${Math.round(sum_fixed / fixed*10)/10} 世代, 平均消失時間: ${Math.round(sum_extinct / extinct*10)/10} 世代`;
    }else if(r % 1000 == 0){
      msgEl.textContent = `固定: ${fixed}, 消失: ${extinct}, 多型: ${unfinished}`;
      await nap();
    }
  }
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

const p0input = document.getElementById("p0");
p0input.addEventListener("input", () => {
  const p0 = parseFloat(p0input.value);
  if (isNaN(p0) || p0 < 0 || p0 > 1) {
    p0input.classList.add("error");
  } else {
    p0input.classList.remove("error");
  }
});

const maxginput = document.getElementById("maxg");
maxginput.addEventListener("input", () => {
  const maxgen = parseInt(maxginput.value, 10);
  if (isNaN(maxgen) || maxgen < 1) {
    maxginput.classList.add("error");
  } else {
    maxginput.classList.remove("error");
  }
});

const maxiteinput = document.getElementById("maxite");
maxiteinput.addEventListener("input", () => {
  const maxite = parseInt(maxiteinput.value, 10);
  if (isNaN(maxite) || maxite < 1) {
    maxiteinput.classList.add("error");
  } else {
    maxiteinput.classList.remove("error");
  }
});

