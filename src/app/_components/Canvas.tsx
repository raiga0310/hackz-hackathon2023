"use client";

import {useEffect, useRef} from "react";
import * as BABYLON from "babylonjs";
import {AdvancedDynamicTexture, Button, Image, Rectangle, TextBlock} from "babylonjs-gui";
import 'babylonjs-materials';
import "./Canvas.css";

type PLayer = {
    mesh: BABYLON.Mesh;
    hp: number;
    score: number;
}

type Enemy = {
    mesh: BABYLON.Mesh;
    textMesh: BABYLON.Mesh;
    hp: number;
};

type BossBox = {
    mainMesh: BABYLON.Mesh;
    shell: Shell[];
    textMesh: BABYLON.Mesh;
    hp: number;
};

type Shell = {
    mesh: BABYLON.Mesh;
    hp: number;
}

export default function Canvas() {
    const gameRef = useRef(null);
    useEffect(() => {
        (async () => {

            let renderCanvas: HTMLCanvasElement | null = null;
            if (typeof document !== "undefined"){
                renderCanvas = document.getElementById("renderCanvas") as HTMLCanvasElement | null;
            }
            const engine = new BABYLON.Engine(renderCanvas, true);
            const scene = new BABYLON.Scene(engine);
            new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));

            const camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, Math.PI / 2.2, 70, BABYLON.Vector3.Zero(), scene);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.upperBetaLimit = Math.PI / 2.2;

            const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 150 }, scene);
            skybox.position.y = 10;
            const skyBoxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
            skyBoxMaterial.backFaceCulling = false;

            skyBoxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://assets.babylonjs.com/textures/skybox", scene);
            skyBoxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;

            skyBoxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            skyBoxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            skybox.material = skyBoxMaterial;

            const name = "ground";
            const width = 150;
            const height = 150;
            const ground = BABYLON.MeshBuilder.CreateGround(name, {width, height, subdivisions: 10});
            const groundMat = new BABYLON.StandardMaterial(name, scene);
            groundMat.diffuseTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/speckles.jpg", scene);
            groundMat.diffuseTexture.scale(5);
            const texture = groundMat.diffuseTexture as BABYLON.Texture;
            texture.vOffset = 0.0;
            texture.uOffset = 0.0;
            groundMat.diffuseTexture = texture;
            ground.material = groundMat;

            const playerHp = 5;
            const boxSize = 1;
            const box = makeBox("box1", new BABYLON.Vector3(1, 1, 1), new BABYLON.Vector3(0, 0, -50));
            const player: PLayer = {mesh: box, hp: playerHp, score: 0};

            box.position.addInPlaceFromFloats(0, boxSize / 2.0, 0);

            const numIntEnemies = 5;
            const enemyHp = 3;
            let intEnemies: Enemy[] = makeEnemies(numIntEnemies, enemyHp, scene);

            const shellHp = 30;
            const bossHp = 50;
            let bossEnemy = makeBossBox(5, shellHp, bossHp, scene);

            let isLeftPressed: boolean = false;
            let isRightPressed: boolean = false;

            document.addEventListener("keydown", function(event) {
                switch (event.key) {
                    case "ArrowLeft":
                        isLeftPressed = true;
                        break;
                    case "ArrowRight":
                        isRightPressed = true;
                        break;
                }
            });

            document.addEventListener("keyup", function(event) {
                switch (event.key) {
                    case "ArrowLeft":
                        isLeftPressed = false;
                        break;
                    case "ArrowRight":
                        isRightPressed = false;
                        break;
                }

            });

            let playerBullets: BABYLON.Mesh[] = [];
            let enemiesBullets: BABYLON.Mesh[] = [];
            let bossBoxBullets: { mesh: BABYLON.Mesh, direction: number }[] = [];

            const playerBulletsCooldown = 10;
            const enemiesBulletsCooldown = 50;
            const bossBoxBulletsCooldown = 40;
            let currentPlayerBulletsCooldown = 0;
            let currentEnemiesCooldown = 0;
            let currentBossBoxCooldown = 0;
            let currentAngle = 0;

            // GUI
            let appState: "start" | "play" | "pause" | "over" | "clear" = "start";
            let gameState: "explain" | "phase1" | "story" | "boss" = "explain";
            let advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
            advancedTexture.background = "rgba(128, 128, 128, 0.7)"; // 透明度の高いグレー

            const logo = new Image("image", "/Title.jpg");
            logo.width = "800px";
            logo.height = "185px";
            logo.top = "-235px";
            const button1 = Button.CreateSimpleButton("but1", "Start");
            button1.width = "150px"
            button1.height = "40px";
            button1.color = "white";
            button1.cornerRadius = 20;
            button1.background = "green";
            button1.onPointerUpObservable.add(function() {
                appState = "play";
                advancedTexture.removeControl(button1);
                advancedTexture.removeControl(logo);
            });
            const button2 = Button.CreateSimpleButton("but2", "Resume");
            button2.width = "150px";
            button2.height = "40px";
            button2.color = "white";
            button2.cornerRadius = 20;
            button2.background = "green";
            button2.top = "0px";
            button2.onPointerUpObservable.add(function() {
                appState = "play";
                advancedTexture.removeControl(button2);
                advancedTexture.removeControl(button3);
                advancedTexture.removeControl(logo);
            });
            const button3 = Button.CreateSimpleButton("but3", "Title");
            button3.width = "150px";
            button3.height = "40px";
            button3.color = "white";
            button3.cornerRadius = 20;
            button3.background = "red";
            button3.top = "90px"
            button3.onPointerUpObservable.add(function() {
                appState = "start";
                gameState = "explain";
                player.mesh.position.x = 0;
                scene.meshes
                    .filter((mesh) => mesh.name === "bullet")
                    .map((mesh) => mesh.dispose());
                intEnemies.map((enemy) => {
                    enemy.mesh.position.z = 50;
                    //
                });

                playerBullets.map((bullet) => bullet.dispose());
                playerBullets = [];
                intEnemies.map((enemy) => enemy.mesh.dispose());
                intEnemies = [];
                intEnemies = makeEnemies(numIntEnemies, enemyHp, scene);
                bossEnemy.mainMesh.dispose();
                bossEnemy.shell.map((shell) => {
                    shell.mesh.dispose();
                });
                bossEnemy.textMesh.dispose();
                bossBoxBullets.map((bullet) => bullet.mesh.dispose());
                bossBoxBullets = [];
                bossEnemy = makeBossBox(5, shellHp, bossHp, scene);
                enemiesBullets.map((bullet) => bullet.dispose());
                enemiesBullets = [];
                player.hp = playerHp;
                advancedTexture.removeControl(button2);
                advancedTexture.removeControl(button3);
                advancedTexture.removeControl(congrats);
                advancedTexture.removeControl(hpBar);
                currentTextIndex = 0;
                textIndex = 0;
                textBlock.text = "";
                advancedTexture.removeControl(dialogBox);
            });
            const congrats =new Image("congrats", "/Congrats.png");
            congrats.width = "800px";
            congrats.height = "284px";
            congrats.top = "-334px";

            const hpBar = new Rectangle("hpBar");
            hpBar.width = "800px";
            hpBar.height = "35px";
            hpBar.top = "300px";
            hpBar.background = "green";
            advancedTexture.addControl(button1);
            advancedTexture.addControl(logo);

            //dialog box
            const dialogBox = new Rectangle("dialog");
            dialogBox.width = "60%";
            dialogBox.height = "30%";
            dialogBox.background = "rgb(0, 15, 69)";
            dialogBox.thickness = 2;
            dialogBox.color = "white";
            dialogBox.alpha = 0.3;

            const textBlock = new TextBlock("text");
            textBlock.color = "white";
            textBlock.text = "Press Enter Key エンターキーを押してください｡";
            dialogBox.addControl(textBlock);

            dialogBox.linkWithMesh(null);
            dialogBox.linkOffsetY = -100;

            let currentTextIndex = 0;
            let textIndex = 0;
            const explainTexts = [
                "あなたはCPUから派遣されたガベージコレクタです｡\nあなたに課せられた任務は､RustというGC(ガベージコレクタ)の無い治安の悪いメモリ空間を掃除することにあります｡",
                "←→を入力すればアドレス空間を左右に横断できます｡メモリ解放のための命令弾は自動的に発射されます｡\nもちろん､アドレス空間の領域の端まで行けば自動で消えますのでご安心を｡",
                "我々の任務は確実な成功を必要とします｡もしあなたが任務遂行が難しいと考えれば､\n｢P｣キーを押せばポーズ画面で中断も可能です｡",
                "･･････早速メモリ残留物が探知範囲にかかりました｡\n任務に取り掛かってください｡"
            ];

            const storyTexts = [
                "スタック領域の残留物はこのくらいでしょう｡",
                "ここからヒープ領域に突入します｡",
                "今回の任務の主目標である巨大な残留物があります｡",
                "･･････探知しました｡｢Box｣です｡\nBoxはヒープ領域にRustceanが明示的に仕込むことができる悪しき残留物です｡必ず排除してください｡",
                "開放に際しては､Boxは何重にも悪ふざけによってBoxでラップされている可能性があります｡\n完全に中の本体が開放されるまで､油断しないようにしてください｡"
            ];

            document.addEventListener("keydown", function(event) {
                if (event.key === "Enter") {
                    if (gameState === "explain") {
                        if (currentTextIndex < explainTexts.length) {
                            textBlock.text = "";
                            dialogBox.alpha = 0.8;
                            animateText(textBlock, explainTexts[currentTextIndex]);
                        } else {
                            gameState = "phase1";
                            advancedTexture.removeControl(dialogBox);
                        }
                    } else if (gameState === "story") {
                        textIndex = 0;
                        if (currentTextIndex < storyTexts.length) {
                            textBlock.text = "";
                            dialogBox.alpha = 0.8;
                            animateText(textBlock, storyTexts[currentTextIndex]);
                        } else {
                            gameState = "boss";
                            advancedTexture.removeControl(dialogBox);
                            advancedTexture.background = "rgba(128, 128, 128, 1)";
                        }
                    }
                }
            });

            function animateText(textBlock: TextBlock, text: string) {
                if (textIndex < text.length) {
                    textBlock.text += text[textIndex];
                    textIndex++;

                    setTimeout(() => animateText(textBlock, text), 20);
                } else {
                    textIndex = 0; // テキストが終了したら textIndex をリセット
                    currentTextIndex++; // 次のテキストに進む
                }
            }

            scene.onKeyboardObservable.add((keyboard) => {
                switch (keyboard.type) {
                    case BABYLON.KeyboardEventTypes.KEYDOWN:
                        switch (keyboard.event.key) {
                            case "p":
                            case "P":
                                //@ts-ignore
                                if (appState === "play"){
                                    appState = "pause";
                                }
                                break;
                        }
                        break;
                }
            });

            const animationSpeed = 0.2;

            scene.beforeRender = function () {
                if (appState === "play") {
                    advancedTexture.background = "rgba(128, 128, 128, 0)";

                    const texture = groundMat.diffuseTexture as BABYLON.Texture;
                    texture.vOffset += 0.00625;

                    if (isLeftPressed) {
                        player.mesh.position.x -= animationSpeed;
                    } else if (isRightPressed) {
                        player.mesh.position.x += animationSpeed;
                    }

                    if (gameState === "explain") {
                        advancedTexture.addControl(dialogBox);
                    } else if (gameState === "phase1") {
                        textBlock.text = "";
                        currentTextIndex = 0;
                        advancedTexture.removeControl(dialogBox);
                        advancedTexture.addControl(hpBar);

                        intEnemies.map((enemy) => {
                            enemy.mesh.position.z -= 0.1;
                        });
                    } else if (gameState === "story") {
                        enemiesBullets.map((bullet) => bullet.dispose());
                        playerBullets.map((bullet) => bullet.dispose());
                        advancedTexture.addControl(dialogBox);
                        advancedTexture.background = "rgba(128, 128, 128, 0.7)";
                    } else if (gameState === "boss") {
                        //boss position move
                        if (bossEnemy.mainMesh.position.y >= 1) {
                            bossEnemy.mainMesh.position.y -= 0.5;
                        }
                        bossEnemy.shell.map((shell) => {
                            if(shell.mesh.position.y >= shell.mesh.scaling.y / 2) {
                                shell.mesh.position.y -= 0.5;
                            }
                        });
                        if (bossEnemy.textMesh.position.y >= 14) {
                            bossEnemy.textMesh.position.y -= 0.1;
                        }
                    }

                } else if (appState === "start") {
                    advancedTexture.background = "rgba(128, 128, 128, 0.7)"; // 透明度の高いグレー
                    advancedTexture.addControl(button1);
                    advancedTexture.addControl(logo);
                } else if (appState === "pause") {
                    advancedTexture.background = "rgba(128, 128, 128, 0.7)"; // 透明度の高いグレー

                    advancedTexture.addControl(button2);
                    advancedTexture.addControl(button3);
                    advancedTexture.addControl(logo);
                } else if(appState === "clear") {
                    advancedTexture.background = "rgba(128, 128, 128, 0.7)";
                    advancedTexture.addControl(button3);
                    advancedTexture.addControl(congrats);
                } else if(appState === "over") {
                    advancedTexture.background = "rgba(128, 128, 128, 0.7)";
                    advancedTexture.addControl(button3);
                }
            }

            scene.registerBeforeRender(function() {
                if (appState === "play") {
                    if (gameState === "phase1") {
                        for(let i = 0; i < playerBullets.length; i++) {
                            const bullet = playerBullets[i];

                            for(let j = 0; j < intEnemies.length; j++) {
                                const enemy = intEnemies[j];

                                if (bullet.intersectsMesh(enemy.mesh, false)) {
                                    bullet.dispose();
                                    playerBullets.splice(i, 1);

                                    if (enemy.hp <= 0) {
                                        enemy.mesh.dispose();
                                        enemy.textMesh.dispose();
                                        intEnemies.splice(j, 1);
                                    } else {
                                        enemy.hp--;
                                    }
                                }
                            }
                        }

                        for (let i = 0; i < enemiesBullets.length; i++) {
                            const bullet = enemiesBullets[i];

                            if (bullet.intersectsMesh(player.mesh, false)) {
                                bullet.dispose()
                                enemiesBullets.splice(i, 1);

                                if (player.hp <= 0) {
                                    appState = "over";
                                } else {
                                    player.hp--;
                                }
                            }
                        }

                        if (intEnemies.length === 0) {
                            gameState = "story";
                        }
                    }
                    else if (gameState === "boss") {
                        for (let i = 0; i < playerBullets.length; i++) {
                            const bullet = playerBullets[i];
                            if (bossEnemy.shell.length > 0) {
                                const shell = bossEnemy.shell[0];
                                if (bullet.intersectsMesh(shell.mesh, false)) {
                                    bullet.dispose();
                                    playerBullets.splice(i, 1);

                                    if (shell.hp <= 0) {
                                        shell.mesh.dispose();
                                        bossEnemy.shell.splice(0, 1);
                                    } else {
                                        shell.hp--;
                                    }
                                }
                            } else {
                                if (bullet.intersectsMesh(bossEnemy.mainMesh, false)) {
                                    bullet.dispose();
                                    playerBullets.splice(i, 1);

                                    if (bossEnemy.hp <= 0) {
                                        bossEnemy.mainMesh.dispose();
                                        appState = "clear";
                                    } else {
                                        bossEnemy.hp--;
                                    }
                                }
                            }
                        }

                        for (let i = 0; i < bossBoxBullets.length; i++) {
                            const bullet = bossBoxBullets[i];

                            if (bullet.mesh.intersectsMesh(player.mesh, false)) {
                                bullet.mesh.dispose();
                                bossBoxBullets.splice(i, 1);

                                if (player.hp <= 0) {
                                    appState = "over";
                                } else  {
                                    player.hp--;
                                }
                            }
                        }
                    }
                }
            });

            engine.runRenderLoop(() => {
                scene.render();

                if (appState === "play") {
                    if (gameState === "explain") {

                    } else if (gameState === "phase1") {
                        if (currentPlayerBulletsCooldown <= 0) {
                            const playerBullet = BABYLON.MeshBuilder.CreateSphere("playerBullet", {
                                segments: 16,
                                diameter: 0.8,
                                diameterZ: 4.0
                            }, scene);
                            playerBullet.position.copyFrom(box.position);
                            playerBullet.position.z += 2;

                            playerBullets.push(playerBullet);

                            currentPlayerBulletsCooldown = playerBulletsCooldown;
                        } else {
                            currentPlayerBulletsCooldown--;
                        }

                        for (let i = 0; i < playerBullets.length; i++) {
                            let bullet = playerBullets[i];
                            bullet.position.z += 2; // 弾を前方に移動

                            // 画面外に出た弾を削除
                            if (bullet.position.z > 75) {
                                bullet.dispose();
                                playerBullets.splice(i, 1);
                                i--;
                            }
                        }

                        intEnemies.map((enemy) => {
                            if (currentEnemiesCooldown <= 0) {
                                const enemiesBullet = BABYLON.MeshBuilder.CreateSphere("enemiesBullet", {
                                    segments: 16,
                                    diameter: 0.4
                                }, scene);
                                enemiesBullet.position.copyFrom(enemy.mesh.position);
                                enemiesBullet.position.z -= 4;

                                enemiesBullets.push(enemiesBullet);

                                currentEnemiesCooldown = enemiesBulletsCooldown;

                            } else {
                                currentEnemiesCooldown--;
                            }
                        });

                        for (let i = 0; i < enemiesBullets.length; i++) {
                            let bullet = enemiesBullets[i];
                            bullet.position.z -= 0.5; // 弾を前方に移動

                            // 画面外に出た弾を削除
                            if (bullet.position.z < -75) {
                                bullet.dispose();
                                enemiesBullets.splice(i, 1);
                                i--;
                            }
                        }
                    } else if (gameState === "boss") {
                        if (currentPlayerBulletsCooldown <= 0) {
                            const playerBullet = BABYLON.MeshBuilder.CreateSphere("playerBullet", {
                                segments: 16,
                                diameter: 0.8,
                                diameterZ: 4.0
                            }, scene);
                            playerBullet.position.copyFrom(box.position);
                            playerBullet.position.z += 2;

                            playerBullets.push(playerBullet);

                            currentPlayerBulletsCooldown = playerBulletsCooldown;
                        } else {
                            currentPlayerBulletsCooldown--;
                        }

                        for (let i = 0; i < playerBullets.length; i++) {
                            let bullet = playerBullets[i];
                            bullet.position.z += 2; // 弾を前方に移動

                            // 画面外に出た弾を削除
                            if (bullet.position.z > 75) {
                                bullet.dispose();
                                playerBullets.splice(i, 1);
                                i--;
                            }
                        }
                        if (currentBossBoxCooldown <= 0) {
                            const numShells = bossEnemy.shell.length * 15;
                            const angleIncrement = (Math.PI / 2) / numShells;

                            for (let i = 0; i < numShells; i++) {
                                const bullet = BABYLON.MeshBuilder.CreateSphere("bossBullet", {
                                    segments: 16,
                                    diameter: 0.6
                                }, scene);
                                bullet.position.copyFrom(bossEnemy.mainMesh.position);
                                currentAngle = (Math.PI * 5 / 4) + angleIncrement * i;
                                bossBoxBullets.push({
                                    mesh: bullet,
                                    direction: currentAngle
                                });
                            }
                            currentBossBoxCooldown = bossBoxBulletsCooldown
                        } else {
                            currentBossBoxCooldown--;
                        }

                        for (let i = 0; i < bossBoxBullets.length; i++) {
                            let bullet = bossBoxBullets[i];
                            const bulletSpeed = 0.4;

                            const directionVector = new BABYLON.Vector3(
                                Math.cos(bullet.direction),
                                0,
                                Math.sin(bullet.direction)
                            );

                            bullet.mesh.position.addInPlace(directionVector.scale(bulletSpeed));

                            if (!isInRange(bullet.mesh.position.x, bullet.mesh.position.z)) {
                                bullet.mesh.dispose();
                                bossBoxBullets.splice(i, 1);
                                i--;
                            }
                        }
                    }
                    const width = 800 * player.hp / playerHp;
                    hpBar.width = `${width}px`;
                }
            });

            window.addEventListener("resize", function() {
                engine.resize();
            });

        })();
    }, []);
    return (
        <canvas
            id="renderCanvas"
            className="m-2"
            ref={gameRef}
            ></canvas>
    )
}

function isInRange(x: number, z: number): Boolean {
    return (-75 <= x && x <= 75 ) && (-75 <= z && z <= 75);
}

function makeBox(name: string, scale: BABYLON.Vector3, position: BABYLON.Vector3): BABYLON.Mesh {
    const box = BABYLON.MeshBuilder.CreateBox(name);
    box.scaling = scale;
    box.position = position;

    return box;
}

function makeEnemies(num: number, hp: number, scene: BABYLON.Scene): Enemy[] {
    const enemies: Enemy[] = [];

    for(let i = 0; i < num; i++) {
        const enemyBox = makeBox("enemy", new BABYLON.Vector3(2, 2, 2), new BABYLON.Vector3(-(5 *(num - 1) / 2) + i * 5, 1, 60));
        const enemyName = makeText("enemyText", "&'static str", enemyBox, scene);

        enemies.push({mesh: enemyBox, hp: hp, textMesh: enemyName});
    }

    return enemies;
}

function makeBossBox(shell: number, shellHp: number, hp: number, scene: BABYLON.Scene): BossBox {
    const mainBox = makeBox("BossBoxMain", new BABYLON.Vector3(4, 4, 4), new BABYLON.Vector3(0, 75, 70));
    const bossName = makeText("bossText", "Box<...>", mainBox, scene);
    bossName.position.y += 1;

    const shells: Shell[] = [];
    for(let i = 0; i < shell; i++) {
        const shellSize = 128 / Math.pow(2, i);
        const shellBox = makeBox("shellBox", new BABYLON.Vector3(shellSize, shellSize, shellSize), new BABYLON.Vector3(0, 75 + shellSize, 70));
        shells.push({mesh: shellBox, hp: shellHp});
    }

    return {mainMesh: mainBox, hp: hp, shell: shells, textMesh: bossName};
}

function makeText(name: string, text: string, mesh: BABYLON.Mesh, scene: BABYLON.Scene) {
    const dynamicTexture = new BABYLON.DynamicTexture(name, 256, scene, true);
    dynamicTexture.hasAlpha = true;
    const textureContext = dynamicTexture.getContext();

    textureContext.font = "24px Arial";
    textureContext.fillStyle = "red";

    textureContext.fillText(text, 128, 128);
    dynamicTexture.update();

    const textMaterial = new BABYLON.StandardMaterial("textMaterial", scene);
    textMaterial.diffuseTexture = dynamicTexture;

    const textPlane = BABYLON.MeshBuilder.CreatePlane("textPlane", { size: 7 }, scene);
    textPlane.material = textMaterial;

    textPlane.position = mesh.position.clone();
    textPlane.position.y = 14;
    textPlane.position.z = -50;

    return textPlane;
}
