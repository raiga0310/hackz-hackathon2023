import Canvas from "@/app/_components/Canvas";

function GameDisplay() {
    return (
        <div id="holder" className="w-2/5 h-screen bg-gray-500 text-5xl">
            <p>
                This is GameDisplay Component.<br />
                It shows gameplay on Babylon.js .
            </p>
            <Canvas />
        </div>
    );
}

export default function Game() {
    return (
        <>
            <p className="text-center text-5xl columns-5xl">This is Game Component</p>
            <GameDisplay />
        </>
    );
}