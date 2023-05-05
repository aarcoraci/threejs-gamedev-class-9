import "./style.css";
import GameScene from "./scene/GameScene";

await GameScene.instance.load();
GameScene.instance.render();
