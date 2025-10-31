function rbinom(n, p) {
  let x = 0;

  for (let i = 0; i < n; i++){
    if (Math.random() < p){
      x++;
    }
  }

  return x;
}

function rbinom_binv(n, p){
  let q;
  if(p > 0.5){
    q = p;
  }else{
    q = 1.0 - p;
  }

  let s = (1.0 - q) / q;
  let a = (n + 1) * s;
  let log_r = n * Math.log(q);

  let log_u = Math.log(Math.random());
  let x = 0;

  while(log_u > log_r && x <= n){
    const delta = log_r - log_u;
    log_u = log_u + Math.log1p(-Math.exp(delta));
    x = x + 1;

    log_r = log_r + Math.log((a / x) - s);

    if(x > n){
      return(-1);
    }
  }

  if(p <= 0.5){
    return(x);
  }else{
    return(n - x);
  }
}

function func_fc(k){
  const ftable = [0.08106146679532726, 
    0.04134069595540929,
    0.02767792568499834,
    0.02079067210376509,
    0.01664469118982119,
    0.01387612882307075,
    0.01189670994589177,
    0.01041126526197209,
    0.009255462182712733,
    0.008330563433362871
  ]

  if(k < 10){
    return(ftable[k]);
  }else{
    return((1/12 - (1/360 - 1/1260/(k+1)/(k+1)) / (k+1)/(k+1)) / (k+1));
  }
}

function rbinom_btrd(n, p){
  /* REFERENCE
    "The generation of binomial random variates", 
    Wolfgang Hormann, Journal of Statistical Computation and Simulation, 
    Volume 46, Issue 1 & 2 April 1993 , pages 101 - 110
  */

  const m = Math.floor((n + 1) * p);
  const r = p / (1.0 - p);
  const nr = (n + 1) * r;
  const npq = n * p * (1.0 - p);
  const b = 1.15 + 2.53 * Math.sqrt(npq);
  const a = -0.0873 + 0.0248 * b + 0.01 * p;
  const c = n * p + 0.5;
  const alpha = (2.83 + 5.1/b) * Math.sqrt(npq);
  const vr = 0.92 - 4.2/b;
  const urvr = 0.86 * vr;

  while(1){
    let u;
    let v = Math.random();

    if(v <= urvr){
      u = v / vr - 0.43;
      return(Math.floor((2.0 * a / (0.5 - Math.abs(u)) + b) * u + c));
    }
    
    if(v >= vr){
      u = Math.random() - 0.5;
    }else{
      u = v / vr - 0.93;
      u = Math.sign(u) * 0.5 - u;
      v = Math.random() * vr;
    }

    let us = 0.5 - Math.abs(u);
    let k = Math.floor((2.0 * a / us + b) * u + c);

    if(k < 0 || k > n){
      continue;
    }

    v = v * alpha / (a / us / us + b);
    let km = Math.abs(k - m);

    if(km <= 15){
      let f = 1;
      if(m < k){
        let i = m;
        while(i != k){
          i = i + 1;
          f = f * (nr / i - r);
        }
      }else if(m > k){
        let i = k;
        while(i != m){
          i = i + 1;
          v = v * (nr / i - r);
        }
      }

      if(v <= f){
        return(k);
      }else{
        continue;
      }
    }else{
      v = Math.log(v);
      let rho = (km / npq) * (((km / 3.0 + 0.625) * km + 1.0 / 6.0) / npq + 0.5);
      let t = -km * km / (2.0 * npq);

      if(v < t - rho){
        return(k);
      }

      if(v > t + rho){
        continue;
      }

      let nm = n - m + 1;
      let h = (m + 0.5) * Math.log((m + 1) / (r * nm)) + func_fc(m) + func_fc(n - m);

      let nk = n - k + 1;

      if(v <= h + (n + 1) * Math.log(nm / nk) + (k + 0.5) * Math.log(nk * r / (k + 1)) - func_fc(k) - func_fc(n - k)){
        return(k);
      }else{
        continue;
      }
    }
  }
}

export function rbinom_fast(n, p){
  let q = p;

  if(p > 0.5){
    q = 1.0 - p;
  }

  if(n * q <= 10.0){
    let ret = rbinom_binv(n, q);

    while(ret == -1){
      ret = rbinom_binv(n, q);
    }

    if(p > 0.5){
      return(n - ret);
    }else{
      return(ret);
    }
  }else{
    const ret = rbinom_btrd(n, q);
    if(p > 0.5){
      return(n - ret);
    }else{
      return(ret);
    }
  }
}