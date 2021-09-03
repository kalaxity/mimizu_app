/**
 * @type {HTMLCanvasElement} canvas
 * ↑これをつけないとfillStyleとかが候補に出ない
 */
const canvas = document.getElementById("game-field");
const ctx = canvas.getContext("2d");
ctx.fillStyle = "green";


// 定数定義 ---dotやcanvasの大きさなど
const dot_width = 10;
const dot_height = 10;
const field_width = 200;
const field_height = 200;
const snake_length = 10;
const game_area = document.getElementById("game-area");
const start_button = document.getElementById("start-button");
const point_area = document.getElementById("point-area");
const high_score_area = document.getElementById("high-score-area");
const time_area = document.getElementById("time-area");
const button_up = document.getElementById("button-up");
const button_down = document.getElementById("button-down");
const button_left = document.getElementById("button-left");
const button_right = document.getElementById("button-right");


// クラスWormの定義
class Worm {
    /**
     * コンストラクタ
     * @param {Number} length Snakeの長さ 
     * @param {Number} point  獲得したポイント数
     * @param {Number} dx     Snakeの先頭点の移動量(x方向)
     * @param {Number} dy     Snakeの先頭点の移動量(y方向)
     */
    constructor(length, dx, dy) {
        this.length = length;
        this.point = 0;

        // Arrayの作成
        this.x = new Array(length);
        this.y = new Array(length);
        this.dx = new Array(length);
        this.dy = new Array(length);

        // Arrayの0埋め
        this.x.fill(0);
        this.y.fill(0);
        this.dx.fill(0);
        this.dy.fill(0);

        // 先頭点の移動量の初期設定
        this.first_dx = dx;
        this.first_dy = dy;
    }

    /**
     * Wormを設定された移動量だけ移動させる
     */
    move() {
        // x, yにdx, dyを加算
        for (let i = 0; i < this.length; ++i) {
            this.x[i] += this.dx[i];
            this.y[i] += this.dy[i];

            // 範囲外に出ないようにする
            if (this.x[i] < 0) this.x[i] = field_width - dot_width;
            if (this.y[i] < 0) this.y[i] = field_height - dot_height;
            if (this.x[i] >= field_width) this.x[i] = 0;
            if (this.y[i] >= field_height) this.y[i] = 0;
        }
    }

    /**
     * Wormの先頭の点の移動量を変更する
     * @param {Number} dx 先頭の点のx方向の移動量
     * @param {Number} dy 先頭の点のy方向の移動量
     */
    setDirection(dx, dy) {
        // 先頭の移動量を更新
        this.first_dx = dx;
        this.first_dy = dy;
    }

    /**
     * Wormの各点の移動量を更新する  
     * * 具体的には、各点の移動量が入った配列をシフトする
     */
    shiftDirection() {
        // dx, dy配列のシフト
        this.dx.unshift(this.first_dx);
        this.dy.unshift(this.first_dy);
        this.dx.pop();
        this.dy.pop();
    }

    /**
     * Wormを描画する  
     * 先頭は色を変えて描画する
     */
    draw() {
        // 画面消去
        ctx.clearRect(0, 0, field_width, field_height);
        
        // 先頭以外の点を先に描画する
        ctx.fillStyle = "Green";
        for (let i = 1; i < this.length; ++i) {
            ctx.fillRect(this.x[i], this.y[i], dot_width, dot_height);
        }
  
        // 後ろの点と重なった時に先頭点の色を優先するため、先頭の点は最後に描画する
        ctx.fillStyle = "darkorange";
        ctx.fillRect(this.x[0], this.y[0], dot_width, dot_height);
    }

    /**
     * Wormが(x, y)にある点と衝突しているか
     * @param {Number} x 点のx座標
     * @param {Number} y 点のy座標
     * @returns {Boolean} 衝突しているならtrue
     */
    isCollision(x, y) {
        for (let i = 0; i < this.length; ++i) {
            if (this.x[i] == x && this.y[i] == y) return true;
        }
        return false;
    }

    /**
     * 現在のスコアを1増やす関数
     */
    incrementPoint() {
        this.point++;
    }

    /**
     * 現在のスコアを返す関数
     * @returns {Number} point
     */
    getPoint() {
        return this.point;
    }
}


// クラスDotの定義
class Dot {
    /**
     * コンストラクタ
     */
    constructor() {
        this.intervalX = field_width / dot_width;
        this.intervalY = field_height / dot_height;
        this.x = Math.floor(Math.random() * this.intervalX) * dot_width;
        this.y = Math.floor(Math.random() * this.intervalY) * dot_height;
    }

    /**
     * ドットの位置を変更する関数
     */
    changePosition() {
        this.x = Math.floor(Math.random() * this.intervalX) * dot_width;
        this.y = Math.floor(Math.random() * this.intervalY) * dot_height;
    }

    /**
     * ドットを描画する関数
     */
    draw() {
        ctx.fillRect(this.x, this.y, dot_width, dot_height);
    }

    /**
     * ドットのx座標を取得する関数
     * @returns {Number} x
     */
    getX() { return this.x; }

    /**
     * ドットのy座標を取得する関数
     * @returns {Number} y
     */
    getY() { return this.y; }
}

/**
 * Cookieからハイスコアを取得する関数
 * @returns {Number} high_score
 */
function getHighScoreFromCookie() {
    for (let c of document.cookie.split("; ")) {
        if (c.split("=")[0] == "high_score") {
            return Number(c.split("=")[1]);
        }
    }
    return 0;
}

/**
 * Canvasの表示やカウントダウンをする関数
 */
function initGame() {
    // スタートボタンを非表示
    start_button.style.display = "none";
    // ゲームエリアを表示
    game_area.style.display = "block";

    // カウントダウン処理
    let count = 4;
    ctx.font = "128px serif";       // canvasに表示するフォントの大きさの変更
    ctx.textAlign = "center";       // 基準点を横方向の中央に合わせる
    ctx.textBaseline = "middle";    // 基準点を縦方向の中央に合わせる
    let countDownInterval = setInterval(() => {
        ctx.clearRect(0, 0, field_width, field_height);
        count--;
        if (count > 0) {
            ctx.fillText(count.toString(), 100, 100);
        } else {
            clearInterval(countDownInterval);
            startGame();
        }
    }, 1000);
}


// =====メイン処理==========================================================-

// Cookieを取得してハイスコアを設定する
let high_score = getHighScoreFromCookie();
high_score_area.innerText = high_score.toString();

// ハイスコアが更新されたかを表す変数
let hasHighScoreSet = false;

function startGame() {
    // 現在時刻から30秒後の時刻を取得
    let time_goal = Date.now() + 30 * 1000;

    // インスタンスの生成
    let worm = new Worm(snake_length, dot_width, 0);
    let dot = new Dot();

    // 衝突していたら点の位置を変える
    while (worm.isCollision(dot.getX(), dot.getY())) {
        dot.changePosition();
    }

    // 点数表示を初期化
    point_area.innerText = worm.getPoint().toString();

    // 一定時間ごとに実行する内容を書く
    let timer = setInterval(() => {
        // 残り時間を更新
        let time_remained = (time_goal - Date.now()) / 1000;
        if (time_remained <= 0) {
            time_remained = 0;
            let msg = "ゲーム終了!\nスコア: " + worm.getPoint().toString() + "点";
            if (hasHighScoreSet) msg += "\nハイスコア更新!!";
            alert(msg);
            clearInterval(timer);
        }
        time_area.innerText = time_remained;

        // 移動方向を更新してから移動する
        worm.shiftDirection();
        worm.move();

        // 衝突判定
        if (worm.isCollision(dot.getX(), dot.getY())) {
            worm.incrementPoint(); // ポイントを加算
            if (worm.getPoint() > high_score) {
                hasHighScoreSet = true;
                high_score = worm.getPoint();
                high_score_area.innerText = high_score.toString();
            }
            document.cookie = "high_score=" + high_score.toString() + ";max-age=31536000";
            while (worm.isCollision(dot.getX(), dot.getY())) {
                dot.changePosition();
            }
            point_area.innerText = worm.getPoint().toString();
        }

        // 画面に表示する
        worm.draw();
        dot.draw();
    }, 100);


    // イベントリスナの設定 -- 矢印キーの受付について
    document.addEventListener("keydown", (event) => {
        if (event.key == "ArrowUp") {
            worm.setDirection(0, -dot_height);
        } else if (event.key == "ArrowDown") {
            worm.setDirection(0, dot_height);
        } else if (event.key == "ArrowLeft") {
            worm.setDirection(-dot_width, 0);
        } else if (event.key == "ArrowRight") {
            worm.setDirection(dot_width, 0);
        }
    });

    // ボタンのイベントリスナの設定 -- スマホ対応
    // なぜか普通に関数を渡しただけでは動かない 無名関数に直してやっと動いた
    button_up.addEventListener("click", () => {
        worm.setDirection(0, -dot_height);
    });
    button_down.addEventListener("click", () => {
        worm.setDirection(0, dot_height);
    });
    button_left.addEventListener("click", () => {
        worm.setDirection(-dot_width, 0);
    });
    button_right.addEventListener("click", () => {
        worm.setDirection(dot_width, 0);
    });
}

