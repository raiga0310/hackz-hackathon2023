"use client";

import { useRef } from "react";
import * as BABYLON from "babylonjs";
import { Button, AdvancedDynamicTexture } from "babylonjs-gui";
import 'babylonjs-materials';
import "./Canvas.css";

export default function Canvas() {
    const gameRef = useRef(null);
    (async () => {
            const renderCanvas = document.getElementById("renderCanvas") as HTMLCanvasElement | null;

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

            skyBoxMaterial.refractionTexture = new BABYLON.CubeTexture("https://assets.babylonjs.com/textures/skybox", scene);
            skyBoxMaterial.refractionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;

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
            const box = makeBox("box1", new BABYLON.Vector3(1, 1, 1), new BABYLON.Vector3(0, 0, -45));

            box.position.addInPlaceFromFloats(0, boxSize / 2.0, 0);

            // GUI
            let appState: "start" | "play" | "pause" = "start";
            let advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

            const button1 = Button.CreateSimpleButton("but1", "Start");
            button1.width = "150px"
            button1.height = "40px";
            button1.color = "white";
            button1.cornerRadius = 20;
            button1.background = "green";
            button1.onPointerUpObservable.add(function() {
                appState = "play";
                advancedTexture.removeControl(button1);
            });
            const button2 = Button.CreateSimpleButton("but2", "Resume");
            button2.width = "150px";
            button2.height = "40px";
            button2.color = "white";
            button2.cornerRadius = 20;
            button2.background = "green";
            button2.top = "40px";
            button2.onPointerUpObservable.add(function() {
                appState = "play";
                advancedTexture.removeControl(button2);
                advancedTexture.removeControl(button3);
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
                advancedTexture.removeControl(button2);
                advancedTexture.removeControl(button3);
            })
            advancedTexture.addControl(button1);

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

            scene.beforeRender = function () {
                if (appState === "play") {
                    const texture = groundMat.diffuseTexture as BABYLON.Texture;
                    texture.vOffset += 0.00625;
                } else if (appState === "start") {
                    advancedTexture.addControl(button1);
                } else if (appState === "pause") {
                    advancedTexture.addControl(button2);
                    advancedTexture.addControl(button3);
                }
            }

            engine.runRenderLoop(() => {
                scene.render();
            });
        }
    )();
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
