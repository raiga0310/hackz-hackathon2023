"use client";

import { useRef } from "react";
import * as BABYLON from "babylonjs";
import { Button, AdvancedDynamicTexture, Image } from "babylonjs-gui";
import 'babylonjs-materials';
import "./Canvas.css";

type PLayer = {
    mesh: BABYLON.Mesh;
    hp: number;
    score: number;
}

type Enemy = {
    mesh: BABYLON.Mesh;
    hp: number;
};

export default function Canvas() {
    const gameRef = useRef(null);
    (async () => {

        let renderCanvas: HTMLCanvasElement | null = null;
        if (typeof document !== "undefined"){
            renderCanvas = document.getElementById("renderCanvas") as HTMLCanvasElement | null;
        }
        const engine = new BABYLON.Engine(renderCanvas, true);
        const scene = new BABYLON.Scene(engine);
        const _light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));

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

        const boxSize = 1;
        const box = makeBox("box1", new BABYLON.Vector3(1, 1, 1), new BABYLON.Vector3(0, 0, -50));
        const player: PLayer = {mesh: box, hp: 5, score: 0};

        box.position.addInPlaceFromFloats(0, boxSize / 2.0, 0);

        const numIntEnemies = 5;
        const enemyHp = 3;
        let intEnemies: Enemy[] = makeEnemies(numIntEnemies, enemyHp);

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

        let bullets: BABYLON.Mesh[] = [];

        const bulletCooldown = 10;
        let currentBulletCooldown = 0;

        // GUI
        let appState: "start" | "play" | "pause" | "" | "clear" = "start";
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
            player.mesh.position.x = 0;
            scene.meshes
                .filter((mesh) => mesh.name === "bullet")
                .map((mesh) => mesh.dispose());
            intEnemies.map((enemy) => {
               enemy.mesh.position.z = 50;
            });

            bullets = [];
            intEnemies.map((enemy) => enemy.mesh.dispose());
            intEnemies = [];
            intEnemies = makeEnemies(numIntEnemies, enemyHp);
            advancedTexture.removeControl(button2);
            advancedTexture.removeControl(button3);
            advancedTexture.removeControl(congrats);
        });
        const congrats =new Image("congrats", "/Congrats.png");
        congrats.width = "800px";
        congrats.height = "284px";
        congrats.top = "-334px";
        advancedTexture.addControl(button1);
        advancedTexture.addControl(logo);

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
                advancedTexture.background = "rgba(128, 128, 128, 0)"; // 透明度の高いグレー

                const texture = groundMat.diffuseTexture as BABYLON.Texture;
                intEnemies.map((enemy) => {
                    enemy.mesh.position.z -= 0.1;
                });
                texture.vOffset += 0.00625;

                if (isLeftPressed) {
                    player.mesh.position.x -= animationSpeed;
                } else if (isRightPressed) {
                    player.mesh.position.x += animationSpeed;
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
            }
        }

        scene.registerBeforeRender(function() {
            if (appState === "play") {
                for(let i = 0; i < bullets.length; i++) {
                    const bullet = bullets[i];

                    for(let j = 0; j < intEnemies.length; j++) {
                        const enemy = intEnemies[j];

                        if (bullet.intersectsMesh(enemy.mesh, false)) {
                            bullet.dispose();
                            bullets.splice(i, 1);

                            if (enemy.hp <= 0) {
                                enemy.mesh.dispose();
                                intEnemies.splice(j, 1);
                            } else {
                                enemy.hp--;
                            }
                        }
                    }
                }

                if (intEnemies.length === 0) {
                    appState = "clear";
                }
            }
        });

        engine.runRenderLoop(() => {
            scene.render();

            if (appState === "play") {
                if (currentBulletCooldown <= 0) {
                    const bullet = BABYLON.MeshBuilder.CreateSphere("bullet", { segments: 16, diameter: 0.8, diameterZ: 4.0 }, scene);
                    bullet.position.copyFrom(box.position);
                    bullet.position.z += 2;

                    bullets.push(bullet);

                    currentBulletCooldown = bulletCooldown;
                } else {
                    currentBulletCooldown--;
                }

                for (let i = 0; i < bullets.length; i++) {
                    let bullet = bullets[i];
                    bullet.position.z += 2; // 弾を前方に移動

                    // 画面外に出た弾を削除
                    if (bullet.position.z > 75) {
                        bullet.dispose();
                        bullets.splice(i, 1);
                        i--;
                    }
                }
            }
        });
    })();
    return (
        <canvas
            id="renderCanvas"
            className="m-2"
            ref={gameRef}
            ></canvas>
    )
}

function makeBox(name: string, scale: BABYLON.Vector3, position: BABYLON.Vector3): BABYLON.Mesh {
    const box = BABYLON.MeshBuilder.CreateBox(name);
    box.scaling = scale;
    box.position = position;

    return box;
}

function makeEnemies(num: number, hp: number): Enemy[] {
    const enemies: Enemy[] = [];

    for(let i = 0; i < num; i++) {
        const enemyBox = makeBox("enemy", new BABYLON.Vector3(2, 2, 2), new BABYLON.Vector3(-(5 *(num - 1) / 2) + i * 5, 1, 60));

        enemies.push({mesh: enemyBox, hp: hp});
    }

    return enemies;
}