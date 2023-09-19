"use client";

import { useRef } from "react";
import * as BABYLON from "babylonjs";
import 'babylonjs-materials';
import "./Canvas.css";

export default function Canvas() {
    const gameRef = useRef(null);
    (async () => {
            const renderCanvas = document.getElementById("renderCanvas") as HTMLCanvasElement | null;

            const engine = new BABYLON.Engine(renderCanvas, true);
            const scene = new BABYLON.Scene(engine);
            const _light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0));

            const camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, 3 * Math.PI / 8, 10, BABYLON.Vector3.Zero(), scene);
            camera.setTarget(BABYLON.Vector3.Zero());
            camera.attachControl(true);
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
            const box = makeBox("box1", new BABYLON.Vector3(1, 1, 1), new BABYLON.Vector3(0, 0, 0));

            box.position.addInPlaceFromFloats(0, boxSize / 2.0, 0);

            const roof = BABYLON.MeshBuilder.CreateCylinder("roof", {diameter: 1.3, height: 1.2, tessellation: 3});
            roof.scaling.x = 0.75;
            roof.rotation.z = Math.PI / 2;
            roof.position.y = 1.25;

            scene.beforeRender = function () {
                const texture = groundMat.diffuseTexture as BABYLON.Texture;
                texture.vOffset += 0.00625;
            }

            engine.runRenderLoop(() => {
                scene.render();
            });
        }
    )();
    return (
        <canvas
            id="renderCanvas"
            className="m-2 h-[400px]"
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
