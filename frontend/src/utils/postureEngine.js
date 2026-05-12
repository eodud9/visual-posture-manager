function vecMatMul(v, M) {
  return [0, 1, 2].map((j) => v[0] * M[0][j] + v[1] * M[1][j] + v[2] * M[2][j]);
}

function inv3(M) {
  const [[a, b, c], [d, e, f], [g, h, i]] = M;
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  const invDet = 1 / (Math.abs(det) < 1e-12 ? 1e-9 : det);
  return [
    [(e * i - f * h) * invDet, (c * h - b * i) * invDet, (b * f - c * e) * invDet],
    [(f * g - d * i) * invDet, (a * i - c * g) * invDet, (c * d - a * f) * invDet],
    [(d * h - e * g) * invDet, (b * g - a * h) * invDet, (a * e - b * d) * invDet],
  ];
}

function cov3(X) {
  const n = X.length;
  const means = [0, 1, 2].map((j) => X.reduce((s, r) => s + r[j], 0) / n);
  const C = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (const row of X)
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i][j] += (row[i] - means[i]) * (row[j] - means[j]);
  return C.map((row) => row.map((v) => v / (n - 1)));
}

function median3(X) {
  return [0, 1, 2].map((j) => {
    const col = X.map((r) => r[j]).sort((a, b) => a - b);
    const n = col.length;
    return n % 2 === 1 ? col[(n - 1) / 2] : (col[n / 2 - 1] + col[n / 2]) / 2;
  });
}

export class PostureEngine {
  constructor(threshold = 3.5, alpha = 0.2) {
    this.threshold = threshold;
    this.alpha = alpha;
    this.emaScore = 0;
    this.calibPool = [];
    this.mu = null;
    this.S = null; // 원본 공분산 행렬 (DB 저장용)
    this.invS = null;
    this.isCalibrated = false;
  }

  getFeatures(landmarks) {
    const lEar = landmarks[7];
    const rEar = landmarks[8];
    const lSh = landmarks[11];
    const rSh = landmarks[12];

    const sh_w = Math.sqrt((lSh.x - rSh.x) ** 2 + (lSh.y - rSh.y) ** 2) + 1e-6;
    const z_ratio = (((lSh.z + rSh.z) / 2 - (lEar.z + rEar.z) / 2) / sh_w) * 6.0;
    const neck_tilt = ((lEar.y - lSh.y - (rEar.y - rSh.y)) / sh_w) * 2.0;
    const body_slope = ((lSh.y - rSh.y) / sh_w) * 2.5;

    return [z_ratio, neck_tilt, body_slope];
  }

  processFrame(landmarks) {
    const feat = this.getFeatures(landmarks);

    if (!this.isCalibrated) {
      this.calibPool.push(feat);
      if (this.calibPool.length >= 100) {
        this.mu = median3(this.calibPool);
        const S = cov3(this.calibPool);
        S[0][0] += 0.01;
        S[1][1] += 0.01;
        S[2][2] += 0.01;
        this.S = S; // 원본 공분산 행렬 보존
        this.invS = inv3(S);
        this.isCalibrated = true;
        return {
          status: "CALIBRATED",
          progress: 100,
          sample_frame_count: this.calibPool.length,
          feature_names: ["z_ratio", "neck_tilt", "body_slope"],
          feature_median: this.mu,
          covariance_matrix: this.S,
          threshold: this.threshold,
          alpha: this.alpha,
          landmarks_used: [7, 8, 11, 12],
          ridge_applied: true,
        };
      }
      return { status: "CALIBRATING", progress: this.calibPool.length };
    }

    const delta = feat.map((v, i) => v - this.mu[i]);
    const tmp = vecMatMul(delta, this.invS);
    const mDist = Math.sqrt(tmp.reduce((s, v, i) => s + v * delta[i], 0));
    this.emaScore = this.alpha * mDist + (1 - this.alpha) * this.emaScore;

    return {
      status: "MONITORING",
      score: Math.round(this.emaScore * 100) / 100,
      is_bad: this.emaScore > this.threshold,
    };
  }
}
