import {
  Clock,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import GameEntity from "../entities/GameEntity";
import GameMap from "../map/GameMap";
import ResourceManager from "../utils/ResourceManager";
import PlayerTank from "../entities/PlayerTank";
import Wall from "../map/Wall";
import EnemyTank from "../entities/EnemyTank";

class GameScene {
  private static _instance = new GameScene();
  public static get instance() {
    return this._instance;
  }
  private _width: number;
  private _height: number;
  private _renderer: WebGLRenderer;
  private _camera: PerspectiveCamera;

  // three js scene
  private readonly _scene = new Scene();

  // game entities array
  private _gameEntities: GameEntity[] = [];

  private _clock: Clock = new Clock();

  // map size
  private _mapSize = 15;

  // expose the camera
  public get camera() {
    return this._camera;
  }

  // expose current entities
  public get gameEntities() {
    return this._gameEntities;
  }

  private constructor() {
    this._width = window.innerWidth;
    this._height = window.innerHeight;

    this._renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(this._width, this._height);
    // find the target html element
    const targetElement = document.querySelector<HTMLDivElement>("#app");
    if (!targetElement) {
      throw "unable to find target element";
    }
    targetElement.appendChild(this._renderer.domElement);
    // setup camera
    const aspectRatio = this._width / this._height;
    this._camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
    this._camera.position.set(7, 7, 15);

    // listen to size change
    window.addEventListener("resize", this.resize, false);

    // add the game map
    const gameMap = new GameMap(new Vector3(0, 0, 0), this._mapSize);
    this._gameEntities.push(gameMap);

    // add the player tank
    const playerTank = new PlayerTank(new Vector3(7, 7, 0));
    this._gameEntities.push(playerTank);

    const enemyTank = new EnemyTank(new Vector3(3, 3, 0));
    this._gameEntities.push(enemyTank);

    this.createWalls();
  }

  private createWalls = () => {
    // helper variable for wall placement
    const edge = this._mapSize - 1;

    // add 4 edge walls
    this._gameEntities.push(new Wall(new Vector3(0, 0, 0)));
    this._gameEntities.push(new Wall(new Vector3(edge, 0, 0)));
    this._gameEntities.push(new Wall(new Vector3(edge, edge, 0)));
    this._gameEntities.push(new Wall(new Vector3(0, edge, 0)));

    // fill in the gaps between the edge walls
    for (let i = 1; i < edge; i++) {
      this._gameEntities.push(new Wall(new Vector3(i, 0, 0)));
      this._gameEntities.push(new Wall(new Vector3(0, i, 0)));
      this._gameEntities.push(new Wall(new Vector3(edge, i, 0)));
      this._gameEntities.push(new Wall(new Vector3(i, edge, 0)));
    }
  };

  private resize = () => {
    this._width = window.innerWidth;
    this._height = window.innerHeight;
    this._renderer.setSize(this._width, this._height);
    this._camera.aspect = this._width / this._height;
    this._camera.updateProjectionMatrix();
  };

  public load = async () => {
    // load game resources
    await ResourceManager.instance.load();

    // load game entities
    for (let index = 0; index < this._gameEntities.length; index++) {
      const element = this._gameEntities[index];
      await element.load();
      this._scene.add(element.mesh);
    }
    // add a light to the scene
    const light = new HemisphereLight(0xffffbb, 0x080820, 1);
    this._scene.add(light);
  };

  public render = () => {
    requestAnimationFrame(this.render);
    // remove entities no longer needed
    this.disposeEntities();
    // obtain elapsed time between frams
    const deltaT = this._clock.getDelta();
    // update the tate of all entities
    for (let index = 0; index < this._gameEntities.length; index++) {
      const element = this._gameEntities[index];
      element.update(deltaT); /// ????
    }
    this._renderer.render(this._scene, this._camera);
  };

  // method to dynamically add entities to the scene
  public addToScene = (entity: GameEntity) => {
    this._gameEntities.push(entity);
    this._scene.add(entity.mesh);
  };

  // method to remove entities no longer needed
  private disposeEntities = () => {
    const entitiesToBeDisposed = this._gameEntities.filter(
      (e) => e.shouldDispose
    );
    entitiesToBeDisposed.forEach((element) => {
      this._scene.remove(element.mesh);
      element.dispose();
    });
    // update entities array
    this._gameEntities = [
      ...this._gameEntities.filter((e) => !e.shouldDispose),
    ];
  };
}

export default GameScene;
