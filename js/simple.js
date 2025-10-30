function rbinom(n, p) {
  let x = 0;

  for (let i = 0; i < n; i++){
    if (Math.random() < p){
      x++;
    }
  }

  return x;
}

function simulate(N, p0, max_gen, s, h){
  N = Number(N);
  p0 = Number(p0);
  max_gen = Number(max_gen);

  let p = p0;
  const series = [p];

  for(let t = 0; t < max_gen; t++){
    p = (p*p * (1+s) + p*(1-p)*(1+s*h)) / (p*p * (1+s) + 2*p*(1-p)*(1+s*h) + (1-p)*(1-p));
    const ac = rbinom(2*N, p);
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
  const s = parseFloat(document.getElementById("s").value);
  const h = parseFloat(document.getElementById("h").value);
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
    Number.isNaN(s) || Number.isNaN(h) || s < -1.0 || s*h < -1.0) {
    alert("パラメータが範囲外です。");
    return;
  }

  const labels = Array.from({ length: maxgen + 1 }, (_, i) => i);
  const datasets = [];
  const maxplot = 50;

  let fixed = 0;
  let extinct = 0;
  let unfinished = 0;
  let max_length = 0;

  for (let r = 1; r <= maxite; r++) {
    if (stopRequested) {
      msgEl.textContent = `⏹ 中断しました（${r - 1}/${maxite}ランまで実行)\n固定: ${fixed}, 消失: ${extinct}, 多型: ${unfinished}`;
      break;
    }

    const series = simulate(N, p0, maxgen, s, h);

    if(series[series.length - 1] == 0.0){
      extinct++;
    }else if(series[series.length - 1] == 1.0){
      fixed++;
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
      chart.data.labels = Array.from({ length: max_length + 1 }, (_, i) => i);;
      chart.data.datasets = datasets;
      chart.update();
      await nap();
    }

    if(r == maxite){
      msgEl.textContent = `⏹ 終了しました（${maxite}ラン実行)\n固定: ${fixed}, 消失: ${extinct}, 多型: ${unfinished}`;
    }else if(r % 100 == 0){
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

const sinput = document.getElementById("s");
sinput.addEventListener("input", () => {
  const s = parseFloat(sinput.value);
  const h = parseFloat(hinput.value);

  if (isNaN(s) || isNaN(h) || s*h < -1.0) {
    sinput.classList.add("error");
    hinput.classList.add("error");
  }else if(s >= -1.0){
    sinput.classList.remove("error");
    hinput.classList.remove("error");
  }else{
    hinput.classList.remove("error");
  }
});

const hinput = document.getElementById("h");
hinput.addEventListener("input", () => {
  const s = parseFloat(sinput.value);
  const h = parseFloat(hinput.value);
  if (isNaN(s) || isNaN(h) || s*h < -1.0) {
    sinput.classList.add("error");
    hinput.classList.add("error");
  }else if(s >= -1.0){
    sinput.classList.remove("error");
    hinput.classList.remove("error");
  }else{
    hinput.classList.remove("error");
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

